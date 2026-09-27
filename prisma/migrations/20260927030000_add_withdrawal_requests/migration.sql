CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "withdrawal_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "WithdrawalStatus" NOT NULL DEFAULT 'pending',
  "reason" TEXT,
  "reviewed_by" TEXT,
  "transaction_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMP(3),
  CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "withdrawal_requests_transaction_id_key" ON "withdrawal_requests"("transaction_id");
CREATE INDEX "withdrawal_requests_status_created_at_idx" ON "withdrawal_requests"("status","created_at");
CREATE INDEX "withdrawal_requests_user_id_idx" ON "withdrawal_requests"("user_id");

ALTER TABLE "withdrawal_requests"
  ADD CONSTRAINT "withdrawal_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "withdrawal_requests"
  ADD CONSTRAINT "withdrawal_requests_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "withdrawal_requests"
  ADD CONSTRAINT "withdrawal_requests_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
