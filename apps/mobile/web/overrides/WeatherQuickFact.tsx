// Browser version of components/developer-id/WeatherQuickFact. The site's is an async server component that reads
// OpenWeather with a secret key; a browser must not hold that key, so this reads the same London conditions from
// Open-Meteo (no key) and maps them onto the same Meteocons icons and the same markup/CSS.
import { useEffect, useState } from 'react';
import { getWeatherIcon, METEOCONS_BASE } from '@/lib/weather/icon';
import type { Weather } from '@/lib/weather/types';

const LOCATION = { lat: 51.5072, lon: -0.1276, label: 'London, UK' };
const URL_ = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current=temperature_2m,apparent_temperature,weather_code,is_day&timezone=auto`;

/** WMO weather code -> [OpenWeather condition id, description] so the site's icon picker and wording apply. */
const WMO: Record<number, [number, string]> = {
  0: [800, 'Clear sky'], 1: [801, 'Few clouds'], 2: [802, 'Scattered clouds'], 3: [804, 'Overcast clouds'],
  45: [741, 'Fog'], 48: [741, 'Rime fog'],
  51: [300, 'Light drizzle'], 53: [301, 'Drizzle'], 55: [302, 'Heavy drizzle'], 56: [511, 'Freezing drizzle'], 57: [511, 'Freezing drizzle'],
  61: [500, 'Light rain'], 63: [501, 'Moderate rain'], 65: [502, 'Heavy rain'], 66: [511, 'Freezing rain'], 67: [511, 'Freezing rain'],
  71: [600, 'Light snow'], 73: [601, 'Snow'], 75: [602, 'Heavy snow'], 77: [600, 'Snow grains'],
  80: [520, 'Light shower rain'], 81: [521, 'Shower rain'], 82: [522, 'Heavy shower rain'], 85: [620, 'Light shower snow'], 86: [621, 'Shower snow'],
  95: [200, 'Thunderstorm'], 96: [230, 'Thunderstorm with drizzle'], 99: [230, 'Thunderstorm with drizzle'],
};

async function staticIcon(src: string): Promise<string | undefined> {
  try {
    const res = await fetch(src);
    if (!res.ok) return undefined;
    const svg = (await res.text()).replace(/<(animate\w*|set)\b[^>]*\/>/g, '').replace(/<(animate\w*|set)\b[^>]*>[\s\S]*?<\/\1>/g, '');
    return svg.trimStart().startsWith('<svg') ? `data:image/svg+xml,${encodeURIComponent(svg)}` : undefined;
  } catch { return undefined; }
}

async function loadWeather(): Promise<Weather | null> {
  try {
    const res = await fetch(URL_);
    if (!res.ok) return null;
    const c = (await res.json())?.current;
    if (typeof c?.temperature_2m !== 'number' || typeof c.apparent_temperature !== 'number') return null;
    const [id, condition] = WMO[c.weather_code as number] ?? [803, 'Cloudy'];
    const iconSrc = `${METEOCONS_BASE}${getWeatherIcon(id, c.is_day === 1)}.svg`;
    return { temperature: Math.round(c.temperature_2m), feelsLike: Math.round(c.apparent_temperature), condition, location: LOCATION.label, iconSrc, staticIconSrc: await staticIcon(iconSrc) };
  } catch { return null; }
}

function WeatherReading({ weather }: { weather: Weather }) {
  return (
    <>
      <picture className="quick-fact-weather-icon">
        {weather.staticIconSrc && <source media="(prefers-reduced-motion: reduce)" srcSet={weather.staticIconSrc} />}
        <img src={weather.iconSrc} alt="" width={40} height={40} decoding="async" />
      </picture>
      <span className="quick-fact-weather-text">
        <span className="quick-fact-temp">{weather.temperature}°C</span>{' '}
        <span className="quick-fact-condition">{weather.condition}</span>
        <small className="quick-fact-meta">
          {weather.location}
          <span className="quick-fact-feels"> · Feels like {weather.feelsLike}°C</span>
        </small>
      </span>
    </>
  );
}

export default function WeatherQuickFact() {
  const [state, setState] = useState<Weather | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    const run = () => loadWeather().then((w) => live && setState((prev) => w ?? prev ?? null));
    run();
    const id = window.setInterval(run, 20 * 60 * 1000);
    return () => { live = false; window.clearInterval(id); };
  }, []);
  if (state === undefined) return <WeatherQuickFactSkeleton />;
  return (
    <div className="quick-fact quick-fact--weather">
      <dt>Weather</dt>
      <dd>{state ? <WeatherReading weather={state} /> : <span className="quick-fact-meta">Currently unavailable</span>}</dd>
    </div>
  );
}

export function WeatherQuickFactSkeleton() {
  return (
    <div className="quick-fact quick-fact--weather" aria-busy="true">
      <dt>Weather</dt>
      <dd>
        <span className="sr-only">Loading weather</span>
        <span className="quick-fact-weather-skeleton" aria-hidden="true"><i /><span><b /><b /></span></span>
      </dd>
    </div>
  );
}
