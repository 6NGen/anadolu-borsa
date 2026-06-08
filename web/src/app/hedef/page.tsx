import { supabaseServer } from "@/lib/supabase";
import { RENKLER, emoji, YEM_RENK, HAYVAN_RENK, KARKAS_KG } from "@/lib/theme";

export const revalidate = 3600;

interface YemRow { urun_norm: string; urun_ad: string | null; ortalama: number | null; }
interface HayvanRow { hayvan_norm: string; hayvan: string; fiyat: number | null; birim: string; }
interface VarlikRow { varlik_fiyat: number; referans_model: string | null; gecerlilik_yili: number; }

export default async function HedefPage() {
  // Not: hedef_varlik_fiyat tablosu anon RLS ile bloklu; traktör fiyatını
  // RLS'i bypass eden uretici_hedef_parite view'ından okuyoruz.
  const [{ data: yem }, { data: hayvan }, { data: varlik }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("urun_norm, urun_ad, ortalama").order("urun_norm"),
    supabaseServer.from("son_hayvan_fiyatlari").select("hayvan_norm, hayvan, fiyat, birim").order("hayvan_norm"),
    supabaseServer.from("uretici_hedef_parite").select("varlik_fiyat, referans_model, gecerlilik_yili").eq("varlik_turu", "traktor").limit(1),
  ]);

  const traktor = (varlik as VarlikRow[] | null)?.[0] ?? null;
  const traktorFiyat = traktor?.varlik_fiyat ?? null;

  const yemler = (yem ?? []) as YemRow[];

  // Hayvan: hayvan_norm başına tek satır (ilk kaynak), karkas ağırlığı olanlar (süt hariç)
  const hayvanSet = new Map<string, HayvanRow>();
  for (const h of (hayvan ?? []) as HayvanRow[]) {
    if (KARKAS_KG[h.hayvan_norm] && h.fiyat && !hayvanSet.has(h.hayvan_norm)) hayvanSet.set(h.hayvan_norm, h);
  }
  const hayvanlar = Array.from(hayvanSet.values());

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>HEDEF PANEL</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>
          Üretici satın alma gücü — kaç ton ürün / kaç baş hayvan = 1 traktör?
        </p>
      </div>

      {traktorFiyat == null ? (
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Varlık (traktör) fiyatı bulunamadı.
        </div>
      ) : (
        <>
          {/* Traktör referansı */}
          <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderLeft: "3px solid #E8A838", borderRadius: "6px", padding: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "32px" }}>🚜</span>
            <div>
              <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em" }}>REFERANS VARLIK · {traktor?.gecerlilik_yili}</div>
              <div style={{ fontSize: "24px", color: "#E8A838", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{Number(traktorFiyat).toLocaleString("tr-TR")} TL</div>
              <div style={{ fontSize: "10px", color: RENKLER.muted }}>{traktor?.referans_model}</div>
            </div>
          </div>

          {/* TAHIL → TON */}
          {yemler.length > 0 && (
            <section style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>TAHIL EŞDEĞERİ — kaç TON = 1 traktör</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                {yemler.map((y) => {
                  const renk = YEM_RENK[y.urun_norm] ?? RENKLER.green;
                  const ton = y.ortalama ? traktorFiyat / (y.ortalama * 1000) : null;
                  return (
                    <div key={y.urun_norm} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px" }}>
                      <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600 }}>
                        <span style={{ marginRight: "6px" }}>{emoji(y.urun_norm)}</span>{y.urun_ad ?? y.urun_norm}
                      </div>
                      <div style={{ fontSize: "11px", color: RENKLER.muted, margin: "4px 0 10px" }}>{y.ortalama?.toFixed(2)} TL/kg</div>
                      <div style={{ fontSize: "30px", color: renk, fontWeight: 700, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{ton ? ton.toFixed(1) : "—"}</div>
                      <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "4px" }}>ton ürün = 1 traktör</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* HAYVAN → BAŞ */}
          {hayvanlar.length > 0 && (
            <section style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>HAYVAN EŞDEĞERİ — kaç BAŞ = 1 traktör</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                {hayvanlar.map((h) => {
                  const renk = HAYVAN_RENK[h.hayvan_norm] ?? RENKLER.red;
                  const karkas = KARKAS_KG[h.hayvan_norm];
                  const basFiyat = (h.fiyat ?? 0) * karkas;
                  const bas = basFiyat ? traktorFiyat / basFiyat : null;
                  return (
                    <div key={h.hayvan_norm} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px" }}>
                      <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600 }}>
                        <span style={{ marginRight: "6px" }}>{emoji(h.hayvan_norm)}</span>{h.hayvan_norm}
                      </div>
                      <div style={{ fontSize: "11px", color: RENKLER.muted, margin: "4px 0 10px" }}>{h.fiyat?.toFixed(2)} TL/kg × ~{karkas}kg karkas</div>
                      <div style={{ fontSize: "30px", color: renk, fontWeight: 700, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{bas ? Math.round(bas) : "—"}</div>
                      <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "4px" }}>baş hayvan = 1 traktör</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "8px" }}>
                * Baş hesabı ortalama karkas ağırlığı varsayımıyla yapılır (TOSUN ~280kg, KUZU ~22kg vb.).
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
