import 'package:flutter/material.dart';
import '../tema.dart';
import '../sabitler.dart';
import '../tercih.dart';

// "Ne üretiyorsun?" — kişiselleştirme seçici.
// İlk kurulumda tam ekran karşılama olarak, sonra Ayarlar'dan açılır.
class UrunSecEkran extends StatefulWidget {
  final bool ilkKurulum;
  const UrunSecEkran({super.key, this.ilkKurulum = false});
  @override
  State<UrunSecEkran> createState() => _UrunSecEkranState();
}

class _UrunSecEkranState extends State<UrunSecEkran> {
  late final Set<String> _secili = {...Tercih.urunlerim};

  Future<void> _bitir() async {
    Tercih.urunlerim = _secili.toList();
    Tercih.kurulumTamam = true;
    await Tercih.kaydet();
    if (mounted) Navigator.pop(context);
  }

  Widget _grup(String baslik, Iterable<String> normlar) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 10),
        child: Text(baslik, style: TextStyle(color: C.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: FontWeight.w600)),
      ),
      Wrap(
        spacing: 8, runSpacing: 8,
        children: normlar.map((n) {
          final aktif = _secili.contains(n);
          final renk = urunRenk(n);
          return GestureDetector(
            onTap: () => setState(() => aktif ? _secili.remove(n) : _secili.add(n)),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 130),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: aktif ? renk.withValues(alpha: 0.22) : C.surface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: aktif ? renk : C.border, width: aktif ? 1.6 : 1),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(emoji(n), style: const TextStyle(fontSize: 15)),
                const SizedBox(width: 6),
                Text(tumUrunler[n] ?? n, style: TextStyle(color: aktif ? C.text : C.muted, fontSize: 13, fontWeight: aktif ? FontWeight.w700 : FontWeight.w500)),
                if (aktif) ...[
                  const SizedBox(width: 5),
                  Icon(Icons.check_rounded, size: 15, color: renk),
                ],
              ]),
            ),
          );
        }).toList(),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final yem = tumUrunler.keys.where((n) => !hayvanNormlari.contains(n));
    final hayvan = tumUrunler.keys.where(hayvanNormlari.contains);

    return Scaffold(
      appBar: AppBar(
        title: Text('ÜRÜNLERİM', style: TextStyle(color: C.green, fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 1)),
        iconTheme: IconThemeData(color: C.muted),
        automaticallyImplyLeading: !widget.ilkKurulum,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.ilkKurulum) ...[
            Text('Hoş geldin! 🌾', style: TextStyle(color: C.text, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
          ],
          Text(
            'Ne üretiyorsun? Seçtiklerin her ekranda en üstte gösterilir. Hiç seçmezsen tüm fiyatlar aynı sırayla listelenir.',
            style: TextStyle(color: C.muted, fontSize: 12.5, height: 1.5),
          ),
          _grup('TARIM / HUBUBAT', yem),
          _grup('HAYVANCILIK', hayvan),
          const SizedBox(height: 90),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Row(children: [
            if (widget.ilkKurulum)
              TextButton(
                onPressed: _bitir,
                child: Text('Atla', style: TextStyle(color: C.muted, fontSize: 13)),
              ),
            const Spacer(),
            FilledButton(
              onPressed: _bitir,
              style: FilledButton.styleFrom(backgroundColor: C.green, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 13)),
              child: Text(
                _secili.isEmpty ? 'Devam et' : '${_secili.length} ürünle devam et',
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
