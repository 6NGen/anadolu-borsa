import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'tema.dart';
import 'bicim.dart';
import 'veri.dart';

// Ortak durum widget'ları
Widget yukleniyor() => Center(child: CircularProgressIndicator(color: C.green));

Widget hataKutusu([Object? e]) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.wifi_off, color: C.muted, size: 36),
          const SizedBox(height: 10),
          Text('Veri alınamadı', style: TextStyle(color: C.text, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('İnternet bağlantını kontrol edip\naşağı çekerek yenile.', textAlign: TextAlign.center, style: TextStyle(color: C.muted, fontSize: 11, height: 1.4)),
        ]),
      ),
    );

Widget bolumBaslik(String s) => Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Text(s, style: TextStyle(color: C.muted, fontSize: 10, letterSpacing: 1.5)),
    );

// Tek fiyat satırı kartı
class FiyatKarti extends StatelessWidget {
  final Fiyat f;
  const FiyatKarti(this.f, {super.key});

  @override
  Widget build(BuildContext context) {
    final renk = urunRenk(f.norm);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: C.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: C.border),
      ),
      child: Row(children: [
        Container(width: 4, height: 56, decoration: BoxDecoration(color: renk, borderRadius: BorderRadius.circular(2)), margin: const EdgeInsets.symmetric(horizontal: 10)),
        Expanded(child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(f.ad, style: TextStyle(color: C.text, fontWeight: FontWeight.w600, fontSize: 13)),
            Text('${f.kaynak} · ${kisaTarih(f.tarih)}', style: TextStyle(color: C.muted, fontSize: 10)),
          ]),
        )),
        Padding(
          padding: const EdgeInsets.only(right: 14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(formatFiyat(f.fiyat), style: TextStyle(color: renk, fontWeight: FontWeight.bold, fontSize: 20)),
            Text(f.birim, style: TextStyle(color: C.muted, fontSize: 9)),
          ]),
        ),
      ]),
    );
  }
}

// 30 günlük mini çizgi grafik
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
      height: 180,
      child: LineChart(LineChartData(
        minY: min - pad, maxY: max + pad,
        gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: C.border, strokeWidth: 0.5)),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 38, getTitlesWidget: (v, _) => Text(formatFiyat(v, 0), style: TextStyle(color: C.muted, fontSize: 9)))),
          bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, interval: (seri.length / 4).ceilToDouble(), getTitlesWidget: (v, _) {
            final i = v.toInt();
            if (i < 0 || i >= seri.length) return const SizedBox();
            return Text(kisaTarih(seri[i].tarih), style: TextStyle(color: C.muted, fontSize: 9));
          })),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [LineChartBarData(
          spots: [for (var i = 0; i < seri.length; i++) FlSpot(i.toDouble(), seri[i].deger)],
          isCurved: true, color: renk, barWidth: 2, dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(show: true, color: renk.withValues(alpha: 0.12)),
        )],
      )),
    );
  }
}

// Seçim çipi (ürün seçici)
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
      child: Container(
        margin: const EdgeInsets.only(right: 6, bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: aktif ? renk : C.surface,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: aktif ? renk : C.border),
        ),
        child: Text(etiket, style: TextStyle(color: aktif ? Colors.black : C.muted, fontSize: 11, fontWeight: aktif ? FontWeight.w700 : FontWeight.normal)),
      ),
    );
  }
}
