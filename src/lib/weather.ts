export type WeatherAppearance = {
  label: string;
  emoji: string;
  className: string;
};

export const COLD_THRESHOLD_C = 8;

export function isCold(temp: number, threshold: number = COLD_THRESHOLD_C): boolean {
  return temp <= threshold;
}

export function getWeatherAppearance(condition: string): WeatherAppearance {
  switch (condition) {
    case "Clear":
      return { label: "Clear", emoji: "☀️", className: "text-amber-300" };

    case "Clouds":
      return { label: "Cloudy", emoji: "☁️", className: "text-slate-300" };

    case "Rain":
      return { label: "Rain", emoji: "🌧️", className: "text-blue-300" };

    case "Drizzle":
      return { label: "Drizzle", emoji: "🌦️", className: "text-blue-300" };

    case "Thunderstorm":
      return { label: "Thunderstorm", emoji: "⛈️", className: "text-violet-300" };

    case "Snow":
      return { label: "Snow", emoji: "❄️", className: "text-sky-100" };

    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
      return { label: condition, emoji: "🌫️", className: "text-neutral-300" };

    case "Dust":
    case "Sand":
    case "Squall":
      return { label: condition, emoji: "💨", className: "text-neutral-300" };

    case "Ash":
      return { label: condition, emoji: "🌫️", className: "text-neutral-300" };

    case "Tornado":
      return { label: "Tornado", emoji: "🌪️", className: "text-neutral-300" };

    default:
      return { label: condition, emoji: "🌤️", className: "text-neutral-300" };
  }
}

export function formatCoordinate(value: number, positive: string, negative: string): string {
  const direction = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}
