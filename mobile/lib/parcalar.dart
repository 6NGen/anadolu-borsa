import 'dart:async';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:share_plus/share_plus.dart';
import 'tema.dart';
import 'bicim.dart';
import 'veri.dart';

// Ortak durum widget'ları
Widget yukleniyor() => Center(child: CircularProgressIndicator(color: C.green, strokeWidth: 2.5));

Widget hataKutusu([Object? e]) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.wifi_off_rounded, color: C.muted, size: 38),
          const SizedBox(height: 12),
          Text('Veri alınamadı', style: TextStyle(color: C.text, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text('İnternet bağlantını kontrol edip\naşağı çekerek yenile.', textAlign: TextAlign.center, style: TextStyle(color: C.muted, fontSize: 12, height: 1.5)),
        ]),
      ),
    );

// Hata durumunda da aşağı çekerek yenilenebilen liste (tüm ekranlarda ortak)
Widget hataListe(Future<void> Function() onRefresh, [Object? e]) => RefreshIndicator(
      color: C.green,
      backgroundColor: C.surface,
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [SizedBox(height: 260, child: hataKutusu(e))],
      ),
    );

Widget bolumBaslik(String s) => Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 6, left: 2),
      child: Row(children: [
        Container(width: 3, height: 12, decoration: BoxDecoration(color: C.green, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Expanded(child: Text(s, style: TextStyle(color: C.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: FontWeight.w600))),
      ]),
    );

// Marka başlık şeridi
Widget markaBaslik(String altyazi) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: C.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('ANADOLU BORSA', style: TextStyle(color: C.green, fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: 1)),
          const SizedBox(height: 2),
          Text(altyazi, style: TextStyle(color: C.muted, fontSize: 10.5)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(color: C.green.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: C.pos, shape: BoxShape.circle)),
            const SizedBox(width: 5),
            Text('CANLI', style: TextStyle(color: C.green, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          ]),
        ),
      ]),
    );

// Kayan fiyat şeridi (Bloomberg tarzı) — içerik iki kez dizilir; ilk kopyanın
// genişliği kadar kayınca başa sarılır (dikişsiz sonsuz döngü, sabit hız).
class FiyatSeridi extends StatefulWidget {
  final List<Fiyat> liste;
  const FiyatSeridi(this.liste, {super.key});
  @override
  State<FiyatSeridi> createState() => _FiyatSeridiState();
}

class _FiyatSeridiState extends State<FiyatSeridi> {
  final _sc = ScrollController();
  final _kopyaKey = GlobalKey();
  bool _duruyor = false; // kullanıcı dokununca akış durur

  static const _hiz = 0.045; // px/ms (~45 px/sn)

  @override
  void initState() {
    super.initState();
    _dongu();
  }

  Future<void> _dongu() async {
    // İlk yerleşimi bekle
    await Future.delayed(const Duration(milliseconds: 600));
    while (mounted) {
      if (_duruyor || !_sc.hasClients || _sc.position.maxScrollExtent <= 0) {
        await Future.delayed(const Duration(milliseconds: 400));
        continue;
      }
      final kopya = _kopyaKey.currentContext?.size?.width;
      if (kopya == null || kopya <= 0) {
        await Future.delayed(const Duration(milliseconds: 400));
        continue;
      }
      if (_sc.offset >= kopya) {
        _sc.jumpTo(_sc.offset - kopya); // dikişsiz sarma
        continue;
      }
      final kalan = kopya - _sc.offset;
      try {
        await _sc.animateTo(kopya,
            duration: Duration(milliseconds: (kalan / _hiz).round()), curve: Curves.linear);
      } catch (_) {/* widget söküldü */}
    }
  }

  @override
  void dispose() {
    _sc.dispose();
    super.dispose();
  }

