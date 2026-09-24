"use client";

import { useEffect, useState } from "react";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { getWedding } from "@/lib/wedding-storage";

export default function Home() {
  const [wedding, setWedding] = useState<WeddingData>(defaultWeddingData);

  useEffect(() => {
    let active = true;
    async function loadWedding() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("w") || params.get("wedding") || defaultWeddingData.slug;
      const data = await getWedding(slug);
      if (active && data) {
        setWedding(data);
      }
    }
    loadWedding();
    return () => {
      active = false;
    };
  }, []);

  return <WeddingInvitation initialData={wedding} />;
}
