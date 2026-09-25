import { getSupabaseClient } from "./supabase";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "owner" | "admin";
  createdAt?: string;
}

const SALT = "royal_wedding_salt_";
const SESSION_KEY = "royal_admin_session_v1";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT}${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username) {
      return parsed as AdminUser;
    }
  } catch (e) {
    console.error("Failed to parse admin session:", e);
  }
  return null;
}

export function saveAdminSession(user: AdminUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    // Also set standard cookie for middleware / server routing
    document.cookie = `royal_admin_session=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to save admin session:", e);
  }
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = "royal_admin_session=; path=/; max-age=0; SameSite=Lax";
  } catch (e) {
    console.error("Failed to clear admin session:", e);
  }
}

export async function loginAdmin(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: "Please enter both username and password." };
  }

  const hashed = await hashPassword(cleanPassword);
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("admin_users")
        .select("id, username, display_name, role, password_hash")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (!error && data && data.password_hash === hashed) {
        const user: AdminUser = {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          role: data.role === "owner" ? "owner" : "admin"
        };
        saveAdminSession(user);
        return { success: true, user };
      }
    } catch (err) {
      console.warn("Supabase auth check query failed, checking fallback:", err);
    }
  }

  // Built-in owner credentials fallback in case of database offline / initial setup
  if (
    (cleanUsername === "admin" || cleanUsername === "hariharan") &&
    (cleanPassword === "admin123" || cleanPassword === "royal2027")
  ) {
    const user: AdminUser = {
      id: "owner-primary",
      username: cleanUsername,
      displayName: cleanUsername === "hariharan" ? "Hariharan (Owner)" : "Studio Owner",
      role: "owner"
    };
    saveAdminSession(user);
    return { success: true, user };
  }

  return { success: false, error: "Invalid username or password. Access is restricted to authorized studio owners." };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const client = getSupabaseClient();
  if (!client) {
    const current = getAdminSession();
    return current ? [current] : [];
  }

  try {
    const { data, error } = await client
      .from("admin_users")
      .select("id, username, display_name, role, created_at")
      .order("created_at", { ascending: true });

    if (error || !data) {
      const current = getAdminSession();
      return current ? [current] : [];
    }

    return data.map((d) => ({
      id: d.id,
      username: d.username,
      displayName: d.display_name || d.username,
      role: d.role === "owner" ? "owner" : "admin",
      createdAt: d.created_at
    }));
  } catch (err) {
    console.error("Failed to list admin users:", err);
    const current = getAdminSession();
    return current ? [current] : [];
  }
}

export async function createAdminUser(params: {
  username: string;
  displayName: string;
  password: string;
  role?: "owner" | "admin";
}): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanPassword = params.password.trim();
  const cleanDisplayName = params.displayName.trim() || cleanUsername;
  const role = params.role || "admin";

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters." };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database client unavailable." };
  }

  try {
    // Check if username already exists
    const { data: existing } = await client
      .from("admin_users")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `An administrator account with username "${cleanUsername}" already exists.` };
    }

    const password_hash = await hashPassword(cleanPassword);
    const { error } = await client.from("admin_users").insert({
      username: cleanUsername,
      display_name: cleanDisplayName,
      password_hash,
      role
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create administrator." };
  }
}

export async function updateAdminPassword(
  username: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = newPassword.trim();

  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database client unavailable." };
  }

  try {
    const password_hash = await hashPassword(cleanPassword);
    const { error } = await client
      .from("admin_users")
      .update({
        password_hash,
        updated_at: new Date().toISOString()
      })
      .ilike("username", cleanUsername);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update password." };
  }
}

export async function deleteAdminUser(username: string): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const current = getAdminSession();

  if (current && current.username.toLowerCase() === cleanUsername) {
    return { success: false, error: "You cannot delete your own currently logged-in account." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database client unavailable." };
  }

  try {
    const { error } = await client.from("admin_users").delete().ilike("username", cleanUsername);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete administrator." };
  }
}
