// TEMPORARY diagnostic page to verify which Supabase env vars the running
// server process can actually see. Never renders secret values themselves —
// only presence, length, and a masked preview so you can spot typos or a
// wrong/duplicated value without leaking the secret.
//
// This is a plain page (not an /api/* route) because something in front of
// this app is currently blocking /api/* paths with a 403. Delete this file
// once you've confirmed your Azure App Service configuration is correct.

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

export default function SystemCheckPage() {
  const vars = {
    SUPABASE_URL: describe(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: describe(process.env.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: describe(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SUPABASE_URL: describe(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: describe(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };

  return (
    <pre
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        fontSize: "14px",
        whiteSpace: "pre-wrap",
      }}
    >
      {JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV ?? null,
          vars,
        },
        null,
        2
      )}
    </pre>
  );
}
