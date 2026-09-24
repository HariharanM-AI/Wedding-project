import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_PROJECT_ID = "fwybohsuhbzqifaqsajl";
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

let cachedClient: SupabaseClient | null = null;
let lastUsedKey: string | null = null;
let lastUsedUrl: string | null = null;

export function getCleanSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl && envUrl.trim()) {
    // Strip trailing /rest/v1, /rest/v1/, or trailing slashes
    return envUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
  return DEFAULT_SUPABASE_URL;
}

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

  const url = getCleanSupabaseUrl();

  if (cachedClient && lastUsedKey === anonKey && lastUsedUrl === url) {
    return cachedClient;
  }

  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
    cachedClient = client;
    lastUsedKey = anonKey;
    lastUsedUrl = url;
    return client;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}
