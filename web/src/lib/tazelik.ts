// Veri tazeliği için TEK kaynak eşik (KARAR 2026-06-12):
// - VeriTazelik rozeti: gun >= BAYAT_ESIK_GUN → ⚠ (kırmızı)
// - OG/PNG kartlar:     gun <= BAYAT_ESIK_GUN → üretilir (tarih etiketli),
//                       gun >  BAYAT_ESIK_GUN → üretilmez (endpoint 409, buton pasif)
export const BAYAT_ESIK_GUN = 3;

// Veri tarihinden bugüne geçen tam gün; tarih yoksa/bozuksa null.
// Negatif çıkabilir (TR günü UTC sunucudan ileride) — bayat SAYILMAZ.
export function gunFarki(tarih: string | null | undefined): number | null {
  if (!tarih) return null;
  const gun = Math.floor((Date.now() - new Date(tarih.slice(0, 10) + "T00:00:00").getTime()) / 86400000);
  return Number.isFinite(gun) ? gun : null;
}

export function kartUretilebilir(tarih: string | null | undefined): boolean {
  const g = gunFarki(tarih);
  return g != null && g <= BAYAT_ESIK_GUN;
}
