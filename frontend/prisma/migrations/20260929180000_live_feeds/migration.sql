-- Live feeds for /home (lib/live): one row per feed, holding what Anakin last
-- returned, already reduced to what the page shows. Public data only.
CREATE TABLE "live_feeds" (
  "key" TEXT NOT NULL,
  "payload" JSONB,
  "fetchedAt" TIMESTAMP(3),
  "attemptedAt" TIMESTAMP(3),
  "error" TEXT,

  CONSTRAINT "live_feeds_pkey" PRIMARY KEY ("key")
);
