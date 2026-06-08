import { supabaseServer } from "@/lib/supabase";
import { RENKLER, emoji, HAYVAN_RENK } from "@/lib/theme";
import PariteGrafik, { PariteNokta } from "@/components/PariteGrafik";

export const revalidate = 3600;

interface PariteRow {
  tarih: string;
  girdi_turu: string;
  girdi_fiyat: number;
  urun_norm: string;
  urun_fiyat: number;
  parite: number;
  ters_parite: number;
}

function HeroKart({ urun, birim, guncel, renk }: { urun: string; birim: string; guncel: PariteRow; renk: string }) {
  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderLeft: `3px solid ${renk}`, borderRadius: "6px", padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px" }}>⛽</span>
        <span style={{ fontSize: "16px", color: RENKLER.muted }}>/</span>
        <span style={{ fontSize: "22px" }}>{emoji(urun)}</span>
        <span style={{ fontSize: "11px", color: RENKLER.muted, letterSpacing: "0.1em", marginLeft: "4px" }}>MAZOT / {urun}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ fontSize: "42px", color: renk, fontWeight: 700, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{Number(guncel.parite).toFixed(3)}</span>
        <span style={{ fontSize: "12px", color: RENKLER.muted }}>{birim}</span>
      </div>
      <div style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${RENKLER.border}` }}>
        1 birim {urun.toLowerCase()} = <span style={{ color: RENKLER.text }}>{Number(guncel.ters_parite).toFixed(3)}</span> litre mazot
      </div>
    </div>
  );
}

function PariteTablo({ baslik, urunEtiket, rows }: { baslik: string; urunEtiket: string; rows: PariteRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>{baslik}</div>
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${RENKLER.border}` }}>
              {["Tarih", "Mazot (TL/lt)", urunEtiket, "Parite", "Ters Parite"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", color: RENKLER.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${RENKLER.border}` }}>
                <td style={{ padding: "9px 14px", color: RENKLER.muted }}>{row.tarih?.slice(0, 10)}</td>
                <td style={{ padding: "9px 14px", color: "#F0A050" }}>{Number(row.girdi_fiyat).toFixed(2)}</td>
                <td style={{ padding: "9px 14px", color: RENKLER.text }}>{Number(row.urun_fiyat).toFixed(2)}</td>
                <td style={{ padding: "9px 14px", color: RENKLER.green, fontWeight: 700 }}>{Number(row.parite).toFixed(3)}</td>
                <td style={{ padding: "9px 14px", color: RENKLER.muted }}>{Number(row.ters_parite).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ParitePage() {
  const { data: parite } = await supabaseServer
    .from("parite_guncel")
    .select("*")
    .order("tarih", { ascending: false })
    .limit(60);

  const tum = (parite ?? []) as PariteRow[];

  const sutGuncel = tum.find((p) => p.urun_norm === "SUT");
  const kuzuGuncel = tum.find((p) => p.urun_norm === "KUZU");
  const guncelMazot = sutGuncel?.girdi_fiyat ?? kuzuGuncel?.girdi_fiyat ?? null;
  const guncelTarih = (sutGuncel ?? kuzuGuncel)?.tarih?.slice(0, 10) ?? "";

  const sutParite = tum.filter((p) => p.urun_norm === "SUT").slice(0, 12).reverse();
  const kuzuParite = tum.filter((p) => p.urun_norm === "KUZU").slice(0, 12).reverse();

  // Grafik: tarihe göre pivot (Mazot/Süt ve Mazot/Kuzu tek grafik)
  const tarihler = Array.from(new Set(tum.map((p) => p.tarih))).sort();
  const grafikVeri: PariteNokta[] = tarihler.map((t) => ({
    tarih: t,
    sut: tum.find((p) => p.tarih === t && p.urun_norm === "SUT")?.parite ?? null,
    kuzu: tum.find((p) => p.tarih === t && p.urun_norm === "KUZU")?.parite ?? null,
  }));

  // Matris: güncel parite × ters parite
  const matrisSatir = [sutGuncel, kuzuGuncel].filter(Boolean) as PariteRow[];

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>PARİTE ENDEKSİ</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>
          Mazot/Süt ve Mazot/Kuzu satın alma gücü paritesi {guncelTarih && `· ${guncelTarih}`}
        </p>
      </div>

      {/* Hero widget'lar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {guncelMazot != null && (
          <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderLeft: "3px solid #F0A050", borderRadius: "6px", padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "22px" }}>⛽</span>
              <span style={{ fontSize: "11px", color: RENKLER.muted, letterSpacing: "0.1em" }}>MAZOT (EPDK)</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "42px", color: "#F0A050", fontWeight: 700, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{Number(guncelMazot).toFixed(2)}</span>
              <span style={{ fontSize: "12px", color: RENKLER.muted }}>TL/litre</span>
            </div>
            <div style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${RENKLER.border}` }}>
              Pompa fiyatı · {guncelTarih}
            </div>
          </div>
        )}
        {sutGuncel && <HeroKart urun="SÜT" birim="litre süt" guncel={sutGuncel} renk={HAYVAN_RENK.SUT} />}
        {kuzuGuncel && <HeroKart urun="KUZU" birim="kg kuzu" guncel={kuzuGuncel} renk={HAYVAN_RENK.KUZU} />}
      </div>

      {/* Grafik */}
      {grafikVeri.length > 1 && (
        <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>PARİTE TARİHSEL TREND (mazot fiyatına göre)</div>
          <PariteGrafik data={grafikVeri} />
        </div>
      )}

      {/* Matris */}
      {matrisSatir.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>PARİTE MATRİSİ</div>
          <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${RENKLER.border}` }}>
                  {["Ürün", "Güncel Fiyat", "Mazot Fiyatı", "Parite (mazot→ürün)", "Ters Parite (ürün→mazot)"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", color: RENKLER.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrisSatir.map((r) => (
                  <tr key={r.urun_norm} style={{ borderBottom: `1px solid ${RENKLER.border}` }}>
                    <td style={{ padding: "10px 14px", color: RENKLER.text, fontWeight: 600 }}>
                      <span style={{ marginRight: "6px" }}>{emoji(r.urun_norm)}</span>{r.urun_norm}
                    </td>
                    <td style={{ padding: "10px 14px", color: HAYVAN_RENK[r.urun_norm] ?? RENKLER.text }}>{Number(r.urun_fiyat).toFixed(2)}</td>
                    <td style={{ padding: "10px 14px", color: "#F0A050" }}>{Number(r.girdi_fiyat).toFixed(2)}</td>
                    <td style={{ padding: "10px 14px", color: RENKLER.green, fontWeight: 700 }}>{Number(r.parite).toFixed(3)}</td>
                    <td style={{ padding: "10px 14px", color: RENKLER.muted }}>{Number(r.ters_parite).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tarihsel tablolar */}
      <PariteTablo baslik="MAZOT / SÜT TARİHSEL PARİTE" urunEtiket="Süt (TL/lt)" rows={sutParite} />
      <PariteTablo baslik="MAZOT / KUZU TARİHSEL PARİTE" urunEtiket="Kuzu (TL/kg)" rows={kuzuParite} />

      {tum.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Parite verisi yok. ESK süt verileri çekildikten sonra hesaplanır.
        </div>
      )}
    </main>
  );
}
