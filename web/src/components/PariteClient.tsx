"use client";
import { useState, useCallback } from "react";
import { AreaChart, BarChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

export interface Seri { y: string; f: number }
export interface Girdi { ad: string; ikon: string; renk: string; birim: string; hist: Seri[]; guncel: number; aktif: boolean }
export interface Urun { ad: string; ikon: string; renk: string; birim: string; hist: Seri[]; guncel: number }

const OLAYLAR: Record<string, string> = {
  "2008": "🌍 Kriz", "2018": "💸 Döviz", "2022": "📈 Kur+Enerji",
};

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE", pos: "#4AE870", neg: "#E84A4A" };

function pariteHesapla(g: Girdi, u: Urun) {
  const yillar = [...new Set([...g.hist, ...u.hist].map((d) => d.y))].sort();
  const hist = yillar.map((y) => {
    const gf = g.hist.filter((d) => d.y <= y).at(-1)?.f;
    const uf = u.hist.filter((d) => d.y <= y).at(-1)?.f;
    return (gf && uf && uf > 0) ? { y, p: +(gf / uf).toFixed(3), olay: OLAYLAR[y] } : null;
  }).filter(Boolean) as { y: string; p: number; olay?: string }[];
  return { hist, guncel: +(g.guncel / u.guncel).toFixed(3) };
}

function kotulesmHizi(hist: { p: number }[]) {
  const s10 = hist.slice(-8);
  if (s10.length < 2) return 0;
  return +(((Math.pow(s10.at(-1)!.p / s10[0].p, 1 / (s10.length - 1)) - 1) * 100)).toFixed(1);
}

interface TTProps { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }

function TT2({ active, payload, label }: TTProps) {
  if (!active || !payload?.length) return null;
  const olay = OLAYLAR[label ?? ""];
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: C.mut, fontWeight: 700, marginBottom: 4 }}>{label} {olay || ""}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.txt }}>
          {p.name}: <b>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</b>
        </div>
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
      <div style={{ color: v > 0 ? C.neg : C.pos, fontWeight: 700 }}>
        {v > 0 ? "▲" : "▼"} {Math.abs(v)}% {v > 0 ? "kötüleşti" : "iyileşti"}
      </div>
    </div>
  );
}

