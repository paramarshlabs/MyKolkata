-- Authors can edit their stories. An edit is stamped here; the 24 hours still
-- run from createdAt, so editing never extends a story's life.
ALTER TABLE "stories" ADD COLUMN "editedAt" TIMESTAMP(3);
