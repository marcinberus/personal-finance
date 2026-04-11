-- CreateTable
CREATE TABLE "MonthlyReportProjection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "incomeTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expenseTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReportProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySpendProjection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorySpendProjection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyReportProjection_userId_idx" ON "MonthlyReportProjection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReportProjection_userId_year_month_key" ON "MonthlyReportProjection"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "CategorySpendProjection_userId_year_month_idx" ON "CategorySpendProjection"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySpendProjection_userId_categoryId_year_month_key" ON "CategorySpendProjection"("userId", "categoryId", "year", "month");
