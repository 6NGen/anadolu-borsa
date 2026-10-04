// Dönemsel resmî fiyat kaynakları: ESK karkas alım fiyatı ve USK çiğ süt tavsiye
// fiyatı dönem dönem ilan edilir; scraper her gece kontrol edip aynı değeri yazar.
// Rozet "bugün" yerine "X'ten beri aynı" desin diye mevcut değerin kayıtlarımızda
// ilk görüldüğü günü buluruz (kaynağın gerçek ilan tarihi daha eski olabilir).
export const DONEMSEL_KAYNAKLAR = ["ESK", "USK"];

export function donemAnahtar(kaynak: string, hayvanNorm: string): string {
  return `${kaynak}|${hayvanNorm}`;
}

// Saf: satırlar tarih AZALAN sırada. Her (kaynak, hayvan_norm) için en yeni
// fiyatla kesintisiz aynı kalan serinin ilk günü.
export function donemBaslangiclariHesapla(
  rows: { kaynak: string; hayvan_norm: string; fiyat: number | null; cekilme_tarihi: string }[]
): Record<string, string> {
  const sonuc: Record<string, string> = {};
  const bitti = new Set<string>();
  const guncel: Record<string, number | null> = {};
  for (const r of rows) {
    const k = donemAnahtar(r.kaynak, r.hayvan_norm);
    if (bitti.has(k)) continue;
    if (!(k in guncel)) {
      guncel[k] = r.fiyat;
      sonuc[k] = r.cekilme_tarihi;
    } else if (Number(r.fiyat) === Number(guncel[k])) {
      sonuc[k] = r.cekilme_tarihi;
    } else {
      bitti.add(k);
    }
  }
  return sonuc;
}

export async function donemBaslangiclari(): Promise<Record<string, string>> {
  // Geç yükleme: saf hesap fonksiyonu testte Supabase istemcisi (env) gerektirmesin
  const { supabaseServer } = await import("./supabase");
  const { data } = await supabaseServer
    .from("hayvan_fiyat_snapshot")
    .select("kaynak, hayvan_norm, fiyat, cekilme_tarihi")
    .in("kaynak", DONEMSEL_KAYNAKLAR)
    .order("cekilme_tarihi", { ascending: false })
    .limit(3000);
  return donemBaslangiclariHesapla(data ?? []);
}
