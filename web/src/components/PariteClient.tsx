"use client";
import { useState } from "react";
import { AreaChart, BarChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { formatFiyat, oranBicim } from "@/lib/format";
import { kartUretilebilir } from "@/lib/tazelik";
import PaylasButonlar from "./PaylasButonlar";
import PariteMatris from "./PariteMatris";

export interface Seri { y: string; f: number }
export interface Girdi { ad: string; ikon: string; renk: string; birim: string; hist: Seri[]; guncel: number; aktif: boolean; tarih: string | null }
export interface Urun {
  ad: string; ikon: string; renk: string; birim: string;
  hist: Seri[];
  guncel: number;
  canli: boolean;
  kaynak: string | null;
  tarih: string | null;
  gercekGun: number;
  gercekSeri: { tarih: string; fiyat: number }[];
}

const OLAYLAR: Record<string, string> = { "2008": "🌍 Kriz", "2018": "💸 Döviz", "2022": "📈 Kur+Enerji" };
const KIYAS_ESIK_GUN = 30;
const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE", pos: "#4AE870", neg: "#E84A4A" };

function pariteHesapla(g: Girdi, u: Urun) {
  const yillar = [...new Set([...g.hist, ...u.hist].map((d) => d.y))].sort();
  const hist = yillar.map((y) => {
    const gf = g.hist.filter((d) => d.y <= y).at(-1)?.f;
    const uf = u.hist.filter((d) => d.y <= y).at(-1)?.f;
    return (gf && uf && uf > 0) ? { y, p: +(gf / uf).toFixed(3), olay: OLAYLAR[y] } : null;
  }).filter(Boolean) as { y: string; p: number; olay?: string }[];
  return { hist, guncel: u.guncel > 0 ? +(g.guncel / u.guncel).toFixed(3) : 0 };
}

interface TTProps { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }

function TT2({ active, payload, label }: TTProps) {
  if (!active || !payload?.length) return null;
  const olay = OLAYLAR[label ?? ""];
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: C.mut, fontWeight: 700, marginBottom: 4 }}>{label} {olay || ""}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.txt }}>{p.name}: <b>{typeof p.value === "number" ? formatFiyat(p.value, 3) : p.value}</b></div>
      ))}
    </div>
  );
}

function DegTT({ active, payload, label }: TTProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: C.mut, marginBottom: 4 }}>{label}</div>
      <div style={{ color: v > 0 ? C.neg : C.pos, fontWeight: 700 }}>{v > 0 ? "▲" : "▼"} %{formatFiyat(Math.abs(v), 1)} {v > 0 ? "kötüleşti" : "iyileşti"}</div>
    </div>
  );
}

