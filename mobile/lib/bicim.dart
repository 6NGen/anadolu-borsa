import 'package:intl/intl.dart';

// tr-TR sayı biçimi (binlik nokta, ondalık virgül) — web lib/format ile aynı ilke.
String formatFiyat(num? n, [int ondalik = 2]) {
  if (n == null) return '—';
  final f = NumberFormat.decimalPatternDigits(locale: 'tr_TR', decimalDigits: ondalik);
  return f.format(n);
}

// "2026-06-19" → "19.06"
String kisaTarih(String? iso) {
  if (iso == null || iso.length < 10) return '—';
  return '${iso.substring(8, 10)}.${iso.substring(5, 7)}';
}
