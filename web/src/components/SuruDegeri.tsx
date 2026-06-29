"use client";
import { useState } from "react";
import { RENKLER, HAYVAN_RENK, emoji } from "@/lib/theme";
import { KARKAS_KG, HAYVAN_AD } from "@/lib/karkas";
import { formatFiyat, parseFiyatGirdi } from "@/lib/format";

interface HayvanFiyat {
  hayvan_norm: string;
  fiyat: number | null;
}

export default function SuruDegeri({ fiyatlar }: { fiyatlar: HayvanFiyat[] }) {
  // hayvan_norm başına tek fiyat (karkas ağırlığı tanımlı olanlar)
  const turler = Array.from(
    new Map(
      fiyatlar
        .filter((f) => KARKAS_KG[f.hayvan_norm] && f.fiyat)
        .map((f) => [f.hayvan_norm, f.fiyat as number])
    ).entries()
  ).map(([norm, fiyat]) => ({ norm, fiyat }));

  const [adet, setAdet] = useState<Record<string, number>>({});
  // M7a: karkas kg KULLANICI AYARLI — varsayılan lib/karkas (TÜİK/ESK ort., tahmin)
  const [karkasAyar, setKarkasAyar] = useState<Record<string, string>>({});

  const kg = (norm: string) => {
    const v = parseFiyatGirdi(karkasAyar[norm] ?? "");
    return karkasAyar[norm] !== undefined && Number.isFinite(v) && v > 0 ? v : KARKAS_KG[norm];
  };
  const basFiyat = (norm: string, fiyat: number) => fiyat * kg(norm);

  const toplam = turler.reduce((acc, t) => acc + (adet[t.norm] ?? 0) * basFiyat(t.norm, t.fiyat), 0);
  const toplamBas = turler.reduce((acc, t) => acc + (adet[t.norm] ?? 0), 0);

  if (turler.length === 0) return null;

  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "16px", marginTop: "20px" }}>
      <div style={{ fontSize: "12px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>🧮 SÜRÜ DEĞERİ HESAPLAYICI</div>
      <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "14px" }}>Baş sayısını gir; ortalama karkas ağırlığını kendi sürüne göre düzenleyebilirsin.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {turler.map((t) => {
          const renk = HAYVAN_RENK[t.norm] ?? RENKLER.red;
          const bf = basFiyat(t.norm, t.fiyat);
          return (
            <div key={t.norm} style={{ background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", padding: "11px" }}>
              <label style={{ fontSize: "13px", color: RENKLER.text, display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px", fontWeight: 600 }}>
                <span>{emoji(t.norm)}</span>{HAYVAN_AD[t.norm] ?? t.norm}
              </label>
              <input
                type="number" min={0} inputMode="numeric" placeholder="0 baş"
                value={adet[t.norm] ?? ""}
                onChange={(e) => setAdet((p) => ({ ...p, [t.norm]: Math.max(0, Number(e.target.value) || 0) }))}
                style={{ width: "100%", padding: "7px 9px", fontSize: "13px", background: RENKLER.surface, color: RENKLER.text, border: `1px solid ${RENKLER.border}`, borderRadius: "6px", fontFamily: "var(--font-mono)" }}
              />
              {/* Ayarlı karkas kg */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "7px" }}>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>karkas</span>
                <input
                  type="number" min={1} inputMode="numeric"
                  value={karkasAyar[t.norm] ?? String(KARKAS_KG[t.norm])}
                  onChange={(e) => setKarkasAyar((p) => ({ ...p, [t.norm]: e.target.value }))}
                  style={{ width: "52px", padding: "3px 6px", fontSize: "13px", background: RENKLER.surface, color: RENKLER.text, border: `1px solid ${RENKLER.border}`, borderRadius: "5px", fontFamily: "var(--font-mono)" }}
                />
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>kg · tahmin</span>
              </div>
              <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "6px" }}>~{formatFiyat(Math.round(bf), 0)} TL/baş</div>
              {(adet[t.norm] ?? 0) > 0 && (
                <div style={{ fontSize: "13px", color: renk, fontWeight: 700, marginTop: "3px" }}>= {formatFiyat(Math.round((adet[t.norm] ?? 0) * bf), 0)} TL</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${RENKLER.border}` }}>
        <span style={{ fontSize: "13px", color: RENKLER.muted }}>{toplamBas} baş · tahmini sürü değeri</span>
        <span style={{ fontSize: "28px", color: RENKLER.green, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          {formatFiyat(Math.round(toplam), 0)} <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL</span>
        </span>
      </div>
      <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.5 }}>
        * Değer = baş × karkas kg × güncel ESK karkas fiyatı. Karkas ağırlıkları düzenlenebilir varsayılandır (ESK/TÜİK ortalaması, ırka ve besiye göre değişir).
      </div>
    </div>
  );
}
