"use client";

import { navigation } from "@/data/navigation";

export default function Navigation({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <ul className="hidden md:flex items-center gap-8">
      {navigation.slice(0, -1).map((item) => (
        <li key={item.id}>
          <button
            onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? "true" : undefined}
            className={`tablet-white text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4 rounded ${
              active === item.id ? "text-white" : "text-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
