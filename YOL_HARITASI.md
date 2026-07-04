# ANADOLU BORSA — YOL HARİTASI & EYLEM PLANI
# Tarih: 2026-06-13 · Founder: Ömer Faruk Durna (6NGen)
# Bu bir PLAN değil, bir PUSULA + faz faz eylem listesidir.
# Tek cümlelik kuzey yıldızı aşağıda; her karar ona göre verilir.

═══════════════════════════════════════════════════════════════
KUZEY YILDIZI
═══════════════════════════════════════════════════════════════
"Türkiye'de bir çiftçi fiyata bakacaksa Anadolu Borsa'ya baksın."
Bu tek cümle kazanılana kadar BAŞKA HİÇBİR ŞEY yok.
Her özellik, her saat şunu sorar: bu, o cümleye hizmet ediyor mu?
Etmiyorsa — ne kadar parlak olursa olsun — şimdi değil.

═══════════════════════════════════════════════════════════════
STRATEJİK TEMEL (neden bu sıra)
═══════════════════════════════════════════════════════════════
İki varlık, iki farklı değer:
• ANADOLU BORSA = düşük hendek, düşük sürtünme → GÜNLÜK KAPI.
  Herkes fiyat scraper'ı yazabilir; avantaj veri disiplini + güven.
  Değeri: çiftçiyi her gün geri getiren tek mecra olmak.
