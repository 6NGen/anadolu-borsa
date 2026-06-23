"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import { useBolgem } from "@/lib/bolgem";
import { RENKLER, YEM_RENK, HAYVAN_RENK, emoji } from "@/lib/theme";
import { ILLER } from "@/lib/iller";
import { parseFiyatGirdi } from "@/lib/format";

// Ürün grupları. Not: yonca/saman aslında KABA YEM (TL/kg değil balya/ton ile
// satılır) — bu yüzden YEM tahıl grubundan ayrıldı. urun_norm değerleri aynı.
const YEM = ["ARPA", "BUGDAY", "MISIR", "YULAF", "CAVDAR"];
const KABAYEM = ["YONCA", "SAMAN", "KORUNGA", "KURUOT"];
const GUBRE = ["DAP", "URE", "AN33", "KOMPOZE"];
const HAYVAN = ["KOYUN", "KUZU", "TOSUN", "TOKLU", "INEK", "SUT"];
const KAYNAKLAR = ["pazar", "tuccar", "fabrika", "kooperatif"] as const;

const AD: Record<string, string> = {
  ARPA: "Arpa", BUGDAY: "Buğday", MISIR: "Mısır", YULAF: "Yulaf", CAVDAR: "Çavdar",
  YONCA: "Yonca", SAMAN: "Saman", KORUNGA: "Korunga", KURUOT: "Kuru Ot",
  DAP: "DAP", URE: "Üre", AN33: "%33 AN", KOMPOZE: "Kompoze",
  KOYUN: "Koyun", KUZU: "Kuzu", TOSUN: "Tosun", TOKLU: "Toklu", INEK: "İnek", SUT: "Süt",
};
const EK_EMOJI: Record<string, string> = { DAP: "🧪", URE: "🧪", AN33: "🧪", KOMPOZE: "🧪", KORUNGA: "🌿", KURUOT: "🌾" };
const ikon = (n: string) => EK_EMOJI[n] ?? emoji(n);
const adGoster = (n: string) => AD[n] ?? n;

type Kategori = "YEM" | "KABAYEM" | "GUBRE" | "HAYVAN";
function kategori(norm: string): Kategori {
  if (GUBRE.includes(norm)) return "GUBRE";
  if (KABAYEM.includes(norm)) return "KABAYEM";
  if (HAYVAN.includes(norm)) return "HAYVAN";
  return "YEM";
}

// Birim-esnek giriş: kaba yem/gübre farklı birimlerle satılır → TL/kg'a normalize.
const BIRIM_SECENEK: Record<string, [string, string][]> = {
  KABAYEM: [["balya", "balya"], ["ton", "ton"], ["kg", "kg"]],
  GUBRE: [["cuval", "çuval · 50kg"], ["ton", "ton"], ["kg", "kg"]],
};
const varsayilanBirim = (norm: string) => (kategori(norm) === "GUBRE" ? "cuval" : kategori(norm) === "KABAYEM" ? "balya" : "kg");

function tlPerKg(fiyat: number, birim: string, balyaKg: number): number {
  if (birim === "ton") return fiyat / 1000;
  if (birim === "cuval") return fiyat / 50;
  if (birim === "balya") return balyaKg > 0 ? fiyat / balyaKg : NaN;
  return fiyat; // kg
}

// Borsa fiyatıyla aynı birim
const yemBirim = (norm: string) => {
  const k = kategori(norm);
  if (norm === "SUT") return "TL/litre";
  if (k === "HAYVAN") return "TL/kg karkas";
  return "TL/kg";
};

const urunRenk = (norm: string) => {
  if (kategori(norm) === "GUBRE") return "#8FB8C8";
  return YEM_RENK[norm] ?? HAYVAN_RENK[norm] ?? RENKLER.green;
};

interface Bildirim {
  id: number; urun_norm: string; fiyat: number; il: string;
  ilce: string | null; kaynak_turu: string; giris_tarihi: string;
}

const inputStil: React.CSSProperties = {
  width: "100%", padding: "11px 13px", background: RENKLER.bg, border: `1px solid ${RENKLER.border}`,
  color: RENKLER.text, fontSize: "14px", borderRadius: "8px", outline: "none", fontFamily: "var(--font-mono)",
};

