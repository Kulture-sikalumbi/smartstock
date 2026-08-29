import { NextResponse } from "next/server";

// TEMPORARY diagnostic route to verify which Supabase env vars the running
// server process can actually see. Never returns secret values themselves —
// only presence, length, and a masked preview so you can spot typos or a
// wrong/duplicated value without leaking the secret.
//
// Delete this file once you've confirmed your Azure App Service
// configuration is correct.

function describe(value: string | undefined) {
  if (!value) {
    return { set: false as const };
  }
  const preview =
    value.length > 12
      ? `${value.slice(0, 6)}...${value.slice(-4)}`
      : `${value.slice(0, 2)}...`;
  return { set: true as const, length: value.length, preview };
}

export async function GET() {
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? null,
    vars: {
      SUPABASE_URL: describe(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: describe(process.env.SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: describe(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_SUPABASE_URL: describe(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: describe(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    },
  });
}
