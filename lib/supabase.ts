import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_PROJECT_ID = "fwybohsuhbzqifaqsajl";
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

let cachedClient: SupabaseClient | null = null;
let lastUsedKey: string | null = null;

export function getSupabaseAnonKey(): string | null {
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("supabase_anon_key");
    if (localKey && localKey.trim()) return localKey.trim();
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
}

export function setSupabaseAnonKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem("supabase_anon_key", key.trim());
    } else {
      localStorage.removeItem("supabase_anon_key");
    }
  }
  cachedClient = null; // force re-creation
}

export function getSupabaseClient(): SupabaseClient | null {
  const anonKey = getSupabaseAnonKey();
  if (!anonKey) return null;

  if (cachedClient && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    const client = createClient(DEFAULT_SUPABASE_URL, anonKey, {
      auth: { persistSession: false }
    });
    cachedClient = client;
    lastUsedKey = anonKey;
    return client;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}
