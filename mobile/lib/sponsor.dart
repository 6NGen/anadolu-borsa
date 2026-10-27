import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'admob.dart';
import 'tema.dart';
import 'veri.dart';

// Sponsor reklam alanı — firmalarla doğrudan anlaşılan reklamlar.
// Liste sitedeki tek dosyadan gelir (web/public/sponsorlar.json); yeni reklam
// için uygulama güncellemesi gerekmez. Reklam kimliği/izleme YOK: yalnızca
// gösterilir, dokununca firmanın linki tarayıcıda açılır.
// Aktif sponsor yoksa Google AdMob banner'ı (admob.dart); o da yüklenemezse
// "buraya reklam verin" kartı gösterilir.

class Sponsor {
  final String firma, baslik, metin, link;
  final List<String> yerler;
  final DateTime? baslangic, bitis;
  Sponsor.fromJson(Map<String, dynamic> j)
      : firma = j['firma'] ?? '',
        baslik = j['baslik'] ?? '',
        metin = j['metin'] ?? '',
        link = j['link'] ?? '',
        yerler = List<String>.from(j['yerler'] ?? const []),
        baslangic = DateTime.tryParse(j['baslangic'] ?? ''),
        bitis = DateTime.tryParse(j['bitis'] ?? '');

  bool aktif(String yer, DateTime simdi) =>
      baslik.isNotEmpty &&
      link.startsWith('http') &&
      (yerler.isEmpty || yerler.contains(yer)) &&
      (baslangic == null || !simdi.isBefore(baslangic!)) &&
      (bitis == null || simdi.isBefore(bitis!.add(const Duration(days: 1))));
}

// Oturum başına bir kez çekilir; hata olursa boş liste (reklam alanı ev kartına düşer).
Future<List<Sponsor>>? _liste;
Future<List<Sponsor>> _sponsorlar() => _liste ??= () async {
      try {
        final c = HttpClient()..connectionTimeout = const Duration(seconds: 6);
        final req = await c.getUrl(Uri.parse('$siteUrl/sponsorlar.json'));
        final res = await req.close().timeout(const Duration(seconds: 8));
        if (res.statusCode != 200) return <Sponsor>[];
        final j = jsonDecode(await res.transform(utf8.decoder).join()) as Map<String, dynamic>;
        return [for (final s in (j['sponsorlar'] as List? ?? const [])) Sponsor.fromJson(s as Map<String, dynamic>)];
      } catch (_) {
        return <Sponsor>[];
      }
    }();

const _reklamEposta = 'omerfarukdurna3442@gmail.com';

class SponsorKarti extends StatelessWidget {
  final String yer; // 'ana' | 'tarim' | 'hayvan'
  const SponsorKarti(this.yer, {super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Sponsor>>(
      future: _sponsorlar(),
      builder: (context, snap) {
        if (!snap.hasData) return const SizedBox.shrink();
        final simdi = DateTime.now();
        final uygun = snap.data!.where((s) => s.aktif(yer, simdi)).toList();
        if (uygun.isEmpty) return AdmobBanner(yedek: _kart(null));
        return _kart(uygun[Random().nextInt(uygun.length)]);
      },
    );
  }

  Widget _kart(Sponsor? s) {
    final baslik = s?.baslik ?? 'Bu alanda reklamınız olsun';
    final metin = s?.metin ?? 'Yem, gübre, tohum ve ekipman firmaları: her gün fiyata bakan üreticiye ulaşın.';
    final link = s?.link ?? 'mailto:$_reklamEposta?subject=${Uri.encodeComponent('Rayiç reklam')}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Material(
        color: C.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication),
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(border: Border.all(color: C.muted), borderRadius: BorderRadius.circular(4)),
                  child: Text(s == null ? 'REKLAM ALANI' : 'SPONSORLU',
                      style: TextStyle(color: C.muted, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                ),
                if (s != null) ...[
                  const SizedBox(width: 8),
                  Expanded(child: Text(s.firma, overflow: TextOverflow.ellipsis, style: TextStyle(color: C.muted, fontSize: 10.5))),
                ],
              ]),
              const SizedBox(height: 8),
              Text(baslik, style: TextStyle(color: C.text, fontSize: 14, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(metin, style: TextStyle(color: C.muted, fontSize: 11.5, height: 1.4)),
              const SizedBox(height: 8),
              Text(s == null ? 'İletişime geç →' : 'İncele →',
                  style: TextStyle(color: C.green, fontSize: 11.5, fontWeight: FontWeight.w700)),
            ]),
          ),
        ),
      ),
    );
  }
}
