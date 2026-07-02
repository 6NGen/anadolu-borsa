// tr-TR biçimlendirme + tazelik birim testleri (web ile aynı kurallar).
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

  test('oranBicim kademeli ondalık (web lib/format ile aynı)', () {
    expect(oranBicim(123.4), '123'); // ≥100 → tam
    expect(oranBicim(15.27), '15,3'); // ≥10 → 1 hane
    expect(oranBicim(5.678), '5,68'); // ≥1 → 2 hane
    expect(oranBicim(0.176), '0,176'); // ≥0,01 → 3 hane
    expect(oranBicim(0.00042), '0,00042'); // >0 → 5 hane (0 görünmez)
    expect(oranBicim(0), '—');
    expect(oranBicim(null), '—');
    expect(oranBicim(-3), '—');
  });

  test('gunFarki bayatlık (bayatEsikGun=3 web ile aynı)', () {
    final simdi = DateTime(2026, 7, 2);
    expect(gunFarki('2026-07-02', simdi), 0); // bugün
    expect(gunFarki('2026-07-01', simdi), 1); // dün
    expect(gunFarki('2026-06-29', simdi), 3); // bayat eşiğinde
    expect(gunFarki(null, simdi), null);
    expect(gunFarki('bozuk', simdi), null);
    expect(bayatEsikGun, 3);
  });
}
