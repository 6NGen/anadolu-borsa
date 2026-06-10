import { createClient } from "@supabase/supabase-js";

// Tarayici istemcisi (auth/insert akislari icin oturum tutar)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server Component icin: salt-okur, oturum tutmaz (RLS public read yeterli).
// persistSession server'da gereksiz storage erisimi ve uyari uretir.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
