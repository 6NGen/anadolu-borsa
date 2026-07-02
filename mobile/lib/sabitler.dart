// Uygulama geneli sabitler — web lib/karkas ve lib/varliklar ile aynı değerler.

// Karkas ağırlıkları (baş → kg çevrimi, tahmin)
const karkasKg = {'TOSUN': 250, 'INEK': 250, 'KUZU': 17, 'TOKLU': 22, 'KOYUN': 25};

// Hedef panel varlık referansları (tahmin)
const varlikFiyatlari = {
  'Traktör': 2500000.0, 'Daire (m²)': 38000.0, 'Arsa (m²)': 4500.0, 'Tarla (m²)': 1180.0,
};

// Ürün seçici kataloğu (norm → görünen ad) — DB normlarıyla eşleşir.
// Veride olmayan norm zararsızdır (kart çıkmaz), veri gelince görünür.
const tumUrunler = <String, String>{
  // yem / hububat
  'BUGDAY': 'Buğday', 'ARPA': 'Arpa', 'MISIR': 'Mısır', 'CAVDAR': 'Çavdar',
  'YULAF': 'Yulaf', 'SAMAN': 'Saman', 'YONCA': 'Yonca',
  // hayvancılık
  'SUT': 'Çiğ Süt', 'KUZU': 'Kuzu', 'TOKLU': 'Toklu', 'KOYUN': 'Koyun',
  'OGLAK': 'Oğlak', 'TOSUN': 'Tosun', 'DANA': 'Dana', 'INEK': 'İnek', 'MANDA': 'Manda',
};

const hayvanNormlari = {'TOSUN', 'DANA', 'INEK', 'MANDA', 'KUZU', 'TOKLU', 'KOYUN', 'OGLAK', 'SUT'};
