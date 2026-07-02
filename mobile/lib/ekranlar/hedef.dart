import 'package:flutter/material.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

// Karkas kg (web lib/karkas ile aynı) — baş hesabı için
const _karkas = {'TOSUN': 250, 'INEK': 250, 'KUZU': 17, 'TOKLU': 22, 'KOYUN': 25};
// Varlık referansları (web lib/varliklar ile aynı, tahmin)
const _varliklar = {
  'Traktör': 2500000.0, 'Daire (m²)': 38000.0, 'Arsa (m²)': 4500.0, 'Tarla (m²)': 1180.0,
};

class HedefEkran extends StatefulWidget {
  const HedefEkran({super.key});
  @override
  State<HedefEkran> createState() => _HedefEkranState();
}

class _HedefEkranState extends State<HedefEkran> {
  late Future<List<Fiyat>> _veri;
  String? _urun;
  String _varlik = 'Traktör';

  @override
  void initState() {
    super.initState();
    _veri = _yukle();
  }

  Future<List<Fiyat>> _yukle() async {
    final r = await Future.wait([yemFiyatlari(), hayvanFiyatlari()]);
    final yem = r[0];
    final hayvan = r[1].where((f) => _karkas.containsKey(f.norm));
    return [...yem, ...hayvan];
  }

  Future<void> _yenile() async {
    final f = _yukle();
    setState(() => _veri = f);
    await f;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Fiyat>>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataListe(_yenile, snap.error);
        final liste = (snap.data ?? []).where((f) => f.fiyat != null && f.fiyat! > 0).toList();
        if (liste.isEmpty) return hataListe(_yenile);
        final urun = _urun ?? liste.first.norm;
        final f = liste.firstWhere((x) => x.norm == urun, orElse: () => liste.first);
        final hayvanMi = _karkas.containsKey(f.norm);
        final olcek = hayvanMi ? _karkas[f.norm]!.toDouble() : 1000.0; // baş→karkas kg, ton→1000 kg
        final birimAd = hayvanMi ? 'baş' : 'ton';
        final varlikFiyat = _varliklar[_varlik]!;
        final kacBirim = varlikFiyat / (f.fiyat! * olcek);

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(14),
          children: [
            bolumBaslik('ÜRÜN'),
            Wrap(children: liste.map((x) => Cip(x.ad, x.norm == urun, urunRenk(x.norm), () => setState(() => _urun = x.norm))).toList()),
            const SizedBox(height: 12),
            bolumBaslik('HEDEF VARLIK'),
            Wrap(children: _varliklar.keys.map((k) => Cip(k, k == _varlik, C.green, () => setState(() => _varlik = k))).toList()),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.green.withValues(alpha: 0.4))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
                Text('1 $_varlik =', style: TextStyle(color: C.muted, fontSize: 13)),
                const SizedBox(height: 8),
                Text(formatFiyat(kacBirim, hayvanMi ? 0 : 1), style: TextStyle(color: C.orange, fontSize: 52, fontWeight: FontWeight.bold, height: 1)),
                Text('$birimAd ${f.ad.toLowerCase()}', style: TextStyle(color: C.text, fontSize: 16)),
              ]),
            ),
            const SizedBox(height: 12),
            Text(
              '${f.ad} ${formatFiyat(f.fiyat)} ${f.birim} (canlı)${hayvanMi ? ' · karkas ~${_karkas[f.norm]} kg (tahmin)' : ''}\n$_varlik ${formatFiyat(varlikFiyat, 0)} ₺ (referans/tahmin)',
              style: TextStyle(color: C.muted, fontSize: 10, height: 1.5),
            ),
            const SizedBox(height: 70),
          ],
        ));
      },
    );
  }
}
