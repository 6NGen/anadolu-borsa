"use client";
import { useState, useEffect } from "react";
import { RENKLER, YEM_RENK, emoji } from "@/lib/theme";
import { formatFiyat, parseFiyatGirdi, kisaTarih } from "@/lib/format";
import { useBolgem } from "@/lib/bolgem";
import { ILLER } from "@/lib/iller";
import {
  maliyetHesapla, VERIM_TUIK, MAZOT_LITRE_DEKAR, TOHUM_VARSAYILAN, GUBRE_VARSAYILAN,
} from "@/lib/maliyet";

const AD: Record<string, string> = { BUGDAY: "Buğday", ARPA: "Arpa" };
const URUNLER = ["BUGDAY", "ARPA"];
const ANAHTAR = "sanal_tarla";

interface Tarla {
  urun: string; dekar: number; il: string;
  acilisMaliyet: number; acilisFiyat: number; acilisTarih: string;
}

interface Props {
  mazot: number;
  borsa: Record<string, { fiyat: number; borsa: string; tarih: string }>;
}

const kart: React.CSSProperties = { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "20px" };
const inputStil: React.CSSProperties = { width: "100%", padding: "11px 13px", background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "14px", borderRadius: "8px", outline: "none", fontFamily: "var(--font-mono)" };
const etiket: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "6px", fontWeight: 600, display: "block" };

function acilisMaliyetiHesapla(urun: string, dekar: number, mazot: number, fiyat: number): number {
  const s = maliyetHesapla({
    dekar, verimKgDekar: VERIM_TUIK[urun] ?? 0, borsaFiyatTlKg: fiyat,
    mazotTlLitre: mazot, mazotLitreDekar: MAZOT_LITRE_DEKAR[urun] ?? 12,
    tohumTlDekar: TOHUM_VARSAYILAN[urun] ?? 0, gubreTlDekar: GUBRE_VARSAYILAN[urun] ?? 0,
    iscilikTlDekar: 0, digerTlDekar: 0,
  });
  return Math.round(s.maliyetToplam);
}