• EKİPMAN/PARÇA MODÜLÜ = yüksek hendek (mühendis+çiftçi+KOBİ
  kesişimi, Türkiye'de nadir), ama yüksek sürtünme, seyrek ihtiyaç.
  Tek başına kullanıcı bulamaz; her gün açılan uygulamanın İÇİNDE bulur.

Sonuç: Kapı önce sağlamlaşır, derin oda sonra onun içine eklenir.
Üç sacayağı (üretim araçları / ürün / çıktı) tek platformun organları —
ama sırayla, güven biriktikçe, talep geldikçe.

ÜÇ SACAYAĞI ↔ ÜÇ İŞ MODELİ (vizyon, ufukta):
2. Ürün fiyatı     → emtia eşleştirme/yönlendirme (komisyon)
3. Üretim araçları → ekipman sağlığı + parça yönlendirme (senin hendeğin)
4. Çıktı           → satış kanalına yönlendirme (komisyon)
Ortak payda: ENVANTER TUTMA, sadece doğru tarafları buluştur (Sahibinden
modeli). Tüm bunlar GÜVEN katmanının çocuğu — ondan önce doğamaz.

═══════════════════════════════════════════════════════════════
FAZ 0 — GÜVEN TEMELİ  (ŞİMDİ → ~4 hafta) · EN KRİTİK
Amaç: Kuzey yıldızı cümlesini kazanmak. Hiç atlanmaz.
═══════════════════════════════════════════════════════════════

## 0.1 Veri doğruluğu — "yarı fiyat" yarası (EN ACİL)
Saha gerçeği: et ESK ile ~%50, süt doğrudan satışta ~40₺ vs USK 24,30.
Resmi referanslar sahanın altında → çiftçi sürüsünü yanlış görüyor →
güven daha doğmadan ölür.
[x] Sürü hesaplayıcı: fiyat + karkas kg KULLANICI DÜZENLENEBİLİR;
    varsayılan ESK, etiket "ESK alım fiyatı — pazarın farklıysa düzenle"
[ ] /hayvan başlığı bağlam satırı: "ESK alım (taban) fiyatıdır"
[ ] Süt: "USK tavsiye fiyatı (üreticiden sanayiye) — doğrudan/saha
    fiyatı belirgin farklı olabilir" notu /hayvan + /parite + /metodoloji
[ ] UKON scraper TAMİRİ — serbest piyasa karkasını gösteren tek kaynak;
    0 dönüyor; ESK ile yan yana düşünce fark kendini anlatır

## 0.2 Scraper dayanıklılığı (uykunu kaçıran haklı dert)
[ ] VERI_GUVENLIK.md'yi tamamla — Telegram + 4 koruma katmanı:
    tutarlılık (%15), regresyon, kaynaklar.json, restore.py
[ ] ÖNCE: Telegram token + chat_id + GitHub Secrets (10 dk, SENDE)
[x] keepalive.yml zaten kuruldu ✅ (60 gün sessiz ölüm önlendi)

## 0.3 Dürüstlük & hukuk kalkanı
[x] /metodoloji yayında ✅
[ ] AVUKAT — 2 soru: "borsa" ibaresi (SPK) + TOBB verisi yeniden yayın
    (FSEK). Kartlar yayılmadan ÖNCE — sonra rebrand felaket.
[ ] DOMAIN KARARI (borsa cevabıyla birlikte)
[ ] TOBB + ESK + USK'ya iş birliği/izin e-postası (cevap ne olursa kazanç)

## 0.4 İnce piyasa bağlamı (Çorum 11 vs Eskişehir 15 dersi)
[x] islem_miktari göster: "15,21 ₺ · 340 ton"; <20 ton → "düşük hacim"
    (manşet sayı sıçramalarının dürüst açıklaması — kart güveni için şart)

FAZ 0 BİTTİ Mİ? → Bir çiftçi sürüsünü/ürününü GERÇEK fiyatıyla görüyor,
scraper sessiz kırılamıyor, hukuki zemin net. Ancak o zaman Faz 1.

═══════════════════════════════════════════════════════════════
FAZ 1 — GÜNLÜK ALIŞKANLIK  (~4-8 hafta) · KAPIYI ÇALIŞTIR
Amaç: Çiftçi her gün açsın. Tutma > büyüme.
═══════════════════════════════════════════════════════════════

## 1.1 Dağıtım — viral motoru ateşle (HASAT PENCERESİ AÇIK)
[x] OG paylaşım kartları ✅ (parite/fiyat/hedef, eşikli 409, 4 sayfa)
[ ] YOUTUBE TOHUMLAMA: 6NGenisLife'ta 60sn Shorts — "1 traktör kaç ton
    arpa", "Çorum 11 / Eskişehir 15 neden" → kart → site. Mevcut kanal =
    bedava soğuk başlangıç çözümü. Hasat döneminde 2-3 video.
[ ] Dağıtım tohum listesi: çiftçi WhatsApp/FB grupları, ziraat odaları,
    tarım gazetecileri — mazot/fiyat haberi günü kart atılacak liste

## 1.2 Geri getiren kanca: Giriş + Fiyat Alarmı (PART5)
[x] Bölgem (localStorage kişiselleşme, auth'suz ısınma)
[x] Giriş: Google OAuth (telefon OTP maliyet nedeniyle iptal edildi)
[x] Fiyat bildirimi açılışı (form) + hayvan/süt ürünleri
[x] "Resmi vs Gerçek" PiyasaKarti — yaranın çözümü ürünleşiyor:
    binlerce bildirim = Türkiye'nin yayınlanmayan GERÇEK fiyat haritası
[x] FCM alarm web ✅ + mobil günlük özet push ✅ (v1.3)

## 1.3 SEO — kalıcı kanal
[x] sitemap + robots + JSON-LD + dinamik fiyatlı başlıklar ✅
[ ] Birikme: scraper her gün gerçek tarihsel seri yazıyor — kimsede yok

FAZ 1 BİTTİ Mİ? → Bir çiftçi uygulamayı haftada birkaç kez kendiliğinden
açıyor (alarm + günlük fiyat). DAU/tutma görünür. Ancak o zaman Faz 2.

═══════════════════════════════════════════════════════════════
FAZ 2 — DERİNLEŞME & İLK MONETİZASYON  (~2-4 ay) · GÜVEN OTURUNCA
Amaç: Kazanılan güveni yönlendirmeye çevir. Hayal satma, doğal adım at.
═══════════════════════════════════════════════════════════════

## 2.1 Veri genişlemesi (PART6 — eldeki veri ailesi)
[~] Gübre paneli (Gübretaş resmi + kullanıcı bildirimi) + mazot/gübre parite
[x] Borsa karşılaştırma bloğu + kartı (Çorum/Eskişehir yan yana)
[x] Ekim maliyeti hesaplayıcı (lib/maliyet saf — Sanal Tarla motoru)
[ ] Harita: TÜİK üretim katmanı + (PART5) fiyat katmanı altyapısı
    GRANÜLERLİK FAZLI: il bazı fiyat verisi şimdi YOK →
    Faz A: 7 coğrafi bölge bazında choropleth (mevcut veriyle anlamlı)
    Faz B: fiyat-bildir biriktikçe hücreler il bazına ayrışır
    Şema baştan PLAKA KODU (1-81) anahtarlı kurulsun (il-uyumlu).
    Flywheel: kullanıcı bölgesini bildirir → harita ısınır → görmek
    için yeni kullanıcı → daha çok rapor. fiyat-bildir motoru besler.
    Teknik: react-simple-maps veya D3+TopoJSON (hafif, tile bağımlılığı
    yok); il sınırı GeoJSON serbest. Bu harita AYNI ZAMANDA B2B verinin
    canlı demosu (2.3-c).

## 2.2 İLK İŞ MODELİ — Emtia Yönlendirme (Sacayağı 2 & 4)
Çiftçinin acısı: ürünü nakde çevirmek. Çözüm: SATIŞ DEĞİL, YÖNLENDİRME.
[ ] "Arpan var mı? Bu hafta şu borsalar/alıcılar şu fiyatı veriyor"
    — ilan değil, fiyat kıyaslamasının doğal uzantısı
[ ] Komisyon/yönlendirme modeli — envanter yok, lojistik yok
ÖN KOŞUL: 1.2'deki fiyat güveni. Güvenmediği fiyattan yönlendirme dinlenmez.

## 2.3 GELİR KATMANLARI (fazlar korundu)
NEDEN ŞİMDİ DEĞİL, FAZ 2: Reklam/affiliate güven OTURMADAN konursa
"bunlar para için kurmuş" algısı → güveni satın alınmış gösterir, ters
teper. Çiftçi sürüsünü hâlâ yarı fiyattan görürken (Faz 0 yarası)
sayfada yem reklamı = felaket. Sıra değişmez: güven → alışkanlık → gelir.

Reddedilen yollar (TEKRAR AÇILMASIN):
✗ Facebook Marketplace scrape → hayvan paritesi: API yok, birim
  uyuşmazlığı (TL/baş vs TL/kg), istek≠satış fiyatı, kırılgan+bakım yükü.
✗ FB ilan yönlendirme komisyonu: C2C, ödeyecek marka yok, yine scrape gerek.
✗ Tam marketplace'e dönüşme: iki taraflı cold-start = solo'nun en zor işi
  (arıcılık platformunda bu duvara çarpıldı). Rafta, sonraya.

Seçilen gelir modelleri (DÜŞÜK→YÜKSEK kaldıraç, hepsi Faz 2+):
[ ] a) AdSense — pasif zemin. Anasayfa/genel endeks gibi NİYETİ DAĞINIK
    sayfalarda. Türkçe RPM düşük (~5-15₺/1000), kira bekleme; bir günlük
    iş, pasif çalışsın. Ödeme eşiği ~2000₺, gelir beyanı gerekir.
[ ] b) Affiliate [ODAK 1] — ürünü sen seç, satıştan komisyon (~%3-10).
    Az trafikle çalışır çünkü kitle "alım modunda". Sayfa→ürün eşleşmesi:
    • Hayvan sayfaları (en yüksek dönüşüm): yem, yalama taşı, veteriner
      malzeme, kulak küpesi, suluk, sağım makinesi, ağıl ekipmanı
    • Hububat: tohum, gübre, ilaçlama pompası, silo torbası, damla sulama
    • Süt: sağım/soğutma ekipmanı, meme hijyeni
    • fiyat-bildir SONUÇ EKRANI = gizli altın: kullanıcı eylem yaptı,
      dikkati sende → bildirdiği kategoriye 1-2 ekipman önerisi.
    Program: Hepsiburada/Trendyol/Amazon TR satış ortaklığı + takip linki.
