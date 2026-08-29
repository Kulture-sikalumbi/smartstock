import { createClient } from "@supabase/supabase-js";

// Plain (non `NEXT_PUBLIC_`) names are read from `process.env` at request
// time on the server, so they pick up values configured directly in the
// hosting platform (e.g. Azure App Service > Configuration) without
// needing to be present during the CI build. `NEXT_PUBLIC_*` names are kept
// as a fallback for local development / existing `.env.local` files, but
// note Next.js inlines those at *build time* -- they won't reflect values
// set only in the runtime environment of a deployed server.
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Browser-safe Supabase client using the public anon key.
 * Used for read-only storefront queries (products, category lists).
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
