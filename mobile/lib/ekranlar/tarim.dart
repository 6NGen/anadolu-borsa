import 'package:flutter/material.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

// Web ile aynı kural: 20 tonun altı düşük hacim uyarısı taşır.
const _dusukHacimTon = 20.0;

class TarimEkran extends StatefulWidget {
  const TarimEkran({super.key});
  @override
  State<TarimEkran> createState() => _TarimEkranState();
}

class _TarimEkranState extends State<TarimEkran> {
  late Future<List<Fiyat>> _liste;
  String? _secili;
  Future<List<GrafikNoktasi>>? _seri;
  Future<List<BorsaSatir>>? _borsalar;

  @override
  void initState() {
    super.initState();
    _liste = yemFiyatlari();
  }

  void _sec(String norm, {String? kaynak}) {
    setState(() {
      _secili = norm;
      // Grafik, başlıktaki borsayla AYNI borsadan çizilir (karışma olmasın)
      _seri = yemSeri(norm, kaynak: kaynak);
      _borsalar = borsaSonlari(norm);
    });
  }

  Future<void> _yenile() async {
    final f = yemFiyatlari();
    setState(() => _liste = f);
    final liste = await f;
    if (!mounted || liste.isEmpty) return;
    // Seçim korunur; grafik + borsa kıyası taze veriyle yeniden çekilir
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
        final ton = f.miktar != null ? f.miktar! / 1000 : null;

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              Wrap(children: liste.map((x) => Cip(x.ad, x.norm == secili, urunRenk(x.norm), () => _sec(x.norm, kaynak: x.kaynak))).toList()),
              const SizedBox(height: 12),
              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontSize: 40, fontWeight: FontWeight.bold, height: 1)),
                const SizedBox(width: 8),
                Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(f.birim, style: TextStyle(color: C.muted, fontSize: 13))),
              ]),
              const SizedBox(height: 4),
              Row(children: [
                Text('${f.kaynak} · ${kisaTarih(f.tarih)}', style: TextStyle(color: C.muted, fontSize: 11)),
                const SizedBox(width: 8),
                TazelikRozet(f.tarih),
              ]),
              if (ton != null)
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text(
                    '${formatFiyat(ton, 0)} ton işlem${ton < _dusukHacimTon ? ' · ⚠ düşük hacim' : ''}',
                    style: TextStyle(color: ton < _dusukHacimTon ? C.orange : C.muted, fontSize: 10.5),
                  ),
                ),
              const SizedBox(height: 16),

              // BORSALAR — aynı ürünün borsalar arası son fiyatları (web ile aynı blok)
              FutureBuilder<List<BorsaSatir>>(
                future: _borsalar,
                builder: (context, s) {
                  final satirlar = s.data ?? [];
                  if (satirlar.length < 2) return const SizedBox.shrink();
                  final enAz = satirlar.first.fiyat;
                  final fark = enAz > 0 ? (satirlar.last.fiyat - enAz) / enAz * 100 : 0.0;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: bolumBaslik('BORSALAR · ${f.ad}')),
                        Text('fark: %${formatFiyat(fark, 1)}', style: TextStyle(color: C.orange, fontSize: 11, fontWeight: FontWeight.w700)),
                      ]),
                      ...satirlar.map((b) {
                        final bTon = b.miktar != null ? b.miktar! / 1000 : null;
                        final dusuk = bTon != null && bTon < _dusukHacimTon;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(children: [
                            Expanded(child: Text('${b.borsa} · ${kisaTarih(b.tarih)}', style: TextStyle(color: C.text, fontSize: 12, fontWeight: FontWeight.w600))),
                            if (bTon != null)
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: Text('${formatFiyat(bTon, 0)} ton${dusuk ? ' ⚠' : ''}', style: TextStyle(color: dusuk ? C.orange : C.muted, fontSize: 10.5)),
                              ),
                            Text('${formatFiyat(b.fiyat)} ₺', style: TextStyle(color: renk, fontSize: 14, fontWeight: FontWeight.w800)),
                          ]),
                        );
                      }),
                      const SizedBox(height: 4),
                      Text('⚠ 20 tondan az işlem; borsalar arası fark bundan kaynaklanabilir.', style: TextStyle(color: C.muted, fontSize: 9.5)),
                    ]),
                  );
                },
              ),

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
