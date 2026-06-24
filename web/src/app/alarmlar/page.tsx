"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import { fcmTokenAl } from "@/lib/firebase";
import { RENKLER } from "@/lib/theme";
import { formatFiyat, parseFiyatGirdi } from "@/lib/format";
import { YEM_AD } from "@/lib/urun-tanim";
import { HAYVAN_AD } from "@/lib/karkas";

const YEM = ["ARPA", "BUGDAY", "MISIR", "SAMAN", "YONCA", "YULAF", "CAVDAR"];
const HAYVAN = ["KOYUN", "KUZU", "TOSUN", "TOKLU", "INEK", "SUT"];
const adGoster = (n: string) => (n === "SUT" ? "Süt" : YEM_AD[n] ?? HAYVAN_AD[n] ?? n);
const birim = (n: string) => (n === "SUT" ? "TL/litre" : HAYVAN.includes(n) ? "TL/kg karkas" : "TL/kg");

interface Alarm { id: number; urun_norm: string; esik_fiyat: number; yon: "asagi" | "yukari"; aktif: boolean; }

const inputStil: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`,
  color: RENKLER.text, fontSize: "14px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)",
};
const etiketStil: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" };

export default function AlarmlarPage() {
  const { user, yukleniyor } = useUser();

  const [token, setToken] = useState<string | null>(null);
  const [izin, setIzin] = useState<"bilinmiyor" | "verildi" | "reddedildi" | "desteksiz">("bilinmiyor");
  const [izinMesgul, setIzinMesgul] = useState(false);

  const [urun, setUrun] = useState("ARPA");
  const [esik, setEsik] = useState("");
  const [yon, setYon] = useState<"yukari" | "asagi">("yukari");
  const [alarmlar, setAlarmlar] = useState<Alarm[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const alarmlariGetir = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("fiyat_alarm")
      .select("id, urun_norm, esik_fiyat, yon, aktif")
      .eq("kullanici_id", user.id).order("olusturma_tarihi", { ascending: false });
    setAlarmlar((data ?? []) as Alarm[]);
  }, [user]);

  useEffect(() => { alarmlariGetir(); }, [alarmlariGetir]);

  // Sayfa açılışında bildirim izni ZATEN verildiyse butonu gösterme — sessizce token al.
  useEffect(() => {
    if (typeof Notification === "undefined") { setIzin("desteksiz"); return; }
    if (Notification.permission === "granted") {
      fcmTokenAl().then((t) => { if (t) { setToken(t); setIzin("verildi"); } });
    } else if (Notification.permission === "denied") {
      setIzin("reddedildi");
    }
  }, []);

  async function bildirimleriAc() {
    setHata(null);
    setIzinMesgul(true);
    const t = await fcmTokenAl();
    setIzinMesgul(false);
    if (t) { setToken(t); setIzin("verildi"); return; }
    if (typeof Notification !== "undefined" && Notification.permission === "denied") setIzin("reddedildi");
    else setIzin("desteksiz");
  }

  async function alarmKur() {
    setHata(null);
    const e = parseFiyatGirdi(esik);
    if (!Number.isFinite(e) || e <= 0) { setHata("Geçerli bir eşik fiyatı girin."); return; }
    if (!token) { setHata("Önce bildirimleri açın."); return; }
    if (!user) return;
    setMesgul(true);
    const { error } = await supabase.from("fiyat_alarm").insert({
      urun_norm: urun, esik_fiyat: e, yon, fcm_token: token, kullanici_id: user.id, kanal: "push", aktif: true,
    });
    setMesgul(false);
    if (error) { setHata(error.message); return; }
    setEsik("");
    await alarmlariGetir();
  }

  async function alarmSil(id: number) {
    await supabase.from("fiyat_alarm").delete().eq("id", id);
    await alarmlariGetir();
  }

  if (yukleniyor) {
    return <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", color: RENKLER.muted, fontFamily: "var(--font-mono)", fontSize: "12px" }}>Yükleniyor…</main>;
  }

  if (!user) {
    return (
      <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT ALARMI</h1>
        <div style={{ marginTop: "20px", padding: "24px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔔</div>
          <p style={{ fontSize: "13px", color: RENKLER.text, lineHeight: 1.6 }}>Fiyat hedefine ulaşınca telefonuna bildirim al.</p>
          <Link href="/giris" style={{ display: "inline-block", marginTop: "16px", padding: "10px 24px", background: RENKLER.green, color: "#000", borderRadius: "3px", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}>Google ile Giriş Yap</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "600px", margin: "32px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT ALARMI</h1>
      <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px", marginBottom: "20px" }}>Eşik fiyata ulaşınca push bildirim gelir. Bildirimler her gece fiyatlar çekildikten sonra kontrol edilir.</p>

      {/* Bildirim izni */}
      {izin !== "verildi" && (
        <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: RENKLER.muted }}>
            {izin === "reddedildi" ? "Bildirim izni reddedilmiş — tarayıcı ayarlarından izin ver." :
             izin === "desteksiz" ? "Bu tarayıcı push bildirimi desteklemiyor (iOS'ta siteyi ana ekrana ekle)." :
             "Alarm kurmak için bildirim iznini aç."}
          </span>
          {izin !== "desteksiz" && (
            <button onClick={bildirimleriAc} disabled={izinMesgul} style={{ padding: "8px 14px", fontSize: "11px", background: RENKLER.green, color: "#000", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {izinMesgul ? "…" : "🔔 Bildirimleri Aç"}
            </button>
          )}
        </div>
      )}

      {/* Alarm kurma formu */}
      <form onSubmit={(e) => { e.preventDefault(); alarmKur(); }} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", opacity: izin === "verildi" ? 1 : 0.55 }}>
        <div>
          <label style={etiketStil}>ÜRÜN</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[...YEM, ...HAYVAN].map((u) => (
              <button key={u} type="button" onClick={() => setUrun(u)}
                style={{ padding: "5px 11px", fontSize: "11px", background: urun === u ? RENKLER.green : "#080E09", color: urun === u ? "#000" : RENKLER.muted, border: `1px solid ${urun === u ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                {adGoster(u)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={etiketStil}>YÖN</label>
          <div style={{ display: "flex", gap: "6px" }}>
            <button type="button" onClick={() => setYon("yukari")} style={{ flex: 1, padding: "9px", fontSize: "11px", background: yon === "yukari" ? RENKLER.surface : "#080E09", color: yon === "yukari" ? RENKLER.text : RENKLER.muted, border: `1px solid ${yon === "yukari" ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>▲ Üstüne çıkınca</button>
            <button type="button" onClick={() => setYon("asagi")} style={{ flex: 1, padding: "9px", fontSize: "11px", background: yon === "asagi" ? RENKLER.surface : "#080E09", color: yon === "asagi" ? RENKLER.text : RENKLER.muted, border: `1px solid ${yon === "asagi" ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>▼ Altına inince</button>
          </div>
        </div>

        <div>
          <label style={etiketStil}>EŞİK FİYAT ({birim(urun)})</label>
          <input type="text" inputMode="decimal" value={esik} onChange={(e) => setEsik(e.target.value)} placeholder="Örn: 16,00" style={inputStil} />
        </div>

        {hata && <div style={{ fontSize: "11px", color: RENKLER.red }}>{hata}</div>}

        <button type="submit" disabled={mesgul || izin !== "verildi"} style={{ padding: "10px", fontSize: "12px", background: RENKLER.green, color: "#000", border: "none", borderRadius: "3px", cursor: izin === "verildi" ? "pointer" : "not-allowed", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          {mesgul ? "…" : "Alarm Kur"}
        </button>
      </form>

      {/* Mevcut alarmlar */}
      {alarmlar.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>KURDUĞUN ALARMLAR</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {alarmlar.map((a) => {
              const pasif = !a.aktif; // tetiklenince scraper aktif=false yapar
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: RENKLER.surface, border: `1px solid ${pasif ? RENKLER.border : RENKLER.green + "44"}`, borderRadius: "8px", padding: "10px 12px", opacity: pasif ? 0.65 : 1 }}>
                  <span style={{ fontSize: "12px", color: RENKLER.text, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{adGoster(a.urun_norm)} {a.yon === "yukari" ? "▲" : "▼"} {formatFiyat(a.esik_fiyat)} <span style={{ color: RENKLER.muted, fontSize: "10px" }}>{birim(a.urun_norm)}</span></span>
                    {pasif
                      ? <span style={{ color: RENKLER.green, fontSize: "9px" }}>✓ tetiklendi</span>
                      : <span style={{ color: RENKLER.muted, fontSize: "9px" }}>● aktif</span>}
                  </span>
                  <button onClick={() => alarmSil(a.id)} style={{ background: "transparent", border: "none", color: RENKLER.red, fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>Sil</button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.5 }}>
            Tetiklenen alarm bir daha çalmaz (otomatik pasifleşir). Tekrar uyarı istersen Sil + yeniden kur.
          </div>
        </div>
      )}
    </main>
  );
}
