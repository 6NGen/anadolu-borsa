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
    """{urun_norm: fiyat} — yem (son_fiyatlar) + hayvan (son_hayvan_fiyatlari, norm basina en guncel)."""
    fiyatlar: dict = {}
    yem = supabase.table("son_fiyatlar").select("urun_norm, ortalama").execute().data or []
    for r in yem:
        if r.get("ortalama") is not None:
            fiyatlar[r["urun_norm"]] = float(r["ortalama"])

    en_yeni: dict = {}  # norm -> (tarih, fiyat) — view kaynak basina satir doner, en guncel tarihi tut
    hay = supabase.table("son_hayvan_fiyatlari").select("hayvan_norm, fiyat, cekilme_tarihi").execute().data or []
    for r in hay:
        if r.get("fiyat") is None:
            continue
        n, t = r["hayvan_norm"], r.get("cekilme_tarihi") or ""
        if n not in en_yeni or t > en_yeni[n][0]:
            en_yeni[n] = (t, float(r["fiyat"]))
    for n, (_t, f) in en_yeni.items():
        fiyatlar[n] = f
    return fiyatlar


def _tetik(yon: str, fiyat: float, esik: float) -> bool:
    return (yon == "yukari" and fiyat >= esik) or (yon == "asagi" and fiyat <= esik)


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
        fiyat = fiyatlar.get(a["urun_norm"])
        if fiyat is None or not a.get("fcm_token"):
            continue
        esik = float(a["esik_fiyat"])
        if not _tetik(a["yon"], fiyat, esik):
            continue

        ad = a["urun_norm"]
        yon_txt = "ustune cikti" if a["yon"] == "yukari" else "altina indi"
        baslik = f"{ad} fiyat alarmi"
        govde = f"{ad} fiyati {fiyat:g} oldu — esigin {esik:g} {yon_txt}."
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
