import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Kullanıcı tercihleri — kişiselleştirmenin tek kaynağı.
// surum artınca uygulama kökü yeniden çizilir (main ValueListenableBuilder).
class Tercih {
  static List<String> urunlerim = [];
  static bool buyukYazi = false;
  static bool kurulumTamam = false; // ilk açılış ürün seçimi yapıldı mı (atlansa bile true)

  static final surum = ValueNotifier<int>(0);

  static Future<void> yukle() async {
    final p = await SharedPreferences.getInstance();
    urunlerim = p.getStringList('urunlerim') ?? [];
    buyukYazi = p.getBool('buyukYazi') ?? false;
    kurulumTamam = p.getBool('kurulumTamam') ?? false;
  }

  static Future<void> kaydet() async {
    final p = await SharedPreferences.getInstance();
    await p.setStringList('urunlerim', urunlerim);
    await p.setBool('buyukYazi', buyukYazi);
    await p.setBool('kurulumTamam', kurulumTamam);
    surum.value++;
  }

  // Listeyi kullanıcının ürünleri önce gelecek şekilde sıralar (kalanlar mevcut sırada).
  static List<T> onceUrunlerim<T>(List<T> liste, String Function(T) normu) {
    if (urunlerim.isEmpty) return liste;
    final benim = <T>[], diger = <T>[];
    for (final e in liste) {
      (urunlerim.contains(normu(e)) ? benim : diger).add(e);
    }
    benim.sort((a, b) => urunlerim.indexOf(normu(a)).compareTo(urunlerim.indexOf(normu(b))));
    return [...benim, ...diger];
  }
}
