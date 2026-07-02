import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:home_widget/home_widget.dart';
import 'bicim.dart';
import 'tema.dart';
import 'tercih.dart';
import 'veri.dart';

// Ana ekran widget'ını günceller: kullanıcının ürünlerinden (yoksa
// buğday/arpa/süt) ilk 3'ü + veri tarihi. Fiyatlar geldikçe çağrılır;
// widget eklenmemişse zararsızdır.
Future<void> widgetGuncelle(List<Fiyat> yem, List<Fiyat> hayvan) async {
  if (kIsWeb || !Platform.isAndroid) return;
  try {
    final hepsi = [...yem, ...hayvan].where((f) => f.fiyat != null).toList();
    if (hepsi.isEmpty) return;

    final oncelik = Tercih.urunlerim.isNotEmpty ? Tercih.urunlerim : const ['BUGDAY', 'ARPA', 'SUT'];
    final secim = <Fiyat>[];
    for (final n in oncelik) {
      if (secim.length == 3) break;
      final es = hepsi.where((f) => f.norm == n);
      if (es.isNotEmpty) secim.add(es.first);
    }
    for (final f in hepsi) {
      if (secim.length == 3) break;
      if (!secim.any((s) => s.norm == f.norm)) secim.add(f);
    }

    String? enYeni;
    for (var i = 0; i < 3; i++) {
      final f = i < secim.length ? secim[i] : null;
      await HomeWidget.saveWidgetData<String>('w_ad${i + 1}', f == null ? '' : '${emoji(f.norm)} ${f.ad}');
      await HomeWidget.saveWidgetData<String>('w_f${i + 1}', f == null ? '' : '${formatFiyat(f.fiyat)} ₺');
      if (f != null && (enYeni == null || f.tarih.compareTo(enYeni) > 0)) enYeni = f.tarih;
    }
    await HomeWidget.saveWidgetData<String>('w_tarih', kisaTarih(enYeni));
    await HomeWidget.updateWidget(qualifiedAndroidName: 'com.anadoluborsa.mobile.FiyatWidget');
  } catch (_) {/* widget kurulmamış olabilir — sessiz */}
}
