"use client";

import { useEffect, useState } from "react";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { getWedding } from "@/lib/wedding-storage";

export default function Home() {
  const [wedding, setWedding] = useState<WeddingData>(defaultWeddingData);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("w") || params.get("wedding");
      if (slug) {
        getWedding(slug).then((data) => {
          if (data) setWedding(data);
        });
      }
    }
  }, []);

  return <WeddingInvitation initialData={wedding} />;
}
