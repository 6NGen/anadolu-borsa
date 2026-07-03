import 'package:flutter/material.dart';
import '../tema.dart';
import '../veri.dart';
import '../tercih.dart';
import '../widget_yenile.dart';
import '../parcalar.dart';

class _AnaVeri {
  final List<Fiyat> yem, hayvan;
  final List<Sinyal> sinyal;
  _AnaVeri(this.yem, this.hayvan, this.sinyal);
}

class AnaEkran extends StatefulWidget {
  const AnaEkran({super.key});
  @override
  State<AnaEkran> createState() => _AnaEkranState();
}

class _AnaEkranState extends State<AnaEkran> {
  late Future<_AnaVeri> _veri;

  @override
  void initState() {
    super.initState();
    _veri = _getir();
  }

  Future<_AnaVeri> _getir() async {
    // Sinyal ayrı yakalanır: view hata verirse (ör. çevrimdışı) ana liste yine gelsin.
    final yemF = yemFiyatlari();
    final hayvanF = hayvanFiyatlari();
    List<Sinyal> sinyal = [];
    try {
      sinyal = await sinyaller();
    } catch (_) {/* sinyal opsiyonel — çevrimdışıyken gizlenir */}
    final yem = await yemF, hayvan = await hayvanF;
    widgetGuncelle(yem, hayvan); // ana ekran widget'ı (beklenmez)
    seritFiyatlari.value = [
      for (final f in [...yem, ...hayvan])
        if (f.fiyat != null && f.fiyat! > 0) f,
    ]; // kayan şerit (kabukta)
    return _AnaVeri(yem, hayvan, sinyal);
  }

  Future<void> _yenile() async {
    final f = _getir();
    setState(() => _veri = f);
    await f;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_AnaVeri>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataListe(_yenile, snap.error);
        final v = snap.data!;

        // Kişiselleştirme: seçili ürünler en üstte ayrı bölümde
        final benimSet = Tercih.urunlerim.toSet();
        final hepsi = [...v.yem, ...v.hayvan];
        final benim = Tercih.onceUrunlerim(
          hepsi.where((f) => benimSet.contains(f.norm)).toList(), (f) => f.norm);
        final digerYem = v.yem.where((f) => !benimSet.contains(f.norm)).toList();
        final digerHayvan = v.hayvan.where((f) => !benimSet.contains(f.norm)).toList();
        final sinyalSirali = Tercih.onceUrunlerim(v.sinyal, (s) => s.norm);

        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface, onRefresh: _yenile,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(14),
            children: [
              markaBaslik('Türkiye tarım & hayvancılık fiyatları · günlük'),
              if (sinyalSirali.isNotEmpty) SinyalSeridi(sinyalSirali),
              if (benim.isNotEmpty) ...[
                bolumBaslik('⭐ ÜRÜNLERİM'),
                ...benim.map((f) => FiyatKarti(f)),
                const SizedBox(height: 12),
              ],
              if (digerYem.isNotEmpty) ...[
                bolumBaslik(benim.isEmpty ? 'YEM FİYATLARI' : 'DİĞER YEM FİYATLARI'),
                ...digerYem.map((f) => FiyatKarti(f)),
                const SizedBox(height: 12),
              ],
              if (digerHayvan.isNotEmpty) ...[
                bolumBaslik(benim.isEmpty ? 'HAYVAN FİYATLARI' : 'DİĞER HAYVAN FİYATLARI'),
                ...digerHayvan.map((f) => FiyatKarti(f)),
              ],
              const SizedBox(height: 20),
              Center(child: Text('Karta uzun bas → paylaş · Aşağı çekerek yenile', style: TextStyle(color: C.muted, fontSize: 10))),
              const SizedBox(height: 60), // FAB altta kart örtmesin
            ],
          ),
        );
      },
    );
  }
}
