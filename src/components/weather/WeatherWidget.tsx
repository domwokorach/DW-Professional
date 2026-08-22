"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { WeatherData } from "@/types/weather";
import { getWeatherAppearance, isCold } from "@/lib/weather";

type Status =
  | "idle"
  | "requesting"
  | "loading"
  | "success"
  | "denied"
  | "unsupported"
  | "error";

const CACHE_KEY = "weather-cache";
const CACHE_TTL_MS = 10 * 60 * 1000;

type Cached = { weather: WeatherData; timestamp: number };

function readCache(): Cached | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(weather: WeatherData) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ weather, timestamp: Date.now() })
    );
  } catch {
    // storage unavailable — weather still works for this session
  }
}

async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(`/api/weather?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load weather");
  }

  return response.json();
}

export default function WeatherWidget({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setWeather(cached.weather);
      setStatus("success");
    }

    if (typeof navigator !== "undefined" && !navigator.geolocation) {
      setStatus((prev) => (prev === "success" ? prev : "unsupported"));
    }
  }, []);

  const requestWeather = () => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");
        try {
          const data = await fetchWeather(
            position.coords.latitude,
            position.coords.longitude
          );
          setWeather(data);
          writeCache(data);
          setStatus("success");
        } catch {
          setStatus("error");
        }
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: CACHE_TTL_MS }
    );
  };

  if (status === "unsupported") return null;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.button
            key="idle"
            type="button"
            onClick={requestWeather}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-medium text-muted underline decoration-line underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            Show My Weather
          </motion.button>
        )}

        {(status === "requesting" || status === "loading") && (
          <motion.p
            key="loading"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs text-muted"
            aria-live="polite"
          >
            Loading local weather...
          </motion.p>
        )}

        {status === "denied" && (
          <motion.div
            key="denied"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-xs text-muted"
          >
            <span>Location unavailable</span>
            <button
              type="button"
              onClick={requestWeather}
              className="underline decoration-line underline-offset-4 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-xs text-muted"
          >
            <span>Weather unavailable</span>
            <button
              type="button"
              onClick={requestWeather}
              className="underline decoration-line underline-offset-4 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {status === "success" && weather && (
          <motion.p
            key="success"
            initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm text-muted"
          >
            {(() => {
              const condition = weather.weather[0]?.main ?? "Clear";
              const appearance = getWeatherAppearance(condition);
              const temp = Math.round(weather.main.temp);
              const cold = isCold(temp);

              return (
                <>
                  <span className="text-white">
                    {weather.name}
                    {weather.sys.country ? `, ${weather.sys.country}` : ""}
                  </span>
                  <span className="mx-1.5" aria-hidden>
                    ·
                  </span>
                  <span>{temp}°C</span>
                  <span className="mx-1.5" aria-hidden>
                    ·
                  </span>
                  <span className={appearance.className}>
                    {appearance.label}{" "}
                    <span aria-hidden="true">{appearance.emoji}</span>
                  </span>
                  {cold && (
                    <>
                      <span className="mx-1.5" aria-hidden>
                        ·
                      </span>
                      <span className="text-cyan-300">
                        Cold <span aria-hidden="true">🥶</span>
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
