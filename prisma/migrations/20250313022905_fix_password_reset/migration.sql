-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "conveyancerId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_conveyancerId_idx" ON "password_resets"("conveyancerId");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_conveyancerId_fkey" FOREIGN KEY ("conveyancerId") REFERENCES "Conveyancer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
