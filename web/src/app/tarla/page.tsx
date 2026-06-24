import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import TarlaClient from "@/components/TarlaClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sanal Tarla — Çiftçiliğini Kâğıt Üzerinde Takip Et | Anadolu Borsa",
  description: "Güzlük buğday/arpa tarlanı sanal aç, açılış maliyetini sabitle, bugünkü değerini canlı borsa fiyatıyla izle, hasatta paylaş.",
};

const URUNLER = ["BUGDAY", "ARPA", "YULAF", "MISIR"];

export default async function TarlaPage() {
  const [{ data: mazotRows }, { data: sonFiyatlar }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat").eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    supabaseServer.from("son_fiyatlar").select("urun_norm, ortalama, borsa, cekilme_tarihi").in("urun_norm", URUNLER),
  ]);

  const mazot = Number(mazotRows?.[0]?.fiyat ?? 0);
  const borsa: Record<string, { fiyat: number; borsa: string; tarih: string }> = {};
  for (const r of sonFiyatlar ?? []) {
    if (r.ortalama != null) borsa[r.urun_norm] = { fiyat: Number(r.ortalama), borsa: r.borsa, tarih: r.cekilme_tarihi };
  }

  return <TarlaClient mazot={mazot} borsa={borsa} />;
}
