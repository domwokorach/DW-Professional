import type { ExperienceItem } from "@/types/experience";

export const experience: ExperienceItem[] = [
  {
    year: "2026",
    role: "Freelance Software Developer",
    org: "",
    location: "London, UK",
    period: "January 2026 – Present",
    focus:
      "Delivering scalable frontend applications focused on WCAG accessibility, performance and overall user experience.",
    points: [
      "Modern News Web Application — built a responsive news interface focused on accessible story presentation and intuitive navigation.",
      "Dog Booking System — built a React and TypeScript booking workflow for grooming, training, daycare and boarding appointments.",
      "Air Quality & Weather Forecasting — built a Next.js environmental dashboard using D3.js and OpenWeather APIs for real-time air-quality and weather monitoring.",
      "AI Application Jobs — built an AI-assisted Next.js and TypeScript platform that improves organisation and tracking of job application activities.",
      "JIRA Project Management System — developed a project-management application that improves task organisation and workflow visibility.",
    ],
    tags: ["React", "TypeScript", "Next.js", "D3.js", "REST APIs"],
  },
  {
    year: "2024",
    role: "Professional Development",
    org: "",
    location: "London, UK",
    period: "September 2024 – January 2026",
    focus:
      "Earned industry-recognised certifications and completed coding challenges across React, JavaScript, TypeScript, Python, SQL, REST APIs, Express, Angular, search algorithms and software engineering.",
    points: [
      "Earned industry-recognised certifications and completed coding challenges across React, JavaScript, TypeScript, Python, SQL, REST APIs, Express, Angular, search algorithms and software engineering.",
      "Strengthened expertise in clean code, API integration, databases, testing and scalable application architecture.",
    ],
    tags: ["React", "TypeScript", "Python", "SQL", "REST APIs"],
  },
  {
    year: "2024",
    role: "Software Engineer Intern",
    org: "Sky",
    location: "Osterley, London, UK",
    period: "June 2024 – August 2024",
    focus:
      "Delivered React and TypeScript components that enhanced catalogue, pricing and billing workflows.",
    points: [
      "Delivered React and TypeScript components that enhanced catalogue, pricing and billing workflows.",
      "Integrated REST APIs with AWS-hosted microservices to improve data exchange across business applications.",
      "Contributed to cloud-native solutions deployed through Docker and Kubernetes environments.",
      "Supported high-quality software delivery through Agile collaboration, code reviews, testing and CI/CD practices.",
    ],
    tags: ["React", "TypeScript", "REST APIs", "AWS", "Docker", "Kubernetes", "CI/CD"],
  },
  {
    year: "2022",
    role: "Career Break",
    org: "Travel and Personal Development",
    location: "North America & South Asia",
    period: "January 2022 – June 2024",
    focus:
      "Completed international travel across North America and South Asia, gaining valuable cross-cultural experience.",
    points: [
      "Completed international travel across North America and South Asia and gained valuable cross-cultural experience.",
      "Developed adaptability, communication and problem-solving skills.",
      "Maintained technical knowledge through self-directed learning and professional development activities.",
    ],
    tags: [],
    muted: true,
  },
  {
    year: "2018",
    role: "Senior Frontend Developer",
    org: "Lloyds Banking Group",
    location: "London Bridge, London, UK",
    period: "September 2018 – January 2020",
    focus:
      "Developed and maintained an enterprise event platform supporting innovation programmes and employee engagement initiatives.",
    points: [
      "Developed and maintained an enterprise event platform supporting innovation programmes and employee engagement initiatives.",
      "Improved digital accessibility through WCAG 2.1 AA-compliant user interfaces across desktop and mobile platforms.",
      "Developed reusable design-system components adopted across multiple projects, reducing duplication and accelerating feature delivery.",
      "Collaborated with cross-functional stakeholders to deliver features successfully within Agile release cycles.",
    ],
    tags: ["React", "Accessibility", "WCAG", "Design Systems", "Agile"],
  },
  {
    year: "2016",
    role: "Senior Web Developer, Backend, Innovation & Architecture and Strategy",
    org: "Lloyds Banking Group",
    location: "London Bridge, London, UK",
    period: "March 2016 – September 2018",
    focus:
      "Developed Python-based automation tooling that streamlined manual processes and improved operational efficiency across innovation teams.",
    points: [
      "Developed Python-based automation tooling that streamlined manual processes and improved operational efficiency across innovation teams.",
      "Contributed to Neo4j graph-database initiatives that improved internal search and knowledge discovery.",
      "Designed UX prototypes and wireframes supporting youth customer-focused digital banking concepts.",
      "Built AI-powered search proof-of-concepts that improved access to internal knowledge resources.",
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
      "Developed reusable frontend components supporting scalable and maintainable UI architecture.",
    points: [
      "Developed reusable frontend components supporting scalable and maintainable UI architecture.",
      "Improved application quality through performance enhancements and defect resolution.",
      "Contributed to responsive web applications supporting multiple business functions.",
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
      "Completed an engineering apprenticeship with cross-functional experience across DevOps, Mobile Engineering and UI Digital Transformation.",
      "Supported digital initiatives while building strong foundations in software engineering and operational practices.",
      "Collaborated with multidisciplinary teams across the software development lifecycle.",
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
