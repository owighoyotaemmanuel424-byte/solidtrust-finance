import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from './db';

export type Direction = 'debit' | 'credit';
export interface LedgerEntryInput { accountId: string; direction: Direction; amount: string; currency?: string; }
export interface PostTransactionInput {
  reference: string;
  type: 'deposit'|'withdrawal'|'transfer'|'loan_disbursement'|'loan_repayment'|'fee'|'interest';
  description?: string; initiatedById?: string; entries: LedgerEntryInput[]; metadata?: Record<string, unknown>;
}
function toDecimalString(value: string|number): string { return new Decimal(value).toFixed(2); }
function sha256(payload: string): string { return createHash('sha256').update(payload).digest('hex'); }

export async function postTransaction(input: PostTransactionInput) {
  if (input.entries.length < 2) throw new Error('Double-entry requires at least 2 entries');
  const debits=input.entries.filter(e=>e.direction==='debit').reduce((s,e)=>s.add(toDecimalString(e.amount)),new Decimal(0));
  const credits=input.entries.filter(e=>e.direction==='credit').reduce((s,e)=>s.add(toDecimalString(e.amount)),new Decimal(0));
  if (!debits.equals(credits)) throw new Error(`Unbalanced ledger transaction: debits=${debits} credits=${credits}`);
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing=await tx.transaction.findUnique({where:{reference:input.reference}});
    if(existing) return existing;
    const last=await tx.ledgerEntry.findFirst({orderBy:[{createdAt:'desc'},{id:'desc'}],select:{runningHash:true}});
    let prevHash=last?.runningHash??'GENESIS';
    const txRow=await tx.transaction.create({data:{
      reference:input.reference,type:input.type,status:'posted',
      amount:new Decimal(credits.toFixed(2)),currency:input.entries[0].currency??'USD',
      description:input.description,metadata: JSON.parse(JSON.stringify(input.metadata ?? {})),
      initiatedById:input.initiatedById,postedAt:new Date()
    }});
    for(const entry of input.entries){
      const amount=toDecimalString(entry.amount);
      const hash=sha256(`${prevHash}|${txRow.id}|${entry.accountId}|${entry.direction}|${amount}`);
      await tx.ledgerEntry.create({data:{transactionId:txRow.id,accountId:entry.accountId,direction:entry.direction,amount:new Decimal(amount),currency:entry.currency??'USD',runningHash:hash}});
      prevHash=hash;
    }
    return txRow;
  });
}
export async function getBalance(accountId:string):Promise<string>{
  const rows=await prisma.ledgerEntry.groupBy({by:['direction'],where:{accountId},_sum:{amount:true}});
  let credits=new Decimal(0),debits=new Decimal(0);
  for(const row of rows){if(row.direction==='credit') credits=row._sum.amount??new Decimal(0);if(row.direction==='debit') debits=row._sum.amount??new Decimal(0);}
  return credits.sub(debits).toFixed(2);
}
export async function getLedgerChainTip():Promise<string|null>{
  const last=await prisma.ledgerEntry.findFirst({orderBy:[{createdAt:'desc'},{id:'desc'}],select:{runningHash:true}});
  return last?.runningHash??null;
}