-- MIND_A2A Supabase security hardening
-- Scope:
-- 1) Emergency containment (RLS + deny by default)
-- 2) Specific owner-based policies for onboarding tables
-- 3) Privilege hardening (no anon write, no destructive grants to authenticated)
--
-- Execute with:
-- supabase db query --linked --file supabase-security-fix.sql

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Emergency containment on all public tables
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS block_all ON %I;', t.tablename);
    EXECUTE format(
      'CREATE POLICY block_all ON %I FOR ALL USING (false) WITH CHECK (false);',
      t.tablename
    );
  END LOOP;
END
$$;

-- -----------------------------------------------------------------------------
-- 2) Ownership model for onboarding tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.builder_applications
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

ALTER TABLE public.sponsor_applications
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

ALTER TABLE public.community_waitlist
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_builder_applications_owner_id
  ON public.builder_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_applications_owner_id
  ON public.sponsor_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_community_waitlist_owner_id
  ON public.community_waitlist(owner_id);

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('builder_applications', 'sponsor_applications', 'community_waitlist')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

-- builder_applications
CREATE POLICY builder_applications_owner_insert
  ON public.builder_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY builder_applications_owner_select
  ON public.builder_applications
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY builder_applications_owner_update
  ON public.builder_applications
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY builder_applications_admin_select
  ON public.builder_applications
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY builder_applications_admin_update
  ON public.builder_applications
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- sponsor_applications
CREATE POLICY sponsor_applications_owner_insert
  ON public.sponsor_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY sponsor_applications_owner_select
  ON public.sponsor_applications
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY sponsor_applications_owner_update
  ON public.sponsor_applications
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY sponsor_applications_admin_select
  ON public.sponsor_applications
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY sponsor_applications_admin_update
  ON public.sponsor_applications
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- community_waitlist
CREATE POLICY community_waitlist_owner_insert
  ON public.community_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() AND consent_email = true);

CREATE POLICY community_waitlist_owner_select
  ON public.community_waitlist
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY community_waitlist_owner_update
  ON public.community_waitlist
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY community_waitlist_admin_select
  ON public.community_waitlist
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- -----------------------------------------------------------------------------
-- 3) Privilege hardening
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.builder_applications FROM anon;
REVOKE ALL ON public.sponsor_applications FROM anon;
REVOKE ALL ON public.community_waitlist FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.builder_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sponsor_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_waitlist TO authenticated;

REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.builder_applications FROM authenticated;
REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.sponsor_applications FROM authenticated;
REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.community_waitlist FROM authenticated;

COMMIT;

-- -----------------------------------------------------------------------------
-- Verification queries
-- -----------------------------------------------------------------------------
-- 1) RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
--
-- 2) Policies on target tables:
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname='public'
--   AND tablename IN ('builder_applications','sponsor_applications','community_waitlist')
-- ORDER BY tablename, policyname;
--
-- 3) Grants:
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema='public'
--   AND table_name IN ('builder_applications','sponsor_applications','community_waitlist')
--   AND grantee IN ('anon','authenticated')
-- ORDER BY table_name, grantee, privilege_type;
