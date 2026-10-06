/** Meteocons used by the Quick Facts weather item (paths under the Meteocons CDN base). */
export type WeatherIconPath =
  | 'flat/extreme'
  | 'line/extreme-rain'
  | 'line/extreme-snow'
  | 'line/extreme-smoke'
  | 'line/extreme-haze'
  | 'line/thunderstorms'
  | 'line/thunderstorms-drizzle'
  | 'line/clear-day'
  | 'line/clear-night'
  | 'line/mostly-clear-day'
  | 'line/cloudy'
  | 'line/drizzle'
  | 'line/rain'
  | 'line/snow'
  | 'line/sleet'
  | 'line/hail'
  | 'line/mist'
  | 'line/fog'
  | 'line/fog-day'
  | 'line/fog-night'
  | 'line/haze-night';

/** What the visitor sees. Never contains anything from the API request (key, URL) or raw errors. */
export interface Weather {
  /** Whole degrees Celsius. */
  temperature: number;
  feelsLike: number;
  /** Sentence case, e.g. "Light rain". */
  condition: string;
  location: string;
  /** Animated Meteocon on the CDN. */
  iconSrc: string;
  /** Same icon with its animations removed (data: URI), for prefers-reduced-motion. Absent if it couldn't be made. */
  staticIconSrc?: string;
}

/** The subset of OpenWeather's /data/2.5/weather response this site reads. */
export interface OpenWeatherCurrent {
  weather: { id: number; description: string; icon: string }[];
  main: { temp: number; feels_like: number };
  dt: number;
  sys?: { sunrise?: number; sunset?: number };
}
