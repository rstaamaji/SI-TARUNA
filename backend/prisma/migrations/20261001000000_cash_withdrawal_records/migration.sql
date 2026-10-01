-- Add audit fields and a one-to-one link to the corresponding expense.
ALTER TABLE "cash_withdrawals"
ADD COLUMN "withdrawerName" TEXT NOT NULL DEFAULT 'Anggota',
ADD COLUMN "financeTransactionId" TEXT,
ALTER COLUMN "memberId" DROP NOT NULL;

UPDATE "cash_withdrawals" AS withdrawal
SET "withdrawerName" = member."name"
FROM "members" AS member
WHERE withdrawal."memberId" = member."id";

ALTER TABLE "cash_withdrawals"
DROP CONSTRAINT "cash_withdrawals_memberId_fkey";

ALTER TABLE "cash_withdrawals"
ADD CONSTRAINT "cash_withdrawals_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "members"("id")
ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "cash_withdrawals_financeTransactionId_fkey"
FOREIGN KEY ("financeTransactionId") REFERENCES "finance_transactions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "cash_withdrawals_financeTransactionId_key"
ON "cash_withdrawals"("financeTransactionId");