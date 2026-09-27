ALTER TABLE "loans" ADD COLUMN "approved_by" TEXT, ADD COLUMN "approved_at" TIMESTAMP(3), ADD COLUMN "disbursement_transaction_id" TEXT;
CREATE UNIQUE INDEX "loans_disbursement_transaction_id_key" ON "loans"("disbursement_transaction_id");
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;