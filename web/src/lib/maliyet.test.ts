import { describe, it, expect } from "vitest";
import { maliyetHesapla, VERIM_TUIK } from "./maliyet";

describe("maliyetHesapla", () => {
  it("gelir = verim × fiyat × dekar; net = gelir − maliyet", () => {
    const s = maliyetHesapla({
      dekar: 10,
      verimKgDekar: 290,
      borsaFiyatTlKg: 12,
      mazotTlLitre: 67,
      mazotLitreDekar: 12,      // mazot/dekar = 804
      tohumTlDekar: 700,
      gubreTlDekar: 900,
      iscilikTlDekar: 0,
      digerTlDekar: 0,
    });
    expect(s.mazotTlDekar).toBe(804);
    expect(s.maliyetDekar).toBe(2404);          // 804 + 700 + 900
    expect(s.gelirDekar).toBe(3480);            // 290 × 12
    expect(s.netDekar).toBe(1076);              // 3480 − 2404
    expect(s.maliyetToplam).toBe(24040);        // × 10
    expect(s.gelirToplam).toBe(34800);
    expect(s.netToplam).toBe(10760);
  });

  it("negatif net (fiyat düşükse) doğru hesaplanır", () => {
    const s = maliyetHesapla({
      dekar: 1, verimKgDekar: 100, borsaFiyatTlKg: 5,
      mazotTlLitre: 67, mazotLitreDekar: 12,
      tohumTlDekar: 700, gubreTlDekar: 900, iscilikTlDekar: 0, digerTlDekar: 0,
    });
    expect(s.gelirDekar).toBe(500);
    expect(s.netDekar).toBeLessThan(0);
  });

  it("dekar=0 → toplamlar 0, dekar başı değerler korunur", () => {
    const s = maliyetHesapla({
      dekar: 0, verimKgDekar: 290, borsaFiyatTlKg: 12,
      mazotTlLitre: 67, mazotLitreDekar: 12,
      tohumTlDekar: 700, gubreTlDekar: 900, iscilikTlDekar: 0, digerTlDekar: 0,
    });
    expect(s.maliyetToplam).toBe(0);
    expect(s.gelirToplam).toBe(0);
    expect(s.gelirDekar).toBe(3480);
  });

  it("TÜİK verim varsayılanları tanımlı", () => {
    expect(VERIM_TUIK.BUGDAY).toBeGreaterThan(0);
    expect(VERIM_TUIK.MISIR).toBeGreaterThan(VERIM_TUIK.BUGDAY);
  });
});
