import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Marka paleti — açık/koyu temaya göre değişir (paletUygula).
// Değerler sabit DEĞİL; bu renkleri kullanan widget'larda `const` kullanılmaz.
class C {
  static Color bg = const Color(0xFF0A0F0B);
  static Color surface = const Color(0xFF121C15);
  static Color surface2 = const Color(0xFF17241A);
  static Color border = const Color(0xFF223328);
  static Color muted = const Color(0xFF6B8270);
  static Color text = const Color(0xFFEAF3EC);
  static Color green = const Color(0xFF6FD39A);
  static Color orange = const Color(0xFFE8804C);
  static Color red = const Color(0xFFE87060);
  static Color pos = const Color(0xFF4AE870);
}

void paletUygula(bool acik) {
  if (acik) {
    C.bg = const Color(0xFFEFF3EF);
    C.surface = const Color(0xFFFFFFFF);
    C.surface2 = const Color(0xFFF4F7F4);
    C.border = const Color(0xFFDCE4DD);
    C.muted = const Color(0xFF6A7A6E);
    C.text = const Color(0xFF14201A);
    C.green = const Color(0xFF1F8A5B);
    C.orange = const Color(0xFFD2622F);
    C.red = const Color(0xFFC0432F);
    C.pos = const Color(0xFF1F9E4A);
  } else {
    C.bg = const Color(0xFF0A0F0B);
    C.surface = const Color(0xFF121C15);
    C.surface2 = const Color(0xFF17241A);
    C.border = const Color(0xFF223328);
    C.muted = const Color(0xFF6B8270);
    C.text = const Color(0xFFEAF3EC);
    C.green = const Color(0xFF6FD39A);
    C.orange = const Color(0xFFE8804C);
    C.red = const Color(0xFFE87060);
    C.pos = const Color(0xFF4AE870);
  }
}

// Ürün vurgu renkleri (her iki temada da okunur tonlar)
const yemRenk = {
  'ARPA': Color(0xFFD79A2B), 'BUGDAY': Color(0xFFB5651D), 'MISIR': Color(0xFFD9B441),
  'SAMAN': Color(0xFF8FA85F), 'YONCA': Color(0xFF4FA877), 'YULAF': Color(0xFFB98BB0), 'CAVDAR': Color(0xFFA67C5B),
};
const hayvanRenk = {
  'TOSUN': Color(0xFFD9604F), 'DANA': Color(0xFFD97A6A), 'INEK': Color(0xFFC0432F),
  'KUZU': Color(0xFF4F8AD9), 'TOKLU': Color(0xFF3E78C0), 'KOYUN': Color(0xFF3066B0),
  'MANDA': Color(0xFFA85F4F), 'OGLAK': Color(0xFF5FA84F), 'SUT': Color(0xFF8AA0C8),
};
Color urunRenk(String norm) => yemRenk[norm] ?? hayvanRenk[norm] ?? C.green;

const _emoji = {
  'ARPA': '🌾', 'BUGDAY': '🌾', 'MISIR': '🌽', 'SAMAN': '🌿', 'YONCA': '🍀', 'YULAF': '🌾', 'CAVDAR': '🌾',
  'TOSUN': '🐂', 'DANA': '🐄', 'INEK': '🐄', 'MANDA': '🐃', 'KUZU': '🐑', 'TOKLU': '🐑', 'KOYUN': '🐑', 'OGLAK': '🐐', 'SUT': '🥛',
  // girdiler (parite)
  'mazot': '⛽', 'elektrik': '⚡', 'ure': '⚪', 'dap': '🟤',
};
String emoji(String norm) => _emoji[norm] ?? '📦';

ThemeData anadoluTema(bool acik) {
  final base = acik ? ThemeData.light(useMaterial3: true) : ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: C.bg,
    colorScheme: base.colorScheme.copyWith(primary: C.green, surface: C.surface, secondary: C.green),
    textTheme: GoogleFonts.ibmPlexMonoTextTheme(base.textTheme).apply(bodyColor: C.text, displayColor: C.text),
    appBarTheme: AppBarTheme(backgroundColor: C.bg, surfaceTintColor: Colors.transparent, elevation: 0, centerTitle: false),
    dividerColor: C.border,
  );
}
