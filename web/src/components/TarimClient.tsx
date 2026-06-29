"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import VeriTazelik from "./VeriTazelik";
import PaylasButonlar from "./PaylasButonlar";
import { YEM_RENK, RENKLER } from "@/lib/theme";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { enGuncelYem, distinctGun } from "@/lib/guncel";
import { kartUretilebilir } from "@/lib/tazelik";
import { useBolgem, ilAscii } from "@/lib/bolgem";

interface SonFiyat {
  urun_norm: string;
  urun_ad: string | null;
  renk: string | null;
  borsa: string;
  cekilme_tarihi: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
  birim: string;
}

interface GrafikVeri {
  urun_norm: string;
  borsa: string;
  cekilme_tarihi: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
  islem_miktari?: number | null; // KG (migration_004 ile view'da); UI ton'a çevirir
}

const DUSUK_HACIM_KG = 20000; // <20 ton = düşük hacim
const tonGoster = (kg?: number | null) =>
  kg != null ? `${formatFiyat(kg / 1000, kg < 10000 ? 1 : 0)} ton` : null;

interface Props {
  sonFiyatlar: SonFiyat[];
  grafik: GrafikVeri[];
}

export default function TarimClient({ sonFiyatlar, grafik }: Props) {
  const [secilen, setSecilen] = useState<string>(sonFiyatlar[0]?.urun_norm ?? "ARPA");
  const [borsaSecim, setBorsaSecim] = useState<string | null>(null);
  const [bolgem] = useBolgem();

  // Seçili ürünün tüm satırları (30 gün, tüm borsalar)
  const urunSatirlari = grafik.filter((g) => g.urun_norm === secilen);
  const borsalar = [...new Set(urunSatirlari.map((g) => g.borsa))].sort();

  // M1: kullanıcının bölgesinin borsası bu üründe varsa öne gelir.
  // Yoksa deterministik en güncel (parite sayfasıyla aynı kural → aynı sayı).
  const bolgeBorsa = bolgem ? borsalar.find((b) => b === ilAscii(bolgem)) ?? null : null;
  const varsayilanBorsa = bolgeBorsa ?? enGuncelYem(urunSatirlari)?.kaynak ?? borsalar[0] ?? null;
  const borsa = borsaSecim && borsalar.includes(borsaSecim) ? borsaSecim : varsayilanBorsa;

  // 1.3: grafik SADECE seçili borsanın serisini çizer — borsalar karışmaz
  const seri = urunSatirlari.filter((g) => g.borsa === borsa);
  const grafikVeri = seri.map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));
  const gunSayisi = distinctGun(seri);

  // Başlık fiyatı: seçili borsanın en güncel satırı
  const guncelSatir = [...seri].sort((a, b) => b.cekilme_tarihi.localeCompare(a.cekilme_tarihi))[0];
  const sf = sonFiyatlar.find((f) => f.urun_norm === secilen);
  const renk = YEM_RENK[secilen] ?? RENKLER.green;

  // M2: borsa karşılaştırması — her borsanın bu ürün için en güncel satırı
  const borsaOzet = borsalar
    .map((b) => {
      const son = [...urunSatirlari.filter((g) => g.borsa === b)].sort((x, y) => y.cekilme_tarihi.localeCompare(x.cekilme_tarihi))[0];
      return son && son.ortalama != null ? { borsa: b, fiyat: son.ortalama, tarih: son.cekilme_tarihi, hacim: son.islem_miktari ?? null } : null;
    })
    .filter((x): x is { borsa: string; fiyat: number; tarih: string; hacim: number | null } => x != null)
    .sort((a, b) => a.fiyat - b.fiyat);
  const fiyatDizi = borsaOzet.map((x) => x.fiyat);
  const fark = fiyatDizi.length > 1 ? ((Math.max(...fiyatDizi) - Math.min(...fiyatDizi)) / Math.min(...fiyatDizi)) * 100 : null;

  return (
    <div>
      {/* Ürün butonları */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {sonFiyatlar.map((f) => {
          const r = YEM_RENK[f.urun_norm] ?? RENKLER.green;
          const aktif = f.urun_norm === secilen;
          return (
            <button
              key={f.urun_norm}
              onClick={() => { setSecilen(f.urun_norm); setBorsaSecim(null); }}
              style={{ padding: "5px 12px", fontSize: "13px", background: aktif ? r : RENKLER.surface, color: aktif ? "#000" : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              {f.urun_norm}
            </button>
          );
        })}
      </div>

      {/* Borsa seçici (1.3 opsiyonel): tek seri, seçilen borsa */}
      {borsalar.length > 1 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "14px" }}>
          {borsalar.map((b) => {
            const aktif = b === borsa;
            return (
              <button
                key={b}
                onClick={() => setBorsaSecim(b)}
                style={{ padding: "3px 10px", fontSize: "12px", background: aktif ? "#1A3020" : "transparent", color: aktif ? RENKLER.text : RENKLER.muted, border: `1px solid ${aktif ? RENKLER.green : RENKLER.border}`, borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
              >
                {b}
              </button>
            );
          })}
        </div>
      )}

      {/* Anlık fiyat — seçili borsanın en güncel değeri */}
      {guncelSatir && (
        <>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{formatFiyat(guncelSatir.ortalama)}</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL/KG</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>{borsa} · {guncelSatir.cekilme_tarihi}</span>
            <VeriTazelik tarih={guncelSatir.cekilme_tarihi} />
            {guncelSatir.islem_miktari != null && (
              <span style={{ fontSize: "13px", color: RENKLER.muted }}>
                · {tonGoster(guncelSatir.islem_miktari)} işlem
                {guncelSatir.islem_miktari < DUSUK_HACIM_KG && <span style={{ color: "#E8C040", marginLeft: "6px" }}>⚠ düşük hacim</span>}
              </span>
            )}
          </div>
          {/* Paylaşım: PNG kart bayat veride üretilmez (KARAR), buton pasif gösterilir */}
          <div style={{ marginBottom: "16px" }}>
            <PaylasButonlar
              metin={`🌾 ${sf?.urun_ad ?? secilen} ${formatFiyat(guncelSatir.ortalama)} TL/kg\n${borsa} · ${kisaTarih(guncelSatir.cekilme_tarihi)}\nhttps://borsanadolu.6ngen.com/tarim`}
              pngUrl={kartUretilebilir(guncelSatir.cekilme_tarihi) ? `/api/kart/fiyat?urun=${secilen}` : null}
            />
          </div>
        </>
      )}

      {/* M2: Borsa karşılaştırması — aynı ürün, tüm borsalar */}
      {borsaOzet.length > 1 && (
        <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: RENKLER.muted, letterSpacing: "0.1em" }}>BORSALAR · {sf?.urun_ad ?? secilen}</span>
            <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {fark != null && <span style={{ fontSize: "12px", color: RENKLER.muted }}>fark: <b style={{ color: renk }}>%{formatFiyat(fark, 1)}</b></span>}
              {kartUretilebilir(guncelSatir?.cekilme_tarihi) && (
                <button onClick={() => window.open(`/api/kart/borsalar?urun=${secilen}`, "_blank")} style={{ background: "transparent", border: `1px solid ${RENKLER.border}`, color: RENKLER.muted, fontSize: "12px", padding: "3px 9px", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>📷 Kart</button>
              )}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {borsaOzet.map((x) => (
              <div key={x.borsa} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "7px 9px", background: RENKLER.bg, borderRadius: "4px", border: x.borsa === borsa ? `1px solid ${renk}55` : `1px solid ${RENKLER.border}` }}>
                <span style={{ color: RENKLER.text }}>{x.borsa} <span style={{ fontSize: "12px", color: RENKLER.muted }}>· {kisaTarih(x.tarih)}</span></span>
                <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {x.hacim != null && (
                    <span style={{ fontSize: "12px", color: x.hacim < DUSUK_HACIM_KG ? "#E8C040" : RENKLER.muted }}>
                      {tonGoster(x.hacim)}{x.hacim < DUSUK_HACIM_KG ? " ⚠" : ""}
                    </span>
                  )}
                  <b style={{ color: renk, fontSize: "14px" }}>{formatFiyat(x.fiyat)} <span style={{ fontSize: "12px", color: RENKLER.muted, fontWeight: 400 }}>₺/kg</span></b>
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.5 }}>
            ⚠ düşük hacim = 20 tondan az işlemle oluşan fiyat; bölgeler arası fark bundan kaynaklanabilir.
          </div>
        </div>
      )}

      {/* Grafik */}
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>
          30 GÜN TARİHÇE · {gunSayisi}/30 gün{borsa ? ` · ${borsa}` : ""}
        </div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim="TL/KG" urun_ad={sf?.urun_ad ?? secilen} kaynakEtiket={borsa ?? undefined} />
      </div>
    </div>
  );
}
