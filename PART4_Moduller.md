# PART 4 — Kullanıcı Modülleri (Giriş · Profil · Alarm)

> Durum: **Başlanmadı.** DB katmanı PART 1'de hazırlandı; bu faz tamamen
> web/frontend tarafıdır. Aşağıdaki sıra önerilen uygulama sırasıdır.

## Ön Bilgi — Neyin Hazır Olduğu

DB şeması (schema.sql) bu modüller için zaten kurulu:

| Tablo / Yapı | Açıklama | RLS |
|---|---|---|
| `profil` | `auth.users(id)`'e bağlı profil: telefon, il, guven_puani, toplam_bildirim, rozet | `profil_kendi` → `auth.uid() = id` |
| `kullanici_fiyat` | Kullanıcı fiyat bildirimleri (kullanici_id) | `kullanici_kendi_girer` (insert), `public_read_piyasa` (select) |
| `fiyat_alarm` | Eşik fiyat alarmları: urun_norm, esik_fiyat, yon(asagi/yukari), fcm_token, aktif | `alarm_kendi` → `auth.uid() = kullanici_id` |
| Trigger | `kullanici_fiyat` insert → `profil.toplam_bildirim` ve guven_puani günceller | — |

> Önemli: RLS politikaları `auth.uid()`'e dayanıyor. Yani frontend
> **giriş yapmış kullanıcının session'ı** ile Supabase'e yazmalı. Şu anki
> `web/src/lib/supabase.ts` sadece anon client (session yok) → auth eklenmeli.

## Stack Notları

- Next.js **16.2.7** App Router + Turbopack, React 19.
- Auth için `@supabase/ssr` gerekli (cookie tabanlı session, server+client).
  Şu an kurulu değil → `npm i @supabase/ssr`.
- `web/AGENTS.md`: Bu Next.js sürümü değiştirilmiş; kod yazmadan önce
  `node_modules/next/dist/docs/` altındaki ilgili rehbere bak.

---

## Modül 1 — Kullanıcı Giriş Sistemi (Auth)

**Hedef:** Supabase Auth ile kayıt/giriş; SSR uyumlu session.

### Karar verilecekler
- [ ] Giriş yöntemi: **Telefon (OTP)** mi, **E-posta + şifre** mi, **Magic link** mi?
      (Hedef kitle çiftçi → telefon/OTP en uygun; ama SMS provider maliyeti var.)
- [ ] Türkçe e-posta şablonları (Supabase dashboard → Auth → Templates).

### Yapılacaklar
1. `npm i @supabase/ssr`
2. `web/src/lib/supabase.ts` → ikiye ayır:
   - `supabaseBrowser()` — `createBrowserClient` (client component'ler)
   - `supabaseServer()` — `createServerClient` + `cookies()` (server component/action)
3. `web/src/middleware.ts` — session yenileme (Supabase ssr örneği).
4. Sayfalar:
   - `web/src/app/giris/page.tsx` — giriş formu
   - `web/src/app/kayit/page.tsx` — kayıt formu
   - `web/src/app/cikis/route.ts` — signOut + redirect
5. `Nav.tsx` → giriş durumuna göre "Giriş / Profil" linki.

### Kabul kriteri
- Kayıt olup giriş yapınca session cookie set ediliyor, sayfa yenilense de
  oturum korunuyor; `supabaseServer().auth.getUser()` kullanıcıyı döndürüyor.

---

## Modül 2 — Profil Sayfası

**Hedef:** Kullanıcı kendi profilini görür/düzenler; güven puanı ve rozet görünür.

### Yapılacaklar
1. `web/src/app/profil/page.tsx` (server component, korumalı):
   - Giriş yoksa `/giris`'e redirect.
   - `profil` satırını çek (yoksa ilk girişte oluştur — trigger değil,
     uygulama tarafında upsert ya da Auth `on_auth_user_created` trigger'ı).
   - Göster: telefon, il, guven_puani, rozet, toplam_bildirim.
2. `web/src/components/ProfilForm.tsx` (client) — telefon + il düzenleme,
   `update profil ... where id = auth.uid()` (RLS `profil_kendi` izin verir).
3. Rozet/puan rozet görseli (yeni → gümüş → altın eşikleri urun_meta benzeri).

### Açık nokta
- [ ] Yeni kullanıcı için `profil` satırı nasıl oluşacak? Öneri: Supabase'de
      `auth.users` insert → `profil` insert eden bir trigger ekle (schema.sql'e
      `handle_new_user()` fonksiyonu). Aksi halde uygulama upsert eder.

---

## Modül 3 — Fiyat Alarmları

**Hedef:** Kullanıcı bir ürün için eşik fiyat belirler; eşik geçilince bildirim.

### Yapılacaklar
1. `web/src/app/alarm/page.tsx` — kullanıcının alarmları (liste + ekle/sil/aktif-pasif).
2. `web/src/components/AlarmForm.tsx` — urun_norm seç, esik_fiyat, yon(asagi/yukari).
3. Alarm tetikleme (backend):
   - [ ] **Karar:** Push (FCM) mı, e-posta mı, in-app mı?
   - `fiyat_alarm.fcm_token` alanı FCM içindir; push istenirse Firebase Cloud
     Messaging kurulumu + Service Worker gerekir (ek iş, ayrı mini-faz).
   - Daha basit başlangıç: scraper sonrası bir Supabase Edge Function / cron
     son fiyatları alarmlarla karşılaştırıp e-posta atar.
4. Scraper entegrasyonu: yeni fiyat yazıldıktan sonra alarm kontrolü
   (scraper.py içinde ya da ayrı bir job).

### Kabul kriteri
- Kullanıcı alarm ekleyebiliyor, listeliyor, siliyor; eşik geçilince seçilen
  kanaldan bildirim alıyor.

---

## Modül 4 — fiyat-bildir'i Auth'a Bağlama

Şu an `web/src/app/fiyat-bildir` muhtemelen anonim insert yapıyor.

### Yapılacaklar
- [ ] Giriş zorunlu hale getir (giriş yoksa `/giris`).
- [ ] Insert'e `kullanici_id = auth.uid()` ekle (RLS `kullanici_kendi_girer` bunu şart koşuyor).
- [ ] `idx_gunluk_kullanici_urun` unique index: aynı kullanıcı aynı ürünü günde
      bir kez bildirebilir → upsert/uyarı mesajı.

---

## Önerilen Uygulama Sırası

1. **Auth altyapısı** (Modül 1) — diğer her şey buna bağlı.
2. **fiyat-bildir bağlama** (Modül 4) — auth'u hemen gerçek kullanımla test eder.
3. **Profil** (Modül 2) — guven_puani/rozet görünürlüğü.
4. **Alarm** (Modül 3) — en çok karar/altyapı gerektiren, en sona.

## İlk Adımda Sorulacaklar
- Giriş yöntemi (telefon-OTP / e-posta-şifre / magic link)?
- Alarm bildirim kanalı (push-FCM / e-posta / in-app)?
- Yeni kullanıcı profili: DB trigger mı, uygulama upsert mi?
