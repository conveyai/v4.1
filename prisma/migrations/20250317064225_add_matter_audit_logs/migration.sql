-- CreateTable
CREATE TABLE "MatterAuditLog" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatterAuditLog_matterId_idx" ON "MatterAuditLog"("matterId");

-- CreateIndex
CREATE INDEX "MatterAuditLog_userId_idx" ON "MatterAuditLog"("userId");

-- CreateIndex
CREATE INDEX "MatterAuditLog_tenantId_idx" ON "MatterAuditLog"("tenantId");

-- AddForeignKey
ALTER TABLE "MatterAuditLog" ADD CONSTRAINT "MatterAuditLog_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAuditLog" ADD CONSTRAINT "MatterAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Conveyancer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAuditLog" ADD CONSTRAINT "MatterAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
