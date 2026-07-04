"""
'gunluk_ozet' konusuna TEK test bildirimi gonderir (tanilama araci).

GitHub Actions > "Bildirim Testi" > Run workflow ile tetiklenir; telefonda
Ayarlar > Bildirimler acik olan cihaza saniyeler icinde dusmelidir.
Dusmezse workflow logu sorunun sunucu mu istemci mi oldugunu soyler.
"""
import os
import json
import sys
from datetime import datetime

import requests

from alarm import _erisim_token


def main() -> int:
    sa_raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not sa_raw:
        print("[HATA] GOOGLE_SERVICE_ACCOUNT_JSON secret yok")
        return 1
    sa_info = json.loads(sa_raw)
    proje = sa_info["project_id"]
    print(f"[BILGI] Firebase projesi: {proje}")
    if proje != "anadolu-borsa-ab12d":
        print("[UYARI] Beklenen proje anadolu-borsa-ab12d degil! Mobil uygulama "
              "ab12d'ye kayitli — farkli projeden atilan push telefona ULASMAZ.")

    token = _erisim_token(sa_info)
    saat = datetime.now().strftime("%H:%M")
    r = requests.post(
        f"https://fcm.googleapis.com/v1/projects/{proje}/messages:send",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"message": {
            "topic": "gunluk_ozet",
            "notification": {
                "title": "🔔 Test bildirimi",
                "body": f"Anadolu Borsa bildirimleri calisiyor ({saat}). Bu bir tanilama mesajidir.",
            },
            "android": {"priority": "high"},
        }},
        timeout=15,
    )
    print(f"[FCM] HTTP {r.status_code}: {r.text[:200]}")
    if r.status_code == 200:
        print("[OK] Gonderildi. Telefona 30 sn icinde dusmezse sorun ISTEMCI "
              "tarafinda (abonelik/izin/pil optimizasyonu).")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