[ ] c) B2B Veri/API [ODAK 2, en yüksek kaldıraç] — Naval specific-knowledge
    modeli. Temiz zaman serili fiyat endeksi başlı başına ürün. Müşteri:
    yem fabrikaları, tüccar, kooperatif, tarım kredisi veren banka.
    Build ucuz (veri zaten Supabase'de, üstüne ince API katmanı). Asıl
    efor SATIŞ ama hedefli: kitle değil, 3-5 KURUMLA konuşmak. Cold-start
    yok. 2.2'deki emtia yönlendirmenin kurumsal/ölçekli hali.
    Harita (PART6) bu verinin canlı demosu — tüccarın para vereceği şey.

## 2.4 TARIM BİLGİ ASİSTANI (RAG — model EĞİTİMİ YOK, küratörlü bilgi tabanı)

MİMARİ NETLİĞİ (yaygın yanlış anlama düzeltmesi):
- Model SIFIRDAN EĞİTİLMEZ, FINE-TUNE EDİLMEZ. Hazır model (Claude API)
  "kiralık beyin" gibi çağrılır. Model senin sunucunda çalışmaz; her soru
  API'ye HTTP isteğiyle gider, cevap döner.
- "Kendine has"lık modelin ağırlıklarında DEĞİL, senin küratörlüğünü
  yaptığın BİLGİ TABANINDA yaşar. Model sabit kalır, BİLGİ büyür.
- Model DEĞİŞTİRİLEBİLİR parça: motor değişebilir, bilgi tabanı kalır.
- Gerçek hazine: ÇİFTÇİNİN NE SORDUĞU — gerçek dilde, gerçek dert.

İKİ BİLGİ KAYNAĞI (RAG):
a) Canlı veri: Supabase'deki güncel fiyat/parite/tarihsel seri.
b) Küratörlü bilgi tabanı: BILGI_TABANI dosyası (founder'ın mühendis+
   çiftçi+saha bilgisi). Bu = Naval "specific knowledge", kopyalanamayan kısım.

