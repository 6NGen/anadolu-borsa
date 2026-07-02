import 'package:intl/intl.dart';

// tr-TR sayı biçimi (binlik nokta, ondalık virgül) — web lib/format ile aynı ilke.
String formatFiyat(num? n, [int ondalik = 2]) {
  if (n == null) return '—';
  final f = NumberFormat.decimalPatternDigits(locale: 'tr_TR', decimalDigits: ondalik);
  return f.format(n);
}

// Parite/oran için kademeli ondalık — küçük sonuç 0 göstermesin.
// web lib/format.oranBicim ile aynı: ≥100→0 · ≥10→1 · ≥1→2 · ≥0,01→3 · >0→5 hane
String oranBicim(num? n) {
  if (n == null || !n.isFinite || n <= 0) return '—';
  final d = n >= 100
      ? 0
      : n >= 10
          ? 1
          : n >= 1
              ? 2
              : n >= 0.01
                  ? 3
                  : 5;
  return formatFiyat(n, d);
}

// "2026-06-19" → "19.06"
String kisaTarih(String? iso) {
  if (iso == null || iso.length < 10) return '—';
  return '${iso.substring(8, 10)}.${iso.substring(5, 7)}';
}

// Veri tazeliği — web lib/tazelik.BAYAT_ESIK_GUN ile aynı tek eşik.
const bayatEsikGun = 3;

// ISO tarihle bugün arasındaki gün farkı (0=bugün). null → bilinmiyor.
// [simdi] test için enjekte edilebilir.
int? gunFarki(String? iso, [DateTime? simdi]) {
  if (iso == null || iso.length < 10) return null;
  final t = DateTime.tryParse(iso.substring(0, 10));
  if (t == null) return null;
  final s = simdi ?? DateTime.now();
  return DateTime(s.year, s.month, s.day).difference(DateTime(t.year, t.month, t.day)).inDays;
}
