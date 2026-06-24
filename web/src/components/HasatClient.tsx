"use client";
import { useState } from "react";
import HavaDurumu from "./HavaDurumu";
import FiyatGrafik from "./FiyatGrafik";
import { RENKLER, YEM_RENK, emoji } from "@/lib/theme";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { enGuncelYem, distinctGun } from "@/lib/guncel";
import { HASAT_TAKVIMI, HASAT_URUNLER } from "@/lib/hasat-takvimi";

const AD: Record<string, string> = { BUGDAY: "Buğday", ARPA: "Arpa", MISIR: "Mısır", YULAF: "Yulaf", CAVDAR: "Çavdar" };

interface GrafikVeri {
  urun_norm: string; borsa: string; cekilme_tarihi: string;
  ortalama: number | null; en_az: number | null; en_cok: number | null;
}

const kart: React.CSSProperties = { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "16px" };
const etiket: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em", marginBottom: "12px", fontWeight: 600 };

export default function HasatClient({ grafik }: { grafik: GrafikVeri[] }) {
  const mevcutUrunler = HASAT_URUNLER.filter((u) => grafik.some((g) => g.urun_norm === u));
  const [secilen, setSecilen] = useState(mevcutUrunler[0] ?? "BUGDAY");
  const renk = YEM_RENK[secilen] ?? RENKLER.green;

  const urunSatirlari = grafik.filter((g) => g.urun_norm === secilen);
  const guncel = enGuncelYem(urunSatirlari);
  const borsa = guncel?.kaynak ?? null;
  const seri = urunSatirlari.filter((g) => g.borsa === borsa);
  const grafikVeri = seri.map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));
  const gun = distinctGun(seri);
  const takvim = HASAT_TAKVIMI[secilen];

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>HASAT PANELİ</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Bölge havası, fiyat trendi ve ortalama hasat takvimi tek ekranda. Yorum yok — yalnızca veri.</p>
      </div>

      {/* Ürün seçici */}
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
        {mevcutUrunler.map((u) => {
          const r = YEM_RENK[u] ?? RENKLER.green;
          const aktif = u === secilen;
          return (
            <button key={u} onClick={() => setSecilen(u)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 13px", fontSize: "11.5px", background: aktif ? `${r}22` : "transparent", color: aktif ? r : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}>
              <span style={{ fontSize: "13px" }}>{emoji(u)}</span>{AD[u]}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
        {/* a) Bölge havası */}
        <div>
          <HavaDurumu />
        </div>

        {/* c) Hasat takvimi */}
        <div style={kart}>
          <div style={etiket}>🌾 HASAT TAKVİMİ · {AD[secilen]?.toUpperCase()}</div>
          {takvim ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: RENKLER.bg, borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>Ekim</span>
                <span style={{ fontSize: "15px", color: RENKLER.text, fontWeight: 600 }}>{takvim.ekim}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: RENKLER.bg, borderRadius: "8px", border: `1px solid ${renk}40` }}>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>Hasat</span>
                <span style={{ fontSize: "15px", color: renk, fontWeight: 700 }}>{takvim.hasat}</span>
              </div>
              <div style={{ fontSize: "9px", color: RENKLER.muted, lineHeight: 1.5 }}>Ortalamadır; bölge, rakım ve yıla göre değişir. Kaynak: il tarım müdürlükleri / TÜİK yayınları.</div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: RENKLER.muted }}>Bu ürün için takvim yok.</div>
          )}
        </div>
      </div>

      {/* b) Fiyat trendi */}
      <div style={{ ...kart, marginTop: "12px" }}>
        <div style={etiket}>📉 30 GÜN FİYAT · {AD[secilen]?.toUpperCase()}{borsa ? ` · ${borsa}` : ""} · {gun}/30 gün</div>
        {grafikVeri.length > 0 ? (
          <FiyatGrafik data={grafikVeri} renk={renk} birim="TL/KG" urun_ad={AD[secilen] ?? secilen} kaynakEtiket={borsa ?? undefined} />
        ) : (
          <div style={{ fontSize: "12px", color: RENKLER.muted, padding: "20px 0", textAlign: "center" }}>Bu ürün için fiyat serisi yok.</div>
        )}
        {guncel && (
          <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "8px" }}>Güncel: {formatFiyat(guncel.fiyat)} TL/kg · {guncel.kaynak} · {kisaTarih(guncel.tarih)}</div>
        )}
      </div>
    </main>
  );
}
