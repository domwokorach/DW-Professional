import type { WeatherIconPath } from './types';

export const METEOCONS_BASE = 'https://cdn.meteocons.com/3.0.0-next.10/svg/';

/**
 * Picks the Meteocon for an OpenWeather condition ID.
 * IDs rather than descriptions: they're stable and grouped by range (2xx thunderstorm, 3xx drizzle,
 * 5xx rain, 6xx snow, 7xx atmosphere, 800 clear, 80x clouds).
 * https://openweathermap.org/weather-conditions
 */
export function getWeatherIcon(id: number, isDay: boolean): WeatherIconPath {
  if (id >= 200 && id < 300) return id >= 230 ? 'line/thunderstorms-drizzle' : 'line/thunderstorms';
  if (id >= 300 && id < 400) return 'line/drizzle';
  if (id >= 500 && id < 600) {
    if (id === 511) return 'line/sleet'; // freezing rain
    if (id >= 502 && id <= 504) return 'line/extreme-rain'; // heavy / very heavy / extreme
    return 'line/rain';
  }
  if (id >= 600 && id < 700) {
    if (id >= 611 && id <= 616) return 'line/sleet'; // sleet, rain and snow
    if (id === 602 || id === 622) return 'line/extreme-snow'; // heavy snow
    return 'line/snow';
  }
  switch (id) {
    case 701: return 'line/mist';
    case 711: return 'line/extreme-smoke';
    case 721: return isDay ? 'line/fog-day' : 'line/haze-night';
    case 741: return isDay ? 'line/fog-day' : 'line/fog-night';
    case 731: case 751: case 761: return 'line/extreme-haze'; // dust, sand
    case 762: return 'line/extreme-smoke'; // volcanic ash
    case 771: case 781: return 'flat/extreme'; // squalls, tornado
    case 800: return isDay ? 'line/clear-day' : 'line/clear-night';
    case 801: case 802: return isDay ? 'line/mostly-clear-day' : 'line/cloudy';
    case 803: case 804: return 'line/cloudy';
    case 906: return 'line/hail'; // legacy "extreme" code
  }
  if (id >= 700 && id < 800) return 'line/fog';
  if (id >= 900) return 'flat/extreme';
  return 'line/cloudy';
}

export const weatherIconUrl = (path: WeatherIconPath) => `${METEOCONS_BASE}${path}.svg`;
