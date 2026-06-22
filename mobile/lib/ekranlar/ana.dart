import 'package:flutter/material.dart';
import '../tema.dart';
import '../veri.dart';
import '../parcalar.dart';

class AnaEkran extends StatefulWidget {
  const AnaEkran({super.key});
  @override
  State<AnaEkran> createState() => _AnaEkranState();
}

class _AnaEkranState extends State<AnaEkran> {
  late Future<List<List<Fiyat>>> _veri;

  @override
  void initState() {
    super.initState();
    _veri = Future.wait([yemFiyatlari(), hayvanFiyatlari()]);
  }

  Future<void> _yenile() async {
    setState(() => _veri = Future.wait([yemFiyatlari(), hayvanFiyatlari()]));
    await _veri;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<List<Fiyat>>>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: C.green));
        }
        if (snap.hasError) {
          return Center(child: Text('Veri alınamadı.\n${snap.error}', textAlign: TextAlign.center, style: const TextStyle(color: C.muted)));
        }
        final yem = snap.data![0], hayvan = snap.data![1];
        return RefreshIndicator(
          color: C.green, backgroundColor: C.surface,
          onRefresh: _yenile,
          child: ListView(
            padding: const EdgeInsets.all(14),
            children: [
              bolumBaslik('YEM FİYATLARI'),
              ...yem.map((f) => FiyatKarti(f)),
              const SizedBox(height: 12),
              bolumBaslik('HAYVAN FİYATLARI'),
              ...hayvan.map((f) => FiyatKarti(f)),
              const SizedBox(height: 20),
              const Center(child: Text('Aşağı çekerek yenile · Günlük güncellenir', style: TextStyle(color: C.muted, fontSize: 10))),
            ],
          ),
        );
      },
    );
  }
}
