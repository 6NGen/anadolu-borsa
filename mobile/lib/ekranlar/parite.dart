import 'package:flutter/material.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

class PariteEkran extends StatefulWidget {
  const PariteEkran({super.key});
  @override
  State<PariteEkran> createState() => _PariteEkranState();
}

class _PariteEkranState extends State<PariteEkran> {
  late Future<_PariteVeri> _veri;

  @override
  void initState() {
    super.initState();
    _veri = _yukle();
  }

  Future<_PariteVeri> _yukle() async {
    final sonuc = await Future.wait([guncelMazot(), yemFiyatlari(), hayvanFiyatlari()]);
    final mazot = sonuc[0] as double?;
    final yem = sonuc[1] as List<Fiyat>;
    final hayvan = sonuc[2] as List<Fiyat>;
    final hepsi = [...hayvan.where((f) => f.norm == 'SUT'), ...yem.where((f) => ['ARPA', 'BUGDAY', 'MISIR'].contains(f.norm))];
    return _PariteVeri(mazot, hepsi);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_PariteVeri>(
      future: _veri,
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: C.green));
        final v = snap.data!;
        if (v.mazot == null) return const Center(child: Text('Mazot verisi yok', style: TextStyle(color: C.muted)));

        return ListView(
          padding: const EdgeInsets.all(14),
          children: [
            bolumBaslik('ÇİFTÇİ SATIN ALMA GÜCÜ'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: C.border)),
              child: Row(children: [
                const Text('⛽', style: TextStyle(fontSize: 22)),
                const SizedBox(width: 8),
                Expanded(child: Text('1 litre motorin = ${formatFiyat(v.mazot)} ₺', style: const TextStyle(color: C.text, fontSize: 13))),
              ]),
            ),
            const SizedBox(height: 14),
            ...v.urunler.map((f) {
              final birimKisa = f.birim.replaceAll('TL/', '');
              final parite = f.fiyat != null && f.fiyat! > 0 ? v.mazot! / f.fiyat! : null;
              final renk = urunRenk(f.norm);
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: C.border)),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('1 litre motorin =', style: const TextStyle(color: C.muted, fontSize: 11)),
                    Text('${f.ad.toLowerCase()} · ${formatFiyat(f.fiyat)} ${f.birim}', style: const TextStyle(color: C.muted, fontSize: 10)),
                  ])),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(formatFiyat(parite), style: TextStyle(color: renk, fontSize: 26, fontWeight: FontWeight.bold)),
                    Text(birimKisa, style: const TextStyle(color: C.muted, fontSize: 10)),
                  ]),
                ]),
              );
            }),
            const SizedBox(height: 8),
            const Text('Parite = mazot fiyatı ÷ ürün fiyatı · kaynak her kartta', style: TextStyle(color: C.muted, fontSize: 10)),
          ],
        );
      },
    );
  }
}

class _PariteVeri {
  final double? mazot;
  final List<Fiyat> urunler;
  _PariteVeri(this.mazot, this.urunler);
}
