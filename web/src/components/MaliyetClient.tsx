"use client";
import { useState } from "react";
import { RENKLER, YEM_RENK, emoji } from "@/lib/theme";
import { formatFiyat, parseFiyatGirdi, kisaTarih } from "@/lib/format";
import {
  maliyetHesapla, VERIM_TUIK, MAZOT_LITRE_DEKAR, TOHUM_VARSAYILAN, GUBRE_VARSAYILAN, MALIYET_URUNLER,
} from "@/lib/maliyet";

const AD: Record<string, string> = { BUGDAY: "Buğday", ARPA: "Arpa", MISIR: "Mısır", YULAF: "Yulaf", CAVDAR: "Çavdar" };

interface Props {
  mazot: number;
  borsa: Record<string, { fiyat: number; borsa: string; tarih: string }>;
}

function Etiket({ children, not }: { children: React.ReactNode; not?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: RENKLER.muted, letterSpacing: "0.1em", fontWeight: 600 }}>{children}</span>
      {not && <span style={{ fontSize: "12px", color: "#3A5A40" }}>{not}</span>}
    </div>
  );
}

const inputStil: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: RENKLER.bg, border: `1px solid ${RENKLER.border}`,
  color: RENKLER.text, fontSize: "14px", borderRadius: "8px", outline: "none", fontFamily: "var(--font-mono)",
};

