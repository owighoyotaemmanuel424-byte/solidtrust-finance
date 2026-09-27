import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { hash } from '@node-rs/argon2';
const adapter=new PrismaNeon({connectionString:process.env.DATABASE_URL!});
const prisma=new PrismaClient({adapter});
async function main(){
  const systemAccounts=[
    {accountNumber:'SYS:CASH',type:'current' as const,isSystem:true},
    {accountNumber:'SYS:INTEREST_INCOME',type:'current' as const,isSystem:true},
    {accountNumber:'SYS:FEE_INCOME',type:'current' as const,isSystem:true},
    {accountNumber:'SYS:LOAN_POOL',type:'current' as const,isSystem:true}
  ];
  for(const acct of systemAccounts) await prisma.account.upsert({where:{accountNumber:acct.accountNumber},update:{},create:{...acct,currency:'USD',status:'active'}});
  const passwordHash=await hash('SolidTrust!2026');
  const admin=await prisma.user.upsert({where:{email:'admin@solidtrust.finance'},update:{},create:{email:'admin@solidtrust.finance',fullName:'SolidTrust Admin',passwordHash,role:'admin',emailVerified:new Date()}});
  const demo=await prisma.user.upsert({where:{email:'demo@solidtrust.finance'},update:{},create:{email:'demo@solidtrust.finance',fullName:'Demo Customer',passwordHash,role:'customer',emailVerified:new Date()}});
  await prisma.account.upsert({where:{accountNumber:'ST-DEMO-0001'},update:{},create:{userId:demo.id,accountNumber:'ST-DEMO-0001',type:'savings',currency:'USD',status:'active'}});
  console.log('Seed complete. Admin:',admin.email,'Demo:',demo.email);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});