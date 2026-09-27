-- Baseline schema for SolidTrust Finance.
-- This migration intentionally contains the schema state before the
-- withdrawal-request and loan-approval migrations.
CREATE TYPE "Role" AS ENUM ('customer', 'admin', 'compliance');
CREATE TYPE "AccountType" AS ENUM ('savings', 'current');
CREATE TYPE "AccountStatus" AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE "TxType" AS ENUM ('deposit', 'withdrawal', 'transfer', 'loan_disbursement', 'loan_repayment', 'fee', 'interest');
CREATE TYPE "TxStatus" AS ENUM ('pending', 'posted', 'failed', 'reversed');
CREATE TYPE "LedgerDirection" AS ENUM ('debit', 'credit');
CREATE TYPE "LoanStatus" AS ENUM ('applied', 'under_review', 'approved', 'disbursed', 'repaying', 'repaid', 'defaulted', 'rejected');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" TIMESTAMP(3),
  "password_hash" TEXT,
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "role" "Role" NOT NULL DEFAULT 'customer',
  "kyc_status" TEXT NOT NULL DEFAULT 'pending',
  "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
  "mfa_secret" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "account_number" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "AccountStatus" NOT NULL DEFAULT 'active',
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_account_number_key" ON "accounts"("account_number");
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

CREATE TABLE "transactions" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "type" "TxType" NOT NULL,
  "status" "TxStatus" NOT NULL DEFAULT 'pending',
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "description" TEXT,
  "metadata" JSONB,
  "initiated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "posted_at" TIMESTAMP(3),
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "transaction_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "running_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");
CREATE INDEX "ledger_entries_account_id_idx" ON "ledger_entries"("account_id");

CREATE TABLE "loans" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "principal" DECIMAL(18,2) NOT NULL,
  "interest_rate" DECIMAL(5,4) NOT NULL,
  "term_months" INTEGER NOT NULL,
  "status" "LoanStatus" NOT NULL DEFAULT 'applied',
  "disbursed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_repayments" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "transaction_id" TEXT NOT NULL,
  "due_date" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "amount_due" DECIMAL(18,2) NOT NULL,
  "amount_paid" DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_log" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "before" JSONB,
  "after" JSONB,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity","entity_id");

ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_initiated_by_fkey"
  FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
