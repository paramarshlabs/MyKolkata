CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "places"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "area" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6),
  ADD COLUMN "geo" geography(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN "latitude" IS NULL OR "longitude" IS NULL THEN NULL
      ELSE ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
    END
  ) STORED,
  ADD COLUMN "ratingCount" INTEGER,
  ADD COLUMN "priceLevel" INTEGER,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "openingHours" JSONB,
  ADD COLUMN "editorialStatus" TEXT NOT NULL DEFAULT 'AUTO',
  ADD COLUMN "sourceConfidence" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");
CREATE INDEX "places_latitude_longitude_idx" ON "places"("latitude", "longitude");
CREATE INDEX "places_geo_gist_idx" ON "places" USING GIST ("geo");
CREATE INDEX "places_area_idx" ON "places"("area");
CREATE INDEX "places_type_idx" ON "places"("type");
CREATE INDEX "places_editorialStatus_publishedAt_idx" ON "places"("editorialStatus", "publishedAt");
CREATE INDEX "places_name_trgm_idx" ON "places" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX "places_address_trgm_idx" ON "places" USING GIN (lower("address") gin_trgm_ops);
CREATE INDEX "places_area_trgm_idx" ON "places" USING GIN (lower("area") gin_trgm_ops);

CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

CREATE TABLE "place_categories" (
  "placeId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "source" TEXT,
  "confidence" DOUBLE PRECISION DEFAULT 1,
  CONSTRAINT "place_categories_pkey" PRIMARY KEY ("placeId", "categoryId")
);
CREATE INDEX "place_categories_categoryId_idx" ON "place_categories"("categoryId");

CREATE TABLE "place_sources" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "attribution" TEXT,
  "license" TEXT,
  "raw" JSONB,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "place_sources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "place_sources_provider_externalId_key" ON "place_sources"("provider", "externalId");
CREATE INDEX "place_sources_placeId_idx" ON "place_sources"("placeId");
CREATE INDEX "place_sources_provider_expiresAt_idx" ON "place_sources"("provider", "expiresAt");

CREATE TABLE "place_photos" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "altText" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'PHOTO',
  "provider" TEXT,
  "attribution" TEXT,
  "license" TEXT,
  "confidence" DOUBLE PRECISION,
  "verification" TEXT NOT NULL DEFAULT 'VERIFIED',
  "width" INTEGER,
  "height" INTEGER,
  "position" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "place_photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "place_photos_placeId_position_idx" ON "place_photos"("placeId", "position");
CREATE INDEX "place_photos_verification_lastVerifiedAt_idx" ON "place_photos"("verification", "lastVerifiedAt");

CREATE TABLE "collections" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");
CREATE INDEX "collections_status_startsAt_endsAt_idx" ON "collections"("status", "startsAt", "endsAt");

CREATE TABLE "collection_items" (
  "collectionId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  CONSTRAINT "collection_items_pkey" PRIMARY KEY ("collectionId", "placeId")
);
CREATE INDEX "collection_items_collectionId_position_idx" ON "collection_items"("collectionId", "position");

CREATE TABLE "experiences" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "venueId" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "bookingUrl" TEXT,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "experiences_slug_key" ON "experiences"("slug");
CREATE INDEX "experiences_status_startsAt_idx" ON "experiences"("status", "startsAt");
CREATE INDEX "experiences_venueId_idx" ON "experiences"("venueId");

CREATE TABLE "place_interactions" (
  "id" TEXT NOT NULL,
  "placeId" TEXT,
  "kind" TEXT NOT NULL,
  "anonymousId" TEXT,
  "userId" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "place_interactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "place_interactions_placeId_kind_occurredAt_idx" ON "place_interactions"("placeId", "kind", "occurredAt" DESC);
CREATE INDEX "place_interactions_anonymousId_occurredAt_idx" ON "place_interactions"("anonymousId", "occurredAt" DESC);

CREATE TABLE "explore_searches" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "normalizedQuery" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "anonymousId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "explore_searches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "explore_searches_normalizedQuery_createdAt_idx" ON "explore_searches"("normalizedQuery", "createdAt" DESC);

ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_photos" ADD CONSTRAINT "place_photos_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "place_interactions" ADD CONSTRAINT "place_interactions_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
