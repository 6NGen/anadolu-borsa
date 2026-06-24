"use client";
import { useState, useEffect } from "react";
import { RENKLER, YEM_RENK } from "@/lib/theme";
import { formatFiyat, parseFiyatGirdi, kisaTarih } from "@/lib/format";
import { useBolgem } from "@/lib/bolgem";
import { ILLER } from "@/lib/iller";
import { maliyetHesapla, VERIM_TUIK, MAZOT_LITRE_DEKAR, TOHUM_VARSAYILAN, GUBRE_VARSAYILAN } from "@/lib/maliyet";
import { TARLA_URUNLER, tarlaUrunBul, aylarMetni, ayIcinde } from "@/lib/tarla";

const ANAHTAR = "sanal_tarla";

interface Tarla {
  urunKey: string; urunNorm: string; dekar: number; il: string;
  acilisMaliyet: number; acilisFiyat: number; acilisTarih: string;
}

interface Props {
  mazot: number;
  borsa: Record<string, { fiyat: number; borsa: string; tarih: string }>;
}

const kart: React.CSSProperties = { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "20px" };
const inputStil: React.CSSProperties = { width: "100%", padding: "11px 13px", background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "14px", borderRadius: "8px", outline: "none", fontFamily: "var(--font-mono)" };
const etiket: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "6px", fontWeight: 600, display: "block" };

function acilisMaliyeti(urunNorm: string, dekar: number, mazot: number, fiyat: number): number {
  const s = maliyetHesapla({
    dekar, verimKgDekar: VERIM_TUIK[urunNorm] ?? 0, borsaFiyatTlKg: fiyat,
    mazotTlLitre: mazot, mazotLitreDekar: MAZOT_LITRE_DEKAR[urunNorm] ?? 12,
    tohumTlDekar: TOHUM_VARSAYILAN[urunNorm] ?? 0, gubreTlDekar: GUBRE_VARSAYILAN[urunNorm] ?? 0,
    iscilikTlDekar: 0, digerTlDekar: 0,
  });
  return Math.round(s.maliyetToplam);
}

