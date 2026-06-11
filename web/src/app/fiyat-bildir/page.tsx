"use client";
import { useState } from "react";
import { RENKLER } from "@/lib/theme";
import { ILLER } from "@/lib/iller";

// TODO(PART5-auth): Telefon OTP girişi implement edilince bu sayfa OTP akışıyla
// açılacak. gonder() içindeki insert mantığı korunacak; AUTH_HAZIR true yapılıp
// supabase.auth üzerinden user.id alınacak. Şimdilik form görünür ama submit kapalı —
// kullanıcıya yanlışlıkla "çalışmayan buton" gösterilmez (UI denetimi 3.1).
const AUTH_HAZIR = false;

const URUNLER = ["ARPA", "BUGDAY", "MISIR", "SAMAN", "YONCA", "YULAF", "CAVDAR"];
const KAYNAKLAR = ["pazar", "tuccar", "fabrika", "kooperatif"] as const;

export default function FiyatBildirPage() {
  const [urun,   setUrun]   = useState("ARPA");
  const [fiyat,  setFiyat]  = useState("");
  const [il,     setIl]     = useState("KONYA");
  const [ilce,   setIlce]   = useState("");
  const [kaynak, setKaynak] = useState<typeof KAYNAKLAR[number]>("pazar");

  return (
    <main style={{ maxWidth: "600px", margin: "32px auto", padding: "16px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT BİLDİR</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>Piyasa fiyatını bildirerek gerçek veri oluştur. En az 3 bildirim sonrası görünür.</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Ürün */}
        <div>
          <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>ÜRÜN</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {URUNLER.map((u) => (
              <button key={u} type="button" onClick={() => setUrun(u)}
                style={{ padding: "5px 12px", fontSize: "11px", background: urun === u ? RENKLER.green : "#080E09", color: urun === u ? "#000" : RENKLER.muted, border: `1px solid ${urun === u ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer" }}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Fiyat — hem "14,50" hem "14.50" kabul edilir (gönderimde parseFiyatGirdi kullanılacak) */}
        <div>
          <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>FİYAT (TL/KG)</label>
          <input
            type="text" inputMode="decimal"
            value={fiyat} onChange={(e) => setFiyat(e.target.value)}
            placeholder="Örn: 14,50"
            style={{ width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "14px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)" }}
          />
        </div>

        {/* İl: 81 il sabit listesi (3.2) — serbest metin GROUP BY'ı bozuyordu */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>İL</label>
            <select
              value={il} onChange={(e) => setIl(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "12px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)" }}
            >
              {ILLER.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>İLÇE (opsiyonel)</label>
            <input
              type="text"
              value={ilce} onChange={(e) => setIlce(e.target.value)}
              placeholder="Karatay"
              style={{ width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "12px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)" }}
            />
          </div>
        </div>

        {/* Kaynak */}
        <div>
          <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>KAYNAK</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {KAYNAKLAR.map((k) => (
              <button key={k} type="button" onClick={() => setKaynak(k)}
                style={{ padding: "5px 10px", fontSize: "11px", background: kaynak === k ? RENKLER.surface : "#080E09", color: kaynak === k ? RENKLER.text : RENKLER.muted, border: `1px solid ${kaynak === k ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer" }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 3.1: auth gelene kadar submit kapalı — çıkmaz sokak yok */}
        <button
          type="submit"
          disabled={!AUTH_HAZIR}
          style={{ padding: "10px", fontSize: "12px", background: AUTH_HAZIR ? RENKLER.green : "#1A3020", color: AUTH_HAZIR ? "#000" : RENKLER.muted, border: "none", borderRadius: "3px", cursor: AUTH_HAZIR ? "pointer" : "not-allowed", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
        >
          🔒 YAKINDA: TELEFONLA GİRİŞ
        </button>
      </form>

      <div style={{ marginTop: "12px", padding: "12px", fontSize: "10px", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", lineHeight: 1.6 }}>
        Fiyat bildirimi yakında telefon numaranızla giriş yaparak yapılabilecek.
        Bildirimler topluluk ortalamasına katılır ve borsa fiyatlarıyla karşılaştırılır.
      </div>
    </main>
  );
}
