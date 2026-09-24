import { WeddingData } from "./types/wedding";
import { defaultWeddingData } from "./default-wedding";
import { getSupabaseClient } from "./supabase";

const LOCAL_STORAGE_KEY = "custom_weddings_data";
const BROADCAST_CHANNEL_NAME = "wedding_realtime_sync";

let memoryMap: Record<string, WeddingData> | null = null;

function getLocalWeddingsMap(): Record<string, WeddingData> {
  if (memoryMap) return memoryMap;
  if (typeof window === "undefined") return { [defaultWeddingData.slug]: defaultWeddingData };
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { [defaultWeddingData.slug]: defaultWeddingData };
    const parsed = JSON.parse(raw);
    if (!parsed[defaultWeddingData.slug]) {
      parsed[defaultWeddingData.slug] = defaultWeddingData;
    }
    memoryMap = parsed;
    return parsed;
  } catch (e) {
    console.error("Error reading local weddings:", e);
    return { [defaultWeddingData.slug]: defaultWeddingData };
  }
}

function saveLocalWeddingsMap(map: Record<string, WeddingData>): void {
  memoryMap = map;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Storage quota reached for localStorage. Persisting in-memory session.", e);
  }
}

export function broadcastWeddingUpdate(wedding: WeddingData) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wedding-data-updated", { detail: wedding }));
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({ type: "UPDATE", wedding });
    channel.close();
  } catch {
    // BroadcastChannel not supported in all contexts
  }
}

const broadcastUpdate = broadcastWeddingUpdate;



export function subscribeToWeddingUpdates(onUpdate: (wedding: WeddingData) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const ce = e as CustomEvent<WeddingData>;
    if (ce.detail) onUpdate(ce.detail);
  };
  window.addEventListener("wedding-data-updated", handleCustomEvent);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === "UPDATE" && event.data.wedding) {
        onUpdate(event.data.wedding);
      }
    };
  } catch {
    // Ignore if not supported
  }

  return () => {
    window.removeEventListener("wedding-data-updated", handleCustomEvent);
    if (channel) {
      channel.close();
    }
  };
}

export async function listWeddings(): Promise<WeddingData[]> {
  const localMap = getLocalWeddingsMap();
  const supabase = getSupabaseClient();

  if (!supabase) {
    const all = Object.values(localMap);
    all.sort((a, b) => {
      if (a.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return -1;
      if (b.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return 1;
      return 0;
    });
    return all;
  }

  try {
    const { data, error } = await supabase.from("weddings").select("*").order("updated_at", { ascending: false });
    if (error) {
      console.warn("Supabase fetch failed, using local list:", error.message);
      const all = Object.values(localMap);
      all.sort((a, b) => {
        if (a.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return -1;
        if (b.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return 1;
        return 0;
      });
      return all;
    }

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row.data && row.slug) {
          localMap[row.slug] = row.data as WeddingData;
        }
      }
      saveLocalWeddingsMap(localMap);
    }
  } catch (err) {
    console.warn("Failed to sync with Supabase list:", err);
  }

  const all = Object.values(localMap);
  all.sort((a, b) => {
    if (a.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return -1;
    if (b.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) return 1;
    return 0;
  });
  return all;
}

export async function getWedding(slug: string): Promise<WeddingData> {
  const localMap = getLocalWeddingsMap();
  const localWedding =
    localMap[slug] ||
    Object.values(localMap).find((w) => w.slug.toLowerCase() === slug.toLowerCase());

  const isDefault = slug.toLowerCase() === defaultWeddingData.slug.toLowerCase();

  const supabase = getSupabaseClient();
  if (!supabase) {
    return localWedding || (isDefault ? defaultWeddingData : { ...defaultWeddingData, slug });
  }

  try {
    const { data, error } = await supabase
      .from("weddings")
      .select("data")
      .or(`slug.eq.${slug},slug.ilike.${slug}`)
      .maybeSingle();
    if (!error && data?.data) {
      const fetched = data.data as WeddingData;
      localMap[slug] = fetched;
      saveLocalWeddingsMap(localMap);
      return fetched;
    }
  } catch (err) {
    console.warn("Error fetching wedding from Supabase:", err);
  }

  return localWedding || (isDefault ? defaultWeddingData : { ...defaultWeddingData, slug });
}

export async function saveWedding(wedding: WeddingData): Promise<{ success: boolean; error?: string }> {
  const localMap = getLocalWeddingsMap();
  wedding.updatedAt = new Date().toISOString();
  localMap[wedding.slug] = wedding;
  saveLocalWeddingsMap(localMap);
  broadcastUpdate(wedding);

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from("weddings").upsert(
      {
        slug: wedding.slug,
        bride_name: wedding.brideName,
        groom_name: wedding.groomName,
        wedding_date: wedding.weddingDate,
        data: wedding,
        updated_at: wedding.updatedAt
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error("Supabase upsert error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Supabase error during save:", err);
    return { success: false, error: String(err) };
  }
}

export async function deleteWedding(slug: string): Promise<boolean> {
  const localMap = getLocalWeddingsMap();
  delete localMap[slug];
  saveLocalWeddingsMap(localMap);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("weddings").delete().eq("slug", slug);
    } catch (e) {
      console.error("Supabase delete failed:", e);
    }
  }
  return true;
}

export async function uploadWeddingPhoto(file: File, slug: string, slotName: string): Promise<string> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${slug}/${slotName}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("wedding-photos")
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("wedding-photos").getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn("Supabase storage upload failed, falling back to local base64:", uploadError.message);
      }
    } catch (err) {
      console.warn("Storage upload exception, falling back to local base64:", err);
    }
  }

  // Fallback to local Base64 / Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
