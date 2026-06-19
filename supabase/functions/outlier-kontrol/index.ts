// Kullanıcı fiyat bildirimi OUTLIER kontrolü (yalnız kullanıcı bildirimi —
// resmi borsa anomalisi VERI_GUVENLIK'te scraper tarafında çözülür).
//
// Tetik: kullanici_fiyat tablosuna INSERT → Supabase Database Webhook → bu fonksiyon.
// Kural: aynı ürün+il, son 7 gün diğer bildirimlerin ortalaması ± 2σ dışındaysa
//        yeni kayıt bayraklandi=true yapılır (piyasa_fiyatlari view'ı bunları gizler).
//
// KURULUM (kullanıcı yapar — Dashboard):
//   1. supabase functions deploy outlier-kontrol --no-verify-jwt
//   2. Database > Webhooks > Create:
//        - Table: kullanici_fiyat,  Events: INSERT
//        - Type: Supabase Edge Function → outlier-kontrol
//   3. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY otomatik enjekte edilir.
//
// Hata durumunda 200 döner — webhook zinciri asla bozulmaz, kayıt silinmez.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESIK_SIGMA = 2;       // ortalamadan kaç standart sapma uzaklık outlier sayılır
const MIN_GECMIS = 3;       // en az bu kadar diğer bildirim yoksa kontrol atlanır

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const rec = payload?.record;
    if (!rec?.id || !rec.urun_norm || rec.il == null || rec.fiyat == null) {
      return yanit({ atlandi: "eksik alan" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const yediGunOnce = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

    // Aynı ürün + il, son 7 gün, yeni kayıt HARİÇ, henüz bayraklanmamış
    const { data, error } = await supabase
      .from("kullanici_fiyat")
      .select("fiyat")
      .eq("urun_norm", rec.urun_norm)
      .eq("il", rec.il)
      .eq("bayraklandi", false)
      .neq("id", rec.id)
      .gte("giris_tarihi", yediGunOnce);
    if (error) return yanit({ hata: error.message });

    const fiyatlar = (data ?? []).map((r) => Number(r.fiyat)).filter(Number.isFinite);
    if (fiyatlar.length < MIN_GECMIS) return yanit({ atlandi: "yetersiz gecmis (soguk baslangic)" });

    const ort = fiyatlar.reduce((a, b) => a + b, 0) / fiyatlar.length;
    const sigma = Math.sqrt(fiyatlar.reduce((a, b) => a + (b - ort) ** 2, 0) / fiyatlar.length);
    const yeni = Number(rec.fiyat);

    if (sigma > 0 && Math.abs(yeni - ort) > ESIK_SIGMA * sigma) {
      await supabase.from("kullanici_fiyat").update({ bayraklandi: true }).eq("id", rec.id);
      return yanit({ bayraklandi: true, ort: +ort.toFixed(2), sigma: +sigma.toFixed(2), gelen: yeni });
    }
    return yanit({ bayraklandi: false, ort: +ort.toFixed(2), sigma: +sigma.toFixed(2) });
  } catch (e) {
    // Webhook'u asla 500'le bozma — kontrol başarısız olsa da kayıt kalır
    return yanit({ hata: String(e) });
  }
});

function yanit(govde: Record<string, unknown>): Response {
  return new Response(JSON.stringify(govde), { status: 200, headers: { "Content-Type": "application/json" } });
}
