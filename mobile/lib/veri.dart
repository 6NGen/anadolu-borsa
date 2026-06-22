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
  Fiyat({required this.norm, required this.ad, required this.kaynak, required this.tarih, required this.birim, this.fiyat});
}

class GrafikNoktasi {
  final String tarih;
  final double deger;
  GrafikNoktasi(this.tarih, this.deger);
}

// --- Güncel fiyatlar ---
Future<List<Fiyat>> yemFiyatlari() async {
  final rows = await sb.from('son_fiyatlar').select('urun_norm, urun_ad, ortalama, borsa, cekilme_tarihi, birim');
  return [
    for (final r in rows)
      Fiyat(
        norm: r['urun_norm'], ad: r['urun_ad'] ?? r['urun_norm'],
        fiyat: (r['ortalama'] as num?)?.toDouble(),
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
Future<List<GrafikNoktasi>> yemSeri(String norm) async {
  final rows = await sb.from('son_30_gun').select('borsa, cekilme_tarihi, ortalama')
      .eq('urun_norm', norm).order('cekilme_tarihi');
  if (rows.isEmpty) return [];
  // Tek borsa: en güncel kaydın borsası (karışma olmasın)
  final borsa = rows.last['borsa'];
  return [
    for (final r in rows)
      if (r['borsa'] == borsa && r['ortalama'] != null)
        GrafikNoktasi(r['cekilme_tarihi'], (r['ortalama'] as num).toDouble()),
  ];
}

Future<List<GrafikNoktasi>> hayvanSeri(String norm) async {
  final rows = await sb.from('son_30_gun_hayvan').select('kaynak, cekilme_tarihi, fiyat')
      .eq('hayvan_norm', norm).order('cekilme_tarihi');
  if (rows.isEmpty) return [];
  final kaynak = rows.last['kaynak'];
  return [
    for (final r in rows)
      if (r['kaynak'] == kaynak && r['fiyat'] != null)
        GrafikNoktasi(r['cekilme_tarihi'], (r['fiyat'] as num).toDouble()),
  ];
}

// --- Mazot (parite için) ---
Future<double?> guncelMazot() async {
  final rows = await sb.from('girdi_fiyat').select('fiyat, gecerlilik_tarihi')
      .eq('girdi_turu', 'mazot').order('gecerlilik_tarihi', ascending: false).limit(1);
  if (rows.isEmpty) return null;
  return (rows.first['fiyat'] as num?)?.toDouble();
}
