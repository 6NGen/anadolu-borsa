// Türkiye ortalama ekim/hasat dönemleri. Kaynak: il tarım müdürlükleri /
// TÜİK yayınları (ortalama). Bölge ve yıla göre değişir — "ortalamadır" etiketli.
// TAVSİYE İÇERMEZ — yalnızca takvim bilgisi.
export interface TakvimSatir {
  ekim: string;
  hasat: string;
}

export const HASAT_TAKVIMI: Record<string, TakvimSatir> = {
  BUGDAY: { ekim: "Ekim–Kasım", hasat: "Haziran–Temmuz" },
  ARPA: { ekim: "Ekim–Kasım", hasat: "Haziran" },
  MISIR: { ekim: "Nisan–Mayıs", hasat: "Eylül–Ekim" },
  YULAF: { ekim: "Ekim–Kasım / Mart", hasat: "Haziran–Temmuz" },
  CAVDAR: { ekim: "Ekim–Kasım", hasat: "Temmuz" },
};

export const HASAT_URUNLER = ["BUGDAY", "ARPA", "MISIR", "YULAF", "CAVDAR"];

// Hasat sezonu (ana sayfa giriş kartı bu aylarda gösterilir): Mayıs–Ağustos
export function hasatSezonuMu(d = new Date()): boolean {
  const ay = d.getMonth() + 1;
  return ay >= 5 && ay <= 8;
}