export default function TarlaClient({ mazot, borsa }: Props) {
  const [bolgem] = useBolgem();
  const [tarla, setTarla] = useState<Tarla | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [hasatModu, setHasatModu] = useState(false);

  // Kurulum formu
  const [urun, setUrun] = useState("BUGDAY");
  const [dekar, setDekar] = useState("10");
  const [il, setIl] = useState("KONYA");
  const [ilDokunuldu, setIlDokunuldu] = useState(false);

  useEffect(() => {
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (ham) setTarla(JSON.parse(ham));
    } catch { /* yok */ }
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (bolgem && !ilDokunuldu && (ILLER as readonly string[]).includes(bolgem)) setIl(bolgem);
  }, [bolgem, ilDokunuldu]);

  function tarlaAc() {
    const d = parseFiyatGirdi(dekar) || 0;
    const bf = borsa[urun];
    if (d <= 0 || !bf) return;
    const t: Tarla = {
      urun, dekar: d, il,
      acilisMaliyet: acilisMaliyetiHesapla(urun, d, mazot, bf.fiyat),
      acilisFiyat: bf.fiyat,
      acilisTarih: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(ANAHTAR, JSON.stringify(t));
    setTarla(t);
    setHasatModu(false);
  }

  function tarlayiKapat() {
    localStorage.removeItem(ANAHTAR);
    setTarla(null);
    setHasatModu(false);
  }

  if (!yuklendi) return <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", color: RENKLER.muted, fontFamily: "var(--font-mono)", fontSize: "12px" }}>Yükleniyor…</main>;

  // ── KURULUM (ek) ──
  if (!tarla) {
    const bf = borsa[urun];
    const onMaliyet = bf ? acilisMaliyetiHesapla(urun, parseFiyatGirdi(dekar) || 0, mazot, bf.fiyat) : 0;
    return (
      <main style={{ maxWidth: "560px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>🌱 SANAL TARLA</h1>
          <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Güzlük tarlanı sanal aç. Açılış maliyeti bugünkü fiyatlarla sabitlenir; değerini canlı izle, hasatta paylaş.</p>
        </div>
        <div style={{ ...kart, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={etiket}>ÜRÜN (GÜZLÜK)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {URUNLER.map((u) => {
                const r = YEM_RENK[u] ?? RENKLER.green; const aktif = u === urun;
                return <button key={u} onClick={() => setUrun(u)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", fontSize: "13px", background: aktif ? `${r}22` : "transparent", color: aktif ? r : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}><span style={{ fontSize: "15px" }}>{emoji(u)}</span>{AD[u]}</button>;
              })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={etiket}>ALAN (DEKAR)</label>
              <input type="text" inputMode="decimal" value={dekar} onChange={(e) => setDekar(e.target.value)} style={inputStil} />
            </div>
            <div>
              <label style={etiket}>İL</label>
              <select value={il} onChange={(e) => { setIl(e.target.value); setIlDokunuldu(true); }} style={{ ...inputStil, fontSize: "12px" }}>
                {ILLER.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          {bf ? (
            <div style={{ fontSize: "11px", color: RENKLER.muted, background: RENKLER.bg, borderRadius: "8px", padding: "10px 12px", lineHeight: 1.6 }}>
              Açılış maliyeti: <b style={{ color: RENKLER.text }}>{formatFiyat(onMaliyet, 0)} ₺</b> <span style={{ fontSize: "9px" }}>(verim TÜİK ortalaması · maliyet kalemleri tahmin)</span>
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: RENKLER.red }}>Bu ürün için canlı fiyat yok — tarla açılamaz.</div>
          )}
          <button onClick={tarlaAc} disabled={!bf} style={{ padding: "13px", fontSize: "13px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: bf ? "pointer" : "not-allowed", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Tarlayı Aç</button>
        </div>
      </main>
    );
  }

  // ── TAKİP / HASAT (izle + hasat et + paylaş) ──
  const bf = borsa[tarla.urun];
  const renk = YEM_RENK[tarla.urun] ?? RENKLER.green;
  const guncelFiyat = bf?.fiyat ?? tarla.acilisFiyat;
  const guncelDeger = Math.round((VERIM_TUIK[tarla.urun] ?? 0) * tarla.dekar * guncelFiyat);
  const net = guncelDeger - tarla.acilisMaliyet;
  const netPoz = net >= 0;
  const fiyatDegisim = ((guncelFiyat - tarla.acilisFiyat) / tarla.acilisFiyat) * 100;

  const kartUrl = `/api/kart/tarla?urun=${tarla.urun}&dekar=${tarla.dekar}&maliyet=${tarla.acilisMaliyet}`;

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>🌱 SANAL TARLAM</h1>
        <button onClick={tarlayiKapat} style={{ background: "transparent", border: `1px solid ${RENKLER.border}`, color: RENKLER.muted, fontSize: "10px", padding: "5px 10px", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>Kapat</button>
      </div>

      <div style={{ ...kart, marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600, marginBottom: "2px" }}>{emoji(tarla.urun)} {tarla.dekar} dekar {AD[tarla.urun]} · {tarla.il}</div>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginBottom: "16px" }}>açılış {kisaTarih(tarla.acilisTarih)} · {formatFiyat(tarla.acilisFiyat)} ₺/kg</div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <div style={{ flex: 1, background: RENKLER.bg, borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "9px", color: RENKLER.muted }}>AÇILIŞ MALİYETİ</div>
            <div style={{ fontSize: "20px", color: RENKLER.text, fontWeight: 700 }}>{formatFiyat(tarla.acilisMaliyet, 0)} ₺</div>
          </div>
          <div style={{ flex: 1, background: RENKLER.bg, borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "9px", color: RENKLER.muted }}>BUGÜNKÜ DEĞER</div>
            <div style={{ fontSize: "20px", color: renk, fontWeight: 700 }}>{formatFiyat(guncelDeger, 0)} ₺</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${RENKLER.border}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "11px", color: RENKLER.muted }}>Net (bugünkü fiyatla)</span>
          <span style={{ fontSize: "28px", color: netPoz ? RENKLER.pos : RENKLER.red, fontWeight: 800 }}>{netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺</span>
        </div>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "8px" }}>
          {AD[tarla.urun]} açılıştan bu yana <b style={{ color: fiyatDegisim >= 0 ? RENKLER.pos : RENKLER.red }}>{fiyatDegisim >= 0 ? "▲" : "▼"} %{formatFiyat(Math.abs(fiyatDegisim), 1)}</b> · verim TÜİK ortalamasıdır
        </div>
      </div>

      {!hasatModu ? (
        <button onClick={() => setHasatModu(true)} style={{ width: "100%", padding: "13px", fontSize: "13px", background: `${renk}22`, color: renk, border: `1px solid ${renk}`, borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}>🌾 Hasat Et</button>
      ) : (
        <div style={{ ...kart, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: RENKLER.muted }}>Sanal hasat — bugünkü fiyatla</div>
          <div style={{ fontSize: "34px", color: netPoz ? RENKLER.pos : RENKLER.red, fontWeight: 800, margin: "6px 0" }}>{netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺</div>
          <div style={{ fontSize: "11px", color: RENKLER.muted, marginBottom: "14px" }}>maliyet {formatFiyat(tarla.acilisMaliyet, 0)} ₺ → değer {formatFiyat(guncelDeger, 0)} ₺</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => window.open(kartUrl, "_blank")} style={{ flex: 1, padding: "11px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>📷 Kart Oluştur</button>
            <button onClick={tarlayiKapat} style={{ flex: 1, padding: "11px", background: "transparent", color: RENKLER.muted, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)" }}>Yeni Tarla</button>
          </div>
        </div>
      )}
    </main>
  );
}
