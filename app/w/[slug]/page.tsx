"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { getWedding } from "@/lib/wedding-storage";

export default function ClientWeddingPage({
  params
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const routerParams = useParams();
  const [slug, setSlug] = useState<string>("");
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveSlug() {
      let resolvedSlug = "";
      if (params && typeof (params as any).then === "function") {
        const resolved = await params;
        resolvedSlug = resolved.slug;
      } else if (params && (params as any).slug) {
        resolvedSlug = (params as any).slug;
      } else if (routerParams?.slug) {
        resolvedSlug = Array.isArray(routerParams.slug) ? routerParams.slug[0] : routerParams.slug;
      }

      if (resolvedSlug) {
        setSlug(resolvedSlug);
        const data = await getWedding(resolvedSlug);
        setWedding(data);
      } else {
        setWedding(defaultWeddingData);
      }
      setLoading(false);
    }

    resolveSlug();
  }, [params, routerParams]);

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
