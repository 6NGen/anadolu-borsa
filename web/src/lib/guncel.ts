// Çoklu borsa/kaynak satırlarından "en güncel" fiyatı DETERMİNİSTİK seçer.
// son_fiyatlar view'ındaki DISTINCT ON, aynı tarihli farklı borsalar arasında
// belirsizdir; /parite ile /tarim bu yüzden farklı sayı gösterebiliyordu.
// İki sayfa da bu fonksiyonu kullanır → her zaman aynı sayı.
// Kural: en yeni tarih, eşitlikte kaynak/borsa adı alfabetik.

export interface YemSatir {
  urun_norm: string;
  borsa: string;
  cekilme_tarihi: string;
  ortalama: number | null;
}

export interface HayvanSatir {
  hayvan_norm: string;
  kaynak: string;
  cekilme_tarihi: string;
  fiyat: number | null;
}

export interface GuncelFiyat {
  fiyat: number;
  kaynak: string;
  tarih: string;
}

export function enGuncelYem(rows: YemSatir[]): GuncelFiyat | null {
  const gecerli = rows.filter((r) => r.ortalama != null && r.ortalama > 0);
  if (!gecerli.length) return null;
  gecerli.sort((a, b) =>
    b.cekilme_tarihi.localeCompare(a.cekilme_tarihi) || a.borsa.localeCompare(b.borsa)
  );
  const r = gecerli[0];
  return { fiyat: r.ortalama!, kaynak: r.borsa, tarih: r.cekilme_tarihi };
}

export function enGuncelHayvan(rows: HayvanSatir[]): GuncelFiyat | null {
  const gecerli = rows.filter((r) => r.fiyat != null && r.fiyat > 0);
  if (!gecerli.length) return null;
  gecerli.sort((a, b) =>
    b.cekilme_tarihi.localeCompare(a.cekilme_tarihi) || a.kaynak.localeCompare(b.kaynak)
  );
  const r = gecerli[0];
  return { fiyat: r.fiyat!, kaynak: r.kaynak, tarih: r.cekilme_tarihi };
}

// son_hayvan_fiyatlari, her (kaynak, hayvan_norm) için bir satır döndürür
// (view'da DISTINCT ON (kaynak, hayvan_norm)). Bir hayvanın kaynağı değişince
// (ör. süt ESK_SUT → USK) eski kaynak da kalır → aynı hayvan iki kez listelenir
// ve eski tarihli satır BAYAT fiyat gösterir. Burada hayvan_norm başına EN GÜNCEL
// satıra indiriyoruz (tarih desc, eşitlikte kaynak adı alfabetik — deterministik,
// enGuncelHayvan ile aynı kural). Not: aynı hayvanı birden çok CANLI kaynaktan
// (ör. ESK + UKON) kıyaslamak istenirse bu birleştirme gözden geçirilmeli.
export function tekHayvanKaynak<T extends { hayvan_norm: string; cekilme_tarihi: string; kaynak: string }>(
  rows: T[]
): T[] {
  const enIyi = new Map<string, T>();
  for (const r of rows) {
    const v = enIyi.get(r.hayvan_norm);
    if (
      !v ||
      r.cekilme_tarihi.localeCompare(v.cekilme_tarihi) > 0 ||
      (r.cekilme_tarihi === v.cekilme_tarihi && r.kaynak.localeCompare(v.kaynak) < 0)
    ) {
      enIyi.set(r.hayvan_norm, r);
    }
  }
  return [...enIyi.values()];
}

// 30 günlük pencerede kaç FARKLI gün veri var (satır sayısı değil!)
export function distinctGun(rows: { cekilme_tarihi: string }[]): number {
  return new Set(rows.map((r) => r.cekilme_tarihi.slice(0, 10))).size;
}

// Gün başına tek deterministik değer: gerçek tarihsel seri (30g değişim hesabı için)
export function gunlukSeri(
  rows: { cekilme_tarihi: string; deger: number | null; kirilim: string }[]
): { tarih: string; fiyat: number }[] {
  const günler = new Map<string, { fiyat: number; kirilim: string }>();
  for (const r of rows) {
    if (r.deger == null || r.deger <= 0) continue;
    const t = r.cekilme_tarihi.slice(0, 10);
    const mevcut = günler.get(t);
    if (!mevcut || r.kirilim.localeCompare(mevcut.kirilim) < 0) {
      günler.set(t, { fiyat: r.deger, kirilim: r.kirilim });
    }
  }
  return [...günler.entries()]
    .map(([tarih, v]) => ({ tarih, fiyat: v.fiyat }))
    .sort((a, b) => a.tarih.localeCompare(b.tarih));
}
