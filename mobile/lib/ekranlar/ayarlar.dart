import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../tema.dart';
import '../tercih.dart';
import '../veri.dart';
import '../bildirim.dart';
import 'urun_sec.dart';

class AyarlarEkran extends StatefulWidget {
  final bool acik;
  final ValueChanged<bool> onTema;
  const AyarlarEkran({super.key, required this.acik, required this.onTema});
  @override
  State<AyarlarEkran> createState() => _AyarlarEkranState();
}

class _AyarlarEkranState extends State<AyarlarEkran> {
  late bool _acik = widget.acik;
  late bool _buyuk = Tercih.buyukYazi;
  bool _ozet = false;

  @override
  void initState() {
    super.initState();
    gunlukOzetAcik().then((v) {
      if (mounted) setState(() => _ozet = v);
    });
  }

  Widget _bolum(String s) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        child: Text(s, style: TextStyle(color: C.muted, fontSize: 10, letterSpacing: 1.5)),
      );

  Widget _kart(Widget child) => Container(
        decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: C.border)),
        child: child,
      );

  Future<void> _siteAc() async {
    // canLaunchUrl bazı cihazlarda yanlış false döner — doğrudan dene
    try {
      await launchUrl(Uri.parse(siteUrl), mode: LaunchMode.externalApplication);
    } catch (_) {/* sessiz */}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('AYARLAR', style: TextStyle(color: C.green, fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 1)),
        iconTheme: IconThemeData(color: C.muted),
      ),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          _bolum('KİŞİSELLEŞTİRME'),
          _kart(ListTile(
            leading: Icon(Icons.agriculture_rounded, color: C.green),
            title: Text('Ürünlerim', style: TextStyle(color: C.text, fontSize: 13)),
            subtitle: Text(
              Tercih.urunlerim.isEmpty ? 'Seçilmedi — tüm fiyatlar aynı sırada' : '${Tercih.urunlerim.length} ürün seçili · her ekranda üstte',
              style: TextStyle(color: C.muted, fontSize: 11),
            ),
            trailing: Icon(Icons.chevron_right_rounded, color: C.muted),
            onTap: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const UrunSecEkran()));
              if (mounted) setState(() {});
            },
          )),
          _bolum('BİLDİRİMLER'),
          _kart(SwitchListTile(
            value: _ozet,
            activeThumbColor: C.green,
            onChanged: (v) async {
              if (v) {
                final mesajci = ScaffoldMessenger.of(context); // await öncesi al (lint)
                final oldu = await gunlukOzetAc();
                if (mounted) setState(() => _ozet = oldu);
                if (!oldu && mounted) {
                  mesajci.showSnackBar(SnackBar(
                    backgroundColor: C.surface,
                    content: Text(
                      bildirimHazir
                          ? 'Bildirim izni verilmedi. Telefon ayarlarından açabilirsin.'
                          : 'Bildirim servisi bu sürümde hazır değil.',
                      style: TextStyle(color: C.text, fontSize: 12),
                    ),
                  ));
                }
              } else {
                await gunlukOzetKapat();
                if (mounted) setState(() => _ozet = false);
              }
            },
            title: Text('Günlük fiyat özeti', style: TextStyle(color: C.text, fontSize: 13)),
            subtitle: Text('Her akşam tek bildirim: günün borsa fiyatları', style: TextStyle(color: C.muted, fontSize: 11)),
            secondary: Icon(Icons.notifications_active_outlined, color: C.green),
          )),
          _bolum('GÖRÜNÜM'),
          _kart(Column(children: [
            SwitchListTile(
              value: _acik,
              activeThumbColor: C.green,
              onChanged: (v) {
                setState(() => _acik = v);
                widget.onTema(v);
              },
              title: Text(_acik ? 'Açık tema' : 'Koyu tema', style: TextStyle(color: C.text, fontSize: 13)),
              subtitle: Text(_acik ? 'Beyaz zemin' : 'Koyu zemin (varsayılan)', style: TextStyle(color: C.muted, fontSize: 11)),
              secondary: Icon(_acik ? Icons.light_mode : Icons.dark_mode, color: C.green),
            ),
            Divider(height: 1, color: C.border),
            SwitchListTile(
              value: _buyuk,
              activeThumbColor: C.green,
              onChanged: (v) async {
                setState(() => _buyuk = v);
                Tercih.buyukYazi = v;
                await Tercih.kaydet();
              },
              title: Text('Büyük yazı', style: TextStyle(color: C.text, fontSize: 13)),
              subtitle: Text('Tüm yazıları %20 büyütür', style: TextStyle(color: C.muted, fontSize: 11)),
              secondary: Icon(Icons.text_increase_rounded, color: C.green),
            ),
          ])),
          _bolum('HAKKINDA'),
          _kart(Column(children: [
            ListTile(
              leading: Icon(Icons.public, color: C.muted),
              title: Text('Web sitesi', style: TextStyle(color: C.text, fontSize: 13)),
              subtitle: Text('borsanadolu.6ngen.com', style: TextStyle(color: C.muted, fontSize: 11)),
              trailing: Icon(Icons.open_in_new, color: C.muted, size: 18),
              onTap: _siteAc,
            ),
            Divider(height: 1, color: C.border),
            ListTile(
              leading: Icon(Icons.info_outline, color: C.muted),
              title: Text('Anadolu Borsa', style: TextStyle(color: C.text, fontSize: 13)),
              subtitle: Text('Türkiye tarım ve hayvancılık fiyatları · sürüm 1.4.1', style: TextStyle(color: C.muted, fontSize: 11)),
            ),
          ])),
          const SizedBox(height: 16),
          Center(child: Text('Veriler: TOBB · KTB · ESK · USK · Open-Meteo', style: TextStyle(color: C.muted, fontSize: 10))),
        ],
      ),
    );
  }
}
