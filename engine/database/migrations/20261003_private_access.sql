-- Apply manually to the Supabase project before deploying the Functions.
-- All snapshot/grant/session reads go through a trusted backend, not browser REST.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mbg_sessions (
  id uuid PRIMARY KEY,
  subject text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('OWNER', 'SUBSCRIBER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE TABLE IF NOT EXISTS public.mbg_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN (
    'cockpit.read', 'arena.read', 'research.read', 'ea.download',
    'scanner.indonesia', 'scanner.america', 'scanner.forex', 'scanner.cfd'
  )),
  valid_from timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > valid_from)
);
CREATE INDEX IF NOT EXISTS mbg_access_grants_user ON public.mbg_access_grants(user_id);
CREATE INDEX IF NOT EXISTS mbg_sessions_expiry ON public.mbg_sessions(expires_at);
-- Explicit privileges: secret/service role bypasses RLS but still needs table grants.
ALTER TABLE public.mbg_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mbg_access_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mbg_sessions, public.mbg_access_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mbg_sessions, public.mbg_access_grants TO service_role;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_trade_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idx_categorized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_spot_10 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_state, public.daily_trade_plans, public.macro_telemetry,
  public.idx_categorized, public.crypto_spot_10 FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_state, public.daily_trade_plans,
  public.macro_telemetry, public.idx_categorized, public.crypto_spot_10 TO service_role;
-- The legacy purge routine is a maintenance operation, never a public RPC.
REVOKE EXECUTE ON FUNCTION public.purge_old_records() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_records() TO service_role;
COMMIT;
