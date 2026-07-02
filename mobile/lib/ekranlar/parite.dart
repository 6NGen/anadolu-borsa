import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

// Web parite matrisi ile aynı satırlar ve kurallar:
// varsayılan yön girdi→ürün (1 litre mazot = X kg ürün — temiz/≥1 sayı),
// kademeli ondalık (oranBicim), yorum/tavsiye YOK.
const _urunSirasi = ['BUGDAY', 'ARPA', 'MISIR', 'SUT', 'KUZU'];

class PariteEkran extends StatefulWidget {
  const PariteEkran({super.key});
  @override
  State<PariteEkran> createState() => _PariteEkranState();
}

class _PariteEkranState extends State<PariteEkran> {
  late Future<_PariteVeri> _veri;
  bool _girdidenUrune = true; // true: 1 lt mazot = X ürün · false: 1 birim ürün = X lt mazot

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
    final hepsi = [...yem, ...hayvan].where((f) => _urunSirasi.contains(f.norm)).toList()
      ..sort((a, b) => _urunSirasi.indexOf(a.norm).compareTo(_urunSirasi.indexOf(b.norm)));
    return _PariteVeri(mazot, hepsi);
  }

  Future<void> _yenile() async {
    final f = _yukle();
    setState(() => _veri = f);
    await f;
  }

  void _paylas(_PariteVeri v) {
    // Web matris paylaşım metniyle aynı format
    final satirlar = [
      '📊 Anadolu Borsa — Parite',
      '1 litre motorin (${formatFiyat(v.mazot)} ₺) parasıyla:',
      '',
      for (final f in v.urunler)
        if (f.fiyat != null && f.fiyat! > 0)
          '${emoji(f.norm)} ${oranBicim(v.mazot! / f.fiyat!)} ${f.birim.replaceAll('TL/', '').toLowerCase()} ${f.ad.toLowerCase()}',
      '',
      '$siteUrl/parite',
    ];
    SharePlus.instance.share(ShareParams(text: satirlar.join('\n')));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_PariteVeri>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataListe(_yenile, snap.error);
        final v = snap.data!;
        if (v.mazot == null || v.mazot! <= 0) return hataListe(_yenile);

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              bolumBaslik('ÇİFTÇİ SATIN ALMA GÜCÜ'),

              // Mazot referansı
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                child: Row(children: [
                  const Text('⛽', style: TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  Expanded(child: Text('Motorin ${formatFiyat(v.mazot)} ₺/litre', style: TextStyle(color: C.text, fontSize: 13.5, fontWeight: FontWeight.w700))),
                  IconButton(
                    icon: Icon(Icons.ios_share_rounded, color: C.green, size: 20),
                    tooltip: 'Pariteyi paylaş',
                    onPressed: () => _paylas(v),
                  ),
                ]),
              ),
              const SizedBox(height: 12),

              // Yön seçimi (web toggle ile aynı)
              Row(children: [
                Cip('Girdi → Ürün', _girdidenUrune, C.green, () => setState(() => _girdidenUrune = true)),
                Cip('Ürün → Girdi', !_girdidenUrune, C.green, () => setState(() => _girdidenUrune = false)),
              ]),
              Padding(
                padding: const EdgeInsets.only(bottom: 12, left: 2),
                child: Text(
                  _girdidenUrune
                      ? '1 litre motorin parasıyla kaç birim ürün alınır'
                      : '1 birim ürün kaç litre motorin eder',
                  style: TextStyle(color: C.muted, fontSize: 11),
                ),
              ),

              ...v.urunler.map((f) {
                final birimKisa = f.birim.replaceAll('TL/', '').toLowerCase();
                final gecerli = f.fiyat != null && f.fiyat! > 0;
                final oran = !gecerli ? null : (_girdidenUrune ? v.mazot! / f.fiyat! : f.fiyat! / v.mazot!);
                final sonucBirim = _girdidenUrune ? birimKisa : 'litre';
                final renk = urunRenk(f.norm);
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                  child: Row(children: [
                    Container(
                      width: 40, height: 40, alignment: Alignment.center,
                      decoration: BoxDecoration(color: renk.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(10)),
                      child: Text(emoji(f.norm), style: const TextStyle(fontSize: 18)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(
                        _girdidenUrune ? '1 lt motorin = ${f.ad.toLowerCase()}' : '1 $birimKisa ${f.ad.toLowerCase()} = motorin',
                        style: TextStyle(color: C.text, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 3),
                      Row(children: [
                        Text('${formatFiyat(f.fiyat)} ${f.birim} · ${f.kaynak}', style: TextStyle(color: C.muted, fontSize: 10)),
                        const SizedBox(width: 6),
                        TazelikRozet(f.tarih),
                      ]),
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(oranBicim(oran), style: TextStyle(color: renk, fontSize: 24, fontWeight: FontWeight.bold, height: 1)),
                      const SizedBox(height: 2),
                      Text(sonucBirim, style: TextStyle(color: C.muted, fontSize: 10)),
                    ]),
                  ]),
                );
              }),

              const SizedBox(height: 8),
              Text(
                'Parite yalnızca oranı gösterir; alım-satım tavsiyesi vermez. Kaynak ve tarih her kartta.',
                style: TextStyle(color: C.muted, fontSize: 10, height: 1.5),
              ),
              const SizedBox(height: 70),
            ],
          ),
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
