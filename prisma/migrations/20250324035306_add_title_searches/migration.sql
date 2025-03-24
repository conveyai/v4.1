-- CreateTable
CREATE TABLE "TitleSearch" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "folioIdentifier" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "document" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TitleSearch_matterId_idx" ON "TitleSearch"("matterId");

-- CreateIndex
CREATE INDEX "TitleSearch_tenantId_idx" ON "TitleSearch"("tenantId");

-- CreateIndex
CREATE INDEX "TitleSearch_orderId_idx" ON "TitleSearch"("orderId");

-- AddForeignKey
ALTER TABLE "TitleSearch" ADD CONSTRAINT "TitleSearch_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
