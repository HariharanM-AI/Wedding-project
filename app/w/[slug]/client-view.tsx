"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { getWedding, subscribeToWeddingUpdates } from "@/lib/wedding-storage";
import { getSupabaseClient } from "@/lib/supabase";

export default function ClientWeddingView({ slug: initialSlug }: { slug?: string }) {
  const routerParams = useParams();
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let resolvedSlug = "";

    // 1. Resolve slug from browser window URL bar first
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] === "w" && parts[1] && parts[1] !== "default") {
        resolvedSlug = decodeURIComponent(parts[1]).trim().replace(/\s+/g, "-");
      }
    }

    // 2. Fallback to router params if not resolved
    if (!resolvedSlug && routerParams?.slug) {
      const pSlug = Array.isArray(routerParams.slug) ? routerParams.slug[0] : routerParams.slug;
      if (pSlug && pSlug !== "default") {
        resolvedSlug = decodeURIComponent(pSlug).trim().replace(/\s+/g, "-");
      }
    }

    // 3. Fallback to initialSlug if valid and not "default"
    if (!resolvedSlug && initialSlug && initialSlug !== "default") {
      resolvedSlug = initialSlug.trim();
    }

    // Load initial wedding data
    async function loadData() {
      if (resolvedSlug) {
        const data = await getWedding(resolvedSlug);
        if (isMounted) {
          setWedding(data);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setWedding(defaultWeddingData);
          setLoading(false);
        }
      }
    }

    loadData();

    // 4. Real-time updates: local tabs via BroadcastChannel
    const unsubscribeLocal = subscribeToWeddingUpdates((updated) => {
      if (isMounted && resolvedSlug && updated.slug.toLowerCase() === resolvedSlug.toLowerCase()) {
        setWedding(updated);
      }
    });

    // 5. Real-time updates: remote client devices via Supabase Realtime WebSocket
    let supabaseChannel: any = null;
    const supabase = getSupabaseClient();
    if (supabase && resolvedSlug) {
      supabaseChannel = supabase
        .channel(`wedding-live-${resolvedSlug}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "weddings",
            filter: `slug=eq.${resolvedSlug}`
          },
          (payload: any) => {
            if (isMounted && payload.new && payload.new.data) {
              setWedding(payload.new.data as WeddingData);
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      unsubscribeLocal();
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [initialSlug, routerParams]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#f7e9cf] flex flex-col items-center justify-center font-serif text-[#55313c]">
        <span className="text-5xl mb-4 font-light">✦</span>
        <p className="text-xs tracking-widest uppercase">Loading Invitation...</p>
      </div>
    );
  }

  return <WeddingInvitation initialData={wedding || defaultWeddingData} />;
}
