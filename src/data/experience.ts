import type { Experience, Period } from '@/types';

const p = (label: string): Period => {
  const [mm, yyyy] = label.split('/');
  return { label, iso: `${yyyy}-${mm}` };
};

// Newest first.
export const experiences: Experience[] = [
  {
    role: 'Freelance Software Developer',
    company: 'Freelance',
    location: 'London, UK',
    start: p('01/2026'),
    bullets: [
      'Delivered scalable frontend applications that improve WCAG accessibility, performance, and overall user experience.',
    ],
    projectsLabel: 'Freelance projects',
    projects: [
      { name: 'Modern News Web Application', description: 'Built a responsive news interface focused on accessible story presentation and intuitive navigation.' },
      { name: 'Dog Booking System', description: 'Built a React and TypeScript booking workflow for grooming, training, daycare, and boarding appointments.' },
      { name: 'Air Quality & Weather Forecasting', description: 'Built a Next.js environmental dashboard using D3.js and OpenWeather APIs for real-time air-quality and weather monitoring.' },
      { name: 'AI Application Jobs', description: 'Built an AI-assisted Next.js and TypeScript platform that improved organisation and tracking of application activities.' },
      { name: 'JIRA Project Management System', description: 'Developed a project management application that enhanced task organisation and workflow visibility.' },
      { name: 'Coding Assessment', description: 'Completed software engineering coding assessments and technical challenges, demonstrating practical problem-solving, debugging, and development skills.' },
      { name: 'Software Engineer Workspace', description: 'Built a developer-focused workspace to support software engineering tasks, project organisation, and efficient development workflows.' },
      { name: 'Housing Agent', description: 'Developed a housing-focused application to support property discovery and agent workflows through a clear, responsive user experience.' },
    ],
  },
  {
    role: 'Professional Development',
    company: 'Home',
    location: 'London, UK',
    start: p('09/2024'),
    end: p('01/2026'),
    bullets: [
      'Earned multiple industry-recognised certifications and completed coding challenges across React, JavaScript, TypeScript, Python, SQL, REST APIs, Express, Angular, search algorithms, and software engineering, strengthening expertise across modern frontend and full-stack technologies.',
      'Strengthened expertise in clean code, API integration, databases, testing, and scalable application architecture.',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'Sky',
    location: 'Osterley, London, UK',
    start: p('06/2024'),
    end: p('08/2024'),
    bullets: [
      'Delivered React and TypeScript components that enhanced catalogue, pricing, and billing workflows.',
      'Integrated REST APIs with AWS-hosted microservices, improving data exchange across business applications.',
      'Contributed to cloud-native solutions deployed through Docker and Kubernetes environments.',
      'Supported high-quality software delivery through Agile collaboration, code reviews, testing, and CI/CD practices.',
    ],
  },
  {
    role: 'Senior Frontend Developer',
    company: 'Lloyds Banking Group',
    location: 'London Bridge, London, UK',
    start: p('09/2018'),
    end: p('06/2024'),
    bullets: [
      'Developed and maintained an enterprise event platform supporting innovation programmes and employee engagement initiatives.',
      'Improved digital accessibility through WCAG 2.1 AA-compliant user interfaces across desktop and mobile platforms.',
      'Developed reusable design-system components adopted across multiple projects, reducing duplication and accelerating feature delivery.',
      'Collaborated with cross-functional stakeholders to successfully deliver features within Agile release cycles.',
    ],
    projectsLabel: 'Work projects',
    projects: [
      { name: 'Web Accessibility on Banking', description: 'Accessible digital banking interfaces and inclusive frontend experiences.' },
      { name: 'Innovation Community', description: 'Conference facilitation, graph-based visual work, web construction and innovation collaboration.' },
      { name: 'Innovation X', description: 'Team values, KPIs, internal innovation and search/frontend experience.' },
      { name: 'Applied Technology and Strategy Team', description: 'Prototype showcases, emerging technology and applied innovation.' },
      { name: 'Banner Design for Early Careers', description: 'LBG campaign/banner design supporting student, apprenticeship and early-career engagement.' },
    ],
  },
  {
    role: 'Senior Web Developer — Backend, Innovation, Architecture & Strategy',
    company: 'Lloyds Banking Group',
    location: 'London Bridge, London, UK',
    start: p('03/2016'),
    end: p('09/2018'),
    bullets: [
      'Developed Python-based automation tooling that streamlined manual processes and improved operational efficiency across innovation teams.',
      'Contributed to Neo4j graph database initiatives, improving internal search and knowledge-discovery capabilities.',
      'Designed UX prototypes and wireframes supporting youth customer-focused digital banking concepts.',
      'Built AI-powered search proof-of-concepts that improved access to internal knowledge resources.',
    ],
  },
  {
    role: 'Junior UI Delivery and Transformation',
    company: 'Lloyds Banking Group',
    location: 'Moorgate, London, UK',
    start: p('03/2015'),
    end: p('03/2016'),
    bullets: [
      'Developed reusable frontend components supporting scalable and maintainable UI architecture.',
      'Improved application quality through performance enhancements and defect resolution.',
      'Contributed to responsive web applications supporting multiple business functions.',
    ],
  },
  {
    role: 'Trainee Digital Transformation',
    company: 'Lloyds Banking Group',
    location: 'Moorgate, London, UK',
    start: p('10/2014'),
    end: p('03/2015'),
    bullets: [
      'Completed an engineering apprenticeship, gaining cross-functional experience across DevOps, Mobile Engineering, and UI Digital Transformation.',
      'Supported digital initiatives while building strong foundations in software engineering and operational practices.',
      'Collaborated with multidisciplinary teams to gain practical experience across the software development lifecycle.',
    ],
  },
];
