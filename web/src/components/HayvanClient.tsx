"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import { HAYVAN_RENK, RENKLER } from "@/lib/theme";

interface HayvanFiyat {
  kaynak: string;
  hayvan: string;
  hayvan_norm: string;
  kategori: string | null;
  bolge: string | null;
  cekilme_tarihi: string;
  fiyat: number | null;
  birim: string;
}

interface GrafikVeri {
  hayvan_norm: string;
  cekilme_tarihi: string;
  fiyat: number | null;
}

interface Props {
  fiyatlar: HayvanFiyat[];
  grafik: GrafikVeri[];
}

export default function HayvanClient({ fiyatlar, grafik }: Props) {
  const [secilen, setSecilen] = useState<string>(fiyatlar[0]?.hayvan_norm ?? "TOSUN");

  const grafikVeri = grafik
    .filter((g) => g.hayvan_norm === secilen)
    .map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.fiyat ?? 0, en_az: g.fiyat ?? 0, en_cok: g.fiyat ?? 0 }));

  const sf = fiyatlar.find((f) => f.hayvan_norm === secilen);
  const renk = HAYVAN_RENK[secilen] ?? RENKLER.red;

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {fiyatlar.map((f) => {
          const r = HAYVAN_RENK[f.hayvan_norm] ?? RENKLER.red;
          const aktif = f.hayvan_norm === secilen;
          return (
            <button
              key={`${f.kaynak}-${f.hayvan_norm}`}
              onClick={() => setSecilen(f.hayvan_norm)}
              style={{ padding: "5px 12px", fontSize: "11px", background: aktif ? r : RENKLER.surface, color: aktif ? "#fff" : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              {f.hayvan_norm}
            </button>
          );
        })}
      </div>

      {sf && (
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "16px" }}>
          <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{sf.fiyat?.toFixed(2) ?? "—"}</span>
          <span style={{ fontSize: "13px", color: RENKLER.muted }}>{sf.birim}</span>
          <span style={{ fontSize: "11px", color: RENKLER.muted }}>{sf.kaynak} · {sf.cekilme_tarihi}</span>
        </div>
      )}

      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>30 GÜN TARİHÇE</div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim={sf?.birim ?? "TL/kg"} urun_ad={sf?.hayvan ?? secilen} />
      </div>
    </div>
  );
}
