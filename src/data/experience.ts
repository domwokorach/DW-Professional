import type { ExperienceItem } from "@/types/experience";

export const experience: ExperienceItem[] = [
  {
    year: "2026",
    role: "Freelance Software Developer",
    org: "Portfolio Projects",
    location: "London, UK",
    period: "January 2026 – Present",
    focus:
      "Building modern software and web applications using React, TypeScript, Next.js and external APIs.",
    points: [
      "World Cup 2026 Match Tracker",
      "AI Chatbot Assistant",
      "Weather Forecasting Application",
      "Geolocation Search Application",
    ],
    tags: ["React", "TypeScript", "Next.js", "REST APIs"],
  },
  {
    year: "2024",
    role: "Professional Development",
    org: "",
    location: "London, UK",
    period: "September 2024 – January 2026",
    focus:
      "Continued development across React, JavaScript, TypeScript, Python, SQL, REST APIs, Express, Angular and search algorithms — strengthening clean code, maintainable architecture, data structures, API integration, database querying, testing and software engineering practices.",
    points: [],
    tags: ["React", "TypeScript", "Python", "SQL", "REST APIs"],
  },
  {
    year: "2024",
    role: "Software Engineer Intern",
    org: "Sky",
    location: "Osterley, London",
    period: "June 2024 – August 2024",
    focus:
      "Developed React and TypeScript components supporting catalogue, pricing and billing workflows.",
    points: [
      "Developed React and TypeScript components supporting catalogue, pricing and billing workflows.",
      "Integrated REST APIs with AWS-hosted microservices supporting internal business services.",
      "Contributed to cloud-native applications deployed with Docker and Kubernetes.",
      "Participated in Agile ceremonies, code reviews, testing and CI/CD deployments.",
    ],
    tags: ["React", "TypeScript", "REST APIs", "AWS", "Docker", "Kubernetes", "CI/CD"],
  },
  {
    year: "2022",
    role: "Career Break",
    org: "World Travel & Personal Development",
    location: "North America & Southeast Asia",
    period: "January 2022 – June 2024",
    focus:
      "International travel and personal development across North America and Southeast Asia, strengthening communication, adaptability and cross-cultural collaboration.",
    points: [],
    tags: [],
  },
  {
    year: "2018",
    role: "Senior Frontend Developer",
    org: "Lloyds Banking Group — Applied Technology & Innovation Community",
    location: "London Bridge, London, UK",
    period: "September 2018 – January 2020",
    focus:
      "Developed and maintained an enterprise event platform supporting innovation programmes and employee engagement initiatives.",
    points: [
      "Developed and maintained an enterprise event platform supporting innovation programmes and employee engagement initiatives.",
      "Delivered WCAG 2.1 AA-compliant interfaces across desktop and mobile.",
      "Developed reusable design-system components adopted across multiple projects.",
      "Collaborated with stakeholders through Agile sprint cycles and release schedules.",
    ],
    tags: ["React", "Accessibility", "WCAG", "Design Systems", "Agile"],
  },
  {
    year: "2016",
    role: "Senior Web Developer",
    org: "Lloyds Banking Group — Innovation & Architecture and Strategy",
    location: "London Bridge, London, UK",
    period: "March 2016 – September 2018",
    focus:
      "Developed Python-based automation tooling to streamline manual processes.",
    points: [
      "Developed Python-based automation tooling to streamline manual processes.",
      "Contributed to Neo4j graph database initiatives.",
      "Designed UX prototypes and wireframes for digital banking concepts.",
      "Built proof-of-concept AI search solutions.",
    ],
    tags: ["Python", "Automation", "Neo4j", "UX Prototyping", "AI Search"],
  },
  {
    year: "2015",
    role: "Junior UI Delivery and Transformation",
    org: "Lloyds Banking Group",
    location: "Moorgate, London, UK",
    period: "March 2015 – March 2016",
    focus:
      "Developed reusable frontend components supporting scalable UI architecture.",
    points: [
      "Developed reusable frontend components supporting scalable UI architecture.",
      "Assisted with application performance improvements and software defect resolution.",
      "Contributed to responsive web applications across multiple business functions.",
    ],
    tags: [],
  },
  {
    year: "2014",
    role: "Trainee Digital Transformation",
    org: "Lloyds Banking Group",
    location: "Moorgate, London, UK",
    period: "October 2014 – March 2015",
    focus:
      "Completed an engineering apprenticeship, gaining cross-functional experience across DevOps, Mobile Engineering, and UI Digital Transformation.",
    points: [
      "Completed an engineering apprenticeship with experience across DevOps, Mobile Engineering and UI Digital Transformation.",
      "Supported technology teams in delivering digital initiatives across the software development lifecycle, infrastructure and digital delivery.",
    ],
    tags: ["DevOps", "Mobile Engineering", "SDLC"],
  },
].reverse();

export const certifications = {
  codecademy: ["React", "Express", "Python", "Search Algorithms"],
  hackerrank: ["JavaScript", "SQL", "Angular", "React", "Software Engineer"],
  additional: ["TypeScript Certification"],
};

export const education = [
  {
    institution: "Hammersmith & West London College",
    qualification: "BTEC National Diploma — DMM",
  },
  {
    institution: "",
    qualification: "Additional BTEC and GNVQ qualifications",
  },
];
