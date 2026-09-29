-- Find your Ashtami date: profiles, photos, swipes, matches, messages, blocks
-- and reports. Applied with `npm run db:push`, which also runs
-- prisma/rls-lockdown.sql so the lock-down at the end holds on every push.

-- CreateTable
CREATE TABLE "date_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "firstName" TEXT,
    "gender" TEXT,
    "showMe" TEXT,
    "night" TEXT,
    "zone" TEXT,
    "vibes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promptId" TEXT,
    "promptAnswer" TEXT,
    "socialKind" TEXT,
    "socialHandle" TEXT,
    "archetype" TEXT,
    "consentedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "pickDay" TEXT,
    "pickId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_photos" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_swipes" (
    "id" TEXT NOT NULL,
    "swiperId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "shiuliDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_matches" (
    "id" TEXT NOT NULL,
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "extensionsUsed" INTEGER NOT NULL DEFAULT 0,
    "firstMoveAt" TIMESTAMP(3),
    "planNight" TEXT NOT NULL,
    "planPandal" TEXT NOT NULL,
    "planArea" TEXT NOT NULL,
    "planNote" TEXT NOT NULL,
    "planTime" TEXT NOT NULL,
    "planZone" TEXT NOT NULL,
    "aReadAt" TIMESTAMP(3),
    "bReadAt" TIMESTAMP(3),

    CONSTRAINT "date_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_messages" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_blocks" (
    "id" TEXT NOT NULL,
    "blockerUserId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "date_profiles_userId_key" ON "date_profiles"("userId");

-- CreateIndex
CREATE INDEX "date_profiles_active_gender_showMe_updatedAt_idx" ON "date_profiles"("active", "gender", "showMe", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "date_photos_storageKey_key" ON "date_photos"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "date_photos_profileId_position_key" ON "date_photos"("profileId", "position");

-- CreateIndex
CREATE INDEX "date_swipes_targetId_liked_idx" ON "date_swipes"("targetId", "liked");

-- CreateIndex
CREATE UNIQUE INDEX "date_swipes_swiperId_targetId_key" ON "date_swipes"("swiperId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "date_swipes_swiperId_shiuliDay_key" ON "date_swipes"("swiperId", "shiuliDay");

-- CreateIndex
CREATE INDEX "date_matches_bId_idx" ON "date_matches"("bId");

-- CreateIndex
CREATE INDEX "date_matches_expiresAt_idx" ON "date_matches"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "date_matches_aId_bId_key" ON "date_matches"("aId", "bId");

-- CreateIndex
CREATE INDEX "date_messages_matchId_createdAt_idx" ON "date_messages"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "date_messages_expiresAt_idx" ON "date_messages"("expiresAt");

-- CreateIndex
CREATE INDEX "date_blocks_blockedUserId_idx" ON "date_blocks"("blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "date_blocks_blockerUserId_blockedUserId_key" ON "date_blocks"("blockerUserId", "blockedUserId");

-- CreateIndex
CREATE INDEX "date_reports_reportedUserId_status_idx" ON "date_reports"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "date_reports_reporterUserId_createdAt_idx" ON "date_reports"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "date_reports_createdAt_idx" ON "date_reports"("createdAt");

-- AddForeignKey
ALTER TABLE "date_photos" ADD CONSTRAINT "date_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_swipes" ADD CONSTRAINT "date_swipes_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_swipes" ADD CONSTRAINT "date_swipes_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_matches" ADD CONSTRAINT "date_matches_aId_fkey" FOREIGN KEY ("aId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_matches" ADD CONSTRAINT "date_matches_bId_fkey" FOREIGN KEY ("bId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_messages" ADD CONSTRAINT "date_messages_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "date_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_messages" ADD CONSTRAINT "date_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "date_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma connects as the tables' owner and is unaffected. The Supabase Data
-- API (anon and authenticated) gets nothing: with RLS on and no policies, a
-- date of birth, a chat or a report can't be read or written from a browser.
ALTER TABLE "date_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_swipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "date_reports" ENABLE ROW LEVEL SECURITY;

-- On Supabase, also take the Data API roles' privileges away outright. Skipped
-- where those roles don't exist.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    FOREACH t IN ARRAY ARRAY['date_profiles', 'date_photos', 'date_swipes', 'date_matches', 'date_messages', 'date_blocks', 'date_reports'] LOOP
      IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
      END IF;
    END LOOP;
  END IF;
END $$;
