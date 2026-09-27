import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { postTransaction } from "@/lib/ledger";
export const runtime="nodejs";
function ref(){return `ST-LOAN-${crypto.randomUUID().replaceAll("-","").slice(0,20).toUpperCase()}`;}
export async function POST(request:Request,{params}:{params:{id:string}}){
 try{
  const admin=await getCurrentUser(); if(!admin||(admin.role!=="admin"&&admin.role!=="compliance"))return Response.json({error:"Admin access required."},{status:403});
  const b=await request.json(); const action=String(b.action??"");
  const loan=await prisma.loan.findUnique({where:{id:params.id},include:{user:{select:{id:true,fullName:true}},repayments:true}});
  if(!loan)return Response.json({error:"Loan not found."},{status:404});
  if(action==="reject"){
   const claimed=await prisma.loan.updateMany({where:{id:loan.id,status:{in:["applied","under_review","approved"]}},data:{status:"rejected",approvedById:admin.id,approvedAt:new Date()}});
   if(!claimed.count)return Response.json({error:"Loan is no longer reviewable."},{status:409});
   await prisma.auditLog.create({data:{actorId:admin.id,action:"loan.rejected",entity:"loan",entityId:loan.id,after:{status:"rejected"}}}); return Response.json({ok:true,status:"rejected"});
  }
  if(action==="review"){const u=await prisma.loan.updateMany({where:{id:loan.id,status:"applied"},data:{status:"under_review"}});if(!u.count)return Response.json({error:"Loan is no longer pending."},{status:409});return Response.json({ok:true,status:"under_review"});}
  if(action!=="approve"&&action!=="disburse")return Response.json({error:"Action must be review, approve, reject, or disburse."},{status:400});
  if(action==="approve"){const u=await prisma.loan.updateMany({where:{id:loan.id,status:{in:["applied","under_review"]}},data:{status:"approved",approvedById:admin.id,approvedAt:new Date()}});if(!u.count)return Response.json({error:"Loan is no longer reviewable."},{status:409});await prisma.auditLog.create({data:{actorId:admin.id,action:"loan.approved",entity:"loan",entityId:loan.id,after:{status:"approved"}}});return Response.json({ok:true,status:"approved"});}
  const claimed=await prisma.loan.updateMany({where:{id:loan.id,status:"approved",disbursementTransactionId:null},data:{status:"disbursed",disbursedAt:new Date()}});
  if(!claimed.count)return Response.json({error:"Loan is not ready for disbursement."},{status:409});
  const account=await prisma.account.findFirst({where:{userId:loan.userId,isSystem:false,status:"active",currency:"USD"},orderBy:{createdAt:"asc"},select:{id:true}});
  const pool=await prisma.account.findFirst({where:{accountNumber:"SYS:LOAN_POOL",isSystem:true,status:"active",currency:"USD"},select:{id:true}});
  if(!account||!pool){await prisma.loan.update({where:{id:loan.id},data:{status:"approved",disbursedAt:null}});return Response.json({error:"Loan disbursement accounts are not configured."},{status:500});}
  try{
   const tx=await postTransaction({reference:ref(),type:"loan_disbursement",description:"Loan disbursement",initiatedById:admin.id,entries:[{accountId:pool.id,direction:"debit",amount:loan.principal.toFixed(2),currency:"USD"},{accountId:account.id,direction:"credit",amount:loan.principal.toFixed(2),currency:"USD"}],metadata:{loanId:loan.id}});
   await prisma.loan.update({where:{id:loan.id},data:{disbursementTransactionId:tx.id,status:"repaying"}});
   await prisma.auditLog.create({data:{actorId:admin.id,action:"loan.disbursed",entity:"loan",entityId:loan.id,after:{status:"repaying",transactionId:tx.id,principal:loan.principal.toFixed(2)}}});
   return Response.json({ok:true,status:"repaying",transactionId:tx.id});
  }catch(e){await prisma.loan.update({where:{id:loan.id},data:{status:"approved",disbursedAt:null}});throw e;}
 }catch(e){console.error("Loan review failed",e);return Response.json({error:"Loan review could not be completed."},{status:500});}
}
