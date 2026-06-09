"""
Anadolu Borsa — Hava Durumu Scraper
Open-Meteo API — aysiz, API anahtarsiz
Calistirilacak: main() scraper.py'den cagirilir
"""

import time
import requests


def hava_cek(il: str, lat: float, lon: float, denemeler: int = 2) -> list[dict]:
    """Open-Meteo'dan 7 gunluk tahmin. 20sn timeout + 1 retry (toplam 2 deneme)."""
    params = {
        "latitude":      lat,
        "longitude":     lon,
        "daily":         "temperature_2m_max,temperature_2m_min,"
                         "precipitation_sum,windspeed_10m_max,weathercode",
        "timezone":      "Europe/Istanbul",
        "forecast_days": 7,
    }
    son_hata = None
    for deneme in range(denemeler):
        try:
            resp = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
                timeout=20,
            )
            data = resp.json().get("daily", {})
            return [
                {
                    "il":            il,
                    "enlem":         lat,
                    "boylam":        lon,
                    "tahmin_tarihi": data["time"][i],
                    "sicaklik_max":  data["temperature_2m_max"][i],
                    "sicaklik_min":  data["temperature_2m_min"][i],
                    "yagis_toplam":  data["precipitation_sum"][i],
                    "ruzgar_hiz":    data["windspeed_10m_max"][i],
                }
                for i in range(len(data.get("time", [])))
            ]
        except Exception as e:
            son_hata = e
            if deneme < denemeler - 1:
                time.sleep(1.5)  # retry oncesi kisa bekleme
    print(f"[HATA] Open-Meteo {il}: {son_hata}")
    return []
