"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import VeriTazelik from "./VeriTazelik";
import PaylasButonlar from "./PaylasButonlar";
import { HAYVAN_RENK, RENKLER } from "@/lib/theme";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { distinctGun } from "@/lib/guncel";
import { kartUretilebilir } from "@/lib/tazelik";
import { hayvanGorunen } from "@/lib/karkas";

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
  kaynak: string;
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

  const sf = fiyatlar.find((f) => f.hayvan_norm === secilen);

  // Grafik yalnız seçili fiyatın KAYNAĞININ serisini çizer (ESK/UKON karışmaz)
  const seri = grafik.filter((g) => g.hayvan_norm === secilen && (!sf || g.kaynak === sf.kaynak));
  const grafikVeri = seri.map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.fiyat ?? 0, en_az: g.fiyat ?? 0, en_cok: g.fiyat ?? 0 }));
  const gunSayisi = distinctGun(seri);

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
              style={{ padding: "5px 12px", fontSize: "13px", background: aktif ? r : RENKLER.surface, color: aktif ? "#fff" : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              {hayvanGorunen(f.hayvan_norm)}
            </button>
          );
        })}
      </div>

      {sf && (
        <>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{formatFiyat(sf.fiyat)}</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>{sf.birim}</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>{sf.kaynak} · {sf.cekilme_tarihi}</span>
            <VeriTazelik tarih={sf.cekilme_tarihi} />
          </div>
          {/* Paylaşım: PNG kart bayat veride üretilmez (KARAR), buton pasif gösterilir */}
          <div style={{ marginBottom: "16px" }}>
            <PaylasButonlar
              metin={`🐄 ${hayvanGorunen(secilen)} ${formatFiyat(sf.fiyat)} ${sf.birim}\n${sf.kaynak.replace("_SUT", "")} · ${kisaTarih(sf.cekilme_tarihi)}\nhttps://borsanadolu.6ngen.com/hayvan`}
              pngUrl={kartUretilebilir(sf.cekilme_tarihi) ? `/api/kart/fiyat?urun=${secilen}` : null}
            />
          </div>
        </>
      )}

      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>
          30 GÜN TARİHÇE · {gunSayisi}/30 gün{sf ? ` · ${sf.kaynak}` : ""}
        </div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim={sf?.birim ?? "TL/kg"} urun_ad={sf?.hayvan ?? secilen} kaynakEtiket={sf?.kaynak} />
      </div>
    </div>
  );
}
