import 'package:flutter/material.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

class HayvanEkran extends StatefulWidget {
  const HayvanEkran({super.key});
  @override
  State<HayvanEkran> createState() => _HayvanEkranState();
}

class _HayvanEkranState extends State<HayvanEkran> {
  late Future<List<Fiyat>> _liste;
  String? _secili;
  Future<List<GrafikNoktasi>>? _seri;

  @override
  void initState() {
    super.initState();
    _liste = hayvanFiyatlari();
  }

  void _sec(String norm) {
    setState(() {
      _secili = norm;
      _seri = hayvanSeri(norm);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Fiyat>>(
      future: _liste,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataKutusu(snap.error);
        final liste = snap.data ?? [];
        if (liste.isEmpty) return Center(child: Text('Veri yok', style: TextStyle(color: C.muted)));
        final secili = _secili ?? liste.first.norm;
        if (_secili == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _sec(secili));
        }
        final f = liste.firstWhere((x) => x.norm == secili, orElse: () => liste.first);
        final renk = urunRenk(secili);

        return ListView(
          padding: const EdgeInsets.all(14),
          children: [
            Wrap(children: liste.map((x) => Cip(x.norm, x.norm == secili, urunRenk(x.norm), () => _sec(x.norm))).toList()),
            const SizedBox(height: 12),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontSize: 40, fontWeight: FontWeight.bold, height: 1)),
              const SizedBox(width: 8),
              Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(f.birim, style: TextStyle(color: C.muted, fontSize: 13))),
            ]),
            Text('${f.ad} · ${f.kaynak} · ${kisaTarih(f.tarih)}', style: TextStyle(color: C.muted, fontSize: 11)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: C.border)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                bolumBaslik('SON 30 GÜN · ${f.kaynak}'),
                FutureBuilder<List<GrafikNoktasi>>(
                  future: _seri,
                  builder: (context, s) {
                    if (!s.hasData) return SizedBox(height: 180, child: yukleniyor());
                    return MiniGrafik(s.data!, renk);
                  },
                ),
              ]),
            ),
          ],
        );
      },
    );
  }
}
