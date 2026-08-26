import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && (serviceRoleKey || anonKey));

/**
 * Server-only Supabase client. Prefers the service role key so Server
 * Actions (order creation, admin inventory CRUD) can bypass row level
 * security when needed. Falls back to the anon key if no service role
 * key has been configured, so the app still runs in a limited capacity.
 */
export function getServerSupabase() {
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    serviceRoleKey || anonKey || "placeholder-anon-key",
    {
      auth: { persistSession: false },
    }
  );
}