function Etiket({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "9px" }}>
      <span style={{ width: "3px", height: "11px", background: RENKLER.green, borderRadius: "2px" }} />
      <span style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em", fontWeight: 600 }}>{children}</span>
    </div>
  );
}

export default function FiyatBildirPage() {
  const { user, yukleniyor } = useUser();
  const [bolgem] = useBolgem();

  const [urun, setUrun] = useState("ARPA");
  const [fiyat, setFiyat] = useState("");
  const [birim, setBirim] = useState("kg");
  const [balyaKg, setBalyaKg] = useState("");
  const [il, setIl] = useState("KONYA");
  const [ilDokunuldu, setIlDokunuldu] = useState(false);
  const [ilce, setIlce] = useState("");
  const [kaynak, setKaynak] = useState<typeof KAYNAKLAR[number]>("pazar");

  const [mevcut, setMevcut] = useState<Bildirim | null>(null);
  const [sayac, setSayac] = useState<number | null>(null);
  const [durum, setDurum] = useState<"form" | "basarili">("form");
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const bugun = new Date().toISOString().slice(0, 10);
  const kat = kategori(urun);
  const birimliKategori = kat === "GUBRE" || kat === "KABAYEM";

  useEffect(() => {
    if (bolgem && !ilDokunuldu && (ILLER as readonly string[]).includes(bolgem)) setIl(bolgem);
  }, [bolgem, ilDokunuldu]);

  const mevcutGetir = useCallback(async (urunNorm: string) => {
    if (!user) { setMevcut(null); return; }
    const { data } = await supabase.from("kullanici_fiyat")
      .select("id, urun_norm, fiyat, il, ilce, kaynak_turu, giris_tarihi")
      .eq("kullanici_id", user.id).eq("urun_norm", urunNorm).eq("giris_tarihi", bugun)
      .maybeSingle();
    if (data) {
      setMevcut(data as Bildirim);
      // Kayıt TL/kg tutulur — düzenlemede birim kg gösterilir
      setFiyat(String(data.fiyat).replace(".", ","));
      setBirim("kg");
      setIl(data.il); setIlce(data.ilce ?? ""); setKaynak(data.kaynak_turu as typeof KAYNAKLAR[number]);
    } else {
      setMevcut(null);
      setFiyat("");
    }
  }, [user, bugun]);

  useEffect(() => { mevcutGetir(urun); }, [urun, mevcutGetir]);

  function urunSec(u: string) {
    setUrun(u);
    setBirim(varsayilanBirim(u));
    setBalyaKg("");
    setHata(null);
  }

  // Normalize edilmiş TL/kg (gönderim + önizleme)
  const hamFiyat = parseFiyatGirdi(fiyat);
  const normalKg = birimliKategori ? tlPerKg(hamFiyat, birim, parseFiyatGirdi(balyaKg)) : hamFiyat;

  async function sayacGetir() {
    const { count } = await supabase.from("kullanici_fiyat")
      .select("id", { count: "exact", head: true })
      .eq("urun_norm", urun).eq("il", il).eq("giris_tarihi", bugun).eq("bayraklandi", false);
    setSayac(count ?? null);
  }

  async function gonder() {
    setHata(null);
    if (!Number.isFinite(normalKg) || normalKg <= 0 || normalKg > 10000) {
      setHata(birim === "balya" && !(parseFiyatGirdi(balyaKg) > 0) ? "Balya ağırlığını (kg) girin." : "Geçerli bir fiyat girin.");
      return;
    }
    if (!user) { setHata("Önce giriş yapın."); return; }
    setMesgul(true);
    const govde = { il, ilce: ilce.trim() || null, kaynak_turu: kaynak };
    const { error } = mevcut
      ? await supabase.from("kullanici_fiyat").update({ fiyat: normalKg, ...govde }).eq("id", mevcut.id)
      : await supabase.from("kullanici_fiyat").insert({ urun_norm: urun, fiyat: normalKg, kullanici_id: user.id, ...govde });
    setMesgul(false);
    if (error) {
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

  if (yukleniyor) {
    return <main style={{ maxWidth: "560px", margin: "48px auto", padding: "16px", color: RENKLER.muted, fontFamily: "var(--font-mono)", fontSize: "12px" }}>Yükleniyor…</main>;
  }

  if (!user) {
    return (
      <main style={{ maxWidth: "560px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>FİYAT BİLDİR</h1>
        <div style={{ marginTop: "20px", padding: "28px 24px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "30px", marginBottom: "12px" }}>📍</div>
          <p style={{ fontSize: "13px", color: RENKLER.text, lineHeight: 1.6 }}>Bulunduğun yerin gerçek piyasa fiyatını bildir.</p>
          <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.6 }}>Özellikle kaba yem ve gübrenin resmi kaynağı yok — senin bildirimin en değerlisi. En az 3 bildirim sonrası görünür.</p>
          <Link href="/giris" style={{ display: "inline-block", marginTop: "18px", padding: "11px 26px", background: RENKLER.green, color: "#06140C", borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}>
            Google ile Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  if (durum === "basarili") {
    return (
      <main style={{ maxWidth: "560px", margin: "48px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
        <div style={{ padding: "32px 24px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", margin: "0 auto 14px", borderRadius: "50%", background: `${RENKLER.green}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", color: RENKLER.green }}>✓</div>
          <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700 }}>Teşekkürler</h1>
          <p style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.6 }}>Bildirimin topluluk ortalamasına katıldı.</p>
          {sayac != null && (
            <div style={{ marginTop: "16px", padding: "12px", background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: RENKLER.muted }}>{adGoster(urun)} · {il}</div>
              <div style={{ fontSize: "22px", color: urunRenk(urun), fontWeight: 800, margin: "2px 0" }}>{sayac}<span style={{ fontSize: "13px", color: RENKLER.muted }}> / 3 bildirim</span></div>
              <div style={{ fontSize: "10px", color: RENKLER.muted }}>{sayac >= 3 ? "Piyasa ortalaması artık görünür." : "3 bildirime ulaşınca piyasa ortalaması görünür."}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <button onClick={() => { setDurum("form"); mevcutGetir(urun); }} style={{ flex: 1, padding: "11px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Yeni Bildirim</button>
            <Link href="/tarim" style={{ flex: 1, padding: "11px", background: "transparent", color: RENKLER.muted, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", textDecoration: "none", fontSize: "12px", textAlign: "center" }}>Borsaya Git</Link>
          </div>
        </div>
      </main>
    );
  }

  const urunButon = (u: string) => {
    const renk = urunRenk(u);
    const aktif = urun === u;
    return (
      <button key={u} type="button" onClick={() => urunSec(u)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 13px", fontSize: "11.5px", fontFamily: "var(--font-mono)",
          background: aktif ? `${renk}22` : "transparent",
          color: aktif ? renk : RENKLER.muted,
          border: `1px solid ${aktif ? renk : RENKLER.border}`,
          borderRadius: "20px", cursor: "pointer", fontWeight: aktif ? 700 : 400, transition: "all .15s",
        }}>
        <span style={{ fontSize: "13px" }}>{ikon(u)}</span>{adGoster(u)}
      </button>
    );
  };

  const fiyatEtiket = birimliKategori
    ? `FİYAT · 1 ${(BIRIM_SECENEK[kat].find(([k]) => k === birim)?.[1] ?? birim)}`
    : `FİYAT · ${yemBirim(urun)}`;

  return (
    <main style={{ maxWidth: "560px", margin: "32px auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>FİYAT BİLDİR</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Piyasa fiyatını bildirerek gerçek veri oluştur. En az 3 bildirim sonrası görünür.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); gonder(); }} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {mevcut && (
          <div style={{ fontSize: "11px", color: "#E8C040", background: "#19150622", border: "1px solid #3A301055", borderRadius: "8px", padding: "9px 11px", display: "flex", gap: "6px", alignItems: "center" }}>
            <span>✎</span> Bugün <b style={{ color: "#E8C040" }}>{adGoster(urun)}</b> için bildirimin var — düzenliyorsun.
          </div>
        )}

        {/* Ürün grupları */}
        <div>
          <Etiket>TAHIL</Etiket>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>{YEM.map(urunButon)}</div>
          <Etiket>KABA YEM</Etiket>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>{KABAYEM.map(urunButon)}</div>
          <Etiket>GÜBRE</Etiket>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>{GUBRE.map(urunButon)}</div>
          <Etiket>HAYVAN</Etiket>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>{HAYVAN.map(urunButon)}</div>
        </div>

        {/* Birim seçici (gübre/kaba yem) */}
        {birimliKategori && (
          <div>
            <Etiket>BİRİM</Etiket>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {BIRIM_SECENEK[kat].map(([k, ad]) => {
                const aktif = birim === k;
                return (
                  <button key={k} type="button" onClick={() => setBirim(k)}
                    style={{ padding: "7px 14px", fontSize: "11.5px", background: aktif ? `${RENKLER.green}1F` : "transparent", color: aktif ? RENKLER.green : RENKLER.muted, border: `1px solid ${aktif ? RENKLER.green : RENKLER.border}`, borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}>
                    {ad}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fiyat (+ balya ağırlığı) */}
        <div>
          <Etiket>{fiyatEtiket}</Etiket>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input type="text" inputMode="decimal" value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="Örn: 250" style={{ ...inputStil, fontSize: "17px", fontWeight: 700, color: urunRenk(urun), paddingRight: "30px" }} />
              <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: RENKLER.muted }}>₺</span>
            </div>
            {birim === "balya" && (
              <div style={{ position: "relative", width: "140px" }}>
                <input type="text" inputMode="decimal" value={balyaKg} onChange={(e) => setBalyaKg(e.target.value)} placeholder="balya kg" style={{ ...inputStil, fontSize: "13px" }} />
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: RENKLER.muted }}>kg</span>
              </div>
            )}
          </div>
          {birimliKategori && Number.isFinite(normalKg) && normalKg > 0 && (
            <div style={{ fontSize: "11px", color: RENKLER.green, marginTop: "7px" }}>
              ≈ {normalKg.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL/kg <span style={{ color: RENKLER.muted }}>· topluluk ortalaması kg üzerinden hesaplanır</span>
            </div>
          )}
        </div>

        {/* İl + İlçe */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <Etiket>İL</Etiket>
            <select value={il} onChange={(e) => { setIl(e.target.value); setIlDokunuldu(true); }} style={{ ...inputStil, fontSize: "12px" }}>
              {ILLER.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <Etiket>İLÇE · opsiyonel</Etiket>
            <input type="text" value={ilce} onChange={(e) => setIlce(e.target.value)} placeholder="Karatay" style={{ ...inputStil, fontSize: "12px" }} />
          </div>
        </div>

        {/* Kaynak */}
        <div>
          <Etiket>KAYNAK</Etiket>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {KAYNAKLAR.map((k) => {
              const aktif = kaynak === k;
              return (
                <button key={k} type="button" onClick={() => setKaynak(k)}
                  style={{ padding: "7px 14px", fontSize: "11.5px", background: aktif ? `${RENKLER.green}1F` : "transparent", color: aktif ? RENKLER.green : RENKLER.muted, border: `1px solid ${aktif ? RENKLER.green : RENKLER.border}`, borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: aktif ? 700 : 400 }}>
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {hata && <div style={{ fontSize: "11px", color: RENKLER.red, background: `${RENKLER.red}14`, border: `1px solid ${RENKLER.red}33`, borderRadius: "8px", padding: "9px 11px" }}>{hata}</div>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={mesgul} style={{ flex: 1, padding: "13px", fontSize: "13px", background: RENKLER.green, color: "#06140C", border: "none", borderRadius: "8px", cursor: mesgul ? "wait" : "pointer", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>
            {mesgul ? "…" : mevcut ? "Bildirimi Güncelle" : "Bildir"}
          </button>
          {mevcut && (
            <button type="button" onClick={sil} disabled={mesgul} style={{ padding: "13px 18px", fontSize: "12px", background: "transparent", color: RENKLER.red, border: `1px solid ${RENKLER.red}55`, borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
              Sil
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
