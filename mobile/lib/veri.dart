import 'package:supabase_flutter/supabase_flutter.dart';

// Supabase herkese açık bağlantı bilgileri (web ile aynı; anon key client'a gider).
const supabaseUrl = 'https://semuedzrtqihnsexyemt.supabase.co';
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbXVlZHpydHFpaG5zZXh5ZW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTExOTMsImV4cCI6MjA5NjQyNzE5M30.6_RIr0NqO6ndNSvwKmQTC39Vshu3rqHFkTk9ZEAeNzU';

const siteUrl = 'https://borsanadolu.6ngen.com';

SupabaseClient get sb => Supabase.instance.client;

class Fiyat {
  final String norm, ad, kaynak, tarih, birim;
  final double? fiyat;
  final double? miktar; // işlem miktarı (kg) — yem borsalarında var
  Fiyat({
    required this.norm,
    required this.ad,
    required this.kaynak,
    required this.tarih,
    required this.birim,
    this.fiyat,
    this.miktar,
  });
}

class GrafikNoktasi {
  final String tarih;
  final double deger;
  GrafikNoktasi(this.tarih, this.deger);
}

// --- Güncel fiyatlar ---
Future<List<Fiyat>> yemFiyatlari() async {
  final rows = await sb
      .from('son_fiyatlar')
      .select('urun_norm, urun_ad, ortalama, borsa, cekilme_tarihi, birim, islem_miktari');
  return [
    for (final r in rows)
      Fiyat(
        norm: r['urun_norm'], ad: r['urun_ad'] ?? r['urun_norm'],
        fiyat: (r['ortalama'] as num?)?.toDouble(),
        miktar: (r['islem_miktari'] as num?)?.toDouble(),
        kaynak: r['borsa'] ?? '', tarih: r['cekilme_tarihi'] ?? '', birim: r['birim'] ?? 'TL/KG',
      ),
  ]..sort((a, b) => a.norm.compareTo(b.norm));
}

Future<List<Fiyat>> hayvanFiyatlari() async {
  final rows = await sb.from('son_hayvan_fiyatlari').select('hayvan_norm, hayvan, fiyat, kaynak, cekilme_tarihi, birim');
  // hayvan_norm başına en güncel (kaynak değişimi → çift kayıt olmasın; web tekHayvanKaynak ile aynı)
  final enYeni = <String, Fiyat>{};
  for (final r in rows) {
    final f = Fiyat(
      norm: r['hayvan_norm'], ad: r['hayvan'] ?? r['hayvan_norm'],
      fiyat: (r['fiyat'] as num?)?.toDouble(),
      kaynak: (r['kaynak'] ?? '').toString().replaceAll('_SUT', ''),
      tarih: r['cekilme_tarihi'] ?? '', birim: r['birim'] ?? 'TL/kg',
    );
    final v = enYeni[f.norm];
    if (v == null || f.tarih.compareTo(v.tarih) > 0) enYeni[f.norm] = f;
  }
  return enYeni.values.toList()..sort((a, b) => a.norm.compareTo(b.norm));
}

// --- 30 günlük seri (grafik) ---
// [kaynak] verilirse o borsa/kaynak çizilir (başlıkla seri aynı borsadan olsun);
// verilmez ya da o kaynakta veri yoksa en güncel kaydın kaynağına düşülür.
Future<List<GrafikNoktasi>> yemSeri(String norm, {String? kaynak}) async {
  final rows = await sb.from('son_30_gun').select('borsa, cekilme_tarihi, ortalama')
      .eq('urun_norm', norm).order('cekilme_tarihi');
  return _tekKaynakSeri(rows, 'borsa', 'ortalama', kaynak);
}

Future<List<GrafikNoktasi>> hayvanSeri(String norm, {String? kaynak}) async {
  final rows = await sb.from('son_30_gun_hayvan').select('kaynak, cekilme_tarihi, fiyat')
      .eq('hayvan_norm', norm).order('cekilme_tarihi');
  return _tekKaynakSeri(rows, 'kaynak', 'fiyat', kaynak);
}

List<GrafikNoktasi> _tekKaynakSeri(List<Map<String, dynamic>> rows, String kaynakKolon, String degerKolon, String? istenen) {
  if (rows.isEmpty) return [];
  final varMi = istenen != null && rows.any((r) => r[kaynakKolon] == istenen);
  final secilen = varMi ? istenen : rows.last[kaynakKolon];
  return [
    for (final r in rows)
      if (r[kaynakKolon] == secilen && r[degerKolon] != null)
        GrafikNoktasi(r['cekilme_tarihi'], (r[degerKolon] as num).toDouble()),
  ];
}

// --- Borsa karşılaştırma: seçili ürünün her borsadaki SON fiyatı ---
class BorsaSatir {
  final String borsa, tarih;
  final double fiyat;
  final double? miktar; // kg
  BorsaSatir(this.borsa, this.tarih, this.fiyat, this.miktar);
}

Future<List<BorsaSatir>> borsaSonlari(String norm) async {
  final rows = await sb.from('son_30_gun').select('borsa, cekilme_tarihi, ortalama, islem_miktari')
      .eq('urun_norm', norm).order('cekilme_tarihi');
  final sonlar = <String, BorsaSatir>{}; // sıralı geldiği için sonuncusu en güncel
  for (final r in rows) {
    if (r['ortalama'] == null) continue;
    sonlar[r['borsa']] = BorsaSatir(
      r['borsa'], r['cekilme_tarihi'],
      (r['ortalama'] as num).toDouble(),
      (r['islem_miktari'] as num?)?.toDouble(),
    );
  }
  return sonlar.values.toList()..sort((a, b) => a.fiyat.compareTo(b.fiyat));
}

// --- Sinyal motoru (web fiyat_sinyal view'ı — hesap DB'de, kural web ile aynı) ---
class Sinyal {
  final String norm;
  final double? ort30, bugun;
  final int gunSayisi;
  Sinyal(this.norm, this.ort30, this.bugun, this.gunSayisi);
}

Future<List<Sinyal>> sinyaller() async {
  final rows = await sb.from('fiyat_sinyal')
      .select('urun_norm, ort_30gun, bugun, veri_gun_sayisi').order('urun_norm');
  return [
    for (final r in rows)
      Sinyal(
        r['urun_norm'],
        (r['ort_30gun'] as num?)?.toDouble(),
        (r['bugun'] as num?)?.toDouble(),
        (r['veri_gun_sayisi'] as num?)?.toInt() ?? 0,
      ),
  ];
}

// --- Mazot (parite için) ---
Future<double?> guncelMazot() async {
  final rows = await sb.from('girdi_fiyat').select('fiyat, gecerlilik_tarihi')
      .eq('girdi_turu', 'mazot').order('gecerlilik_tarihi', ascending: false).limit(1);
  if (rows.isEmpty) return null;
  return (rows.first['fiyat'] as num?)?.toDouble();
}
