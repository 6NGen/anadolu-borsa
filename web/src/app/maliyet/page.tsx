import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import MaliyetClient from "@/components/MaliyetClient";
import { MALIYET_URUNLER } from "@/lib/maliyet";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ekim Maliyeti Hesaplayıcı — Dekar Başı Maliyet ve Gelir | Anadolu Borsa",
  description: "Buğday, arpa, mısır için dekar başı ekim maliyeti ve bugünkü borsa fiyatıyla beklenen gelir. Mazot canlı, verim TÜİK ortalaması.",
};

export default async function MaliyetPage() {
  const [{ data: mazotRows }, { data: sonFiyatlar }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat, gecerlilik_tarihi")
      .eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    supabaseServer.from("son_fiyatlar").select("urun_norm, ortalama, borsa, cekilme_tarihi").in("urun_norm", MALIYET_URUNLER),
  ]);

  const mazot = Number(mazotRows?.[0]?.fiyat ?? 0);
  const borsa: Record<string, { fiyat: number; borsa: string; tarih: string }> = {};
  for (const r of sonFiyatlar ?? []) {
    if (r.ortalama != null) borsa[r.urun_norm] = { fiyat: Number(r.ortalama), borsa: r.borsa, tarih: r.cekilme_tarihi };
  }

  return <MaliyetClient mazot={mazot} borsa={borsa} />;
}
