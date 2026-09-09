"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const zoneFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  timeZoneName: "short",
});

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  hourCycle: "h23",
});

function getUKHour(now: Date): number {
  const parts = hourFormatter.formatToParts(now);
  const hour = parts.find((part) => part.type === "hour")?.value;
  return Number(hour);
}

type Period = "morning" | "afternoon" | "evening";

const GREETINGS: Record<Period, string> = {
  morning: "Good Morning!",
  afternoon: "Good Afternoon!",
  evening: "Good Evening!",
};

function getPeriod(hour: number): Period {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getUKZoneLabel(now: Date): string {
  const parts = zoneFormatter.formatToParts(now);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "UK";
}

interface UKClock {
  period: Period;
  zone: string;
  time: string;
  date: string;
  iso: string;
}

function getUKClock(): UKClock {
  const now = new Date();
  return {
    period: getPeriod(getUKHour(now)),
    zone: getUKZoneLabel(now),
    time: timeFormatter.format(now),
    date: dateFormatter.format(now),
    iso: now.toISOString(),
  };
}

const UPDATE_INTERVAL_MS = 1_000;

export default function UKGreeting({
  showLocation = true,
  className,
}: {
  showLocation?: boolean;
  className?: string;
}) {
  const [clock, setClock] = useState<UKClock | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const update = () => setClock(getUKClock());

    update();
    const id = window.setInterval(update, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  if (!clock) {
    return <div className={className} aria-hidden="true" />;
  }

  const { period, zone, time, date, iso } = clock;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.p
          key={period}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="greeting-text text-sm font-medium tracking-wide sm:text-base"
        >
          <span className="greeting-title">{GREETINGS[period]}</span>
          {showLocation && (
            <span className="location-text ml-2">
              Current location: London ·{" "}
              <time dateTime={iso} className="tabular-nums">
                {zone} {time}
              </time>{" "}
              | {date}
            </span>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
