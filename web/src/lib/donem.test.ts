import { describe, expect, it } from "vitest";
import { donemBaslangiclariHesapla } from "./donem";
import { isGunuFarki } from "./tazelik";

describe("donemBaslangiclariHesapla", () => {
  it("en yeni fiyatla kesintisiz aynı serinin ilk gününü verir", () => {
    const rows = [
      { kaynak: "USK", hayvan_norm: "SUT", fiyat: 24.3, cekilme_tarihi: "2026-10-04" },
      { kaynak: "ESK", hayvan_norm: "TOSUN", fiyat: 331, cekilme_tarihi: "2026-10-04" },
      { kaynak: "USK", hayvan_norm: "SUT", fiyat: 24.3, cekilme_tarihi: "2026-06-13" },
      { kaynak: "USK", hayvan_norm: "SUT", fiyat: 19.5, cekilme_tarihi: "2026-06-12" },
      { kaynak: "USK", hayvan_norm: "SUT", fiyat: 24.3, cekilme_tarihi: "2026-01-01" }, // seri koptu: sayılmaz
      { kaynak: "ESK", hayvan_norm: "TOSUN", fiyat: 331, cekilme_tarihi: "2026-06-07" },
    ];
    expect(donemBaslangiclariHesapla(rows)).toEqual({
      "USK|SUT": "2026-06-13",
      "ESK|TOSUN": "2026-06-07",
    });
  });
});

describe("isGunuFarki", () => {
  // 2026-10-02 Cuma
  const cuma = "2026-10-02";
  it("hafta sonunu saymaz", () => {
    expect(isGunuFarki(cuma, new Date(2026, 9, 3))).toBe(0); // Cumartesi
    expect(isGunuFarki(cuma, new Date(2026, 9, 4))).toBe(0); // Pazar
    expect(isGunuFarki(cuma, new Date(2026, 9, 5))).toBe(1); // Pazartesi
    expect(isGunuFarki(cuma, new Date(2026, 9, 8))).toBe(4); // Perşembe
  });
  it("aynı gün ve gelecek 0", () => {
    expect(isGunuFarki(cuma, new Date(2026, 9, 2, 15))).toBe(0);
    expect(isGunuFarki("2026-10-09", new Date(2026, 9, 2))).toBe(0);
  });
});