export default function PariteClient({ girdiler, urunler }: { girdiler: Record<string, Girdi>; urunler: Record<string, Urun> }) {
  const ilkGirdi = Object.keys(girdiler).find((k) => girdiler[k].aktif) ?? Object.keys(girdiler)[0];
  const ilkUrun = Object.keys(urunler).find((k) => urunler[k].canli) ?? Object.keys(urunler)[0];
  const [girdi, setGirdi] = useState(ilkGirdi);
  const [urun, setUrun] = useState(ilkUrun);
  const G = girdiler[girdi];
  const U = urunler[urun];

  const canliUrunler = Object.entries(urunler).filter(([, v]) => v.canli);

  if (!G?.aktif || canliUrunler.length === 0) {
    return (
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.mut, fontFamily: "monospace", maxWidth: 1200, margin: "20px auto" }}>
        Parite için canlı veri bulunamadı. Fiyatlar çekildikten sonra hesaplanır.
      </div>
    );
  }

  const { hist, guncel } = pariteHesapla(G, U);

  // 30 gün GERÇEK veri kıyası (slim gösterim, grafiklerin üstünde)
  const kiyasHazir = U.gercekGun >= KIYAS_ESIK_GUN && U.gercekSeri.length >= 2 && G.guncel > 0;
  const seri = U.gercekSeri;
  const ilkParite = kiyasHazir && seri[0] ? +(G.guncel / seri[0].fiyat).toFixed(3) : null;
  const sonParite = kiyasHazir && seri.at(-1) ? +(G.guncel / seri.at(-1)!.fiyat).toFixed(3) : null;
  const degisim30 = ilkParite && sonParite ? +(((sonParite - ilkParite) / ilkParite) * 100).toFixed(1) : null;

  const degVerisi = hist.slice(1).map((d, i) => ({ y: d.y, deg: +((d.p - hist[i].p) / hist[i].p * 100).toFixed(1) }));

  // Matris kartı: en az bir ürün taze ise üretilebilir
  const matrisAktif = canliUrunler.some(([, u]) => kartUretilebilir(u.tarih));

  // Paylaşım metni = TÜM matris (ana girdi = ilk aktif girdi, şu an mazot)
  const anaG = girdiler[Object.keys(girdiler).find((k) => girdiler[k].aktif)!];
  const aBirim = anaG.birim.replace("TL/", "");
  const matrisMetni = [
    "📊 Anadolu Borsa — Parite Matrisi",
    `1 birim ürün = kaç ${aBirim} ${anaG.ad.toLowerCase()} (${formatFiyat(anaG.guncel)} ₺/${aBirim})`,
    "",
    ...canliUrunler.map(([, u]) => `${u.ikon} ${u.ad}: ${oranBicim(u.guncel / anaG.guncel)} ${aBirim}`),
    "",
    "borsanadolu.6ngen.com/parite",
  ].join("\n");

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: "'Courier New',monospace", padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`select option{background:#0A140C;}`}</style>

      {/* ÜST: MATRİS (satır=ürün, sütun=girdi, çift yön) */}
      <PariteMatris girdiler={girdiler} urunler={urunler} seciliGirdi={girdi} seciliUrun={urun} onSec={(g, u) => { setGirdi(g); setUrun(u); }} />

      {/* Seçili çift + 30 gün değişim (grafikleri sürer) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12, padding: "0 4px" }}>
        <span style={{ fontSize: 13, color: C.txt }}>Grafik: <b style={{ color: G.renk }}>{G.ikon} {G.ad}</b> / <b style={{ color: U.renk }}>{U.ikon} {U.ad}</b></span>
        <span style={{ fontSize: 13, color: C.mut }}>bugün 1 {G.birim.replace("TL/", "")} = <b style={{ color: C.txt }}>{formatFiyat(guncel, 2)}</b> {U.birim.replace("TL/", "")} {U.ad.toLowerCase()}</span>
        {kiyasHazir && degisim30 != null && (
          <span style={{ fontSize: 13, color: degisim30 > 0 ? "#E86040" : C.pos }}>· 30g {degisim30 > 0 ? "▲" : "▼"} %{formatFiyat(Math.abs(degisim30), 1)}</span>
        )}
      </div>

      {/* TARİHSEL GRAFİK (mum grafiği — korunur) */}
      {hist.length > 1 && (
        <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.mut, letterSpacing: 1 }}>TARİHSEL PARİTE GRAFİĞİ (tahmini seri)</div>
            <div style={{ fontSize: 13, color: C.txt, marginTop: 2 }}>{G.ikon} {G.ad} / {U.ikon} {U.ad} — {hist[0]?.y}–2026</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {Object.entries(OLAYLAR).map(([y, metin]) => (
                <div key={y} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.mut }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E84040", opacity: 0.7 }} />{y}: {metin}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.renk} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G.renk} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#142018" strokeDasharray="4 4" />
              <XAxis dataKey="y" tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
              <Tooltip content={<TT2 />} />
              <ReferenceLine y={1} stroke="#3A6A3A" strokeDasharray="6 3" label={{ value: "Eşit (1.0)", position: "right", fill: C.mut, fontSize: 12 }} />
              {Object.keys(OLAYLAR).map((y) => (<ReferenceLine key={y} x={y} stroke="#E8404050" strokeWidth={1} strokeDasharray="4 2" />))}
              <Area type="monotone" dataKey="p" stroke={G.renk} strokeWidth={2.5} fill="url(#pg)" dot={{ fill: G.renk, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: G.renk }} name="Parite" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: C.mut, marginTop: 6 }}>
            Kesikli çizgi: Eşit parite (1.0) · Tarihsel ürün serisi TÜİK tahminidir, 2026 ucu canlı borsa verisidir
          </div>
        </div>
      )}

      {/* YILLIK DEĞİŞİM (korunur) */}
      {degVerisi.length > 1 && (
        <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.mut, letterSpacing: 1, marginBottom: 12 }}>YIL BAZLI DEĞİŞİM (tahmini seri)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={degVerisi} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#142018" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="y" tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<DegTT />} cursor={{ fill: "transparent" }} />
              <ReferenceLine y={0} stroke={C.brd} />
              <Bar dataKey="deg" radius={[3, 3, 0, 0]} name="Değişim">
                {degVerisi.map((d, i) => (<Cell key={i} fill={d.deg > 0 ? C.neg : C.pos} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* PAYLAŞIM — tüm matris (WhatsApp/X metni + PNG kartı) */}
      <div style={{ background: "#0A1810", border: "1px solid #1A4028", borderRadius: 14, padding: 20, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#4A9060", letterSpacing: 2, marginBottom: 6 }}>📤 PARİTE MATRİSİNİ PAYLAŞ</div>
        <div style={{ fontSize: 13, color: C.mut, marginBottom: 12 }}>WhatsApp/X metninde ve PNG kartında matrisin tamamı görünür.</div>
        <PaylasButonlar metin={matrisMetni} pngUrl={matrisAktif ? `/api/kart/matris` : null} />
      </div>

      <div style={{ fontSize: 12, color: "#2A4030", textAlign: "center", paddingTop: 10, lineHeight: 1.6 }}>
        Güncel fiyatlar canlı borsa verisidir (TOBB/KTB hububat · ESK karkas · USK çiğ süt) · Matris yalnızca oranı gösterir, tavsiye vermez.<br />
        Tarihsel ürün serileri TÜİK tahminidir.
      </div>
    </div>
  );
}
