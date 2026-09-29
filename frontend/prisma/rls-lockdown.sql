-- Run after every `npm run db:push` (scripts/prisma.mjs). db push creates tables
-- but can't express Row Level Security, and on Supabase a table in the public
-- schema can be reachable through the Data API. For each private table: RLS on
-- (with no policies, the Data API roles see no rows), and on Supabase, anon and
-- authenticated lose their privileges outright. Prisma is unaffected: it
-- connects as the owner, or as a role with BYPASSRLS.
--
-- It only changes what needs changing, so it is idempotent and also runs
-- cleanly for a login that doesn't own the tables once they're locked down.
DO $$
DECLARE
  t text;
  rel regclass;
  data_api boolean := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
  FOREACH t IN ARRAY ARRAY['date_profiles', 'date_photos', 'date_swipes', 'date_matches', 'date_messages', 'date_blocks', 'date_reports'] LOOP
    rel := to_regclass(format('public.%I', t));
    CONTINUE WHEN rel IS NULL;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = rel) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
    IF data_api AND (has_table_privilege('anon', rel, 'SELECT,INSERT,UPDATE,DELETE')
      OR has_table_privilege('authenticated', rel, 'SELECT,INSERT,UPDATE,DELETE')) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
