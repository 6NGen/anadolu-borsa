import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Marka paleti. Açık/koyu temaya göre değerler değişir (paletUygula).
// Not: değerler sabit (const) DEĞİL — bu yüzden bu renkleri kullanan
// widget'larda `const` kullanılmaz.
class C {
  static Color bg = const Color(0xFF080E09);
  static Color surface = const Color(0xFF0F1A12);
  static Color border = const Color(0xFF1E3A22);
  static Color muted = const Color(0xFF506A52);
  static Color text = const Color(0xFFE8F5EA);
  static Color green = const Color(0xFF68B890);
  static Color red = const Color(0xFFE87060);
  static Color pos = const Color(0xFF4AE870);
}

void paletUygula(bool acik) {
  if (acik) {
    C.bg = const Color(0xFFF3F6F3);
    C.surface = const Color(0xFFFFFFFF);
    C.border = const Color(0xFFD6E0D8);
    C.muted = const Color(0xFF5E6E60);
    C.text = const Color(0xFF16201A);
    C.green = const Color(0xFF2F9E6E);
    C.red = const Color(0xFFC0432F);
    C.pos = const Color(0xFF2BA84A);
  } else {
    C.bg = const Color(0xFF080E09);
    C.surface = const Color(0xFF0F1A12);
    C.border = const Color(0xFF1E3A22);
    C.muted = const Color(0xFF506A52);
    C.text = const Color(0xFFE8F5EA);
    C.green = const Color(0xFF68B890);
    C.red = const Color(0xFFE87060);
    C.pos = const Color(0xFF4AE870);
  }
}

// Ürün vurgu renkleri her iki temada da aynı
const yemRenk = {
  'ARPA': Color(0xFFE8A838), 'BUGDAY': Color(0xFFC4722A), 'MISIR': Color(0xFFF0D060),
  'SAMAN': Color(0xFFA0B878), 'YONCA': Color(0xFF68B890), 'YULAF': Color(0xFFD4A0C0), 'CAVDAR': Color(0xFFB8907A),
};
const hayvanRenk = {
  'TOSUN': Color(0xFFE87060), 'DANA': Color(0xFFF09080), 'INEK': Color(0xFFD05040),
  'KUZU': Color(0xFF70A8E8), 'TOKLU': Color(0xFF5090D0), 'KOYUN': Color(0xFF4080C0),
  'MANDA': Color(0xFFC07060), 'OGLAK': Color(0xFF80B870), 'SUT': Color(0xFFB0B090),
};

Color urunRenk(String norm) => yemRenk[norm] ?? hayvanRenk[norm] ?? C.green;

ThemeData anadoluTema(bool acik) {
  final base = acik ? ThemeData.light(useMaterial3: true) : ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: C.bg,
    colorScheme: base.colorScheme.copyWith(primary: C.green, surface: C.surface, secondary: C.green),
    textTheme: GoogleFonts.ibmPlexMonoTextTheme(base.textTheme).apply(bodyColor: C.text, displayColor: C.text),
    appBarTheme: AppBarTheme(backgroundColor: C.surface, elevation: 0, centerTitle: false),
  );
}
