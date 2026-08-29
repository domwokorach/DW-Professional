"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function getUKHour(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value;
  return Number(hour);
}

type Period = "morning" | "afternoon" | "evening";

const GREETINGS: Record<Period, string> = {
  morning: "Good Morning!",
  afternoon: "Good Afternoon!",
  evening: "Good Evening!",
};

const GREETING_COLORS: Record<Period, string> = {
  morning: "text-emerald-300",
  afternoon: "text-orange-400",
  evening: "text-sky-300",
};

function getPeriod(hour: number): Period {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getUKZoneLabel(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "UK";
}

const CHECK_INTERVAL_MS = 45_000;

export default function UKGreeting({
  showLocation = true,
  className,
}: {
  showLocation?: boolean;
  className?: string;
}) {
  const [period, setPeriod] = useState<Period | null>(null);
  const [zone, setZone] = useState<string>("UK");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const update = () => {
      setPeriod(getPeriod(getUKHour()));
      setZone(getUKZoneLabel());
    };

    update();
    const id = window.setInterval(update, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  if (!period) {
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.p
          key={period}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm font-medium tracking-wide sm:text-base"
        >
          <span className={GREETING_COLORS[period]}>{GREETINGS[period]}</span>
          {showLocation && (
            <span className="ml-2 text-muted">
              Current location: London · {zone}
            </span>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