  Widget _ogeDizisi({Key? key}) => Row(
        key: key,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final f in widget.liste) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(emoji(f.norm), style: const TextStyle(fontSize: 11)),
                const SizedBox(width: 4),
                Text(f.ad.toUpperCase(), style: TextStyle(color: C.muted, fontSize: 10.5, fontWeight: FontWeight.w600, letterSpacing: 0.4)),
                const SizedBox(width: 5),
                Text(formatFiyat(f.fiyat), style: TextStyle(color: urunRenk(f.norm), fontSize: 11.5, fontWeight: FontWeight.w800)),
              ]),
            ),
            Container(width: 1, height: 10, color: C.border),
          ],
        ],
      );

  @override
  Widget build(BuildContext context) {
    if (widget.liste.isEmpty) return const SizedBox.shrink();
    return GestureDetector(
      // Dokun-basılı tut: akış durur (okumak için); bırakınca devam eder
      onTapDown: (_) => setState(() => _duruyor = true),
      onTapUp: (_) => setState(() => _duruyor = false),
      onTapCancel: () => setState(() => _duruyor = false),
      child: Container(
        height: 30,
        decoration: BoxDecoration(
          color: C.surface,
          border: Border(bottom: BorderSide(color: C.border)),
        ),
        child: SingleChildScrollView(
          controller: _sc,
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          child: Row(children: [
            Center(child: _ogeDizisi(key: _kopyaKey)),
            Center(child: _ogeDizisi()),
          ]),
        ),
      ),
    );
  }
}

// Veri tazeliği rozeti — web VeriTazelik ile aynı dil (tek eşik: bayatEsikGun)
class TazelikRozet extends StatelessWidget {
  final String? tarih;
  const TazelikRozet(this.tarih, {super.key});

  @override
  Widget build(BuildContext context) {
    final g = gunFarki(tarih);
    if (g == null) return const SizedBox.shrink();
    final String metin;
    final Color renk;
    if (g <= 0) {
      metin = 'bugün';
      renk = C.pos;
    } else if (g == 1) {
      metin = 'dün';
      renk = C.muted;
    } else if (g < bayatEsikGun) {
      metin = '$g gün önce';
      renk = C.muted;
    } else {
      metin = '⚠ $g gün önce';
      renk = C.orange;
    }
    return Row(mainAxisSize: MainAxisSize.min, children: [
      if (g <= 0) ...[
        Container(width: 6, height: 6, decoration: BoxDecoration(color: renk, shape: BoxShape.circle)),
        const SizedBox(width: 4),
      ],
      Text(metin, style: TextStyle(color: renk, fontSize: 10, fontWeight: g >= bayatEsikGun ? FontWeight.w700 : FontWeight.w500)),
    ]);
  }
}

// Tek fiyat satırı kartı — emoji rozeti + ad/kaynak + tazelik + büyük fiyat.
// Uzun basınca fiyat metni paylaşılır (çiftçinin WhatsApp alışkanlığı).
class FiyatKarti extends StatelessWidget {
  final Fiyat f;
  const FiyatKarti(this.f, {super.key});

  void _paylas() {
    SharePlus.instance.share(ShareParams(
      text: '${emoji(f.norm)} ${f.ad}: ${formatFiyat(f.fiyat)} ${f.birim}\n'
          '${f.kaynak} · ${kisaTarih(f.tarih)}\n$siteUrl',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final renk = urunRenk(f.norm);
    return GestureDetector(
      onLongPress: _paylas,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: C.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44, alignment: Alignment.center,
            decoration: BoxDecoration(color: renk.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(11)),
            child: Text(emoji(f.norm), style: const TextStyle(fontSize: 20)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(f.ad, style: TextStyle(color: C.text, fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 3),
            Row(children: [
              Flexible(child: Text('${f.kaynak} · ${kisaTarih(f.tarih)}', overflow: TextOverflow.ellipsis, style: TextStyle(color: C.muted, fontSize: 10.5))),
              const SizedBox(width: 6),
              TazelikRozet(f.tarih),
            ]),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontWeight: FontWeight.w800, fontSize: 22, height: 1)),
            const SizedBox(height: 2),
            Text(f.birim, style: TextStyle(color: C.muted, fontSize: 9.5)),
          ]),
        ]),
      ),
    );
  }
}

// Sinyal motoru şeridi — web SinyalMotoru ile aynı kurallar:
// en az 5 gün veri, ±%2 nötr bandı. Yorum/tavsiye YOK, yalnızca ortalamaya göre konum.
const _minVeriGun = 5;
const _notrBant = 2.0;

class SinyalSeridi extends StatelessWidget {
  final List<Sinyal> liste;
  const SinyalSeridi(this.liste, {super.key});

  @override
  Widget build(BuildContext context) {
    if (liste.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      bolumBaslik('SİNYAL MOTORU · bugün vs 30 gün ortalaması'),
      SizedBox(
        height: 106,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: liste.length,
          itemBuilder: (context, i) => _SinyalKarti(liste[i]),
        ),
      ),
      const SizedBox(height: 4),
      Text('En az $_minVeriGun gün veri gerekir · yorum içermez', style: TextStyle(color: C.muted, fontSize: 9.5)),
      const SizedBox(height: 12),
    ]);
  }
}