export default function MaliyetClient({ mazot, borsa }: Props) {
  const [urun, setUrun] = useState("BUGDAY");
  const [dekar, setDekar] = useState("10");
  const [verim, setVerim] = useState(String(VERIM_TUIK["BUGDAY"]));
  const [tohum, setTohum] = useState(String(TOHUM_VARSAYILAN["BUGDAY"]));
  const [gubre, setGubre] = useState(String(GUBRE_VARSAYILAN["BUGDAY"]));
  const [iscilik, setIscilik] = useState("0");
  const [diger, setDiger] = useState("0");

  function urunSec(u: string) {
    setUrun(u);
    setVerim(String(VERIM_TUIK[u] ?? 0));
    setTohum(String(TOHUM_VARSAYILAN[u] ?? 0));
    setGubre(String(GUBRE_VARSAYILAN[u] ?? 0));
  }

  const bf = borsa[urun];
  const renk = YEM_RENK[urun] ?? RENKLER.green;
  const mazotLt = MAZOT_LITRE_DEKAR[urun] ?? 12;

  const s = maliyetHesapla({
    dekar: parseFiyatGirdi(dekar) || 0,
    verimKgDekar: parseFiyatGirdi(verim) || 0,
    borsaFiyatTlKg: bf?.fiyat ?? 0,
    mazotTlLitre: mazot,
    mazotLitreDekar: mazotLt,
    tohumTlDekar: parseFiyatGirdi(tohum) || 0,
    gubreTlDekar: parseFiyatGirdi(gubre) || 0,
    iscilikTlDekar: parseFiyatGirdi(iscilik) || 0,
    digerTlDekar: parseFiyatGirdi(diger) || 0,
  });

  const netPozitif = s.netDekar >= 0;
  const kart: React.CSSProperties = { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "18px" };

  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>EKİM MALİYETİ</h1>
        <p style={{ fontSize: "13px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Dekar başı maliyet ve bugünkü borsa fiyatıyla beklenen gelir. Gelecek fiyat tahmin edilmez.</p>
      </div>

      {/* Ürün */}
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
        {MALIYET_URUNLER.map((u) => {
          const r = YEM_RENK[u] ?? RENKLER.green;
          const aktif = u === urun;
          return (
            <button key={u} onClick={() => urunSec(u)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 13px", fontSize: "13px", background: aktif ? `${r}22` : "transparent", color: aktif ? r : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}>
              <span style={{ fontSize: "13px" }}>{emoji(u)}</span>{AD[u]}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div style={kart}>
          <Etiket>ALAN (DEKAR)</Etiket>
          <input type="text" inputMode="decimal" value={dekar} onChange={(e) => setDekar(e.target.value)} style={inputStil} />
        </div>
        <div style={kart}>
          <Etiket not="TÜİK ort. · tahmin">VERİM (kg/dekar)</Etiket>
          <input type="text" inputMode="decimal" value={verim} onChange={(e) => setVerim(e.target.value)} style={inputStil} />
        </div>
      </div>

      {/* Maliyet kalemleri */}
      <div style={{ ...kart, marginBottom: "12px" }}>
        <Etiket>MALİYET KALEMLERİ (TL/dekar)</Etiket>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${RENKLER.border}` }}>
          <span style={{ fontSize: "12px", color: RENKLER.text }}>⛽ Mazot <span style={{ fontSize: "12px", color: RENKLER.muted }}>({mazotLt} lt × {formatFiyat(mazot)} ₺ · canlı)</span></span>
          <span style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600 }}>{formatFiyat(s.mazotTlDekar, 0)} ₺</span>
        </div>
        {([["Tohum", tohum, setTohum], ["Gübre", gubre, setGubre], ["İşçilik", iscilik, setIscilik], ["Diğer", diger, setDiger]] as const).map(([ad, val, set]) => (
          <div key={ad} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${RENKLER.border}` }}>
            <span style={{ fontSize: "12px", color: RENKLER.text }}>{ad}</span>
            <div style={{ position: "relative", width: "120px" }}>
              <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} style={{ ...inputStil, padding: "7px 24px 7px 10px", fontSize: "13px", textAlign: "right" }} />
              <span style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: RENKLER.muted }}>₺</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px" }}>
          <span style={{ fontSize: "12px", color: RENKLER.muted }}>Toplam maliyet / dekar</span>
          <span style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700 }}>{formatFiyat(s.maliyetDekar, 0)} ₺</span>
        </div>
      </div>

      {/* Sonuç */}
      <div style={{ ...kart, background: netPozitif ? "#0A1A10" : "#1A0E0A", border: `1px solid ${netPozitif ? "#1A5A30" : "#5A2A1A"}` }}>
        {!bf ? (
          <div style={{ fontSize: "12px", color: RENKLER.muted, textAlign: "center", padding: "8px" }}>Bu ürün için canlı borsa fiyatı yok — gelir hesaplanamıyor.</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: RENKLER.muted }}>Beklenen gelir / dekar <span style={{ fontSize: "12px" }}>(bugünkü fiyatla)</span></span>
              <span style={{ fontSize: "13px", color: RENKLER.text }}>{formatFiyat(s.gelirDekar, 0)} ₺</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: RENKLER.muted }}>Net / dekar</span>
              <span style={{ fontSize: "30px", color: netPozitif ? RENKLER.pos : RENKLER.red, fontWeight: 800 }}>{netPozitif ? "+" : ""}{formatFiyat(s.netDekar, 0)} ₺</span>
            </div>
            <div style={{ borderTop: `1px solid ${RENKLER.border}`, paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: RENKLER.muted }}>{formatFiyat(parseFiyatGirdi(dekar) || 0, 0)} dekar toplam net</span>
              <span style={{ color: netPozitif ? RENKLER.pos : RENKLER.red, fontWeight: 700 }}>{netPozitif ? "+" : ""}{formatFiyat(s.netToplam, 0)} ₺</span>
            </div>
            <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "10px", lineHeight: 1.5 }}>
              Gelir = verim × {AD[urun].toLowerCase()} {formatFiyat(bf.fiyat)} ₺/kg ({bf.borsa} · {kisaTarih(bf.tarih)}). Verim TÜİK ortalamasıdır, düzenleyebilirsin. Maliyet kalemleri tahminidir — kendi değerlerini gir.
            </div>
            <button
              onClick={() => {
                const p = new URLSearchParams({ urun, dekar: String(parseFiyatGirdi(dekar) || 1), verim, tohum, gubre, iscilik, diger });
                window.open(`/api/kart/maliyet?${p.toString()}`, "_blank");
              }}
              style={{ marginTop: "12px", width: "100%", padding: "10px", background: "transparent", color: RENKLER.green, border: `1px solid ${RENKLER.green}55`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}
            >
              📷 Görsel Kart Oluştur
            </button>
          </>
        )}
      </div>
    </main>
  );
}
