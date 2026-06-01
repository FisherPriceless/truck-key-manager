-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "truckNumber" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL DEFAULT '',
    "routeNumber" TEXT NOT NULL DEFAULT '',
    "checkOutTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_truckNumber_idx" ON "Transaction"("truckNumber");

-- CreateIndex
CREATE INDEX "Transaction_employeeNumber_idx" ON "Transaction"("employeeNumber");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_checkOutTime_idx" ON "Transaction"("checkOutTime");
