import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'tema.dart';
import 'veri.dart';
import 'ekranlar/ana.dart';
import 'ekranlar/tarim.dart';
import 'ekranlar/hayvan.dart';
import 'ekranlar/parite.dart';
import 'ekranlar/hedef.dart';
import 'ekranlar/ayarlar.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: supabaseUrl, publishableKey: supabaseAnonKey);
  final prefs = await SharedPreferences.getInstance();
  final acik = prefs.getBool('acikTema') ?? false;
  paletUygula(acik);
  runApp(AnadoluBorsaApp(baslangic: acik));
}

class AnadoluBorsaApp extends StatefulWidget {
  final bool baslangic;
  const AnadoluBorsaApp({super.key, required this.baslangic});
  @override
  State<AnadoluBorsaApp> createState() => _AnadoluBorsaAppState();
}

class _AnadoluBorsaAppState extends State<AnadoluBorsaApp> {
  late bool _acik = widget.baslangic;

  Future<void> _temaDegistir(bool acik) async {
    paletUygula(acik);
    setState(() => _acik = acik);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('acikTema', acik);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Anadolu Borsa',
      debugShowCheckedModeBanner: false,
      theme: anadoluTema(_acik),
      home: AnaKabuk(acik: _acik, onTema: _temaDegistir),
    );
  }
}

class AnaKabuk extends StatefulWidget {
  final bool acik;
  final ValueChanged<bool> onTema;
  const AnaKabuk({super.key, required this.acik, required this.onTema});
  @override
  State<AnaKabuk> createState() => _AnaKabukState();
}

class _AnaKabukState extends State<AnaKabuk> {
  int _sekme = 0;

  static const _ekranlar = [AnaEkran(), TarimEkran(), HayvanEkran(), PariteEkran(), HedefEkran()];
  static const _basliklar = ['ANADOLU BORSA', 'TARIM BORSASI', 'HAYVAN BORSASI', 'PARİTE', 'HEDEF'];

  Future<void> _bildir() async {
    final uri = Uri.parse('$siteUrl/fiyat-bildir');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_basliklar[_sekme], style: TextStyle(color: C.green, fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 1)),
        actions: [
          IconButton(
            icon: Icon(Icons.ios_share, color: C.muted, size: 20),
            tooltip: 'Paylaş',
            onPressed: () => SharePlus.instance.share(
              ShareParams(text: 'Anadolu Borsa — güncel tarım ve hayvancılık fiyatları\n$siteUrl'),
            ),
          ),
          IconButton(
            icon: Icon(Icons.settings_outlined, color: C.muted, size: 20),
            tooltip: 'Ayarlar',
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => AyarlarEkran(acik: widget.acik, onTema: widget.onTema),
            )),
          ),
        ],
      ),
      body: IndexedStack(index: _sekme, children: _ekranlar),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _bildir,
        backgroundColor: C.green,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add, size: 20),
        label: const Text('Fiyat Bildir', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _sekme,
        onTap: (i) => setState(() => _sekme = i),
        type: BottomNavigationBarType.fixed,
        backgroundColor: C.surface,
        selectedItemColor: C.green,
        unselectedItemColor: C.muted,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Ana'),
          BottomNavigationBarItem(icon: Icon(Icons.grass_outlined), label: 'Tarım'),
          BottomNavigationBarItem(icon: Icon(Icons.pets_outlined), label: 'Hayvan'),
          BottomNavigationBarItem(icon: Icon(Icons.sync_alt), label: 'Parite'),
          BottomNavigationBarItem(icon: Icon(Icons.flag_outlined), label: 'Hedef'),
        ],
      ),
    );
  }
}
