import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../tema.dart';
import '../bicim.dart';
import '../veri.dart';
import '../parcalar.dart';

// ÇİFTÇİ DEFTERİ (prototip/ciftci_defteri_demo.html'in canlı-veri portu).
// "Bu sezon ne kazandım?" — sürü/tarla kaba gelir-gider hesabı.
// İLKELER: fiyatlar CANLI borsadan gelir ama DÜZENLENEBİLİR (saha fiyatı
// farklı olabilir — yol haritası 0.1); varsayımlar açık yazılır; tavsiye YOK;
// affiliate/gelir kutusu YOK (Faz 2 kuralı). Girdiler cihazda saklanır.

// Dönüm başı varsayılanlar (prototip ile aynı; kullanıcı düzenler)
const _verimVarsayilan = {'BUGDAY': 450.0, 'ARPA': 400.0, 'MISIR': 900.0}; // kg/dönüm
const _girdiVarsayilan = {'BUGDAY': 1850.0, 'ARPA': 1600.0, 'MISIR': 2400.0}; // TL/dönüm

class DefterEkran extends StatefulWidget {
  const DefterEkran({super.key});
  @override
  State<DefterEkran> createState() => _DefterEkranState();
}

class _DefterEkranState extends State<DefterEkran> {
  late Future<List<Fiyat>> _veri;
  bool _suruSekmesi = true;

  // Sürü girdileri
  final _adet = TextEditingController();
  bool _sutInegi = true;
  final _sutLitre = TextEditingController(text: '15');
  final _yemGider = TextEditingController(text: '260');
  final _sutFiyat = TextEditingController(); // canlıdan önceden doldurulur

  // Tarla girdileri
  String _urun = 'BUGDAY';
  final _donum = TextEditingController();
  final _verim = TextEditingController();
  final _girdi = TextEditingController();
  final _urunFiyat = TextEditingController(); // canlıdan önceden doldurulur
  String? _fiyatKaynak;
  bool _fiyatlarDolduruldu = false;

  @override
  void initState() {
    super.initState();
    _veri = _yukle();
    _kayitliYukle();
  }

  Future<List<Fiyat>> _yukle() async {
    final r = await Future.wait([yemFiyatlari(), hayvanFiyatlari()]);
    return [...r[0], ...r[1]];
  }

  Future<void> _kayitliYukle() async {
    final p = await SharedPreferences.getInstance();
    setState(() {
      _adet.text = p.getString('defter_adet') ?? '';
      _sutInegi = p.getBool('defter_sut_inegi') ?? true;
      _sutLitre.text = p.getString('defter_sut_litre') ?? '15';
      _yemGider.text = p.getString('defter_yem_gider') ?? '260';
      _urun = p.getString('defter_urun') ?? 'BUGDAY';
      _donum.text = p.getString('defter_donum') ?? '';
      _verim.text = p.getString('defter_verim') ?? '';
      _girdi.text = p.getString('defter_girdi') ?? '';
    });
  }

  Future<void> _kaydet() async {
    final p = await SharedPreferences.getInstance();
    await p.setString('defter_adet', _adet.text);
    await p.setBool('defter_sut_inegi', _sutInegi);
    await p.setString('defter_sut_litre', _sutLitre.text);
    await p.setString('defter_yem_gider', _yemGider.text);
    await p.setString('defter_urun', _urun);
    await p.setString('defter_donum', _donum.text);
    await p.setString('defter_verim', _verim.text);
    await p.setString('defter_girdi', _girdi.text);
  }

  @override
  void dispose() {
    for (final c in [_adet, _sutLitre, _yemGider, _sutFiyat, _donum, _verim, _girdi, _urunFiyat]) {
      c.dispose();
    }
    super.dispose();
  }

  double? _oku(TextEditingController c) {
    final v = double.tryParse(c.text.replaceAll(',', '.'));
    return (v == null || v <= 0) ? null : v;
  }

  // Canlı fiyatları alanlara bir kez doldur (kullanıcı sonra düzenleyebilir)
  void _fiyatlariDoldur(List<Fiyat> liste) {
    if (_fiyatlarDolduruldu) return;
    _fiyatlarDolduruldu = true;
    final sut = liste.where((f) => f.norm == 'SUT' && f.fiyat != null).firstOrNull;
    if (sut != null) _sutFiyat.text = sut.fiyat!.toStringAsFixed(2).replaceAll('.', ',');
    _urunFiyatiDoldur(liste);
    if (_verim.text.isEmpty) _verim.text = _verimVarsayilan[_urun]!.toStringAsFixed(0);
    if (_girdi.text.isEmpty) _girdi.text = _girdiVarsayilan[_urun]!.toStringAsFixed(0);
  }

  void _urunFiyatiDoldur(List<Fiyat> liste) {
    final f = liste.where((x) => x.norm == _urun && x.fiyat != null).firstOrNull;
    _fiyatKaynak = f?.kaynak;
    if (f != null) _urunFiyat.text = f.fiyat!.toStringAsFixed(2).replaceAll('.', ',');
  }

