-- Ephemeral public stories for /contribute: text and an external URL only.
CREATE TABLE "stories" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "story" TEXT NOT NULL,
  "externalUrl" TEXT,
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stories_expiresAt_createdAt_idx" ON "stories"("expiresAt", "createdAt" DESC);
