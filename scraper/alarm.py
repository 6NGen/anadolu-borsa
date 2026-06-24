"""Fiyat alarmi kontrolu + FCM push gonderimi (PART5 M6b).

Her scraper kosusu sonunda calisir: aktif push alarmlarini guncel fiyatlarla
karsilastirir, esik asilmissa FCM ile bildirim gonderir ve alarmi pasiflestirir.

Service account yoksa (GOOGLE_SERVICE_ACCOUNT_JSON ortam degiskeni) sessizce atlar
-> lokal kosuda / secret eklenmeden once scraper'i bozmaz.
"""
import os
import json
import requests


def _erisim_token(sa_info: dict) -> str:
    """Service account'tan FCM HTTP v1 icin OAuth2 erisim token'i uretir."""
    from google.oauth2 import service_account
    import google.auth.transport.requests

    creds = service_account.Credentials.from_service_account_info(
        sa_info, scopes=["https://www.googleapis.com/auth/firebase.messaging"]
    )
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def _guncel_fiyatlar(supabase) -> dict:
    """norm -> [(fiyat, kaynak), ...] — her borsa/kaynagin EN GUNCEL degeri.
    Arpa gibi borsadan borsaya cok degisen urunlerde alarm hangi borsanin
    tetikledigini bilmeli (Corum 11.10 / Eskisehir 15.21 / Ilgin 12.50)."""
    sonuc: dict = {}

    # YEM: son_30_gun (borsa kolonu var) — (norm, borsa) basina en guncel
    eny: dict = {}
    yem = supabase.table("son_30_gun").select("urun_norm, borsa, cekilme_tarihi, ortalama").execute().data or []
    for r in yem:
        if r.get("ortalama") is None:
            continue
        k = (r["urun_norm"], r["borsa"]); t = r.get("cekilme_tarihi") or ""
        if k not in eny or t > eny[k][0]:
            eny[k] = (t, float(r["ortalama"]))
    for (norm, borsa), (_t, f) in eny.items():
        sonuc.setdefault(norm, []).append((f, borsa))

    # HAYVAN: son_hayvan_fiyatlari — norm basina en guncel kaynak
    enh: dict = {}
    hay = supabase.table("son_hayvan_fiyatlari").select("hayvan_norm, kaynak, fiyat, cekilme_tarihi").execute().data or []
    for r in hay:
        if r.get("fiyat") is None:
            continue
        n, t = r["hayvan_norm"], r.get("cekilme_tarihi") or ""
        kaynak = (r.get("kaynak") or "").replace("_SUT", "")
        if n not in enh or t > enh[n][0]:
            enh[n] = (t, float(r["fiyat"]), kaynak)
    for n, (_t, f, kaynak) in enh.items():
        sonuc.setdefault(n, []).append((f, kaynak))

    return sonuc


def _tetik(yon: str, fiyat: float, esik: float) -> bool:
    return (yon == "yukari" and fiyat >= esik) or (yon == "asagi" and fiyat <= esik)


def _tetikleyen(yon: str, fiyatlar: list, esik: float):
    """yon yonunde esigi asan EN ALAKALI (yukari->en yuksek borsa, asagi->en
    dusuk borsa) (fiyat, kaynak); asan yoksa None. fiyatlar: [(fiyat, kaynak)]."""
    if not fiyatlar:
        return None
    aday = max(fiyatlar, key=lambda x: x[0]) if yon == "yukari" else min(fiyatlar, key=lambda x: x[0])
    return aday if _tetik(yon, aday[0], esik) else None


def alarmlari_kontrol_et(supabase) -> None:
    sa_raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not sa_raw:
        print("[BILGI] GOOGLE_SERVICE_ACCOUNT_JSON yok — alarm gonderimi atlandi")
        return
    try:
        sa_info = json.loads(sa_raw)
    except Exception as e:
        print(f"[HATA] Service account JSON cozumlenemedi: {e}")
        return
    proje_id = sa_info.get("project_id")

    alarmlar = (supabase.table("fiyat_alarm").select("*")
                .eq("aktif", True).eq("kanal", "push").execute().data) or []
    if not alarmlar:
        print("[OK] Alarm kontrol: aktif alarm yok")
        return

    fiyatlar = _guncel_fiyatlar(supabase)
    try:
        token_erisim = _erisim_token(sa_info)
    except Exception as e:
        print(f"[HATA] FCM erisim token alinamadi: {e}")
        return

    gonderilen = 0
    for a in alarmlar:
        norm_fiyatlar = fiyatlar.get(a["urun_norm"])
        if not norm_fiyatlar or not a.get("fcm_token"):
            continue
        esik = float(a["esik_fiyat"])
        tetik = _tetikleyen(a["yon"], norm_fiyatlar, esik)
        if not tetik:
            continue
        fiyat, kaynak = tetik

        ad = a["urun_norm"]
        yon_txt = "ustune cikti" if a["yon"] == "yukari" else "altina indi"
        baslik = f"{ad} fiyat alarmi"
        # Hangi borsanin tetikledigini yaz — seffaflik (arpa borsadan borsaya degisir)
        govde = f"{ad} {kaynak} borsasinda {fiyat:g} TL — esigin {esik:g} {yon_txt}."
        try:
            r = requests.post(
                f"https://fcm.googleapis.com/v1/projects/{proje_id}/messages:send",
                headers={"Authorization": f"Bearer {token_erisim}", "Content-Type": "application/json"},
                json={"message": {"token": a["fcm_token"], "notification": {"title": baslik, "body": govde}}},
                timeout=15,
            )
            if r.status_code == 200:
                supabase.table("fiyat_alarm").update({"aktif": False}).eq("id", a["id"]).execute()
                gonderilen += 1
            elif r.status_code in (400, 404):
                # Token gecersiz/silinmis — alarmi pasiflestir, tekrar denenmesin
                supabase.table("fiyat_alarm").update({"aktif": False}).eq("id", a["id"]).execute()
                print(f"[UYARI] Gecersiz token, alarm pasiflendi (id={a['id']})")
            else:
                print(f"[UYARI] FCM gonderim {r.status_code}: {r.text[:120]}")
        except Exception as e:
            print(f"[HATA] FCM gonderim (id={a.get('id')}): {e}")

    print(f"[OK] Alarm kontrol: {gonderilen} bildirim gonderildi")
