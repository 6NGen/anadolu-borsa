import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Push bildirimleri (FCM). Günlük özet, kullanıcı hesabı GEREKTİRMEZ:
// cihaz "gunluk_ozet" konusuna abone olur, scraper her akşam tek bildirim atar.
// Kişisel fiyat alarmı (eşik) girişli olduğundan v1.4'te (web'de mevcut).
const _konu = 'gunluk_ozet';

bool bildirimHazir = false;

// Uygulama açılışında çağrılır. google-services.json yoksa/bozuksa sessizce
// devre dışı kalır — uygulamanın geri kalanını asla bozmaz.
Future<void> bildirimBaslat() async {
  if (kIsWeb || !Platform.isAndroid) return;
  try {
    await Firebase.initializeApp();
    bildirimHazir = true;
  } catch (_) {
    bildirimHazir = false;
  }
}

Future<bool> gunlukOzetAcik() async {
  final p = await SharedPreferences.getInstance();
  return p.getBool('gunlukOzet') ?? false;
}

// İzin ister + konuya abone olur. İzin reddedilirse false.
Future<bool> gunlukOzetAc() async {
  if (!bildirimHazir) return false;
  try {
    final m = FirebaseMessaging.instance;
    final izin = await m.requestPermission();
    if (izin.authorizationStatus == AuthorizationStatus.denied) return false;
    await m.subscribeToTopic(_konu);
    final p = await SharedPreferences.getInstance();
    await p.setBool('gunlukOzet', true);
    return true;
  } catch (_) {
    return false;
  }
}

Future<void> gunlukOzetKapat() async {
  final p = await SharedPreferences.getInstance();
  await p.setBool('gunlukOzet', false);
  if (!bildirimHazir) return;
  try {
    await FirebaseMessaging.instance.unsubscribeFromTopic(_konu);
  } catch (_) {/* çevrimdışı olabilir — tercih kaydedildi, sonraki açılışta denenir */}
}

// Açılışta tercihle aboneliği eşitler (yeniden kurulum/veri silme sonrası).
Future<void> gunlukOzetEsitle() async {
  if (!bildirimHazir) return;
  try {
    if (await gunlukOzetAcik()) await FirebaseMessaging.instance.subscribeToTopic(_konu);
  } catch (_) {/* sessiz */}
}
