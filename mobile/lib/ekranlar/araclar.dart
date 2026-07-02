import 'package:flutter/material.dart';
import '../tema.dart';
import '../parcalar.dart';
import 'hesap.dart';
import 'hedef.dart';

// Araçlar sekmesi — hesap makineleri tek çatı altında (ileride Maliyet de buraya).
class AraclarEkran extends StatelessWidget {
  const AraclarEkran({super.key});

  void _ac(BuildContext context, String baslik, Widget ekran) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => Scaffold(
        appBar: AppBar(
          title: Text(baslik, style: TextStyle(color: C.green, fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 1)),
          iconTheme: IconThemeData(color: C.muted),
        ),
        body: ekran,
      ),
    ));
  }

  Widget _arac(BuildContext context, {required String emoji, required String ad, required String aciklama, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border)),
        child: Row(children: [
          Container(
            width: 48, height: 48, alignment: Alignment.center,
            decoration: BoxDecoration(color: C.green.withValues(alpha: 0.13), borderRadius: BorderRadius.circular(12)),
            child: Text(emoji, style: const TextStyle(fontSize: 22)),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(ad, style: TextStyle(color: C.text, fontSize: 14.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(aciklama, style: TextStyle(color: C.muted, fontSize: 11, height: 1.4)),
          ])),
          Icon(Icons.chevron_right_rounded, color: C.muted),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        bolumBaslik('ÇİFTÇİ ARAÇLARI'),
        _arac(context,
          emoji: '🧮', ad: 'Kaç Para Eder?',
          aciklama: 'Elindeki ürün bugünkü borsa fiyatıyla ne eder — ton, kg, baş, litre',
          onTap: () => _ac(context, 'KAÇ PARA EDER?', const HesapEkran()),
        ),
        _arac(context,
          emoji: '🎯', ad: 'Hedef Panel',
          aciklama: '1 traktör kaç ton buğday eder? Varlık hedefine ürün cinsinden bak',
          onTap: () => _ac(context, 'HEDEF PANEL', const HedefEkran()),
        ),
        const SizedBox(height: 8),
        Text('Araçlar tavsiye vermez; yalnızca güncel borsa ortalamasıyla hesap yapar.', style: TextStyle(color: C.muted, fontSize: 10, height: 1.5)),
      ],
    );
  }
}
