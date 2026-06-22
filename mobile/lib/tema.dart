import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Marka paleti — web ile birebir aynı (lib/theme.ts RENKLER).
class C {
  static const bg = Color(0xFF080E09);
  static const surface = Color(0xFF0F1A12);
  static const border = Color(0xFF1E3A22);
  static const muted = Color(0xFF506A52);
  static const text = Color(0xFFE8F5EA);
  static const green = Color(0xFF68B890);
  static const red = Color(0xFFE87060);
  static const pos = Color(0xFF4AE870);
}

const yemRenk = {
  'ARPA': Color(0xFFE8A838), 'BUGDAY': Color(0xFFC4722A), 'MISIR': Color(0xFFF0D060),
  'SAMAN': Color(0xFFA0B878), 'YONCA': Color(0xFF68B890), 'YULAF': Color(0xFFD4A0C0), 'CAVDAR': Color(0xFFB8907A),
};
const hayvanRenk = {
  'TOSUN': Color(0xFFE87060), 'DANA': Color(0xFFF09080), 'INEK': Color(0xFFD05040),
  'KUZU': Color(0xFF70A8E8), 'TOKLU': Color(0xFF5090D0), 'KOYUN': Color(0xFF4080C0),
  'MANDA': Color(0xFFC07060), 'OGLAK': Color(0xFF80B870), 'SUT': Color(0xFFF0F0E0),
};

Color urunRenk(String norm) => yemRenk[norm] ?? hayvanRenk[norm] ?? C.green;

ThemeData anadoluTema() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: C.bg,
    colorScheme: base.colorScheme.copyWith(
      primary: C.green, surface: C.surface, secondary: C.green,
    ),
    textTheme: GoogleFonts.ibmPlexMonoTextTheme(base.textTheme).apply(
      bodyColor: C.text, displayColor: C.text,
    ),
    appBarTheme: const AppBarTheme(backgroundColor: C.surface, elevation: 0, centerTitle: false),
  );
}
