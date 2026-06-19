"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser, cikisYap, telefonNormalize } from "@/lib/auth";
import { RENKLER } from "@/lib/theme";

export default function GirisPage() {
  const router = useRouter();
  const { user, yukleniyor } = useUser();

  const [asama, setAsama] = useState<"telefon" | "kod">("telefon");
  const [telefon, setTelefon] = useState("");
  const [kod, setKod] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [e164, setE164] = useState("");

  const inputStil: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`,
    color: RENKLER.text, fontSize: "15px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)",
  };
  const butonStil = (aktif: boolean): React.CSSProperties => ({
    width: "100%", padding: "11px", fontSize: "13px", borderRadius: "3px", marginTop: "4px",
    background: aktif ? RENKLER.green : "#0E1A10", color: aktif ? "#000" : "#3A5040",
    border: "none", cursor: aktif ? "pointer" : "not-allowed", fontFamily: "var(--font-mono)", fontWeight: 700,
  });

  async function kodGonder() {
    setHata(null);
    const n = telefonNormalize(telefon);
    if (!n) { setHata("Geçerli bir cep numarası girin (5XX XXX XX XX)."); return; }
    if (!kvkk) { setHata("Devam etmek için KVKK metnini onaylayın."); return; }
    setGonderiliyor(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: n });
    setGonderiliyor(false);
    if (error) { setHata(error.message); return; }
    setE164(n);
    setAsama("kod");
  }

  async function kodDogrula() {
    setHata(null);
    if (kod.replace(/\D/g, "").length !== 6) { setHata("6 haneli kodu girin."); return; }
    setGonderiliyor(true);
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token: kod.replace(/\D/g, ""), type: "sms" });
    setGonderiliyor(false);
    if (error) { setHata(error.message); return; }
    router.push("/fiyat-bildir");
  }

  // Zaten giriş yapılmışsa
  if (!yukleniyor && user) {
    return (
      <main style={{ maxWidth: "420px", margin: "48px auto", padding: "0 16px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>👤</div>
        <h1 style={{ fontSize: "15px", color: RENKLER.text, fontWeight: 700 }}>Giriş yapıldı</h1>
        <p style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "6px" }}>{user.phone}</p>
        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          <Link href="/fiyat-bildir" style={{ flex: 1, padding: "10px", background: RENKLER.green, color: "#000", borderRadius: "3px", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}>Fiyat Bildir</Link>
          <button onClick={() => cikisYap()} style={{ flex: 1, padding: "10px", background: "transparent", color: RENKLER.muted, border: `1px solid ${RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)" }}>Çıkış</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "420px", margin: "48px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>GİRİŞ</h1>
      <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px", marginBottom: "20px" }}>
        Telefonla giriş — şifre yok, SMS ile gelen 6 haneli kod.
      </p>

      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {asama === "telefon" ? (
          <>
            <div>
              <label style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>CEP TELEFONU</label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", color: RENKLER.muted }}>+90</span>
                <input type="tel" inputMode="numeric" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="5XX XXX XX XX" style={inputStil} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "11px", color: RENKLER.muted, lineHeight: 1.5, cursor: "pointer" }}>
              <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} style={{ marginTop: "2px", accentColor: RENKLER.green }} />
              <span>
                <Link href="/kvkk" target="_blank" style={{ color: RENKLER.green }}>KVKK aydınlatma metnini</Link> okudum;
                telefon numaramın kimlik doğrulama ve bildirim için işlenmesini onaylıyorum.
              </span>
            </label>
            {hata && <div style={{ fontSize: "11px", color: RENKLER.red }}>{hata}</div>}
            <button onClick={kodGonder} disabled={!kvkk || gonderiliyor} style={butonStil(kvkk && !gonderiliyor)}>
              {gonderiliyor ? "Gönderiliyor…" : "Kod Gönder"}
            </button>
          </>
        ) : (
          <>
            <div>
              <label style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
                SMS KODU — {e164}
              </label>
              <input type="tel" inputMode="numeric" maxLength={6} value={kod} onChange={(e) => setKod(e.target.value)} placeholder="000000" style={{ ...inputStil, letterSpacing: "0.4em", textAlign: "center", fontSize: "20px" }} />
            </div>
            {hata && <div style={{ fontSize: "11px", color: RENKLER.red }}>{hata}</div>}
            <button onClick={kodDogrula} disabled={gonderiliyor} style={butonStil(!gonderiliyor)}>
              {gonderiliyor ? "Doğrulanıyor…" : "Giriş Yap"}
            </button>
            <button onClick={() => { setAsama("telefon"); setKod(""); setHata(null); }} style={{ background: "none", border: "none", color: RENKLER.muted, fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
              ← Numarayı değiştir
            </button>
          </>
        )}
      </div>
    </main>
  );
}
