"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { getWedding } from "@/lib/wedding-storage";

export default function ClientWeddingView({ slug: initialSlug }: { slug?: string }) {
  const routerParams = useParams();
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      let resolvedSlug = initialSlug || "";
      if (!resolvedSlug && routerParams?.slug) {
        resolvedSlug = Array.isArray(routerParams.slug) ? routerParams.slug[0] : routerParams.slug;
      }
      if (!resolvedSlug && typeof window !== "undefined") {
        const parts = window.location.pathname.split("/").filter(Boolean);
        if (parts[0] === "w" && parts[1]) {
          resolvedSlug = parts[1];
        }
      }

      if (resolvedSlug) {
        const data = await getWedding(resolvedSlug);
        setWedding(data);
      } else {
        setWedding(defaultWeddingData);
      }
      setLoading(false);
    }

    loadData();
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
