-- Editorial news: turns "news" into a persisted, deduplicated feed of CITY and
-- SPORTS stories plus the NEWSPAPER card. Existing rows are kept and classified.

ALTER TABLE "news"
  ADD COLUMN "imageSource" TEXT,
  ADD COLUMN "imageSourceUrl" TEXT,
  ADD COLUMN "canonicalUrl" TEXT,
  ADD COLUMN "titleKey" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourceDomain" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CITY',
  ADD COLUMN "category" TEXT,
  ADD COLUMN "eventSlug" TEXT,
  ADD COLUMN "eventPhase" TEXT,
  ADD COLUMN "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "featuredAt" TIMESTAMP(3),
  ADD COLUMN "cooldownUntil" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "news_canonicalUrl_key" ON "news"("canonicalUrl");
CREATE UNIQUE INDEX "news_titleKey_key" ON "news"("titleKey");
CREATE UNIQUE INDEX "news_contentHash_key" ON "news"("contentHash");
CREATE INDEX "news_type_isActive_publishedAt_idx" ON "news"("type", "isActive", "publishedAt" DESC);
CREATE INDEX "news_type_featuredAt_idx" ON "news"("type", "featuredAt" DESC);
CREATE INDEX "news_eventSlug_idx" ON "news"("eventSlug");

-- Backfill the hand-seeded rows: the paper keeps its card, the old book-fair and
-- derby rows become last-resort fallbacks rather than live candidates.
UPDATE "news" SET "type" = 'NEWSPAPER', "category" = 'newspaper', "sourceName" = 'Anandabazar Patrika'
  WHERE "title" ILIKE 'Anandabazar%';
UPDATE "news" SET "type" = 'SPORTS', "category" = 'football', "isActive" = false
  WHERE "title" ILIKE '%Derby%';
UPDATE "news" SET "category" = 'culture', "eventSlug" = 'kolkata-book-fair', "isActive" = false
  WHERE "title" ILIKE '%Book Fair%' AND "type" = 'CITY';
