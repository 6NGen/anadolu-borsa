import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
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

Widget bolumBaslik(String s) => Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 6, left: 2),
      child: Row(children: [
        Container(width: 3, height: 12, decoration: BoxDecoration(color: C.green, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(s, style: TextStyle(color: C.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: FontWeight.w600)),
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

// Tek fiyat satırı kartı — emoji rozeti + ad/kaynak + büyük fiyat
class FiyatKarti extends StatelessWidget {
  final Fiyat f;
  const FiyatKarti(this.f, {super.key});

  @override
  Widget build(BuildContext context) {
    final renk = urunRenk(f.norm);
    return Container(
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
          Text('${f.kaynak} · ${kisaTarih(f.tarih)}', style: TextStyle(color: C.muted, fontSize: 10.5)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontWeight: FontWeight.w800, fontSize: 22, height: 1)),
          const SizedBox(height: 2),
          Text(f.birim, style: TextStyle(color: C.muted, fontSize: 9.5)),
        ]),
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
