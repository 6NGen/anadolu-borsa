// tr-TR biçimlendirme birim testleri (web ile aynı kurallar).
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/bicim.dart';

void main() {
  test('formatFiyat tr-TR: binlik nokta, ondalık virgül', () {
    expect(formatFiyat(15.206, 2), '15,21');
    expect(formatFiyat(1234.5, 2), '1.234,50');
    expect(formatFiyat(331, 0), '331');
    expect(formatFiyat(null), '—');
  });

  test('kisaTarih ISO → gün.ay', () {
    expect(kisaTarih('2026-06-19'), '19.06');
    expect(kisaTarih(null), '—');
  });
}