ÜÇ DEMİR KURAL:
1. TAVSİYE DEĞİL BİLGİ: ansiklopedik EVET; teşhis/al-sat HAYIR.
2. UYDURMASIN: sayısal/teknik soruda SADECE doğrulanmış bilgi tabanından;
   tabanda yoksa "ziraat mühendisi/veterinere sorun".
3. MALİYET KONTROLÜ: gelirden ÖNCE açılmaz.

MALİYET MİMARİSİ: model kademesi (basit→Haiku), önbellek, API'siz cevap
(fiyat DB'den), kullanıcı başı günlük limit, premium arkasında.

NEDEN FAZ 2: (1) her sohbet API parası; (2) yanlış veriyi inandırıcı
yapar — ancak veri güvenilir olunca güvenli; (3) alışkanlığı GÜÇLENDİRİR,
YARATMAZ.

BUGÜN BAŞLANABİLİR (bedava, kod yok): BILGI_TABANI dosyasını doldur.

## 2.5 SAHA DOĞRULAMASI (kod yazmadan)
[ ] 10 çiftçi görüşmesi: "GERÇEKTE kaça satıyorsun?" + "Premium'a para
    verir misin?" + "tarlanı uygulamada takip eder miydin?" + B2B: hangi
    kurum bu veriye para verir?

FAZ 2 BİTTİ Mİ? → İlk gelir akıyor, saha kitleyi doğruladı, B2B için
3-5 kurum listesi/ilk görüşme var.

═══════════════════════════════════════════════════════════════
FAZ 3 — DERİN ODA: EKİPMAN/PARÇA  (~4-6 ay+) · SENİN HENDEĞİN
═══════════════════════════════════════════════════════════════
Soğuk başlangıç Faz 1'in günlük alışkanlığıyla çözülmüş olur. Çiftçi her
gün fiyata bakarken, traktörü bozulduğu gün parçayı da orada arar.

[ ] Ekipman kaydı (traktör/biçerdöver/ekipman envanteri)
[ ] Bakım/arıza takibi — mühendislik bilgisi burada değer üretir
[ ] PARÇA YÖNLENDİRME: muadil parça, nereden bulunur
[ ] MAKİNETAKİP MVP'si buraya taşınır

UYARI (mühendis tuzağı): v1 dar tut: kayıt + arıza + parça yönlendirme.
Kapsam kayması (her arıza tipi, her marka, IoT...) seni boğar.

═══════════════════════════════════════════════════════════════
FAZ 4 — MEVSİMSEL & TUTMA OYUNLARI  (şartlı, en sonda)
═══════════════════════════════════════════════════════════════
[~] SANAL TARLA — v1 çıktı (sezon kilitli); kitle doğrulaması bekliyor
[x] Hasat Paneli (tavsiyesiz: hava + fiyat trendi + takvim)
[x] Kurban modülü (sayaç)

═══════════════════════════════════════════════════════════════
DEĞİŞMEZ KURALLAR (her fazda geçerli)
═══════════════════════════════════════════════════════════════
• Sayıyı göster, cümle kurma. Tavsiye yok (yatırım/zirai/veterinerlik
  mevzuat riski). AI özetler, yönlendirir — karar vermez.
• Her tahmini/resmi değer kaynak+kapsam etiketli. Resmi ≠ saha.
• Envanter tutma — yönlendir, eşleştir, komisyon al.
• Tek kişilik ekipte asıl risk teknik değil, DİKKAT DAĞILMASI.
  Heyecan verici olanı değil, sıralamada doğru olanı yap.
• Üretici + Eleştirmen ikilisini koru.
• YAPMA: pazaryeri/e-ticaret (envanter), forum (moderasyon),
  kripto karşılaştırma, fiyat tahmini/projeksiyon.

═══════════════════════════════════════════════════════════════
BU HAFTA — SOMUT İLK ADIMLAR (sıra)
═══════════════════════════════════════════════════════════════
1. Telegram token+chat_id+secrets (10 dk) → VERI_GUVENLIK'e başlanır
2. [x] 0.1 yarı-fiyat yaması (sürü düzenlenebilir fiyat/kg)
3. UKON scraper tamiri
4. SEN: avukata 2 soru + domain kararı
5. SEN: hasat döneminde ilk YouTube Short (kart → site)

═══════════════════════════════════════════════════════════════
FİKİR DEFTERİ — doğrulanmayı bekleyen adaylar (İNŞA ETME, sıraya koy)
═══════════════════════════════════════════════════════════════

GELİR-ÖZELLİK ADAYLARI (Çiftçi Defteri ailesi — PART7-B üstüne):
[ ] Çiftçi Defteri (prototip: prototip/ciftci_defteri_demo.html —
    sürü/tarla gelir-gider defteri + bağlamsal affiliate önerisi)
[ ] Başabaş noktası: "kilosunu X ₺ üstüne satmazsan zarardasın"
[ ] Mazot/gübre alım zamanlayıcısı: tarihsel ayna (tavsiye değil)
[ ] Komşu fiyat radarı: fiyat-bildir'den hiperlokal — ÖN KOŞUL: kütle
[ ] "Koç" katmanı: takvim hatırlatmaları + Kanıtlanabilir Kâr Belgesi
    (bankaya PDF) + kademeli abonelik (hasat dönemine bağlı ödeme)

VİRAL / DAĞITIM ADAYLARI:
[ ] Bölge Meydan Okuması: haftalık "arpa şampiyonu" kartı (kuru skor)
[ ] "Bugünün Makası" günlük kartı + "Geçen yıl bugün" + 1080×1920 format
[ ] WhatsApp fiyat bülteni: önce 20 kişiye ELLE, tutarsa otomatik
[ ] QR poster: borsa/kooperatif/veteriner panosu (ECX modeli)
[ ] Muhtar kanalı: köy WhatsApp gruplarına haftalık özet
[ ] Sesli Fiyat 🔊: Web Speech API — "yazı okunmuyor" çözümü

DAMLA GELİR ADAYLARI (güven bozmayan):
[ ] Yerel bayi sponsorluğu: "X Bayii desteğiyle" tek satır
[ ] Fiyat Sertifikası: tarihli/kaynaklı PDF — pazarlık kanıtı
[ ] Kooperatif/belediye widget aboneliği: canlı fiyat kutusu
[ ] TARSİM/kredi yönlendirme komisyonu
[ ] YouTube çapraz besleme: fiyat segmentleri

TASARIM NOTU:
[x] Çevrimdışı-öncelikli: mobil v1.2'de önbellek + çevrimdışı şeridi ✅
    (web tarafı için hâlâ denetim maddesi)

NAKLİYE MODÜLÜ (ayrı oturum handoff'u, 3 Temmuz — şartlı kabul):
[ ] /nakliye: tarımsal nakliye İLAN PANOSU (hasat taşıma, hububat,
    canlı hayvan, balya). Aynı repo/Supabase/auth — ayrı uygulama YOK.
    Komisyonsuz (WhatsApp'a karşı tek koşul), para akışına GİRME (TİO
    belgesi tetiklenmesin), iletişim doğrudan telefon.
    ⚠️ AÇIK ÇELİŞKİ UYARISI: bu, reddedilen "iki taraflı marketplace"in
    niş versiyonu — cold-start riski AYNEN geçerli (arıcılık dersi).
    Kırılma şansı: hasat sezonu + WhatsApp gruplarındaki hazır trafiği
    panoya taşıyabilmek. Taşınamazsa modül ölü doğar; launch > build.
    KAPSAM KİLİDİ: v1 = ilan + il/ilçe filtre + harita. PostGIS dönüş
    yükü eşleşmesi "50 aktif ilan" eşiğinden SONRA (likiditesiz killer
    feature yoktur). Canlı hayvan ilanında belge alanı + avukat sorusu
    (nakil mevzuatı) STRATEJIK_KONTROL'e.
    ASIL SİNERJİ (spec'e girmeli): pano doğal NAKLİYE FİYAT VERİSİ
    üretir (güzergâh × ürün × ton ₺) — kimsede olmayan 4. veri katmanı;
    Çiftçi Defteri'ne nakliye gideri kalemi + B2B paketi.
    ÖN KOŞUL: mevcut açık işler (UKON tamiri, TÜRİB e-postası, ✅matris
    mobil, ERİŞİLEBİLİRLİK) + Anadolu Borsa'nın KENDİ dağıtımı önce.
