import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../sabitler.dart';
import '../tercih.dart';
import '../parcalar.dart';

// "Kaç Para Eder?" — elimdeki mal bugünkü borsa fiyatıyla ne eder?
// Tavsiye/tahmin İÇERMEZ: yalnızca miktar × güncel ortalama.
class HesapEkran extends StatefulWidget {
  const HesapEkran({super.key});
  @override
  State<HesapEkran> createState() => _HesapEkranState();
}

class _HesapEkranState extends State<HesapEkran> {
  late Future<List<Fiyat>> _veri;
  final _miktarCtrl = TextEditingController();
  String? _urun;
  bool _tonMu = true; // hububatta ton/kg anahtarı

  @override
  void initState() {
    super.initState();
    _veri = _yukle();
  }

  Future<List<Fiyat>> _yukle() async {
    final r = await Future.wait([yemFiyatlari(), hayvanFiyatlari()]);
    final hepsi = [...r[0], ...r[1]].where((f) => f.fiyat != null && f.fiyat! > 0).toList();
    return Tercih.onceUrunlerim(hepsi, (f) => f.norm);
  }

  Future<void> _yenile() async {
    final f = _yukle();
    setState(() => _veri = f);
    await f;
  }

  @override
  void dispose() {
    _miktarCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Fiyat>>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataListe(_yenile, snap.error);
        final liste = snap.data ?? [];
        if (liste.isEmpty) return hataListe(_yenile);
        final urun = _urun ?? liste.first.norm;
        final f = liste.firstWhere((x) => x.norm == urun, orElse: () => liste.first);
        final hayvanMi = karkasKg.containsKey(f.norm);
        final sutMu = f.norm == 'SUT';
        final renk = urunRenk(f.norm);

        // Birim: hayvan=baş (karkas çevrimi) · süt=litre · hububat=ton/kg
        final String birimAd = hayvanMi ? 'baş' : (sutMu ? 'litre' : (_tonMu ? 'ton' : 'kg'));
        final miktar = double.tryParse(_miktarCtrl.text.replaceAll(',', '.'));
        double? tutar;
        if (miktar != null && miktar > 0) {
          final kgVeyaLitre = hayvanMi
              ? miktar * karkasKg[f.norm]!
              : (sutMu ? miktar : (_tonMu ? miktar * 1000 : miktar));
          tutar = kgVeyaLitre * f.fiyat!;
        }

        final ozet = tutar == null
            ? null
            : '${formatFiyat(miktar, miktar! % 1 == 0 ? 0 : 1)} $birimAd ${f.ad.toLowerCase()} ≈ ${formatFiyat(tutar, 0)} ₺';

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              bolumBaslik('ÜRÜN SEÇ'),
              Wrap(children: liste.map((x) => Cip(x.ad, x.norm == urun, urunRenk(x.norm), () => setState(() => _urun = x.norm))).toList()),
              const SizedBox(height: 14),

              bolumBaslik('MİKTAR'),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _miktarCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(color: C.text, fontSize: 24, fontWeight: FontWeight.w800),
                    decoration: InputDecoration(
                      hintText: '0',
                      hintStyle: TextStyle(color: C.muted.withValues(alpha: 0.5), fontSize: 24),
                      filled: true, fillColor: C.surface,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: C.border)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: C.border)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: C.green, width: 1.6)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                if (!hayvanMi && !sutMu)
                  Column(children: [
                    Cip('ton', _tonMu, C.green, () => setState(() => _tonMu = true)),
                    Cip('kg', !_tonMu, C.green, () => setState(() => _tonMu = false)),
                  ])
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.border)),
                    child: Text(birimAd, style: TextStyle(color: C.text, fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
              ]),
              const SizedBox(height: 18),

              // SONUÇ
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: C.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: tutar != null ? renk.withValues(alpha: 0.5) : C.border, width: 1.4),
                ),
                child: Column(children: [
                  Text(emoji(f.norm), style: const TextStyle(fontSize: 30)),
                  const SizedBox(height: 8),
                  Text(
                    tutar == null ? 'Miktarı gir' : '≈ ${formatFiyat(tutar, 0)} ₺',
                    style: TextStyle(color: tutar == null ? C.muted : renk, fontSize: tutar == null ? 15 : 38, fontWeight: FontWeight.w800, height: 1),
                  ),
                  const SizedBox(height: 10),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Flexible(child: Text('${f.ad} ${formatFiyat(f.fiyat)} ${f.birim} · ${f.kaynak} · ${kisaTarih(f.tarih)}', textAlign: TextAlign.center, style: TextStyle(color: C.muted, fontSize: 10.5))),
                    const SizedBox(width: 6),
                    TazelikRozet(f.tarih),
                  ]),
                  if (hayvanMi)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('baş × karkas ~${karkasKg[f.norm]} kg (tahmin) × fiyat', style: TextStyle(color: C.muted, fontSize: 10)),
                    ),
                  if (tutar != null) ...[
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: () => SharePlus.instance.share(ShareParams(
                        text: '🧮 $ozet\n(${f.kaynak} borsa ortalaması ${formatFiyat(f.fiyat)} ${f.birim}, ${kisaTarih(f.tarih)})\n$siteUrl',
                      )),
                      icon: Icon(Icons.ios_share_rounded, size: 17, color: C.green),
                      label: Text('Paylaş', style: TextStyle(color: C.green, fontSize: 12.5, fontWeight: FontWeight.w700)),
                      style: OutlinedButton.styleFrom(side: BorderSide(color: C.green.withValues(alpha: 0.6))),
                    ),
                  ],
                ]),
              ),
              const SizedBox(height: 12),
              Text(
                'Hesap, borsa günlük ortalamasıyla yapılır; gerçek satış fiyatı borsaya, kaliteye ve pazara göre değişir. Tavsiye değildir.',
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
