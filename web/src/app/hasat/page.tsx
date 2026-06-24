import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import HasatClient from "@/components/HasatClient";
import { HASAT_URUNLER } from "@/lib/hasat-takvimi";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hasat Paneli — Hava, Fiyat Trendi, Hasat Takvimi | Anadolu Borsa",
  description: "Bölge hava durumu, ürün fiyat trendi ve ortalama hasat takvimi tek ekranda. Buğday, arpa, mısır.",
};

export default async function HasatPage() {
  const { data: grafik } = await supabaseServer
    .from("son_30_gun")
    .select("urun_norm, borsa, cekilme_tarihi, ortalama, en_az, en_cok")
    .in("urun_norm", HASAT_URUNLER)
    .order("cekilme_tarihi");

  return <HasatClient grafik={grafik ?? []} />;
}
