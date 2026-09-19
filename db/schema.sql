-- MyKolkata schema for a fresh Supabase Postgres database.
-- Run in the SQL Editor, then: npm run db:push && npm run db:seed
-- Prisma still owns runtime queries via DATABASE_URL / DIRECT_URL.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "news" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "link" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "news_createdAt_idx" ON "news"("createdAt" DESC);

CREATE TABLE "marketplace_items" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "location" TEXT,
  "price" TEXT,
  "image" TEXT,
  "link" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_items_createdAt_idx" ON "marketplace_items"("createdAt" DESC);

CREATE TABLE "places" (
  "id" TEXT NOT NULL,
  "slug" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "location" TEXT,
  "address" TEXT,
  "area" TEXT,
  "type" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "geo" geography(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN "latitude" IS NULL OR "longitude" IS NULL THEN NULL
      ELSE ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
    END
  ) STORED,
  "rating" DOUBLE PRECISION,
  "ratingCount" INTEGER,
  "priceLevel" INTEGER,
  "phone" TEXT,
  "website" TEXT,
  "openingHours" JSONB,
  "status" TEXT,
  "editorialStatus" TEXT NOT NULL DEFAULT 'AUTO',
  "sourceConfidence" DOUBLE PRECISION DEFAULT 0,
  "lastVerifiedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");
CREATE INDEX "places_latitude_longitude_idx" ON "places"("latitude", "longitude");
CREATE INDEX "places_geo_gist_idx" ON "places" USING GIST ("geo");
CREATE INDEX "places_area_idx" ON "places"("area");
CREATE INDEX "places_type_idx" ON "places"("type");
CREATE INDEX "places_editorialStatus_publishedAt_idx" ON "places"("editorialStatus", "publishedAt");
CREATE INDEX "places_createdAt_idx" ON "places"("createdAt" DESC);
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

CREATE TABLE "pandals" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "image" TEXT,
  "distance" TEXT,
  "rating" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pandals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pandals_createdAt_idx" ON "pandals"("createdAt" DESC);

CREATE TABLE "regions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "regions_createdAt_idx" ON "regions"("createdAt" DESC);

CREATE TABLE "transport" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT,
  "location" TEXT,
  "distance" TEXT,
  "time" TEXT,
  "platform" TEXT,
  "routes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "from" TEXT,
  "to" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "transport_category_idx" ON "transport"("category");
CREATE INDEX "transport_createdAt_idx" ON "transport"("createdAt" DESC);

CREATE TABLE "communities" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "link" TEXT,
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communities_createdAt_idx" ON "communities"("createdAt" DESC);

CREATE TABLE "tinder_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "age" TEXT,
  "bio" TEXT,
  "image" TEXT,
  "baseStars" DOUBLE PRECISION NOT NULL DEFAULT 3,
  "averageStars" DOUBLE PRECISION,
  "feedbacks" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tinder_profiles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tinder_profiles_createdAt_idx" ON "tinder_profiles"("createdAt" DESC);

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

-- Prisma uses the database role (bypasses RLS). The Data API uses anon/authenticated,
-- so lock tables down until explicit policies exist.
ALTER TABLE "news" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketplace_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "places" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "explore_searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pandals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tinder_profiles" ENABLE ROW LEVEL SECURITY;
