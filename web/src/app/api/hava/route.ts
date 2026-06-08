export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") ?? "37.87";
  const lon = searchParams.get("lon") ?? "32.49";

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,` +
        `precipitation_sum,windspeed_10m_max,weathercode` +
        `&timezone=Europe/Istanbul&forecast_days=7`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Hava verisi alınamadı" }, { status: 500 });
  }
}
