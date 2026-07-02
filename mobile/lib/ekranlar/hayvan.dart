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

  void _sec(String norm, {String? kaynak}) {
    setState(() {
      _secili = norm;
      // Grafik, başlıktaki kaynakla AYNI kaynaktan çizilir (ESK/USK karışmasın)
      _seri = hayvanSeri(norm, kaynak: kaynak);
    });
  }

  Future<void> _yenile() async {
    final f = hayvanFiyatlari();
    setState(() => _liste = f);
    final liste = await f;
    if (!mounted || liste.isEmpty) return;
    // Seçim korunur; grafik taze veriyle yeniden çekilir
    final sec = liste.firstWhere((x) => x.norm == _secili, orElse: () => liste.first);
    _sec(sec.norm, kaynak: sec.kaynak);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Fiyat>>(
      future: _liste,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataListe(_yenile, snap.error);
        final liste = snap.data ?? [];
        if (liste.isEmpty) return hataListe(_yenile);
        final secili = _secili ?? liste.first.norm;
        final f = liste.firstWhere((x) => x.norm == secili, orElse: () => liste.first);
        if (_secili == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _sec(secili, kaynak: f.kaynak));
        }
        final renk = urunRenk(secili);

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              Wrap(children: liste.map((x) => Cip(x.norm, x.norm == secili, urunRenk(x.norm), () => _sec(x.norm, kaynak: x.kaynak))).toList()),
              const SizedBox(height: 12),
              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontSize: 40, fontWeight: FontWeight.bold, height: 1)),
                const SizedBox(width: 8),
                Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(f.birim, style: TextStyle(color: C.muted, fontSize: 13))),
              ]),
              const SizedBox(height: 4),
              Row(children: [
                Flexible(child: Text('${f.ad} · ${f.kaynak} · ${kisaTarih(f.tarih)}', overflow: TextOverflow.ellipsis, style: TextStyle(color: C.muted, fontSize: 11))),
                const SizedBox(width: 8),
                TazelikRozet(f.tarih),
              ]),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  bolumBaslik('SON 30 GÜN · ${f.kaynak}'),
                  FutureBuilder<List<GrafikNoktasi>>(
                    future: _seri,
                    builder: (context, s) {
                      if (s.hasError) {
                        return SizedBox(height: 100, child: Center(child: Text('Grafik için bağlantı gerekli', style: TextStyle(color: C.muted, fontSize: 11))));
                      }
                      if (!s.hasData) return SizedBox(height: 180, child: yukleniyor());
                      return MiniGrafik(s.data!, renk);
                    },
                  ),
                ]),
              ),
              const SizedBox(height: 70),
            ],
          ),
        );
      },
    );
  }
}
