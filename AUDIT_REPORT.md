# Anadolu Borsa — Denetim Raporu (2026-06-10)

Kapsam: `web/` (Next.js 16.2.7), `scraper/` (Python), `schema.sql`, `.github/workflows/`.
Yöntem: Aşama 0 keşif (şema↔kod çapraz eşleme) → Aşama 1 denetim → Aşama 2 düzeltme → Aşama 3 doğrulama.

## Doğrulama Sonuçları
- `npm run build`: ✅ hatasız (Turbopack + TypeScript)
- `pytest scraper/`: ✅ 27/27 geçti
- Scraper kuru-çalıştırma (DB stub'lı, canlı TOBB): ✅ 26 kayıt, sınır dışı 0, tarih TR günü
- Üretim Supabase'ine **hiçbir şey çalıştırılmadı**; tüm DB değişiklikleri `migration_002_denetim_duzeltmeleri.sql` içinde.

## Şema ↔ Kod Çapraz Eşleme (Aşama 0 cevapları)
- **Süt fiyatı**: `hayvan_fiyat_snapshot`'a yazılıyor (`hayvan_norm='SUT'`, `kaynak='ESK_SUT'`). `parite_guncel` aynı tablodan `IN ('SUT','KUZU')` okuyor → **tutarlı**. `urun_meta('SUT')` yalnız meta; `fiyat_snapshot`'a SUT hiç yazılmıyor → `son_fiyatlar`'da SUT görünmez (bilinçli).
- Scraper yazdıkları: `fiyat_snapshot` (upsert: borsa,urun_norm,cekilme_tarihi), `hayvan_fiyat_snapshot` (upsert: kaynak,hayvan_norm,cekilme_tarihi), `hava_durumu` (upsert: il,tahmin_tarihi), `scraper_log` (insert). Hepsi unique index'lerle uyumlu → **idempotent**, aynı gün ikinci çalıştırma çakışmaz.
- Web okudukları: `son_fiyatlar`, `son_30_gun`, `son_hayvan_fiyatlari`, `son_30_gun_hayvan`, `piyasa_fiyatlari`, `fiyat_sinyal`, `urun_meta`, `girdi_fiyat` (parite sayfası doğrudan tablo!), `uretici_hedef_parite`, `kullanici_fiyat` (insert).
- **`migration_001_schema_fixes.sql` repo'da ve git geçmişinde YOK** (görev tanımında "önceki oturumda hazırlandı" deniyordu). migration_002 kendi kendine yeterli yazıldı ve 001'e atfedilen tüm maddeleri kapsıyor.

## Bulgular ve Yapılanlar

### KRİTİK
| # | Konum | Bulgu | Durum |
|---|---|---|---|
| K1 | schema.sql RLS bölümü | `urun_meta`, `girdi_fiyat`, `hava_durumu`, `scraper_log` RLS'siz. Supabase varsayılan GRANT'leriyle **anon key ile yazılabilir** (ör. herkes mazot fiyatını değiştirebilir). | ✅ migration_002 §1: RLS + salt-okur policy'ler (`scraper_log` anon'a tamamen kapalı) |
| K2 | schema.sql `rozet_guncelle()` | SECURITY DEFINER yok → RLS altında `kullanici_fiyat SET agirlik` **sessizce 0 satır** (UPDATE policy yoktu); profil satırı yoksa puan hiç işlemez, `RETURNING NULL` → `agirlik=NULL` (ağırlıklı ortalamadan satır düşer). `search_path` sabitlenmemiş. | ✅ migration_002 §3: SECURITY DEFINER + `SET search_path=public` + profil auto-insert + `COALESCE(yeni_puan,1)` + NULL kullanici_id koruması |
| K3 | scraper.py `parse_fiyat` | Her nokta binlik sayılıyordu: `"14.50"` → **1450** (10× hata), ton_to_kg sonrası 1.45 (sessiz bozuk veri). | ✅ commit `35d3091`: akıllı format ayrımı + 27 birim testi (gerçek saha formatları) |
| K4 | schema.sql `parite_guncel` | (a) `ORDER BY cekilme_tarihi DESC LIMIT 2` satır bazlı: KUZU iki kaynaktan gelince **SUT tamamen düşebilir**, aynı tarihte sıralama belirsiz. (b) Her tarihsel mazot fiyatı **güncel** ürün fiyatıyla eşleşiyordu ("1995 mazotu ÷ 2026 sütü"). | ✅ migration_002 §5: `DISTINCT ON (hayvan_norm)` + yalnız güncel×güncel eşleşme. Davranış değişikliği: view artık ürün başına tek satır (web bu view'ı şu an kullanmıyor → kırılma yok) |

### ORTA
| # | Konum | Bulgu | Durum |
|---|---|---|---|
| O1 | `fiyat_sinyal` view | `veri_gun_sayisi = COUNT(*)`: aynı gün 3 borsa = "3 gün" sayılıyordu → web'deki 30-gün veri şartı yanlış ölçülüyordu; `bugun` alt sorgusu aynı tarihli borsalar arasında belirsiz. | ✅ migration_002 §6: `COUNT(DISTINCT cekilme_tarihi)` + deterministik kırılım |
| O2 | `kullanici_fiyat` | UPDATE/DELETE policy yok (kullanıcı kendi bildirimini düzeltemez); `fiyat>0` CHECK yok. | ✅ migration_002 §2 |
| O3 | api/hava/route.ts | `lat`/`lon` doğrulanmadan string birleştirmeyle upstream URL'e gömülüyordu (query parametre enjeksiyonu). | ✅ commit `6787efb`: sayısal + TR-sınır doğrulama, `URLSearchParams`, `!res.ok→502` |
| O4 | scraper.py | Sanity bound yok: kaynak HTML değişirse absürt değer sessizce DB'ye yazılır. | ✅ `sinirla()`: yem 0.5–500 TL/kg, hayvan 20–5000 TL/kg; sınır dışı kayıt atlanır |
| O5 | scraper.py tarihler | `date.today()` UTC runner'da TR gününden kayabilir (cron saati değişirse). | ✅ `bugun_tr()` (Europe/Istanbul; tzdata yoksa sabit UTC+3 fallback — TR 2016'dan beri DST'siz) |
| O6 | scraper.py `log_yaz` | Log yazma hatası tüm kaynağı patlatıyordu. | ✅ try/except (log asla scraper'ı durdurmaz) |
| O7 | `kurban_karsilastirma` | ESK + UKON fiyatları tek AVG'de karışıyordu (farklı metodolojiler). | ✅ migration_002 §7: ESK'ya sabitlendi + `veri_sayisi` kolonu |
| O8 | `fiyat_alarm` | Kanal kolonu yok; `fcm_token NOT NULL` e-posta/uygulama-içi kanalı imkânsız kılıyor. | ✅ migration_002 §8: `kanal` (varsayılan `push` — PART4 FCM kararına uygun), token nullable + `push→token zorunlu` CHECK |
| O9 | fiyat-bildir/page.tsx | NaN/negatif/absürt fiyat ve il içeriği doğrulanmıyordu. | ✅ commit `6787efb` (client) + migration_002 §2 (DB CHECK) — çift katman |
| O10 | hava.py | `raise_for_status` yok: 429/5xx yanıtı sessizce boş veri sanılıyordu. | ✅ eklendi |

### DÜŞÜK / NOT
- **D1**: `migration_001` yok — maddeleri 002'ye alındı (yukarıda).
- **D2**: `tabula-py` hiçbir yerde import edilmiyordu → requirements'tan kaldırıldı (CI hızlanır); `tzdata` eklendi.
- **D3**: Yeni kullanıcıda profil satırı oluşmuyordu → migration_002 §4 `auth.users` trigger'ı (telefon OTP kararıyla uyumlu: `phone` kopyalanır).
- **D4**: TOBB `birim` kolonu "KG" yazıyor ama kaynak bazen ton yayınlıyor — değerler `ton_to_kg` ile normalize edildiğinden kolon bilgilendirme amaçlı; dokunulmadı.
- **D5**: Sızıntı taraması temiz: git geçmişinde `sb_secret_`/JWT yok, `.env` dosyaları hiç commit'lenmemiş, client bundle yalnız `NEXT_PUBLIC_*` içeriyor, workflow secret'ları GitHub tarafından maskeleniyor.
- **D6**: Değiştirilmiş Next.js notu: `export const revalidate` bu sürümde yalnız Cache Components **açıkken** kaldırılmış; proje ISR modunda → mevcut kullanım geçerli. Docs'taki `unstable_instant` ipucu (draft, Cache Components'a özgü) bilinçli olarak uygulanmadı.
- **D7**: `params` artık `Promise` — `urun/[slug]` zaten `await params` yapıyor ✓.

## KARAR GEREKLİ (değiştirilmedi)
1. **Alarm tetikleme mimarisi**: Şema hazır (kanal+token). Tetikleyici (scraper sonrası kontrol mü, Supabase Edge Function/cron mu) PART4'te kararlaştırılmalı.
2. **View'lardaki `CURRENT_DATE` UTC'dir**: TR 00:00–03:00 arasında "bugün" bir gün geri kayar. Düşük etki; istenirse migration_003 ile `(NOW() AT TIME ZONE 'Europe/Istanbul')::date`'e çevrilir. DB genelinde timezone değiştirmek (ALTER DATABASE) önerilmez — etkisi geniş.
3. **scraper_log anon'a kapalı bırakıldı** (hata mesajları iç bilgi). Public bir "sistem durumu" göstergesi istenirse ayrı, kırpılmış bir view yazılır.
4. **`piyasa_fiyatlari` il belirsizliği**: tarım sayfası ürün başına ilk ili gösteriyor; il seçimi PART4 kapsamında UI kararı.

## Ertelenen Maddeler (gerekçeli)
- **Vitest**: Web'de saf (UI'sız) util neredeyse yok; parite/hedef hesapları client component'lerde gömülü. Test edilebilir kılmak UI refactor'u gerektirir → bu denetimin kapsamı dışında. Kritik parse mantığının tamamı Python tarafında ve pytest'le kapsandı.
- **`supabase gen types`** ile şemadan TS tipi üretimi: önerilir, mekanik iş, davranış değiştirmez.
- **Workflow hata bildirimi**: GitHub varsayılan başarısızlık e-postası mevcut; ek kanal (ör. Telegram) ürün kararı.
- **urun/[slug] hayvan ürünleri**: `son_fiyatlar` yalnız yem içerir; hayvan detay sayfası ayrı özellik.

