// =========================================
// SMH COLLECTION
// Supabase Client
// =========================================

const SUPABASE_URL =
  "https://lpxizviaksooowzoyfuf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_i08p6MeFi9D-HKoDcPuxDQ_3tbe7YGa";

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