class _SinyalKarti extends StatelessWidget {
  final Sinyal s;
  const _SinyalKarti(this.s);

  @override
  Widget build(BuildContext context) {
    final String etiket;
    final String ikon;
    final Color renk;
    double? sapma;
    if (s.bugun == null || s.ort30 == null || s.gunSayisi < _minVeriGun) {
      etiket = 'VERİ BİRİKİYOR';
      ikon = '⋯';
      renk = C.muted;
    } else {
      sapma = (s.bugun! - s.ort30!) / s.ort30! * 100;
      if (sapma >= _notrBant) {
        etiket = 'ORTALAMA ÜSTÜ';
        ikon = '▲';
        renk = C.pos;
      } else if (sapma <= -_notrBant) {
        etiket = 'ORTALAMA ALTI';
        ikon = '▼';
        renk = C.red;
      } else {
        etiket = 'NÖTR';
        ikon = '─';
        renk = C.muted;
      }
    }
    return Container(
      width: 168,
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: C.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(emoji(s.norm), style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 5),
          Expanded(child: Text(s.norm, style: TextStyle(color: C.text, fontSize: 11.5, fontWeight: FontWeight.w700))),
          Text(ikon, style: TextStyle(color: renk, fontSize: 11)),
        ]),
        const SizedBox(height: 6),
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(formatFiyat(s.bugun), style: TextStyle(color: urunRenk(s.norm), fontSize: 19, fontWeight: FontWeight.w800, height: 1)),
          const SizedBox(width: 5),
          if (sapma != null)
            Text('%${formatFiyat(sapma.abs(), 1)}', style: TextStyle(color: renk, fontSize: 10.5, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 5),
        Text(etiket, style: TextStyle(color: renk, fontSize: 8.5, fontWeight: FontWeight.w700, letterSpacing: 0.4)),
        Text(
          s.ort30 == null ? 'veri bekleniyor' : '30g ort ${formatFiyat(s.ort30)} · ${s.gunSayisi} gün',
          style: TextStyle(color: C.muted, fontSize: 8.5),
        ),
      ]),
    );
  }
}

// 30 günlük çizgi grafik
class MiniGrafik extends StatelessWidget {
  final List<GrafikNoktasi> seri;
  final Color renk;
  const MiniGrafik(this.seri, this.renk, {super.key});

  @override
  Widget build(BuildContext context) {
    if (seri.length < 2) {
      return SizedBox(height: 160, child: Center(child: Text('Grafik için yeterli veri yok', style: TextStyle(color: C.muted, fontSize: 11))));
    }
    final degerler = seri.map((s) => s.deger).toList();
    final min = degerler.reduce((a, b) => a < b ? a : b);
    final max = degerler.reduce((a, b) => a > b ? a : b);
    final pad = (max - min) == 0 ? max * 0.05 : (max - min) * 0.1;

    return SizedBox(
      height: 190,
      child: LineChart(LineChartData(
        minY: min - pad, maxY: max + pad,
        gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: C.border, strokeWidth: 0.5)),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, _) => Text(formatFiyat(v, 0), style: TextStyle(color: C.muted, fontSize: 9)))),
          bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, interval: (seri.length / 4).ceilToDouble(), getTitlesWidget: (v, _) {
            final i = v.toInt();
            if (i < 0 || i >= seri.length) return const SizedBox();
            return Padding(padding: const EdgeInsets.only(top: 6), child: Text(kisaTarih(seri[i].tarih), style: TextStyle(color: C.muted, fontSize: 9)));
          })),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [LineChartBarData(
          spots: [for (var i = 0; i < seri.length; i++) FlSpot(i.toDouble(), seri[i].deger)],
          isCurved: true, color: renk, barWidth: 2.5, dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(show: true, color: renk.withValues(alpha: 0.14)),
        )],
      )),
    );
  }
}

// Seçim çipi
class Cip extends StatelessWidget {
  final String etiket;
  final bool aktif;
  final Color renk;
  final VoidCallback onTap;
  const Cip(this.etiket, this.aktif, this.renk, this.onTap, {super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 7, bottom: 7),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: aktif ? renk : C.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: aktif ? renk : C.border),
        ),
        child: Text(etiket, style: TextStyle(color: aktif ? Colors.white : C.muted, fontSize: 11.5, fontWeight: aktif ? FontWeight.w700 : FontWeight.w500)),
      ),
    );
  }
}
