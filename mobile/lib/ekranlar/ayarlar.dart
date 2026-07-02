import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../tema.dart';
import '../veri.dart';

class AyarlarEkran extends StatefulWidget {
  final bool acik;
  final ValueChanged<bool> onTema;
  const AyarlarEkran({super.key, required this.acik, required this.onTema});
  @override
  State<AyarlarEkran> createState() => _AyarlarEkranState();
}

class _AyarlarEkranState extends State<AyarlarEkran> {
  late bool _acik = widget.acik;

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
              subtitle: Text('Türkiye tarım ve hayvancılık fiyatları · sürüm 1.1', style: TextStyle(color: C.muted, fontSize: 11)),
            ),
          ])),
          const SizedBox(height: 16),
          Center(child: Text('Veriler: TOBB · KTB · ESK · USK · Open-Meteo', style: TextStyle(color: C.muted, fontSize: 10))),
        ],
      ),
    );
  }
}
