const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const ensureSupabaseConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables are missing. Expected EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
};

const buildSupabaseUrl = (path) => {
  ensureSupabaseConfigured();
  return `${SUPABASE_URL.replace(/\/$/, "")}${path}`;
};

const buildSupabaseHeaders = (accessToken, extraHeaders = {}) => {
  ensureSupabaseConfigured();
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
};

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  ensureSupabaseConfigured,
  buildSupabaseUrl,
  buildSupabaseHeaders,
};
