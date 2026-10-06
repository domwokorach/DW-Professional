import { getWeather } from '@/lib/weather/get-weather.server';
import type { Weather } from '@/lib/weather/types';

function WeatherReading({ weather }: { weather: Weather }) {
  return (
    <>
      {/* Decorative: the condition is always written out next to it. */}
      <picture className="quick-fact-weather-icon">
        {weather.staticIconSrc && <source media="(prefers-reduced-motion: reduce)" srcSet={weather.staticIconSrc} />}
        {/* eslint-disable-next-line @next/next/no-img-element -- external SVG, no optimisation needed */}
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

/** Weather row for Quick Facts. Async server component: render it inside <Suspense> with the skeleton. */
export default async function WeatherQuickFact() {
  const weather = await getWeather();
  return (
    <div className="quick-fact quick-fact--weather">
      <dt>Weather</dt>
      <dd>
        {weather ? <WeatherReading weather={weather} /> : <span className="quick-fact-meta">Currently unavailable</span>}
      </dd>
    </div>
  );
}

/** Same footprint as the loaded row, so nothing shifts when the weather arrives. */
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
