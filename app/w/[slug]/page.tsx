import ClientWeddingView from "./client-view";
import { getSupabaseClient } from "@/lib/supabase";

export async function generateStaticParams() {
  const fallbackSlugs = [
    { slug: "Jyothika-Suriya" },
    { slug: "rohidcb-pushyar" },
    { slug: "dharant-karthigam" },
    { slug: "ananya-karthik" },
    { slug: "hari-moni" },
    { slug: "hari-trisha" },
    { slug: "suriyas-jotikas" },
    { slug: "default" }
  ];

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from("weddings").select("slug");
      if (!error && data && data.length > 0) {
        const slugMap = new Map<string, string>();
        for (const item of fallbackSlugs) {
          slugMap.set(item.slug.toLowerCase(), item.slug);
        }
        for (const row of data) {
          if (row.slug) {
            slugMap.set(row.slug.toLowerCase(), row.slug);
          }
        }
        return Array.from(slugMap.values()).map((slug) => ({ slug }));
      }
    }
  } catch (err) {
    console.warn("generateStaticParams Supabase query error:", err);
  }

  return fallbackSlugs;
}

export default async function ClientWeddingPage({
  params
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = params && typeof (params as any).then === "function" 
    ? await params 
    : (params as { slug: string });

  return <ClientWeddingView slug={resolvedParams?.slug} />;
}
