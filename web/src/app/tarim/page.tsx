import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import TarimClient from "@/components/TarimClient";
import PiyasaKarti from "@/components/PiyasaKarti";
import { RENKLER } from "@/lib/theme";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tarım Ürünleri Fiyatları — Arpa, Buğday, Mısır | Anadolu Borsa",
  description: "Arpa, buğday, mısır ve diğer hububat fiyatları — TOBB ve KTB borsa verileri, son 30 gün grafikli. Günlük güncellenir.",
};

export default async function TarimPage() {
  const [{ data: sonFiyatlar }, { data: grafik }, { data: piyasa }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("*").in("urun_norm", ["ARPA", "BUGDAY", "MISIR", "SAMAN", "YONCA", "YULAF", "CAVDAR"]),
    supabaseServer.from("son_30_gun").select("*").order("cekilme_tarihi"),
    supabaseServer.from("piyasa_fiyatlari").select("*"),
  ]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>TARIM BORSASI</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>TOBB ve Konya Ticaret Borsası (KTB) verileri · Günlük güncellenir</p>
      </div>

      {(sonFiyatlar ?? []).length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Henüz veri yok. Scraper çalıştıktan sonra fiyatlar burada görünür.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <TarimClient sonFiyatlar={sonFiyatlar ?? []} grafik={grafik ?? []} />
          <div>
            <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>BORSA vs PİYASA</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(sonFiyatlar ?? []).map((f) => {
                const piyasaVeri = (piyasa ?? []).find((p) => p.urun_norm === f.urun_norm) ?? null;
                return (
                  <PiyasaKarti
                    key={f.urun_norm}
                    urun_ad={f.urun_ad ?? f.urun_norm}
                    borsa={{ kaynak: f.borsa, fiyat: f.ortalama, birim: f.birim ?? "TL/KG", tarih: f.cekilme_tarihi }}
                    piyasa={piyasaVeri ? { agirlikli_ortalama: piyasaVeri.agirlikli_ortalama, en_az: piyasaVeri.en_az, en_cok: piyasaVeri.en_cok, bildirim_sayisi: piyasaVeri.bildirim_sayisi, il: piyasaVeri.il } : null}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
