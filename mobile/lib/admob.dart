import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

// Google AdMob banner'ı — o sayfada aktif sponsor yoksa gösterilir.
// Kimlikler: AdMob > Uygulamalar > Rayiç > Reklam birimleri.
// Uygulama kimliği (~ ile) AndroidManifest.xml'deki APPLICATION_ID'dedir.
// Debug derlemede her zaman Google'ın test birimi kullanılır (kendi reklamına
// tıklamak hesabı askıya aldırır).
const _bannerGercek = 'ca-app-pub-3940256099942544/9214589741'; // TODO: gerçek birim
const _bannerTest = 'ca-app-pub-3940256099942544/9214589741';
String get _bannerId => kReleaseMode ? _bannerGercek : _bannerTest;

// Açılışta bir kez: rıza bilgisini güncelle (gerekirse form), sonra SDK'yı başlat.
// Beklenmez — açılışı yavaşlatmasın.
Completer<bool>? _hazir;
Future<bool> admobBaslat() {
  if (_hazir != null) return _hazir!.future;
  _hazir = Completer<bool>();
  ConsentInformation.instance.requestConsentInfoUpdate(
    ConsentRequestParameters(),
    () async {
      await ConsentForm.loadAndShowConsentFormIfRequired((_) {});
      final olur = await ConsentInformation.instance.canRequestAds();
      if (olur) await MobileAds.instance.initialize();
      _hazir!.complete(olur);
    },
    (_) async {
      // Rıza servisine ulaşılamazsa yine de dene (Türkiye'de form zorunlu değil).
      await MobileAds.instance.initialize();
      _hazir!.complete(true);
    },
  );
  return _hazir!.future;
}

class AdmobBanner extends StatefulWidget {
  final Widget yedek; // reklam yüklenemezse gösterilecek kart
  const AdmobBanner({required this.yedek, super.key});
  @override
  State<AdmobBanner> createState() => _AdmobBannerState();
}

class _AdmobBannerState extends State<AdmobBanner> {
  BannerAd? _reklam;
  AdSize? _boyut;
  bool _hata = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_reklam == null && !_hata) _yukle();
  }

  Future<void> _yukle() async {
    final genislik = MediaQuery.sizeOf(context).width.truncate() - 32;
    if (!await admobBaslat()) {
      if (mounted) setState(() => _hata = true);
      return;
    }
    final reklam = BannerAd(
      adUnitId: _bannerId,
      size: AdSize.getInlineAdaptiveBannerAdSize(genislik, 250),
      request: const AdRequest(keywords: ['tarım', 'çiftçi', 'gübre', 'yem', 'hayvancılık']),
      listener: BannerAdListener(
        onAdLoaded: (ad) async {
          final b = await (ad as BannerAd).getPlatformAdSize();
          if (mounted) setState(() => _boyut = b);
        },
        onAdFailedToLoad: (ad, _) {
          ad.dispose();
          if (mounted) setState(() => _hata = true);
        },
      ),
    );
    _reklam = reklam;
    await reklam.load();
  }

  @override
  void dispose() {
    _reklam?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hata) return widget.yedek;
    if (_reklam == null || _boyut == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Center(
        child: SizedBox(width: _boyut!.width.toDouble(), height: _boyut!.height.toDouble(), child: AdWidget(ad: _reklam!)),
      ),
    );
  }
}
