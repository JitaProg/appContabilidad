import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, key } = getSupabaseConfig();
    // @supabase/ssr guarda la sesión en cookies, no en localStorage.
    client = createBrowserClient(url, key);
  }

  return client;
}
