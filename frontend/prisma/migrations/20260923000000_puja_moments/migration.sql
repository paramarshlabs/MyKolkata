-- Puja moments: Instagram posts people submitted for review. The database has had
-- this table since 23 September 2026, but the file that created it was never in this
-- repository; this one was written on 29 September from the live table so the
-- history here matches what the database records.
-- CreateTable
CREATE TABLE "puja_moments" (
    "id" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "caption" TEXT,
    "submitterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puja_moments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "puja_moments_instagramUrl_key" ON "puja_moments"("instagramUrl");

-- CreateIndex
CREATE INDEX "puja_moments_status_featured_createdAt_idx" ON "puja_moments"("status", "featured", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "puja_moments_status_year_category_createdAt_idx" ON "puja_moments"("status", "year", "category", "createdAt" DESC);
