import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  ledgerEntry: { groupBy: vi.fn(), findFirst: vi.fn() },
}));

vi.mock('./db', () => ({ prisma: mockPrisma }));

import {
  getBalance,
  getLedgerChainTip,
  postTransaction,
} from './ledger';

describe('ledger invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects transactions with fewer than two entries', async () => {
    await expect(
      postTransaction({
        reference: 'too-few',
        type: 'deposit',
        entries: [{ accountId: 'a', direction: 'credit', amount: '10.00' }],
      }),
    ).rejects.toThrow('Double-entry requires at least 2 entries');

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unbalanced debit and credit totals', async () => {
    await expect(
      postTransaction({
        reference: 'unbalanced',
        type: 'transfer',
        entries: [
          { accountId: 'a', direction: 'debit', amount: '10.00' },
          { accountId: 'b', direction: 'credit', amount: '9.99' },
        ],
      }),
    ).rejects.toThrow('Unbalanced ledger transaction');

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('uses exact decimal arithmetic instead of floating point', async () => {
    expect(new Prisma.Decimal('0.10').add(new Prisma.Decimal('0.20')).toFixed(2)).toBe('0.30');
  });

  it('posts a balanced transaction atomically and creates a hash chain', async () => {
    const transactionCreate = vi.fn().mockResolvedValue({
      id: 'tx-1',
      reference: 'dep-1',
      type: 'deposit',
      status: 'posted',
      amount: new Prisma.Decimal('10.00'),
    });
    const ledgerCreate = vi.fn().mockImplementation(async (args) => ({
      id: String(ledgerCreate.mock.calls.length),
      ...args.data,
    }));

    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        transaction: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: transactionCreate,
        },
        ledgerEntry: {
          findFirst: vi.fn().mockResolvedValue({ runningHash: 'GENESIS-HASH' }),
          create: ledgerCreate,
        },
      }),
    );

    const result = await postTransaction({
      reference: 'dep-1',
      type: 'deposit',
      description: 'Test deposit',
      entries: [
        { accountId: 'cash', direction: 'debit', amount: '10.00' },
        { accountId: 'customer', direction: 'credit', amount: '10.00' },
      ],
    });

    expect(result.id).toBe('tx-1');
    expect(transactionCreate).toHaveBeenCalledOnce();
    expect(ledgerCreate).toHaveBeenCalledTimes(2);
    expect(ledgerCreate.mock.calls[0][0].data.runningHash).toMatch(/^[a-f0-9]{64}$/);
    expect(ledgerCreate.mock.calls[1][0].data.runningHash).toMatch(/^[a-f0-9]{64}$/);
    expect(ledgerCreate.mock.calls[0][0].data.runningHash).not.toBe(
      ledgerCreate.mock.calls[1][0].data.runningHash,
    );
  });

  it('returns the existing transaction for an idempotent reference', async () => {
    const existing = { id: 'tx-existing', reference: 'same-ref' };

    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        transaction: {
          findUnique: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
        },
        ledgerEntry: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
      }),
    );

    const result = await postTransaction({
      reference: 'same-ref',
      type: 'transfer',
      entries: [
        { accountId: 'a', direction: 'debit', amount: '5.00' },
        { accountId: 'b', direction: 'credit', amount: '5.00' },
      ],
    });

    expect(result).toBe(existing);
  });

  it('calculates balance as credits minus debits', async () => {
    mockPrisma.ledgerEntry = {
      groupBy: vi.fn().mockResolvedValue([
        { direction: 'credit', _sum: { amount: new Prisma.Decimal('100.00') } },
        { direction: 'debit', _sum: { amount: new Prisma.Decimal('35.25') } },
      ]),
    };

    expect(await getBalance('customer')).toBe('64.75');
  });

  it('treats missing direction totals as zero', async () => {
    mockPrisma.ledgerEntry = {
      groupBy: vi.fn().mockResolvedValue([
        { direction: 'credit', _sum: { amount: null } },
      ]),
    };

    expect(await getBalance('empty')).toBe('0.00');
  });

  it('returns the current hash-chain tip or null when empty', async () => {
    mockPrisma.ledgerEntry = {
      findFirst: vi.fn().mockResolvedValue({ runningHash: 'tip-hash' }),
    };
    await expect(getLedgerChainTip()).resolves.toBe('tip-hash');

    mockPrisma.ledgerEntry.findFirst.mockResolvedValue(null);
    await expect(getLedgerChainTip()).resolves.toBeNull();
  });
});
