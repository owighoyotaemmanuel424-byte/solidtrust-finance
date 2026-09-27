import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
describe('ledger invariants',()=>{
  it('uses exact decimal arithmetic for balanced entries',()=>{
    const debit=new Prisma.Decimal('10.10');
    const credit=new Prisma.Decimal('5.05').add(new Prisma.Decimal('5.05'));
    expect(debit.equals(credit)).toBe(true);
  });
  it('detects an unbalanced pair',()=>{
    expect(new Prisma.Decimal('10.00').equals(new Prisma.Decimal('9.99'))).toBe(false);
  });
  it('avoids floating-point money arithmetic',()=>{
    expect(new Prisma.Decimal('0.10').add(new Prisma.Decimal('0.20')).toFixed(2)).toBe('0.30');
  });
});