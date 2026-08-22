import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    slug: "world-cup-2026-match-tracker",
    title: "World Cup 2026 Match Tracker",
    technology: ["React", "TypeScript", "REST APIs"],
    description:
      "A football match tracking experience supporting more than 100 fixtures with timezone conversion, calendar exports and match reminders.",
    features: [
      "100+ fixtures",
      "Timezone conversion",
      "Calendar export",
      "Match reminders",
      "API-driven content",
      "Responsive interface",
    ],
    overview:
      "A portfolio frontend project built to track World Cup 2026 fixtures, giving fans an accurate, personalised view of match schedules across timezones.",
    challenge:
      "Presenting over 100 fixtures in a way that stays clear and scannable, while accounting for timezone differences and giving users a way to remember matches they care about.",
    approach:
      "Built with React and TypeScript, integrating REST APIs for fixture data, with timezone conversion logic, calendar export functionality, and a responsive interface for reminders.",
    outcome:
      "A working match tracker demonstrating REST API integration, timezone handling, and responsive frontend engineering.",
  },
  {
    slug: "ai-chatbot-assistant",
    title: "AI Chatbot Assistant",
    technology: ["React", "TypeScript", "Google Gemini API"],
    description:
      "An AI-powered conversational assistant designed for intelligent search and information retrieval.",
    features: [
      "Conversational UI",
      "AI integration",
      "Search",
      "Information retrieval",
      "Responsive interface",
    ],
    overview:
      "A conversational AI assistant built to explore search and information-retrieval workflows powered by the Google Gemini API.",
    challenge:
      "Designing a conversational interface that feels natural and responsive while integrating an external AI API for search and retrieval.",
    approach:
      "Implemented with React and TypeScript, connecting to the Google Gemini API to handle conversational queries and return relevant information.",
    outcome:
      "A functioning chatbot assistant demonstrating AI API integration and conversational UI design.",
  },
  {
    slug: "weather-forecasting-application",
    title: "Weather Forecasting Application",
    technology: ["Next.js", "TypeScript", "REST APIs"],
    description:
      "A modern weather forecasting application delivering real-time weather information through external API integrations.",
    features: [
      "Real-time weather",
      "API integration",
      "Responsive interface",
      "Modern Next.js architecture",
    ],
    overview:
      "A weather forecasting application delivering real-time updates through external REST API integrations, built on Next.js.",
    challenge:
      "Delivering accurate, real-time weather data through a clean, responsive interface across devices.",
    approach:
      "Built with Next.js and TypeScript, fetching real-time weather data from external REST APIs and rendering it through responsive UI patterns.",
    outcome:
      "A responsive weather application showcasing Next.js architecture and REST API integration.",
  },
  {
    slug: "geolocation-search-application",
    title: "Geolocation Search Application",
    technology: ["React", "Google Maps API"],
    description:
      "A location-based application providing real-time address lookup and location tracking functionality.",
    features: [
      "Google Maps API",
      "Geolocation",
      "Address lookup",
      "Location tracking",
      "Interactive mapping",
    ],
    overview:
      "A geolocation search application providing real-time address lookup and location tracking using the Google Maps API.",
    challenge:
      "Building accurate, real-time location lookup and tracking functionality with an interactive mapping interface.",
    approach:
      "Built with React, integrating the Google Maps API for geolocation, address lookup, and interactive map rendering.",
    outcome:
      "A working geolocation application demonstrating third-party mapping API integration.",
  },
];