## migration_002 Uygulama Talimatı
1. Supabase Dashboard → SQL Editor → `migration_002_denetim_duzeltmeleri.sql` içeriğini yapıştır → **Run**. (İdempotent; iki kez çalıştırmak güvenli.)
2. Dosyanın sonundaki **7 doğrulama sorgusunu** sırayla çalıştır; beklenen sonuçlar yorumlarda.
3. En kritik doğrulama: anon key ile `INSERT INTO girdi_fiyat ...` denemesi **RLS hatası vermeli** (sorgu 7).
4. Uygulama SONRASI web'i bir kez kontrol et: `/parite` sayfası mazot verisini `girdi_fiyat`'tan okur — §1'deki `public_read_girdi` policy'si bunu korur; sayfa boş dönerse policy'nin oluştuğunu sorgu 2 ile doğrula.

## Commit Listesi
| Commit | İçerik |
|---|---|
| `35d3091` | scraper: parse_fiyat, sanity bound, TR timezone, lazy client, log dayanıklılığı, hava raise_for_status, 27 pytest |
| `6787efb` | web: api/hava doğrulama, fiyat-bildir validasyon, supabaseServer oturum kapalı |
| `33fd5a9` | migration_002 (RLS, trigger, view'lar, alarm kanalı, policy'ler) |
| (bu commit) | AUDIT_REPORT.md |
