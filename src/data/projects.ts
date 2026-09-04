import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    slug: "news",
    title: "News",
    technology: ["Next.js", "TypeScript", "REST APIs"],
    description:
      "A modern news web application delivering UK and world headlines across politics, business, health, tech, sport and weather.",
    features: [
      "Section-based navigation",
      "Live weather widget",
      "Top stories feed",
      "Newsletter subscription",
      "Responsive interface",
      "Modern Next.js architecture",
    ],
    image: "/images/projects/news.webp",
    imageAlt: "The Daily Wire news application header navigation and newsletter footer",
    liveUrl: "https://the-daily-wire-two.vercel.app/",
    overview:
      "A freelance news web application built to explore modern content delivery, covering UK and world news across multiple sections.",
    challenge:
      "Structuring a multi-section news experience — politics, world, business, health, tech, sport and weather — in a way that stays clear, fast and easy to navigate.",
    approach:
      "Built with Next.js and TypeScript, integrating external APIs for headline and weather data, with a section-based navigation model and a responsive layout.",
    outcome:
      "A working news application demonstrating Next.js architecture, API integration and responsive frontend engineering.",
  },
  {
    slug: "dog-booking-system",
    title: "Dog Booking System",
    technology: ["React", "TypeScript", "Booking Workflow"],
    description:
      "A booking-system web application designed around managing dog-related appointments and bookings, including grooming, training, daycare and boarding.",
    features: [
      "Appointment booking",
      "Sign in / registration",
      "Service categories",
      "Booking management",
      "Responsive interface",
    ],
    image: "/images/projects/dog-booking.webp",
    imageAlt: "Pawside dog booking system landing page with appointment booking call to action",
    liveUrl: "https://booking-system-for-dogs.vercel.app/",
    overview:
      "A booking-system web application built around managing dog-related appointments, covering services such as grooming, training, daycare and boarding.",
    challenge:
      "Designing a booking flow that feels simple for customers arranging appointments across multiple dog-care services.",
    approach:
      "Built with React and TypeScript, implementing sign in / registration, service selection and an appointment booking workflow within a responsive interface.",
    outcome:
      "A working booking-system application demonstrating appointment-workflow design and modern frontend engineering.",
  },
  {
    slug: "air-quality-weather-forecasting",
    title: "Air Quality & Weather Forecasting",
    technology: ["Next.js", "React", "D3.js", "Node.js", "OJS", "API", "OpenWeather"],
    description:
      "An environmental research dashboard delivering real-time air-quality monitoring, weather observations and forecasting, with D3.js visualisation and international geographic comparison.",
    features: [
      "Real-time AQI and pollutant monitoring",
      "Current weather conditions and forecasts",
      "D3.js charts and bivariate choropleth mapping",
      "International country and city search",
      "Monitoring-station analysis",
      "Responsive research interface",
    ],
    image: "/images/projects/air-quality-weather-forecasting.webp",
    imageAlt: "Air Quality, Weather & Research Dashboard showing current AQI, pollutant levels and weather summary",
    liveUrl: "https://air-quality-weather-forecasting.vercel.app/en",
    overview:
      "A freelance environmental research platform combining live air-quality and weather data with forecasting, historical analysis and D3.js geographic visualisation.",
    challenge:
      "Bringing together air-quality and weather data from separate providers into one coherent, research-grade dashboard, including a bivariate choropleth map that stays honest about missing station coverage.",
    approach:
      "Built with Next.js and React, integrating the OpenWeather and WAQI APIs on the backend and rendering D3.js time-series charts and an international bivariate choropleth on the frontend.",
    outcome:
      "A working research dashboard demonstrating API integration, data visualisation with D3.js and responsive frontend engineering.",
  },
  {
    slug: "jira-project-management-system",
    title: "JIRA Project Management System",
    technology: ["React", "TypeScript", "Project Management"],
    description:
      "A project-management application exploring task organisation, issue tracking and workflow-based delivery.",
    features: [
      "Project dashboard",
      "Sprint / task tracking",
      "Status workflow",
      "Issue tracking",
      "Responsive interface",
    ],
    image: "/images/projects/jira-project-management.webp",
    imageAlt: "Atlas project management application dashboard showing sprint tasks and status",
    liveUrl: "https://jiraprojectmanagementsystem.vercel.app/",
    overview:
      "A project-management application exploring task organisation, issue tracking and workflow-based delivery, inspired by tools such as JIRA.",
    challenge:
      "Presenting roadmaps, sprints, tasks and issue status in a focused workspace that stays clear as work scales.",
    approach:
      "Built with React and TypeScript, implementing a sprint-based dashboard, task/issue tracking and status workflow within a responsive interface.",
    outcome:
      "A working project-management application demonstrating workflow design, state management and responsive frontend engineering.",
  },
];