  Widget _alan(String etiket, TextEditingController c, {String? sonek, String? ipucu}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Expanded(
          flex: 3,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(etiket, style: TextStyle(color: C.text, fontSize: 12.5, fontWeight: FontWeight.w600)),
            if (ipucu != null)
              Text(ipucu, style: TextStyle(color: C.muted, fontSize: 10)),
          ]),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 2,
          child: TextField(
            controller: c,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
            onChanged: (_) {
              setState(() {});
              _kaydet();
            },
            textAlign: TextAlign.right,
            style: TextStyle(color: C.text, fontSize: 15, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              suffixText: sonek,
              suffixStyle: TextStyle(color: C.muted, fontSize: 11),
              isDense: true,
              filled: true, fillColor: C.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: BorderSide(color: C.border)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: BorderSide(color: C.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: BorderSide(color: C.green, width: 1.5)),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _kalem(String ad, String detay, double tutar, {required bool gider}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(ad, style: TextStyle(color: C.text, fontSize: 13, fontWeight: FontWeight.w600)),
          Text(detay, style: TextStyle(color: C.muted, fontSize: 10)),
        ])),
        Text('${gider ? '−' : '+'}${formatFiyat(tutar, 0)} ₺',
            style: TextStyle(color: gider ? C.red : C.pos, fontSize: 14.5, fontWeight: FontWeight.w800)),
      ]),
    );
  }

  Widget _netKutu(String etiket, double? net, {bool sadeceGider = false}) {
    final renk = sadeceGider ? C.text : (net == null ? C.muted : (net >= 0 ? C.pos : C.red));
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: net == null ? C.border : renk.withValues(alpha: 0.6), width: 1.5),
        borderRadius: BorderRadius.circular(11),
      ),
      child: Row(children: [
        Expanded(child: Text(etiket, style: TextStyle(color: C.text, fontSize: 14, fontWeight: FontWeight.w800))),
        Text(
          net == null ? '—' : '${!sadeceGider && net >= 0 ? '+' : ''}${formatFiyat(net, 0)} ₺',
          style: TextStyle(color: renk, fontSize: 21, fontWeight: FontWeight.w800),
        ),
      ]),
    );
  }

  void _paylas(String metin) {
    SharePlus.instance.share(ShareParams(text: '$metin\n(Anadolu Borsa Çiftçi Defteri — güncel borsa fiyatlarıyla kaba hesap)\n$siteUrl'));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Fiyat>>(
      future: _veri,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return yukleniyor();
        if (snap.hasError) return hataKutusu(snap.error);
        final liste = snap.data ?? [];
        _fiyatlariDoldur(liste);

        return ListView(
          padding: const EdgeInsets.all(14),
          children: [
            Text('Bu sezon ne kazandım?', style: TextStyle(color: C.text, fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 3),
            Text('Sürünü ya da tarlanı yaz — hesap güncel fiyatlarla, tüm değerler düzenlenebilir.',
                style: TextStyle(color: C.muted, fontSize: 11.5, height: 1.4)),
            const SizedBox(height: 14),

            Row(children: [
              Cip('🐄 Sürü', _suruSekmesi, C.green, () => setState(() => _suruSekmesi = true)),
              Cip('🌾 Tarla', !_suruSekmesi, C.green, () => setState(() => _suruSekmesi = false)),
            ]),
            const SizedBox(height: 12),

            if (_suruSekmesi) ..._suruIcerik() else ..._tarlaIcerik(liste),

            const SizedBox(height: 14),
            Text(
              'Kaba hesaptır: yem rasyonu, verim ve saha fiyatı işletmeye göre değişir — bu yüzden her değer düzenlenebilir. Tavsiye değil, fiyat aynası.',
              style: TextStyle(color: C.muted, fontSize: 10, height: 1.5),
            ),
            const SizedBox(height: 70),
          ],
        );
      },
    );
  }

  List<Widget> _suruIcerik() {
    final adet = _oku(_adet);
    final yem = _oku(_yemGider);
    final sutL = _oku(_sutLitre);
    final sutF = _oku(_sutFiyat);

    final gider = (adet != null && yem != null) ? adet * yem * 30 : null;
    final gelir = (_sutInegi && adet != null && sutL != null && sutF != null) ? adet * sutL * 30 * sutF : null;
    final net = (gider != null && gelir != null) ? gelir - gider : null;

    return [
      Row(children: [
        Cip('Süt ineği', _sutInegi, C.green, () {
          setState(() => _sutInegi = true);
          _kaydet();
        }),
        Cip('Besi (tosun/dana)', !_sutInegi, C.green, () {
          setState(() => _sutInegi = false);
          _kaydet();
        }),
      ]),
      const SizedBox(height: 10),
      _alan('Kaç büyükbaş var?', _adet, sonek: 'baş'),
      _alan('Yem gideri', _yemGider, sonek: '₺/gün·baş', ipucu: 'rasyonuna göre düzenle'),
      if (_sutInegi) ...[
        _alan('İnek başına günlük süt', _sutLitre, sonek: 'litre'),
        _alan('Süt satış fiyatın', _sutFiyat, sonek: '₺/litre', ipucu: 'USK tavsiyesi önden yazıldı — sahada farklıysa değiştir'),
      ],

      const SizedBox(height: 6),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.border)),
        child: Column(children: [
          if (gider != null)
            _kalem('Yem gideri', '${_adet.text} baş × ${_yemGider.text} ₺ × 30 gün', gider, gider: true),
          if (_sutInegi && gelir != null)
            _kalem('Süt geliri', '${_adet.text} × ${_sutLitre.text} lt × 30 gün × ${_sutFiyat.text} ₺', gelir, gider: false),
          if (!_sutInegi && gider != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Besi geliri satışta (sezonluk) oluşur — aylık tabloda yalnızca gider izlenir.',
                  style: TextStyle(color: C.muted, fontSize: 10.5, height: 1.4)),
            ),
          if (gider == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text('Baş sayısını gir, hesap kendiliğinden çıkar.', style: TextStyle(color: C.muted, fontSize: 12)),
            ),
        ]),
      ),
      if (_sutInegi)
        _netKutu('Aylık Net', net)
      else if (gider != null)
        _netKutu('Aylık Yem Gideri', -gider, sadeceGider: true),
      if ((_sutInegi && net != null) || (!_sutInegi && gider != null))
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: () => _paylas(_sutInegi
                ? '🐄 ${_adet.text} başlık sürüm bu ay ≈ ${net! >= 0 ? '+' : ''}${formatFiyat(net, 0)} ₺'
                : '🐂 ${_adet.text} baş besinin aylık yem gideri ≈ ${formatFiyat(gider!, 0)} ₺'),
            icon: Icon(Icons.ios_share_rounded, size: 16, color: C.green),
            label: Text('Paylaş', style: TextStyle(color: C.green, fontSize: 12)),
          ),
        ),
    ];
  }

  List<Widget> _tarlaIcerik(List<Fiyat> liste) {
    final donum = _oku(_donum);
    final verim = _oku(_verim);
    final girdi = _oku(_girdi);
    final fiyat = _oku(_urunFiyat);

    final gider = (donum != null && girdi != null) ? donum * girdi : null;
    final kg = (donum != null && verim != null) ? donum * verim : null;
    final gelir = (kg != null && fiyat != null) ? kg * fiyat : null;
    final net = (gider != null && gelir != null) ? gelir - gider : null;
    final urunAd = {'BUGDAY': 'Buğday', 'ARPA': 'Arpa', 'MISIR': 'Mısır'}[_urun]!;

    return [
      Wrap(children: [
        for (final n in ['BUGDAY', 'ARPA', 'MISIR'])
          Cip({'BUGDAY': 'Buğday', 'ARPA': 'Arpa', 'MISIR': 'Mısır'}[n]!, _urun == n, urunRenk(n), () {
            setState(() {
              _urun = n;
              _verim.text = _verimVarsayilan[n]!.toStringAsFixed(0);
              _girdi.text = _girdiVarsayilan[n]!.toStringAsFixed(0);
              _urunFiyatiDoldur(liste);
            });
            _kaydet();
          }),
      ]),
      const SizedBox(height: 10),
      _alan('Kaç dönüm ektin?', _donum, sonek: 'dönüm'),
      _alan('Beklenen verim', _verim, sonek: 'kg/dönüm', ipucu: 'ortalama tahmin — toprağına göre düzenle'),
      _alan('Girdi gideri', _girdi, sonek: '₺/dönüm', ipucu: 'tohum + gübre + mazot + ilaç toplamı'),
      _alan('$urunAd satış fiyatı', _urunFiyat, sonek: '₺/kg',
          ipucu: _fiyatKaynak != null ? 'bugünkü $_fiyatKaynak borsası önden yazıldı' : 'güncel borsa fiyatı'),

      const SizedBox(height: 6),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: C.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.border)),
        child: Column(children: [
          if (gider != null)
            _kalem('Girdi gideri', '${_donum.text} dönüm × ${_girdi.text} ₺', gider, gider: true),
          if (gelir != null)
            _kalem('Hasat geliri (tahmini)', '${formatFiyat(kg, 0)} kg × ${_urunFiyat.text} ₺', gelir, gider: false),
          if (gider == null && gelir == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text('Dönüm sayısını gir, hesap kendiliğinden çıkar.', style: TextStyle(color: C.muted, fontSize: 12)),
            ),
        ]),
      ),
      _netKutu('Sezon Net (tahmini)', net),
      if (net != null)
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: () => _paylas('🌾 ${_donum.text} dönüm ${urunAd.toLowerCase()} bu sezon ≈ ${net >= 0 ? '+' : ''}${formatFiyat(net, 0)} ₺'),
            icon: Icon(Icons.ios_share_rounded, size: 16, color: C.green),
            label: Text('Paylaş', style: TextStyle(color: C.green, fontSize: 12)),
          ),
        ),
    ];
  }
}