export default function TarlaClient({ mazot, borsa }: Props) {
  const [bolgem] = useBolgem();
  const [tarla, setTarla] = useState<Tarla | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [hasatModu, setHasatModu] = useState(false);

  const [urunKey, setUrunKey] = useState("guzluk_bugday");
  const [dekar, setDekar] = useState("10");
  const [il, setIl] = useState("KONYA");
  const [ilDokunuldu, setIlDokunuldu] = useState(false);

  useEffect(() => {
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (ham) {
        const t = JSON.parse(ham);
        // Geçerli yeni şema mı? (eski broken sürümün kaydı urunKey içermez → ele)
        if (t && typeof t.urunKey === "string" && tarlaUrunBul(t.urunKey)) setTarla(t);
        else localStorage.removeItem(ANAHTAR);
      }
    } catch { localStorage.removeItem(ANAHTAR); }
    setYuklendi(true);
  }, []);
  useEffect(() => {
    if (bolgem && !ilDokunuldu && (ILLER as readonly string[]).includes(bolgem)) setIl(bolgem);
  }, [bolgem, ilDokunuldu]);

  function tarlaAc() {
    const u = tarlaUrunBul(urunKey);
    const d = parseFiyatGirdi(dekar) || 0;
    if (!u || d <= 0 || !ayIcinde(u.ekimAylar)) return;
    const bf = borsa[u.urunNorm];
    if (!bf) return;
    const t: Tarla = {
      urunKey: u.key, urunNorm: u.urunNorm, dekar: d, il,
      acilisMaliyet: acilisMaliyeti(u.urunNorm, d, mazot, bf.fiyat),
      acilisFiyat: bf.fiyat, acilisTarih: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(ANAHTAR, JSON.stringify(t));
    setTarla(t); setHasatModu(false);
  }

  function tarlayiKapat() {
    localStorage.removeItem(ANAHTAR); setTarla(null); setHasatModu(false);
  }

  if (!yuklendi) return <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", color: RENKLER.muted, fontFamily: "var(--font-mono)", fontSize: "12px" }}>Yükleniyor…</main>;

  // ── KURULUM (ek) ──
  if (!tarla) {
    const u = tarlaUrunBul(urunKey)!;
    const sezonda = ayIcinde(u.ekimAylar);
    const bf = borsa[u.urunNorm];
    const onMaliyet = bf ? acilisMaliyeti(u.urunNorm, parseFiyatGirdi(dekar) || 0, mazot, bf.fiyat) : 0;
    return (
      <main style={{ maxWidth: "560px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>🌱 SANAL TARLA</h1>
          <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Tarlanı ekim sezonunda aç, açılış maliyetin sabitlensin; sezon boyunca değerini canlı borsa fiyatıyla izle, hasatta paylaş.</p>
        </div>
        <div style={{ ...kart, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={etiket}>ÜRÜN</label>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {TARLA_URUNLER.map((x) => {
                const r = YEM_RENK[x.urunNorm] ?? RENKLER.green; const aktif = x.key === urunKey;
                return <button key={x.key} onClick={() => setUrunKey(x.key)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 13px", fontSize: "11.5px", background: aktif ? `${r}22` : "transparent", color: aktif ? r : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}><span style={{ fontSize: "13px" }}>{x.emoji}</span>{x.ad}</button>;
              })}
            </div>
            <div style={{ fontSize: "10px", color: sezonda ? RENKLER.green : "#E8C040", marginTop: "10px" }}>
              {sezonda ? `● ${u.ad} ekim sezonu (${aylarMetni(u.ekimAylar)}) — şimdi açabilirsin` : `⏳ ${u.ad} ekim sezonu: ${aylarMetni(u.ekimAylar)} · hasat: ${aylarMetni(u.hasatAylar)}`}
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
          {bf && sezonda && (
            <div style={{ fontSize: "11px", color: RENKLER.muted, background: RENKLER.bg, borderRadius: "8px", padding: "10px 12px", lineHeight: 1.6 }}>
              Açılış maliyeti: <b style={{ color: RENKLER.text }}>{formatFiyat(onMaliyet, 0)} ₺</b> <span style={{ fontSize: "9px" }}>(verim TÜİK ortalaması · maliyet kalemleri tahmin)</span>
            </div>
          )}
          {!bf && <div style={{ fontSize: "11px", color: RENKLER.red }}>Bu ürün için canlı fiyat yok.</div>}
          <button onClick={tarlaAc} disabled={!sezonda || !bf} style={{ padding: "13px", fontSize: "13px", background: sezonda && bf ? RENKLER.green : "#15211A", color: sezonda && bf ? "#06140C" : RENKLER.muted, border: "none", borderRadius: "8px", cursor: sezonda && bf ? "pointer" : "not-allowed", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {sezonda ? "Tarlayı Aç" : `${aylarMetni(u.ekimAylar)}'da açılır`}
          </button>
        </div>
      </main>
    );
  }

  // ── İZLE / HASAT ──
  const u = tarlaUrunBul(tarla.urunKey);
  if (!u) {
    return (
      <main style={{ maxWidth: "560px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "14px" }}>Tarla kaydı okunamadı (eski sürüm olabilir).</p>
        <button onClick={tarlayiKapat} style={{ padding: "10px 20px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Sıfırla</button>
      </main>
    );
  }
  const renk = YEM_RENK[tarla.urunNorm] ?? RENKLER.green;
  const bf = borsa[tarla.urunNorm];
  const guncelFiyat = bf?.fiyat ?? tarla.acilisFiyat;
  const guncelDeger = Math.round((VERIM_TUIK[tarla.urunNorm] ?? 0) * tarla.dekar * guncelFiyat);
  const net = guncelDeger - tarla.acilisMaliyet;
  const netPoz = net >= 0;
  const degisim = ((guncelFiyat - tarla.acilisFiyat) / tarla.acilisFiyat) * 100;
  const degisimPoz = degisim >= 0;
  const hasatZamani = ayIcinde(u.hasatAylar);
  const kartUrl = `/api/kart/tarla?urun=${tarla.urunKey}&dekar=${tarla.dekar}&maliyet=${tarla.acilisMaliyet}&afiyat=${tarla.acilisFiyat}&hasat=${hasatModu ? 1 : 0}`;

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>🌱 SANAL TARLAM</h1>
        <button onClick={tarlayiKapat} style={{ background: "transparent", border: `1px solid ${RENKLER.border}`, color: RENKLER.muted, fontSize: "10px", padding: "5px 10px", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>Kapat</button>
      </div>

      <div style={{ ...kart, marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600 }}>{u.emoji} {tarla.dekar} dekar {u.ad} · {tarla.il}</div>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginBottom: "16px" }}>açılış {kisaTarih(tarla.acilisTarih)} · {formatFiyat(tarla.acilisFiyat)} ₺/kg · hasat {aylarMetni(u.hasatAylar)}</div>

        {/* HERO: açılıştan beri değer değişimi (fiyatla oynar) */}
        <div style={{ textAlign: "center", padding: "8px 0 14px" }}>
          <div style={{ fontSize: "11px", color: RENKLER.muted }}>Açılıştan beri pazar değeri</div>
          <div style={{ fontSize: "44px", fontWeight: 800, color: degisimPoz ? RENKLER.pos : RENKLER.red, lineHeight: 1.1 }}>{degisimPoz ? "▲ +" : "▼ "}%{formatFiyat(Math.abs(degisim), 1)}</div>
          <div style={{ fontSize: "10px", color: RENKLER.muted }}>{tarla.urunNorm === "BUGDAY" ? "buğday" : u.ad.toLowerCase()} {formatFiyat(tarla.acilisFiyat)} → {formatFiyat(guncelFiyat)} ₺/kg</div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, background: RENKLER.bg, borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "9px", color: RENKLER.muted }}>AÇILIŞ MALİYETİ</div>
            <div style={{ fontSize: "18px", color: RENKLER.text, fontWeight: 700 }}>{formatFiyat(tarla.acilisMaliyet, 0)} ₺</div>
          </div>
          <div style={{ flex: 1, background: RENKLER.bg, borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "9px", color: RENKLER.muted }}>BUGÜNKÜ DEĞER</div>
            <div style={{ fontSize: "18px", color: renk, fontWeight: 700 }}>{formatFiyat(guncelDeger, 0)} ₺</div>
          </div>
        </div>
        <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "10px", lineHeight: 1.5 }}>
          Net (hasatta gerçekleşir): <b style={{ color: netPoz ? RENKLER.pos : RENKLER.red }}>{netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺</b>. Verim TÜİK ortalamasıdır; değer bugünkü {bf?.borsa} fiyatıyla.
        </div>
      </div>

      {hasatZamani && !hasatModu && (
        <button onClick={() => setHasatModu(true)} style={{ width: "100%", padding: "13px", fontSize: "13px", background: `${renk}22`, color: renk, border: `1px solid ${renk}`, borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}>🌾 Hasat Et</button>
      )}
      {!hasatZamani && !hasatModu && (
        <div style={{ ...kart, textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: RENKLER.muted, lineHeight: 1.6 }}>⏳ Hasat zamanı: <b style={{ color: RENKLER.text }}>{aylarMetni(u.hasatAylar)}</b><br /><span style={{ fontSize: "10px" }}>O zamana kadar değerini izle; istersen şu anki durumu paylaş.</span></div>
          <button onClick={() => window.open(kartUrl, "_blank")} style={{ marginTop: "12px", padding: "10px 20px", background: "transparent", color: RENKLER.green, border: `1px solid ${RENKLER.green}55`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>📷 Durumu Paylaş</button>
        </div>
      )}
      {hasatModu && (
        <div style={{ ...kart, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: RENKLER.muted }}>🌾 Hasat — bugünkü fiyatla</div>
          <div style={{ fontSize: "34px", color: netPoz ? RENKLER.pos : RENKLER.red, fontWeight: 800, margin: "6px 0" }}>{netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺</div>
          <div style={{ fontSize: "11px", color: RENKLER.muted, marginBottom: "14px" }}>maliyet {formatFiyat(tarla.acilisMaliyet, 0)} → değer {formatFiyat(guncelDeger, 0)} ₺ · fiyat {degisimPoz ? "+" : ""}%{formatFiyat(degisim, 1)}</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => window.open(kartUrl, "_blank")} style={{ flex: 1, padding: "11px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>📷 Kart Oluştur</button>
            <button onClick={tarlayiKapat} style={{ flex: 1, padding: "11px", background: "transparent", color: RENKLER.muted, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)" }}>Yeni Tarla</button>
          </div>
        </div>
      )}
    </main>
  );
}
