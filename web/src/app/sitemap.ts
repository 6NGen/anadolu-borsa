import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase";
import { SITE_URL } from "@/lib/urun-tanim";

// Günde 1 tazelenir; ürün listesi urun_meta'dan (generateStaticParams ile aynı kaynak).
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statik: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tarim`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/hayvan`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/parite`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/hedef`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/fiyat-bildir`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/metodoloji`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const { data } = await supabaseServer.from("urun_meta").select("urun_norm");
  const urunler: MetadataRoute.Sitemap = (data ?? []).map((r) => ({
    url: `${SITE_URL}/urun/${r.urun_norm.toLowerCase()}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...statik, ...urunler];
}
