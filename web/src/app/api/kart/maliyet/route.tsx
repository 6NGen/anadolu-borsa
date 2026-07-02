// 1080×1080 ekim maliyeti kartı (M3). Varsayılan (TÜİK verim + ortalama
// kalemler) + canlı mazot/borsa ile referans hesap — paylaşılabilir.
// GET /api/kart/maliyet?urun=BUGDAY&dekar=1
import { ImageResponse } from "next/og";
import { supabaseServer } from "@/lib/supabase";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir } from "@/lib/tazelik";
import { maliyetHesapla, VERIM_TUIK, MAZOT_LITRE_DEKAR, TOHUM_VARSAYILAN, GUBRE_VARSAYILAN } from "@/lib/maliyet";

export const revalidate = 3600;

const AD: Record<string, string> = { BUGDAY: "BUĞDAY", ARPA: "ARPA", MISIR: "MISIR", YULAF: "YULAF", CAVDAR: "ÇAVDAR" };
const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890", kirmizi: "#E87060" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urun = (searchParams.get("urun") ?? "BUGDAY").toUpperCase();
  const dekar = Math.max(1, Number(searchParams.get("dekar") ?? "1") || 1);
  if (!VERIM_TUIK[urun]) return Response.json({ error: "Ürün desteklenmiyor" }, { status: 404 });

  const [{ data: mazotRows }, { data: bf }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat").eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    supabaseServer.from("son_fiyatlar").select("ortalama, borsa, cekilme_tarihi").eq("urun_norm", urun).maybeSingle(),
  ]);
  if (!bf?.ortalama) return Response.json({ error: "Canlı borsa fiyatı yok" }, { status: 404 });
  if (!kartUretilebilir(bf.cekilme_tarihi)) return Response.json({ error: "Veri bayat" }, { status: 409 });

  // Form'dan paylaşıldığında kullanıcının değerleri; çıplak erişimde varsayılan.
  const sayi = (ad: string, vars: number) => {
    const v = searchParams.get(ad);
    return v != null && Number.isFinite(Number(v)) ? Number(v) : vars;
  };
  const mazot = Number(mazotRows?.[0]?.fiyat ?? 0);
  const verimVal = sayi("verim", VERIM_TUIK[urun]);
  const s = maliyetHesapla({
    dekar, verimKgDekar: verimVal, borsaFiyatTlKg: Number(bf.ortalama),
    mazotTlLitre: mazot, mazotLitreDekar: MAZOT_LITRE_DEKAR[urun] ?? 12,
    tohumTlDekar: sayi("tohum", TOHUM_VARSAYILAN[urun] ?? 0), gubreTlDekar: sayi("gubre", GUBRE_VARSAYILAN[urun] ?? 0),
    iscilikTlDekar: sayi("iscilik", 0), digerTlDekar: sayi("diger", 0),
  });
  const netPoz = s.netDekar >= 0;

  const Kutu = (etiket: string, deger: string, renk: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "26px 18px" }}>
      <div style={{ display: "flex", fontSize: 22, color: C.mut, letterSpacing: 2 }}>{etiket}</div>
      <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: renk, marginTop: 8 }}>{deger}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 5, marginTop: 6 }}>EKİM MALİYETİ</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(bf.cekilme_tarihi)}</div>
        </div>

        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: C.txt, margin: "28px 0 6px" }}>{dekar} DEKAR {AD[urun] ?? urun}</div>
        <div style={{ display: "flex", fontSize: 20, color: C.mut, marginBottom: 28 }}>verim {formatFiyat(verimVal, 0)} kg/dekar · bugünkü fiyatla</div>

        <div style={{ display: "flex", gap: 16 }}>
          {Kutu("MALİYET", `${formatFiyat(s.maliyetToplam, 0)} ₺`, C.kirmizi)}
          {Kutu("BUGÜNKÜ DEĞER", `${formatFiyat(s.gelirToplam, 0)} ₺`, C.yesil)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, color: C.mut }}>NET</div>
          <div style={{ display: "flex", fontSize: 120, fontWeight: 700, color: netPoz ? C.yesil : C.kirmizi, letterSpacing: -4 }}>
            {netPoz ? "+" : ""}{formatFiyat(s.netToplam, 0)} ₺
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 18, color: C.mut }}>
            {AD[urun] ?? urun} {formatFiyat(Number(bf.ortalama))} ₺/kg · {bf.borsa} · maliyet kalemleri tahmindir
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>borsanadolu.6ngen.com/maliyet</div>
        </div>
      </div>
    ),
    {
      width: 1080, height: 1080, fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-maliyet-${urun.toLowerCase()}.png"`,
      },
    }
  );
}
