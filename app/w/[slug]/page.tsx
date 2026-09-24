import ClientWeddingView from "./client-view";

export function generateStaticParams() {
  return [
    { slug: "Jyothika-Suriya" },
    { slug: "rohidcb-pushyar" },
    { slug: "default" }
  ];
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
