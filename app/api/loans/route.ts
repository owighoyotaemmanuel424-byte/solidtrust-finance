import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
export const runtime="nodejs";
export async function POST(request:Request){
  try{
    const user=await getCurrentUser(); if(!user)return Response.json({error:"Authentication required."},{status:401});
    const b=await request.json(); const principal=new Prisma.Decimal(String(b.principal??"")); const rate=new Prisma.Decimal(String(b.interestRate??"")); const term=Number(b.termMonths);
    if(!principal.isFinite()||principal.lte(0)||principal.decimalPlaces()>2||!rate.isFinite()||rate.lt(0)||rate.gt(1)||!Number.isInteger(term)||term<1||term>60)return Response.json({error:"Enter valid loan terms."},{status:400});
    const loan=await prisma.loan.create({data:{userId:user.id,principal,interestRate:rate,termMonths:term,status:"applied"}});
    await prisma.auditLog.create({data:{actorId:user.id,action:"loan.applied",entity:"loan",entityId:loan.id,after:{principal:principal.toFixed(2),interestRate:rate.toFixed(4),termMonths:term,status:"applied"}}});
    return Response.json({ok:true,loan});
  }catch(e){console.error("Loan application failed",e);return Response.json({error:"Loan application could not be submitted."},{status:500});}
}
