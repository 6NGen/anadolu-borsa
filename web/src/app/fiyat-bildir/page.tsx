"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import { useBolgem } from "@/lib/bolgem";
import { RENKLER } from "@/lib/theme";
import { ILLER } from "@/lib/iller";
import { parseFiyatGirdi } from "@/lib/format";
import { YEM_AD } from "@/lib/urun-tanim";
import { HAYVAN_AD } from "@/lib/karkas";

const YEM = ["ARPA", "BUGDAY", "MISIR", "SAMAN", "YONCA", "YULAF", "CAVDAR"];
const HAYVAN = ["KOYUN", "KUZU", "TOSUN", "TOKLU", "INEK", "SUT"];
const KAYNAKLAR = ["pazar", "tuccar", "fabrika", "kooperatif"] as const;

const adGoster = (norm: string) => (norm === "SUT" ? "Süt" : YEM_AD[norm] ?? HAYVAN_AD[norm] ?? norm);
// Borsa fiyatıyla aynı birim: süt litre, diğer hayvan karkas kg, yem kg
const birimEtiket = (norm: string) => (norm === "SUT" ? "TL/litre" : HAYVAN.includes(norm) ? "TL/kg karkas" : "TL/kg");

interface Bildirim {
  id: number; urun_norm: string; fiyat: number; il: string;
  ilce: string | null; kaynak_turu: string; giris_tarihi: string;
}

const inputStil: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "#080E09", border: `1px solid ${RENKLER.border}`,
  color: RENKLER.text, fontSize: "14px", borderRadius: "3px", outline: "none", fontFamily: "var(--font-mono)",
};
const etiketStil: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, display: "block", marginBottom: "6px", letterSpacing: "0.1em" };

