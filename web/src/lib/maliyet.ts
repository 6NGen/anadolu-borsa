// Ekim maliyeti — SAF hesap (UI yok). Sanal Tarla (M6) bu fonksiyonları AYNEN kullanır.
// İlke: canlı veriden gelen kalemler (mazot fiyatı, borsa fiyatı) gerçek;
// verim TÜİK ortalaması (tahmin, kullanıcı düzenler); tohum/gübre/işçilik kullanıcı girer.
// Gelecek fiyat TAHMİN EDİLMEZ — gelir "bugünkü fiyatla" hesaplanır.

export interface MaliyetGirdi {
  dekar: number;
  verimKgDekar: number;     // TÜİK ortalama (düzenlenebilir)
  borsaFiyatTlKg: number;   // canlı borsa
  mazotTlLitre: number;     // canlı girdi_fiyat
  mazotLitreDekar: number;  // yaklaşık tüketim (agronomik)
  tohumTlDekar: number;     // kullanıcı (varsayılan tahmin)
  gubreTlDekar: number;     // kullanıcı (varsayılan tahmin)
  iscilikTlDekar: number;   // kullanıcı
  digerTlDekar: number;     // kullanıcı
}

export interface MaliyetSonuc {
  mazotTlDekar: number;
  maliyetDekar: number;
  maliyetToplam: number;
  gelirDekar: number;
  gelirToplam: number;
  netDekar: number;
  netToplam: number;
}

export function maliyetHesapla(g: MaliyetGirdi): MaliyetSonuc {
  const mazotTlDekar = g.mazotTlLitre * g.mazotLitreDekar;
  const maliyetDekar = mazotTlDekar + g.tohumTlDekar + g.gubreTlDekar + g.iscilikTlDekar + g.digerTlDekar;
  const gelirDekar = g.verimKgDekar * g.borsaFiyatTlKg;
  const dekar = g.dekar > 0 ? g.dekar : 0;
  return {
    mazotTlDekar,
    maliyetDekar,
    maliyetToplam: maliyetDekar * dekar,
    gelirDekar,
    gelirToplam: gelirDekar * dekar,
    netDekar: gelirDekar - maliyetDekar,
    netToplam: (gelirDekar - maliyetDekar) * dekar,
  };
}

// TÜİK ulusal ortalama verim (kg/dekar) — yaklaşık, düzenlenebilir varsayılan.
export const VERIM_TUIK: Record<string, number> = {
  BUGDAY: 290, ARPA: 280, MISIR: 1100, YULAF: 250, CAVDAR: 230,
};
// Tam sezon yaklaşık motorin tüketimi (lt/dekar) — toprak işleme+ekim+hasat.
export const MAZOT_LITRE_DEKAR: Record<string, number> = {
  BUGDAY: 12, ARPA: 12, MISIR: 18, YULAF: 11, CAVDAR: 11,
};
// Tohum/gübre için düzenlenebilir varsayılan (TL/dekar, tahmin — kullanıcı kendi değerini girer).
export const TOHUM_VARSAYILAN: Record<string, number> = {
  BUGDAY: 700, ARPA: 650, MISIR: 1400, YULAF: 600, CAVDAR: 600,
};
export const GUBRE_VARSAYILAN: Record<string, number> = {
  BUGDAY: 900, ARPA: 850, MISIR: 1600, YULAF: 750, CAVDAR: 750,
};

export const MALIYET_URUNLER = ["BUGDAY", "ARPA", "MISIR", "YULAF", "CAVDAR"];
