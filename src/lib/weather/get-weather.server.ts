// Server-only: OPENWEATHER is read here and nowhere else, so the key never reaches the browser bundle,
// the HTML, or a log line (the request URL is never logged).
import { getWeatherIcon, weatherIconUrl } from './icon';
import type { OpenWeatherCurrent, Weather } from './types';

/** No visitor geolocation: the portfolio shows the weather where Dominic is based. */
const LOCATION = { lat: 51.5072, lon: -0.1276, label: 'London, UK' };
/** OpenWeather updates current conditions roughly every 10 minutes; one request per 20 is plenty. */
const REVALIDATE_SECONDS = 20 * 60;

const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function parse(data: unknown): OpenWeatherCurrent | null {
  const d = data as Partial<OpenWeatherCurrent> | null;
  const w = d?.weather?.[0];
  if (!w || typeof w.id !== 'number' || typeof d?.main?.temp !== 'number' || typeof d.main.feels_like !== 'number') return null;
  return d as OpenWeatherCurrent;
}

/** OpenWeather's icon code ends in "d" or "n"; sunrise/sunset is the fallback. */
function isDaytime({ weather, dt, sys }: OpenWeatherCurrent) {
  const suffix = weather[0].icon?.slice(-1);
  if (suffix === 'd' || suffix === 'n') return suffix === 'd';
  if (sys?.sunrise && sys.sunset) return dt >= sys.sunrise && dt < sys.sunset;
  return true;
}

/** A still copy of a Meteocon (its SMIL animations stripped), cached for a week since CDN icons are versioned. */
async function getStaticIcon(src: string): Promise<string | undefined> {
  try {
    const res = await fetch(src, { next: { revalidate: 7 * 24 * 60 * 60 } });
    if (!res.ok) return undefined;
    const svg = (await res.text())
      .replace(/<(animate\w*|set)\b[^>]*\/>/g, '')
      .replace(/<(animate\w*|set)\b[^>]*>[\s\S]*?<\/\1>/g, '');
    return svg.trimStart().startsWith('<svg') ? `data:image/svg+xml,${encodeURIComponent(svg)}` : undefined;
  } catch {
    return undefined;
  }
}

/** Current weather for the portfolio location, or null when unavailable (no key, API error, rate limit, network). */
export async function getWeather(): Promise<Weather | null> {
  const key = process.env.OPENWEATHER;
  if (!key) return null;

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.search = new URLSearchParams({ lat: String(LOCATION.lat), lon: String(LOCATION.lon), units: 'metric', appid: key }).toString();

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      console.warn(`[weather] OpenWeather responded ${res.status}`);
      return null;
    }
    const data = parse(await res.json());
    if (!data) {
      console.warn('[weather] Unexpected OpenWeather response shape');
      return null;
    }
    const iconSrc = weatherIconUrl(getWeatherIcon(data.weather[0].id, isDaytime(data)));
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: sentenceCase(data.weather[0].description),
      location: LOCATION.label,
      iconSrc,
      staticIconSrc: await getStaticIcon(iconSrc),
    };
  } catch {
    console.warn('[weather] OpenWeather request failed');
    return null;
  }
}
