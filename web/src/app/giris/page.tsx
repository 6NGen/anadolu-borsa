"use client";
import { useState } from "react";
import Link from "next/link";
import { useUser, cikisYap, googleGiris } from "@/lib/auth";
import { RENKLER } from "@/lib/theme";

export default function GirisPage() {
  const { user, yukleniyor } = useUser();
  const [kvkk, setKvkk] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gidiliyor, setGidiliyor] = useState(false);

  async function girisYap() {
    setHata(null);
    if (!kvkk) { setHata("Devam etmek için KVKK metnini onaylayın."); return; }
    setGidiliyor(true);
    try {
      await googleGiris(); // Google'a yönlendirir
    } catch (e) {
      setGidiliyor(false);
      setHata(e instanceof Error ? e.message : "Giriş başlatılamadı.");
    }
  }

  // Zaten giriş yapılmışsa
  if (!yukleniyor && user) {
    return (
      <main style={{ maxWidth: "420px", margin: "48px auto", padding: "0 16px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>👤</div>
        <h1 style={{ fontSize: "15px", color: RENKLER.text, fontWeight: 700 }}>Giriş yapıldı</h1>
        <p style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "6px" }}>{user.email}</p>
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
        Google hesabınla tek tıkla giriş — şifre yok.
      </p>

      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "11px", color: RENKLER.muted, lineHeight: 1.5, cursor: "pointer" }}>
          <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} style={{ marginTop: "2px", accentColor: RENKLER.green }} />
          <span>
            <Link href="/kvkk" target="_blank" style={{ color: RENKLER.green }}>KVKK aydınlatma metnini</Link> okudum;
            hesap bilgilerimin kimlik doğrulama ve bildirim için işlenmesini onaylıyorum.
          </span>
        </label>

        {hata && <div style={{ fontSize: "11px", color: RENKLER.red }}>{hata}</div>}

        <button
          onClick={girisYap}
          disabled={!kvkk || gidiliyor}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            width: "100%", padding: "11px", fontSize: "13px", borderRadius: "3px", fontWeight: 700, fontFamily: "var(--font-mono)",
            background: kvkk ? "#fff" : "#1A2018", color: kvkk ? "#1A1A1A" : "#3A5040",
            border: "none", cursor: kvkk && !gidiliyor ? "pointer" : "not-allowed",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 700, color: kvkk ? "#4285F4" : "#3A5040" }}>G</span>
          {gidiliyor ? "Yönlendiriliyor…" : "Google ile Giriş"}
        </button>
      </div>
    </main>
  );
}
