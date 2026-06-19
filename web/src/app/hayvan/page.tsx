import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import HayvanClient from "@/components/HayvanClient";
import SuruDegeri from "@/components/SuruDegeri";
import PiyasaKarti from "@/components/PiyasaKarti";
import { tekHayvanKaynak } from "@/lib/guncel";
import { RENKLER } from "@/lib/theme";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Canlı Hayvan ve Karkas Fiyatları — Tosun, Kuzu, Süt | Anadolu Borsa",
  description: "ESK karkas alım fiyatları (tosun, kuzu, toklu) ve USK çiğ süt tavsiye fiyatı — günlük, kaynaklı, grafikli.",
};

export default async function HayvanPage() {
  const [{ data: fiyatlarHam }, { data: grafik }, { data: piyasa }] = await Promise.all([
    supabaseServer.from("son_hayvan_fiyatlari").select("*").order("hayvan_norm"),
    supabaseServer.from("son_30_gun_hayvan").select("*").order("cekilme_tarihi"),
    supabaseServer.from("piyasa_fiyatlari").select("*"),
  ]);

  // Kaynağı değişen hayvanın (süt: ESK_SUT → USK) eski bayat kaydını ele —
  // hayvan_norm başına tek (en güncel) satır kalsın. Grafik ham seriyi kullanır.
  const fiyatlar = tekHayvanKaynak(fiyatlarHam ?? []);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>HAYVAN BORSASI</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>ESK karkas alım fiyatları + Çiğ süt · Günlük güncellenir</p>
      </div>

      {fiyatlar.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Henüz veri yok. Scraper çalıştıktan sonra fiyatlar burada görünür.
        </div>
      ) : (
        <>
          <HayvanClient fiyatlar={fiyatlar} grafik={grafik ?? []} />

          {/* Resmi (ESK/USK) vs Gerçek (kullanıcı bildirimi, min 3) */}
          <section style={{ marginTop: "20px" }}>
            <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>BORSA vs PİYASA</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "8px" }}>
              {fiyatlar.map((h) => {
                const pv = (piyasa ?? []).find((p) => p.urun_norm === h.hayvan_norm) ?? null;
                return (
                  <PiyasaKarti
                    key={h.hayvan_norm}
                    urun_ad={h.hayvan}
                    borsa={{ kaynak: h.kaynak.replace("_SUT", ""), fiyat: h.fiyat, birim: h.birim ?? "TL/kg", tarih: h.cekilme_tarihi }}
                    piyasa={pv ? { agirlikli_ortalama: pv.agirlikli_ortalama, en_az: pv.en_az, en_cok: pv.en_cok, bildirim_sayisi: pv.bildirim_sayisi, il: pv.il } : null}
                  />
                );
              })}
            </div>
          </section>

          <SuruDegeri fiyatlar={fiyatlar} />
        </>
      )}
    </main>
  );
}
