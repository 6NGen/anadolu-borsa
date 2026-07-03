import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../tercih.dart';
import '../parcalar.dart';

// Web parite matrisi (mobil kart görünümü) ile birebir aynı kurallar:
// - satır = ürün kartı, içinde her girdi bir TAM CÜMLE:
//   "1 litre motorin = 2,76 litre çiğ süt" (her birim kendi cinsinden)
// - çift yön, varsayılan girdi→ürün; kademeli ondalık; tavsiye YOK.
const _urunSirasi = ['BUGDAY', 'ARPA', 'MISIR', 'SUT', 'KUZU'];

class PariteEkran extends StatefulWidget {
  const PariteEkran({super.key});
  @override
  State<PariteEkran> createState() => _PariteEkranState();
}

class _PariteEkranState extends State<PariteEkran> {
  late Future<_PariteVeri> _veri;
  bool _girdidenUrune = true; // true: 1 birim girdi = X ürün · false: tersi

  @override
  void initState() {
    super.initState();
    _veri = _yukle();
  }

  Future<_PariteVeri> _yukle() async {
    final sonuc = await Future.wait([girdiFiyatlari(), yemFiyatlari(), hayvanFiyatlari()]);
    final girdiler = sonuc[0] as List<Girdi>;
    final yem = sonuc[1] as List<Fiyat>;
    final hayvan = sonuc[2] as List<Fiyat>;
    final urunler = [...yem, ...hayvan].where((f) => _urunSirasi.contains(f.norm)).toList()
      ..sort((a, b) => _urunSirasi.indexOf(a.norm).compareTo(_urunSirasi.indexOf(b.norm)));
    // Kişiselleştirme: kullanıcının ürünleri en üstte
    return _PariteVeri(girdiler, Tercih.onceUrunlerim(urunler, (f) => f.norm));
  }

  Future<void> _yenile() async {
    final f = _yukle();
    setState(() => _veri = f);
    await f;
  }

  // Cümle içinde girdi adı: küçük harf, DAP kısaltma olduğu için aynen kalır
  String _gAd(Girdi g) => g.tur == 'dap' ? 'DAP' : g.ad.toLowerCase();

  void _paylas(_PariteVeri v) {
    final mazot = v.girdiler.where((g) => g.tur == 'mazot').firstOrNull;
    if (mazot == null) return;
    final satirlar = [
      '📊 Anadolu Borsa — Parite',
      '1 ${mazot.birim} motorin (${formatFiyat(mazot.fiyat)} ₺) parasıyla:',
      '',
      for (final f in v.urunler)
        if (f.fiyat != null && f.fiyat! > 0)
          '${emoji(f.norm)} ${oranBicim(mazot.fiyat / f.fiyat!)} ${f.birim.replaceAll('TL/', '').toLowerCase()} ${f.ad.toLowerCase()}',
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
        if (v.girdiler.isEmpty || v.urunler.isEmpty) return hataListe(_yenile);

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              bolumBaslik('ÇİFTÇİ SATIN ALMA GÜCÜ'),

              // Girdi referans şeridi (fiyat + kaynak tarihi)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                child: Row(children: [
                  Expanded(
                    child: Wrap(spacing: 12, runSpacing: 4, children: [
                      for (final g in v.girdiler)
                        Text('${emoji(g.tur)} ${g.ad} ${formatFiyat(g.fiyat)} ₺/${g.birim}',
                            style: TextStyle(color: C.text, fontSize: 11.5, fontWeight: FontWeight.w600)),
                    ]),
                  ),
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
                      ? '1 birim girdi parasıyla kaç birim ürün alınır'
                      : '1 birim ürün kaç birim girdi eder',
                  style: TextStyle(color: C.muted, fontSize: 11),
                ),
              ),

              // ÜRÜN KARTLARI — her satır kendi birimiyle tam cümle
              ...v.urunler.map((f) {
                final uBirim = f.birim.replaceAll('TL/', '').toLowerCase();
                final uAd = f.ad.toLowerCase();
                final gecerli = f.fiyat != null && f.fiyat! > 0;
                final renk = urunRenk(f.norm);
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.border)),
                  child: Column(children: [
                    // Kart başlığı: ürün + fiyat + tazelik
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                      decoration: BoxDecoration(
                        color: C.surface2,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                        border: Border(bottom: BorderSide(color: C.border)),
                      ),
                      child: Row(children: [
                        Text(emoji(f.norm), style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: 7),
                        Text(f.ad, style: TextStyle(color: renk, fontSize: 14.5, fontWeight: FontWeight.w800)),
                        const SizedBox(width: 8),
                        TazelikRozet(f.tarih),
                        const Spacer(),
                        Text('${formatFiyat(f.fiyat)} ${f.birim} · ${f.kaynak}',
                            style: TextStyle(color: C.muted, fontSize: 10)),
                      ]),
                    ),
                    // Girdi satırları: "1 litre motorin = 2,76 litre çiğ süt"
                    ...v.girdiler.map((g) {
                      final oran = !gecerli ? null : (_girdidenUrune ? g.fiyat / f.fiyat! : f.fiyat! / g.fiyat);
                      final sol = _girdidenUrune ? '1 ${g.birim} ${_gAd(g)}' : '1 $uBirim $uAd';
                      final sagBirim = _girdidenUrune ? '$uBirim $uAd' : '${g.birim} ${_gAd(g)}';
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
                        decoration: BoxDecoration(
                          border: g == v.girdiler.last ? null : Border(bottom: BorderSide(color: C.border.withValues(alpha: 0.5))),
                        ),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                          Text(emoji(g.tur), style: const TextStyle(fontSize: 13)),
                          const SizedBox(width: 6),
                          Text(sol, style: TextStyle(color: C.green, fontSize: 13, fontWeight: FontWeight.w600)),
                          const SizedBox(width: 6),
                          Text('=', style: TextStyle(color: C.muted, fontSize: 13)),
                          const Spacer(),
                          Text(oranBicim(oran), style: TextStyle(color: C.text, fontSize: 18, fontWeight: FontWeight.w800)),
                          const SizedBox(width: 5),
                          Text(sagBirim, style: TextStyle(color: renk, fontSize: 12, fontWeight: FontWeight.w600)),
                        ]),
                      );
                    }),
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
  final List<Girdi> girdiler;
  final List<Fiyat> urunler;
  _PariteVeri(this.girdiler, this.urunler);
}
