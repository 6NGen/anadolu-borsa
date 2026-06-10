"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { RENKLER } from "@/lib/theme";

const URUNLER = ["ARPA", "BUGDAY", "MISIR", "SAMAN", "YONCA", "YULAF", "CAVDAR"];
const KAYNAKLAR = ["pazar", "tuccar", "fabrika", "kooperatif"] as const;

export default function FiyatBildirPage() {
  const [urun,    setUrun]    = useState("ARPA");
  const [fiyat,   setFiyat]   = useState("");
  const [il,      setIl]      = useState("");
  const [ilce,    setIlce]    = useState("");
  const [kaynak,  setKaynak]  = useState<typeof KAYNAKLAR[number]>("pazar");
  const [durum,   setDurum]   = useState<"bos" | "gonderiliyor" | "basarili" | "hata">("bos");
  const [mesaj,   setMesaj]   = useState("");

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!fiyat || !il) { setMesaj("Fiyat ve il zorunludur."); setDurum("hata"); return; }

    const fiyatSayi = parseFloat(fiyat.replace(",", "."));
    if (!Number.isFinite(fiyatSayi) || fiyatSayi <= 0 || fiyatSayi > 10000) {
      setMesaj("Geçerli bir fiyat girin (0 ile 10.000 TL/kg arası).");
      setDurum("hata");
      return;
    }
    const ilTemiz = il.toUpperCase().trim();
    if (ilTemiz.length < 2 || ilTemiz.length > 30 || !/^[A-ZÇĞİÖŞÜ\s]+$/.test(ilTemiz)) {
      setMesaj("Geçerli bir il adı girin (yalnızca harf).");
      setDurum("hata");
      return;
    }
    setDurum("gonderiliyor");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMesaj("Fiyat bildirmek için giriş yapmalısınız."); setDurum("hata"); return; }

    const { error } = await supabase.from("kullanici_fiyat").insert({
      urun_norm:    urun,
      fiyat:        fiyatSayi,
      il:           ilTemiz,
      ilce:         ilce.trim().slice(0, 50) || null,
      kaynak_turu:  kaynak,
      kullanici_id: user.id,
    });

    if (error) { setMesaj(error.message); setDurum("hata"); }
    else { setMesaj("Fiyat başarıyla bildirildi. Teşekkürler!"); setDurum("basarili"); setFiyat(""); setIlce(""); }
  }

  return (
    <main style={{ maxWidth: "600px", margin: "32px auto", padding: "16px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT BİLDİR</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>Piyasa fiyatını bildirerek gerçek veri oluştur. En az 3 bildirim sonrası görünür.</p>
      </div>

      <form onSubmit={gonder} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
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

        {/* Fiyat */}
        <div>
          <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>FİYAT (TL/KG)</label>
          <input
            type="number" step="0.01" min="0" required
            value={fiyat} onChange={(e) => setFiyat(e.target.value)}
            placeholder="Örn: 14.50"
            style={{ width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "14px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)" }}
          />
        </div>

        {/* İl */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>İL</label>
            <input
              type="text" required
              value={il} onChange={(e) => setIl(e.target.value)}
              placeholder="KONYA"
              style={{ width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "12px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
            />
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
          <div style={{ display: "flex", gap: "6px" }}>
            {KAYNAKLAR.map((k) => (
              <button key={k} type="button" onClick={() => setKaynak(k)}
                style={{ padding: "5px 10px", fontSize: "11px", background: kaynak === k ? RENKLER.surface : "#080E09", color: kaynak === k ? RENKLER.text : RENKLER.muted, border: `1px solid ${kaynak === k ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer" }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Gönder */}
        <button
          type="submit"
          disabled={durum === "gonderiliyor"}
          style={{ padding: "10px", fontSize: "12px", background: RENKLER.green, color: "#000", border: "none", borderRadius: "3px", cursor: durum === "gonderiliyor" ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
        >
          {durum === "gonderiliyor" ? "GÖNDERİLİYOR…" : "FİYAT BİLDİR"}
        </button>

        {mesaj && (
          <div style={{ padding: "10px 12px", background: "#080E09", border: `1px solid ${durum === "basarili" ? RENKLER.pos : RENKLER.neg}`, borderRadius: "3px", fontSize: "11px", color: durum === "basarili" ? RENKLER.pos : RENKLER.neg }}>
            {mesaj}
          </div>
        )}
      </form>

      <div style={{ marginTop: "12px", padding: "12px", fontSize: "10px", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
        Giriş yapmadan bildirim yapamazsınız. Supabase Auth ile e-posta veya Google ile giriş yapın.
      </div>
    </main>
  );
}
