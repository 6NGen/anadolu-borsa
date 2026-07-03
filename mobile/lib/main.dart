import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'tema.dart';
import 'veri.dart';
import 'tercih.dart';
import 'bildirim.dart';
import 'parcalar.dart';
import 'ekranlar/ana.dart';
import 'ekranlar/tarim.dart';
import 'ekranlar/hayvan.dart';
import 'ekranlar/parite.dart';
import 'ekranlar/araclar.dart';
import 'ekranlar/ayarlar.dart';
import 'ekranlar/urun_sec.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: supabaseUrl, publishableKey: supabaseAnonKey);
  await Tercih.yukle();
  await bildirimBaslat();
  gunlukOzetEsitle(); // beklenmez — açılışı yavaşlatmasın
  final prefs = await SharedPreferences.getInstance();
  final acik = prefs.getBool('acikTema') ?? false;
  paletUygula(acik);
  runApp(AnadoluBorsaApp(baslangic: acik));
}

// Tarayıcıda link aç — canLaunchUrl bazı cihazlarda yanlış false döndüğü için
// doğrudan deneyip hatayı yutuyoruz.
Future<void> linkAc(String url) async {
  try {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  } catch (_) {/* sessiz */}
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
    // Tercih.surum artınca (ürünlerim/büyük yazı) tüm ağaç yeniden çizilir
    return ValueListenableBuilder<int>(
      valueListenable: Tercih.surum,
      builder: (context, surum, child) => MaterialApp(
        title: 'Anadolu Borsa',
        debugShowCheckedModeBanner: false,
        theme: anadoluTema(_acik),
        builder: (context, child) {
          final mq = MediaQuery.of(context);
          return MediaQuery(
            data: mq.copyWith(textScaler: TextScaler.linear(Tercih.buyukYazi ? 1.2 : 1.0)),
            child: child!,
          );
        },
        home: AnaKabuk(acik: _acik, onTema: _temaDegistir),
      ),
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
  static const _basliklar = ['ANA SAYFA', 'TARIM BORSASI', 'HAYVAN BORSASI', 'PARİTE', 'ARAÇLAR'];

  @override
  void initState() {
    super.initState();
    // İlk açılış: "Ne üretiyorsun?" seçicisi (atlanabilir, bir kez sorulur)
    if (!Tercih.kurulumTamam) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => const UrunSecEkran(ilkKurulum: true)));
      });
    }
  }

  // Her build'de TAZE örnek (const DEĞİL) → tema değişince ekranlar yeniden
  // çizilir; State korunur (aynı tip+konum), veri yeniden çekilmez.
  // ignore: prefer_const_constructors
  List<Widget> _ekranlarYap() => [AnaEkran(), TarimEkran(), HayvanEkran(), PariteEkran(), AraclarEkran()];

  @override
  Widget build(BuildContext context) {
    final ekranlar = _ekranlarYap();
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(_basliklar[_sekme], style: TextStyle(color: C.text, fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 1)),
        actions: [
          IconButton(
            icon: Icon(Icons.ios_share_rounded, color: C.muted, size: 21),
            tooltip: 'Paylaş',
            onPressed: () => SharePlus.instance.share(
              ShareParams(text: 'Anadolu Borsa — güncel tarım ve hayvancılık fiyatları\n$siteUrl'),
            ),
          ),
          IconButton(
            icon: Icon(Icons.settings_outlined, color: C.muted, size: 21),
            tooltip: 'Ayarlar',
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => AyarlarEkran(acik: widget.acik, onTema: widget.onTema),
            )),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(children: [
        // Çevrimdışı şeridi — önbellekten veri gösterilirken dürüst uyarı
        ValueListenableBuilder<bool>(
          valueListenable: cevrimdisi,
          builder: (context, kapali, _) => kapali
              ? Container(
                  width: double.infinity,
                  color: C.orange.withValues(alpha: 0.16),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  child: Text('📡 Çevrimdışı — son kaydedilen fiyatlar gösteriliyor',
                      style: TextStyle(color: C.orange, fontSize: 11, fontWeight: FontWeight.w600)),
                )
              : const SizedBox.shrink(),
        ),
        // Kayan fiyat şeridi (Bloomberg tarzı) — tüm sekmelerde, dokununca durur
        ValueListenableBuilder<List<Fiyat>>(
          valueListenable: seritFiyatlari,
          builder: (context, liste, _) => FiyatSeridi(liste),
        ),
        Expanded(child: IndexedStack(index: _sekme, children: ekranlar)),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => linkAc('$siteUrl/fiyat-bildir'),
        backgroundColor: C.green,
        foregroundColor: Colors.white,
        elevation: 2,
        icon: const Icon(Icons.add_rounded, size: 22),
        label: const Text('Fiyat Bildir', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: C.surface, border: Border(top: BorderSide(color: C.border))),
        child: BottomNavigationBar(
          currentIndex: _sekme,
          onTap: (i) => setState(() => _sekme = i),
          type: BottomNavigationBarType.fixed,
          backgroundColor: C.surface,
          elevation: 0,
          selectedItemColor: C.green,
          unselectedItemColor: C.muted,
          selectedFontSize: 10.5,
          unselectedFontSize: 10.5,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Ana'),
            BottomNavigationBarItem(icon: Icon(Icons.grass_rounded), label: 'Tarım'),
            BottomNavigationBarItem(icon: Icon(Icons.pets_rounded), label: 'Hayvan'),
            BottomNavigationBarItem(icon: Icon(Icons.sync_alt_rounded), label: 'Parite'),
            BottomNavigationBarItem(icon: Icon(Icons.calculate_rounded), label: 'Araçlar'),
          ],
        ),
      ),
    );
  }
}