function SelBtn({ aktif, renk, onClick, disabled, children }: { aktif: boolean; renk: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      background: aktif ? renk : "transparent",
      border: `1px solid ${aktif ? renk : C.brd}`,
      color: disabled ? "#2A4030" : aktif ? "#060E08" : C.mut,
      padding: "5px 14px", borderRadius: 20, cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: aktif ? 700 : 400, fontSize: 11, transition: "all 0.15s", fontFamily: "monospace",
      opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

export default function PariteClient({ girdiler, urunler, mazotGuncelVar }: { girdiler: Record<string, Girdi>; urunler: Record<string, Urun>; mazotGuncelVar: boolean }) {
  const ilkGirdi = Object.keys(girdiler).find((k) => girdiler[k].aktif) ?? Object.keys(girdiler)[0];
  const [girdi, setGirdi] = useState(ilkGirdi);
  const [urun, setUrun] = useState(Object.keys(urunler)[0]);
  const G = girdiler[girdi];
  const U = urunler[urun];
  const { hist, guncel } = pariteHesapla(G, U);
  const hiz = kotulesmHizi(hist);
  const ilk = hist[0]?.p ?? 1;
  const carpan = (guncel / ilk).toFixed(1);
  const tamSayi = Math.floor(guncel);
  const goster = Math.min(tamSayi, 12);

  const degVerisi = hist.slice(1).map((d, i) => ({
    y: d.y,
    deg: +((d.p - hist[i].p) / hist[i].p * 100).toFixed(1),
  }));

  const paylasMetni = `${G.ikon} ${G.ad} / ${U.ikon} ${U.ad} paritesi\n${hist[0]?.y}: ${hist[0]?.p?.toFixed(2)} → 2026: ${guncel.toFixed(2)}\n${carpan}× daha kötü · Yıllık %${Math.abs(hiz)} kötüleşme\nanadoluborsa.com/parite`;

  const handlePaylas = useCallback((kanal: "whatsapp" | "twitter" | "png") => {
    const metin = encodeURIComponent(paylasMetni);
    if (kanal === "whatsapp") window.open(`https://wa.me/?text=${metin}`, "_blank");
    else if (kanal === "twitter") window.open(`https://twitter.com/intent/tweet?text=${metin}`, "_blank");
    else alert("PNG indirme yakında (html2canvas ile 1080×1080 kart üretilecek).\n\n" + paylasMetni);
  }, [paylasMetni]);

  const aktifGirdiler = Object.entries(girdiler).filter(([, v]) => v.aktif);

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: "'Courier New',monospace", padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`select option{background:#0A140C;}`}</style>

      {/* BAŞLIK */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: C.mut, letterSpacing: 3, marginBottom: 4 }}>ÇİFTÇİ SATIN ALMA GÜCÜ ENDEKSİ</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>PARİTE ANALİZİ</div>
      </div>

      {/* SEÇİCİ */}
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 8 }}>GİRDİ (MALİYET)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(girdiler).map(([k, v]) => (
                <SelBtn key={k} aktif={girdi === k} renk={v.renk} disabled={!v.aktif} onClick={() => setGirdi(k)}>
                  {v.ikon} {v.ad}{!v.aktif && " · yakında"}
                </SelBtn>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 22, color: C.mut, paddingTop: 22 }}>÷</div>
          <div>
            <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 8 }}>ÜRÜN (GELİR)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(urunler).map(([k, v]) => (
                <SelBtn key={k} aktif={urun === k} renk={v.renk} onClick={() => setUrun(k)}>
                  {v.ikon} {v.ad}
                </SelBtn>
              ))}
            </div>
          </div>
        </div>

        {/* HERO */}
        <div style={{ background: "linear-gradient(135deg,#0A1A0C,#0F2015)", border: "1px solid #1A4025", borderRadius: 14, padding: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${G.renk}10`, filter: "blur(80px)" }} />
          <div style={{ fontSize: 9, color: "#4A9055", letterSpacing: 3, marginBottom: 12 }}>
            1 {G.birim.replace("TL/", "")} {G.ad.toUpperCase()} = KAÇ {U.birim.replace("TL/", "")} {U.ad.toUpperCase()}?
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 9, color: C.mut, marginBottom: 4 }}>BUGÜN 2026</div>
              <div style={{ fontSize: 54, fontWeight: 800, color: G.renk, lineHeight: 1, letterSpacing: -3 }}>
                {guncel.toFixed(2)}
                <span style={{ fontSize: 16, color: C.mut, marginLeft: 8, fontWeight: 400 }}>{U.birim.replace("TL/", "")}</span>
              </div>
              <div style={{ fontSize: 9, color: "#3A7040", marginTop: 6 }}>
                {G.ad}: {G.guncel} {G.birim} · {U.ad}: {U.guncel} {U.birim}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: "#2A0A08", border: "1px solid #5A2018", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: "#E86040" }}>{hist[0]?.y}&apos;den bu yana</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#E86040" }}>{carpan}×</div>
                <div style={{ fontSize: 9, color: "#8A4030" }}>daha kötü</div>
              </div>
              <div style={{ background: "#0A1A28", border: "1px solid #1A3A5A", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: "#6090E8" }}>Yıllık kötüleşme</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#6090E8" }}>%{Math.abs(hiz)}</div>
                <div style={{ fontSize: 9, color: "#4060A8" }}>son dönem ort.</div>
              </div>
            </div>
          </div>

          {/* EMOJİ KARŞILAŞTIRMA */}
          <div style={{ background: "#06080660", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 10 }}>
              {G.ikon} 1 {G.ad.toUpperCase()} = {U.ikon} KAÇ {U.ad.toUpperCase()}?
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 9, color: C.mut, marginBottom: 4 }}>{hist[0]?.y}</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", maxWidth: 200 }}>
                  {Array.from({ length: Math.max(1, Math.min(Math.round(hist[0]?.p ?? 1), 8)) }).map((_, i) => (
                    <span key={i} style={{ fontSize: 20 }}>{U.ikon}</span>
                  ))}
                  {(hist[0]?.p ?? 0) < 1 && <span style={{ fontSize: 11, color: C.mut, alignSelf: "center" }}>&lt;1</span>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.mut, marginTop: 4 }}>{hist[0]?.p?.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 24, color: C.mut }}>→</div>
              <div>
                <div style={{ fontSize: 9, color: C.mut, marginBottom: 4 }}>2026</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", maxWidth: 300 }}>
                  {Array.from({ length: goster }).map((_, i) => (
                    <span key={i} style={{ fontSize: 20 }}>{U.ikon}</span>
                  ))}
                  {tamSayi > 12 && <span style={{ fontSize: 14, color: G.renk, alignSelf: "center", marginLeft: 4 }}>+{tamSayi - 12}</span>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.renk, marginTop: 4 }}>{guncel.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#5A8060", lineHeight: 1.7, fontStyle: "italic", borderLeft: "3px solid #2A5030", paddingLeft: 14 }}>
            &quot;{hist[0]?.y}&apos;de {hist[0]?.p?.toFixed(2)} {U.birim.replace("TL/", "")} yeterliydi. Bugün {guncel.toFixed(2)} {U.birim.replace("TL/", "")} gerekiyor.&quot;
          </div>
        </div>
      </div>

      {/* ANOTASYONLU GRAFİK */}
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1 }}>TARİHSEL PARİTE GRAFİĞİ</div>
          <div style={{ fontSize: 11, color: C.txt, marginTop: 2 }}>{G.ikon} {G.ad} / {U.ikon} {U.ad} — {hist[0]?.y}–2026</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {Object.entries(OLAYLAR).map(([y, metin]) => (
              <div key={y} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: C.mut }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E84040", opacity: 0.7 }} />
                {y}: {metin}
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
            <XAxis dataKey="y" tick={{ fill: C.mut, fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.mut, fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Tooltip content={<TT2 />} />
            <ReferenceLine y={1} stroke="#3A6A3A" strokeDasharray="6 3" label={{ value: "Eşit (1.0)", position: "right", fill: C.mut, fontSize: 8 }} />
            {Object.keys(OLAYLAR).map((y) => (
              <ReferenceLine key={y} x={y} stroke="#E8404050" strokeWidth={1} strokeDasharray="4 2" />
            ))}
            <Area type="monotone" dataKey="p" stroke={G.renk} strokeWidth={2.5} fill="url(#pg)" dot={{ fill: G.renk, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: G.renk }} name="Parite" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 8, color: C.mut, marginTop: 6 }}>
          Kesikli çizgi: Eşit parite (1.0) — altı çiftçi lehine, üstü aleyhine
        </div>
      </div>

      {/* YILLIK DEĞİŞİM */}
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 12 }}>YIL BAZLI DEĞİŞİM — Her dönem ne kadar kötüleşti?</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={degVerisi} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#142018" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="y" tick={{ fill: C.mut, fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.mut, fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<DegTT />} />
            <ReferenceLine y={0} stroke={C.brd} />
            <Bar dataKey="deg" radius={[3, 3, 0, 0]} name="Değişim">
              {degVerisi.map((d, i) => (
                <Cell key={i} fill={d.deg > 0 ? C.neg : C.pos} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MATRİS */}
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20, marginBottom: 20, overflowX: "auto" }}>
        <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 14 }}>TÜM PARİTE KOMBİNASYONLARI — GÜNCEL</div>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: C.mut, borderBottom: `1px solid ${C.brd}` }}>GİRDİ → ÜRÜN</th>
              {Object.entries(urunler).map(([k, v]) => (
                <th key={k} style={{ padding: "8px 10px", textAlign: "center", fontSize: 10, color: v.renk, borderBottom: `1px solid ${C.brd}` }}>
                  {v.ikon} {v.ad}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aktifGirdiler.map(([gk, gv]) => (
              <tr key={gk} style={{ borderBottom: "1px solid #0E1C10" }}>
                <td style={{ padding: "10px", fontSize: 11, color: gv.renk, fontWeight: 700 }}>{gv.ikon} {gv.ad}</td>
                {Object.entries(urunler).map(([uk, uv]) => {
                  const p = +(gv.guncel / uv.guncel).toFixed(2);
                  const secili = gk === girdi && uk === urun;
                  return (
                    <td key={uk} onClick={() => { setGirdi(gk); setUrun(uk); }} style={{
                      padding: "10px", textAlign: "center", cursor: "pointer",
                      background: secili ? `${gv.renk}22` : "transparent",
                      outline: secili ? `1px solid ${gv.renk}` : "none",
                      borderRadius: 6, transition: "all 0.15s",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: p > 2 ? C.neg : p > 1 ? "#E8A040" : C.pos }}>{p}×</div>
                      <div style={{ fontSize: 8, color: C.mut, marginTop: 2 }}>{uv.birim.replace("TL/", "")}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 8, color: C.mut, marginTop: 10 }}>
          🟢 &lt;1.0 çiftçi lehine · 🟡 1.0–2.0 dengede · 🔴 &gt;2.0 çiftçi aleyhine · Hücreye tıkla → grafik değişir · ⚡ Elektrik yakında
        </div>
      </div>

      {/* PAYLAŞIM */}
      <div style={{ background: "#0A1810", border: "1px solid #1A4028", borderRadius: 14, padding: 20, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#4A9060", letterSpacing: 2, marginBottom: 12 }}>📤 PAYLAŞIM KARTI</div>
        <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${G.renk}30`, lineHeight: 1.8 }}>
          <div style={{ fontSize: 9, color: C.mut, marginBottom: 6, letterSpacing: 2 }}>ÖNİZLEME</div>
          <span style={{ color: G.renk, fontWeight: 700 }}>{G.ikon} {G.ad} / {U.ikon} {U.ad}</span><br />
          <span style={{ color: C.txt }}>{hist[0]?.y}: {hist[0]?.p?.toFixed(2)} → 2026: <b style={{ color: G.renk }}>{guncel.toFixed(2)}</b></span><br />
          <span style={{ color: C.mut, fontSize: 10 }}>{carpan}× daha kötü · Yıllık %{Math.abs(hiz)} kötüleşiyor</span><br />
          <span style={{ color: C.mut, fontSize: 10 }}>anadoluborsa.com/parite</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {([["📱 WhatsApp", "#25D366", "whatsapp"], ["🐦 Twitter", "#1DA1F2", "twitter"], ["📷 PNG İndir", "#E86040", "png"]] as const).map(([lbl, renk, kanal]) => (
            <button key={lbl} onClick={() => handlePaylas(kanal)} style={{
              background: "transparent", border: `1px solid ${renk}`, color: renk,
              padding: "8px 18px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontFamily: "monospace",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 8, color: "#2A4030", textAlign: "center", paddingTop: 10, lineHeight: 1.6 }}>
        Güncel: ESK (Süt/Kuzu) · TOBB/KTB (Hububat) · EPDK (Motorin{mazotGuncelVar ? "" : " tahmini"}) — canlı Supabase.<br />
        Tarihsel ürün serileri TÜİK tahminidir · Elektrik tahmini (yakında canlı).
      </div>
    </div>
  );
}