export default function FiyatBildirPage() {
  const { user, yukleniyor } = useUser();
  const [bolgem] = useBolgem();

  const [urun, setUrun] = useState("ARPA");
  const [fiyat, setFiyat] = useState("");
  const [il, setIl] = useState("KONYA");
  const [ilDokunuldu, setIlDokunuldu] = useState(false);
  const [ilce, setIlce] = useState("");
  const [kaynak, setKaynak] = useState<typeof KAYNAKLAR[number]>("pazar");

  const [mevcut, setMevcut] = useState<Bildirim | null>(null); // bugünkü kendi bildirimi → düzenleme
  const [sayac, setSayac] = useState<number | null>(null);
  const [durum, setDurum] = useState<"form" | "basarili">("form");
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const bugun = new Date().toISOString().slice(0, 10);

  // İl bölgem'den ön-dolu (kullanıcı elle değiştirmediyse)
  useEffect(() => {
    if (bolgem && !ilDokunuldu && (ILLER as readonly string[]).includes(bolgem)) setIl(bolgem);
  }, [bolgem, ilDokunuldu]);

  // Seçili ürün için bugünkü kendi bildirimini getir → varsa düzenleme moduna geç
  const mevcutGetir = useCallback(async (urunNorm: string) => {
    if (!user) { setMevcut(null); return; }
    const { data } = await supabase.from("kullanici_fiyat")
      .select("id, urun_norm, fiyat, il, ilce, kaynak_turu, giris_tarihi")
      .eq("kullanici_id", user.id).eq("urun_norm", urunNorm).eq("giris_tarihi", bugun)
      .maybeSingle();
    if (data) {
      setMevcut(data as Bildirim);
      setFiyat(String(data.fiyat).replace(".", ","));
      setIl(data.il); setIlce(data.ilce ?? ""); setKaynak(data.kaynak_turu as typeof KAYNAKLAR[number]);
    } else {
      setMevcut(null);
      setFiyat("");
    }
  }, [user, bugun]);

  useEffect(() => { mevcutGetir(urun); }, [urun, mevcutGetir]);

  async function sayacGetir() {
    const { count } = await supabase.from("kullanici_fiyat")
      .select("id", { count: "exact", head: true })
      .eq("urun_norm", urun).eq("il", il).eq("giris_tarihi", bugun).eq("bayraklandi", false);
    setSayac(count ?? null);
  }

  async function gonder() {
    setHata(null);
    const f = parseFiyatGirdi(fiyat);
    if (!Number.isFinite(f) || f <= 0 || f > 10000) { setHata("Geçerli bir fiyat girin (0–10.000)."); return; }
    if (!user) { setHata("Önce giriş yapın."); return; }
    setMesgul(true);
    const govde = { il, ilce: ilce.trim() || null, kaynak_turu: kaynak };
    const { error } = mevcut
      ? await supabase.from("kullanici_fiyat").update({ fiyat: f, ...govde }).eq("id", mevcut.id)
      : await supabase.from("kullanici_fiyat").insert({ urun_norm: urun, fiyat: f, kullanici_id: user.id, ...govde });
    setMesgul(false);
    if (error) {
      // Unique (kullanici_id, urun_norm, giris_tarihi): bugün zaten bildirilmiş
      if (error.code === "23505") { setHata("Bugün bu ürün için zaten bildirim yaptınız — aşağıdan düzenleyebilirsiniz."); await mevcutGetir(urun); return; }
      setHata(error.message); return;
    }
    await sayacGetir();
    setDurum("basarili");
  }

  async function sil() {
    if (!mevcut) return;
    setMesgul(true);
    await supabase.from("kullanici_fiyat").delete().eq("id", mevcut.id);
    setMesgul(false);
    setMevcut(null); setFiyat(""); setHata(null);
  }

  // ── Yükleniyor ──
  if (yukleniyor) {
    return <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", color: RENKLER.muted, fontFamily: "var(--font-mono)", fontSize: "12px" }}>Yükleniyor…</main>;
  }

  // ── Giriş yapılmamış: CTA ──
  if (!user) {
    return (
      <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT BİLDİR</h1>
        <div style={{ marginTop: "20px", padding: "24px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>📍</div>
          <p style={{ fontSize: "13px", color: RENKLER.text, lineHeight: 1.6 }}>Bulunduğun yerin gerçek piyasa fiyatını bildir.</p>
          <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "6px", lineHeight: 1.6 }}>Bildirimler topluluk ortalamasına katılır ve borsa fiyatıyla karşılaştırılır. En az 3 bildirim sonrası görünür.</p>
          <Link href="/giris" style={{ display: "inline-block", marginTop: "16px", padding: "10px 24px", background: RENKLER.green, color: "#000", borderRadius: "3px", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}>
            Telefonla Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  // ── Başarı ──
  if (durum === "basarili") {
    return (
      <main style={{ maxWidth: "600px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>✓</div>
        <h1 style={{ fontSize: "15px", color: RENKLER.green, fontWeight: 700 }}>Teşekkürler</h1>
        <p style={{ fontSize: "12px", color: RENKLER.text, marginTop: "8px", lineHeight: 1.6 }}>Bildirimin topluluk ortalamasına katıldı.</p>
        {sayac != null && (
          <p style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "10px" }}>
            {adGoster(urun)} · {il} — bugün <b style={{ color: RENKLER.text }}>{sayac}/3</b> bildirim
            <br />
            <span style={{ fontSize: "10px" }}>{sayac >= 3 ? "Piyasa ortalaması artık görünür." : "3 bildirime ulaşınca piyasa ortalaması görünür."}</span>
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "center" }}>
          <button onClick={() => { setDurum("form"); mevcutGetir(urun); }} style={{ padding: "10px 18px", background: RENKLER.green, color: "#000", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Yeni Bildirim</button>
          <Link href="/tarim" style={{ padding: "10px 18px", background: "transparent", color: RENKLER.muted, border: `1px solid ${RENKLER.border}`, borderRadius: "3px", textDecoration: "none", fontSize: "12px" }}>Borsaya Git</Link>
        </div>
      </main>
    );
  }

  // ── Form (ekle / düzenle) ──
  const urunButon = (u: string) => (
    <button key={u} type="button" onClick={() => { setUrun(u); setHata(null); }}
      style={{ padding: "5px 12px", fontSize: "11px", background: urun === u ? RENKLER.green : "#080E09", color: urun === u ? "#000" : RENKLER.muted, border: `1px solid ${urun === u ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
      {adGoster(u)}
    </button>
  );

  return (
    <main style={{ maxWidth: "600px", margin: "32px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>FİYAT BİLDİR</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>Piyasa fiyatını bildirerek gerçek veri oluştur. En az 3 bildirim sonrası görünür.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); gonder(); }} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {mevcut && (
          <div style={{ fontSize: "11px", color: "#E8C040", background: "#1A1605", border: "1px solid #3A3010", borderRadius: "3px", padding: "8px 10px" }}>
            ✎ Bugün {adGoster(urun)} için bildirimin var — düzenliyorsun.
          </div>
        )}

        {/* Ürün: YEM + HAYVAN grupları */}
        <div>
          <label style={etiketStil}>ÜRÜN — YEM</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>{YEM.map(urunButon)}</div>
          <label style={etiketStil}>ÜRÜN — HAYVAN</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{HAYVAN.map(urunButon)}</div>
        </div>

        {/* Fiyat — birim ürüne göre (süt litre, hayvan karkas kg, yem kg) */}
        <div>
          <label style={etiketStil}>FİYAT ({birimEtiket(urun)})</label>
          <input type="text" inputMode="decimal" value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="Örn: 14,50" style={inputStil} />
        </div>

        {/* İl + İlçe */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={etiketStil}>İL</label>
            <select value={il} onChange={(e) => { setIl(e.target.value); setIlDokunuldu(true); }} style={{ ...inputStil, fontSize: "12px" }}>
              {ILLER.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={etiketStil}>İLÇE (opsiyonel)</label>
            <input type="text" value={ilce} onChange={(e) => setIlce(e.target.value)} placeholder="Karatay" style={{ ...inputStil, fontSize: "12px" }} />
          </div>
        </div>

        {/* Kaynak */}
        <div>
          <label style={etiketStil}>KAYNAK</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {KAYNAKLAR.map((k) => (
              <button key={k} type="button" onClick={() => setKaynak(k)}
                style={{ padding: "5px 10px", fontSize: "11px", background: kaynak === k ? RENKLER.surface : "#080E09", color: kaynak === k ? RENKLER.text : RENKLER.muted, border: `1px solid ${kaynak === k ? RENKLER.green : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {hata && <div style={{ fontSize: "11px", color: RENKLER.red }}>{hata}</div>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={mesgul} style={{ flex: 1, padding: "10px", fontSize: "12px", background: RENKLER.green, color: "#000", border: "none", borderRadius: "3px", cursor: mesgul ? "wait" : "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {mesgul ? "…" : mevcut ? "Bildirimi Güncelle" : "Bildir"}
          </button>
          {mevcut && (
            <button type="button" onClick={sil} disabled={mesgul} style={{ padding: "10px 16px", fontSize: "12px", background: "transparent", color: RENKLER.red, border: `1px solid ${RENKLER.red}40`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
              Sil
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
