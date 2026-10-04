// Veri tazeliği için TEK kaynak eşik (KARAR 2026-06-12):
// - VeriTazelik rozeti: iş günü farkı >= BAYAT_ESIK_GUN → ⚠ (kırmızı)
// - OG/PNG kartlar:     iş günü farkı <= BAYAT_ESIK_GUN → üretilir (tarih etiketli),
//                       üstü → üretilmez (endpoint 409, buton pasif)
// 2026-10-04: borsa satırları artık GERÇEK işlem günüyle yazılıyor (scraper
// tobb_birlestir). Hafta sonu borsa kapalı: cuma işlemi pazartesi "3 gün önce"
// kırmızı görünmesin diye eşik İŞ GÜNÜ sayar (cumartesi/pazar sayılmaz).
export const BAYAT_ESIK_GUN = 3;

function gunBasi(tarih: string): Date {
  return new Date(tarih.slice(0, 10) + "T00:00:00");
}

// Veri tarihinden bugüne geçen tam takvim günü; tarih yoksa/bozuksa null.
// Negatif çıkabilir (TR günü UTC sunucudan ileride) — bayat SAYILMAZ.
export function gunFarki(tarih: string | null | undefined): number | null {
  if (!tarih) return null;
  const gun = Math.floor((Date.now() - gunBasi(tarih).getTime()) / 86400000);
  return Number.isFinite(gun) ? gun : null;
}

// Veri tarihinden sonra bugüne kadar geçen İŞ GÜNÜ (Pzt-Cuma) sayısı.
// Cuma verisi: cumartesi 0, pazar 0, pazartesi 1.
export function isGunuFarki(tarih: string | null | undefined, simdi: Date = new Date()): number | null {
  if (!tarih) return null;
  const bas = gunBasi(tarih);
  if (!Number.isFinite(bas.getTime())) return null;
  const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
  if (bugun <= bas) return 0;
  let n = 0;
  const g = new Date(bas);
  while (g < bugun) {
    g.setDate(g.getDate() + 1);
    const hg = g.getDay();
    if (hg !== 0 && hg !== 6) n++;
  }
  return n;
}

export function kartUretilebilir(tarih: string | null | undefined): boolean {
  const g = isGunuFarki(tarih);
  return g != null && g <= BAYAT_ESIK_GUN;
}
