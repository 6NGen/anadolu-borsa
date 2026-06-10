// Open-Meteo proxy'si. lat/lon dogrulanir: dogrulamasiz string upstream URL'e
// gomulurse query parametresi enjekte edilebilir (or. "&forecast_days=16").
const TR_SINIR = { latMin: 35, latMax: 43, lonMin: 25, lonMax: 45 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "37.87");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "32.49");

  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    lat < TR_SINIR.latMin || lat > TR_SINIR.latMax ||
    lon < TR_SINIR.lonMin || lon > TR_SINIR.lonMax
  ) {
    return Response.json({ error: "Geçersiz koordinat" }, { status: 400 });
  }

  const upstream = new URL("https://api.open-meteo.com/v1/forecast");
  upstream.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode",
    timezone: "Europe/Istanbul",
    forecast_days: "7",
  }).toString();

  try {
    const res = await fetch(upstream, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return Response.json({ error: "Hava verisi alınamadı" }, { status: 502 });
    }
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Hava verisi alınamadı" }, { status: 500 });
  }
}
