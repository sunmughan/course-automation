-- AlterTable
ALTER TABLE "AIRequest" ADD COLUMN "requestId" TEXT;
ALTER TABLE "AIRequest" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIRequest" ADD COLUMN "agent" TEXT;
ALTER TABLE "AIRequest" ADD COLUMN "totalTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIRequest" ADD COLUMN "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "AIRequest" ADD COLUMN "error" TEXT;
ALTER TABLE "AIRequest" ADD COLUMN "attemptedProviders" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AIRequest" ADD COLUMN "attemptedModels" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AIRequest" ADD COLUMN "finalProvider" TEXT;
ALTER TABLE "AIRequest" ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AIRequest" ADD COLUMN "completedAt" TIMESTAMP(3);

UPDATE "AIRequest"
SET
  "requestId" = "id",
  "totalTokens" = "inputTokens" + "outputTokens",
  "estimatedCost" = "cost",
  "attemptedProviders" = CONCAT('["', "provider", '"]'),
  "attemptedModels" = CONCAT('["', "model", '"]'),
  "finalProvider" = "provider",
  "startedAt" = "createdAt",
  "completedAt" = "createdAt";

ALTER TABLE "AIRequest" ALTER COLUMN "requestId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AIRequest_requestId_key" ON "AIRequest"("requestId");
CREATE INDEX "AIRequest_userId_idx" ON "AIRequest"("userId");
CREATE INDEX "AIRequest_organizationId_idx" ON "AIRequest"("organizationId");
CREATE INDEX "AIRequest_sessionId_idx" ON "AIRequest"("sessionId");
CREATE INDEX "AIRequest_createdAt_idx" ON "AIRequest"("createdAt");
