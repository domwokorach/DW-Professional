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
      { name: 'Modern News Web Application', description: 'Built a responsive news interface focused on accessible story presentation and intuitive navigation.', url: 'https://the-daily-wire-two.vercel.app/' },
      { name: 'Dog Booking System', description: 'Built a React and TypeScript booking workflow for grooming, training, daycare, and boarding appointments.', url: 'https://booking-system-for-dogs.vercel.app/' },
      { name: 'Air Quality & Weather Forecasting', description: 'Built a Next.js environmental dashboard using D3.js and OpenWeather APIs for real-time air-quality and weather monitoring.', url: 'https://air-quality-weather-forecasting.vercel.app/en' },
      { name: 'AI Application Jobs', description: 'Built an AI-assisted Next.js and TypeScript platform that improved organisation and tracking of application activities.', url: 'https://ai-application-jobs-special-27ax.vercel.app/' },
      { name: 'JIRA Project Management System', description: 'Developed a project management application that enhanced task organisation and workflow visibility.', url: 'https://jiraprojectmanagementsystem.vercel.app/' },
      { name: 'Coding Assessment', description: 'Completed software engineering coding assessments and technical challenges, demonstrating practical problem-solving, debugging, and development skills.', url: 'https://coding-challenege-assessment.vercel.app/' },
      { name: 'Software Engineer Workspace', description: 'Built a developer-focused workspace to support software engineering tasks, project organisation, and efficient development workflows.', url: 'https://workspace-teams-seven.vercel.app/login' },
      { name: 'Housing Agent', description: 'Developed a housing-focused application to support property discovery and agent workflows through a clear, responsive user experience.', url: 'https://housing-agent-ty6m.vercel.app/' },
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
    projectsLabel: 'Learning Courses',
    projects: [
      { name: 'HackerRank', description: 'C#, SQL, React, REST API, JavaScript and problem-solving learning/assessment.' },
      { name: 'Codecademy', description: 'Python, search algorithms, Express and React.' },
      { name: 'Learn TypeScript Online', description: 'Primitive types, unions, narrowing, arrays, tuples and literal types.' },
      { name: 'Learn JavaScript Online', description: 'Strings, numbers, arrays, objects, functions, classes and prototypical inheritance.' },
      { name: 'Learn Programming', description: 'Variables, data types, arrays, objects, functions and conditionals.' },
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
    projectsLabel: 'Work Learning',
    projects: [
      { name: 'Analysis — Technical Analyst', description: 'Requirements, dependencies, system understanding and impact analysis.' },
      { name: 'Design', description: 'Technical design, solution planning and implementation preparation.' },
      { name: 'Testing & Integration', description: 'E2E testing, Jenkins, CI/CD pipelines and cross-service validation.' },
      { name: 'Deployment', description: 'Build/release workflows, deployment pipelines and environment checks.' },
      { name: 'Testing', description: 'Regression testing, functional validation and release confidence.' },
      { name: 'Maintenance', description: 'Feature requests, issue reporting, stakeholder feedback and ongoing support.' },
    ],
    projectGallery: [
      {
        src: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_auto,q_auto/v1783168000/BSL_Dominic_Day_11_6_wp2ekp.jpg',
        fallbackSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_jpg,q_auto/v1783168000/BSL_Dominic_Day_11_6_wp2ekp.jpg',
        originalSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/v1783168000/BSL_Dominic_Day_11_6_wp2ekp.jpg',
        alt: 'Two colleagues discussing work at computers in an office.',
        width: 4190,
        height: 2775,
      },
      {
        src: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_auto,q_auto/v1783168000/BSL_Dominic_Day_16_95_rmoy4j.jpg',
        fallbackSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_jpg,q_auto/v1783168000/BSL_Dominic_Day_16_95_rmoy4j.jpg',
        originalSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/v1783168000/BSL_Dominic_Day_16_95_rmoy4j.jpg',
        alt: 'A visitor speaking with a colleague in a bright workspace.',
        width: 3952,
        height: 2618,
      },
      {
        src: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_auto,q_auto/v1783168000/BSL_Dominic_Day_3_94_wt7pck.jpg',
        fallbackSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_jpg,q_auto/v1783168000/BSL_Dominic_Day_3_94_wt7pck.jpg',
        originalSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/v1783168000/BSL_Dominic_Day_3_94_wt7pck.jpg',
        alt: 'Two colleagues walking and talking outside an office building.',
        width: 3214,
        height: 2129,
      },
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
      {
        name: 'Web Accessibility on Banking',
        description: 'Accessible digital banking interfaces and inclusive frontend experiences.',
        url: 'https://res.cloudinary.com/dkkuwmr42/video/upload/v1791557665/Full%20Stack%20Developer/lbg-dw_fnk7y7.mp4',
        video: {
          src: 'https://res.cloudinary.com/dkkuwmr42/video/upload/v1791557665/Full%20Stack%20Developer/lbg-dw_fnk7y7.mp4',
          poster: 'https://res.cloudinary.com/dkkuwmr42/video/upload/so_0,f_jpg,q_auto/v1791557665/Full%20Stack%20Developer/lbg-dw_fnk7y7.jpg',
          width: 1280,
          height: 676,
        },
      },
      {
        name: 'Innovation Community',
        description: 'Conference facilitation, graph-based visual work, web construction and innovation collaboration.',
        visibility: 'confidential',
      },
      { name: 'Innovation X', description: 'Team values, KPIs, internal innovation and search/frontend experience.', visibility: 'confidential' },
      { name: 'Applied Technology and Strategy Team', description: 'Prototype showcases, emerging technology and applied innovation.', visibility: 'confidential' },
      {
        name: 'Banner Design for Early Careers',
        description: 'LBG campaign/banner design supporting student, apprenticeship and early-career engagement.',
        image: {
          src: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_auto,q_auto/v1790087347/IC_conference_dmmrsr.heic',
          fallbackSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/f_jpg,q_auto/v1790087347/IC_conference_dmmrsr.jpg',
          originalSrc: 'https://res.cloudinary.com/dkkuwmr42/image/upload/v1790087347/IC_conference_dmmrsr.heic',
          alt: 'Early Careers campaign banner design supporting student, apprenticeship and graduate engagement at LBG.',
          width: 4032,
          height: 3024,
        },
      },
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
    projectsLabel: 'Work projects',
    projects: [
      { name: 'Data Analytics, Data Science & Machine Learning', description: 'Python foundations supporting backend, data-analysis, data-science and machine-learning understanding.', visibility: 'confidential' },
      { name: 'Innovation X Team', description: 'Neo4j-backed internal search, API/JSON workflows, CSS3/Sass interface improvements and toolbar UI icons.', visibility: 'confidential' },
      { name: 'Programming Languages & Technical Development', description: 'Continuous technical learning supporting progression toward advanced frontend and software-engineering responsibilities.', visibility: 'professional-development' },
      { name: 'UI/UX — Piggy Bank Web Application', description: "Prototype for parent-managed children's finances, financial education and stakeholder presentation.", visibility: 'confidential' },
      { name: 'Internal AI Chatbot Prototype', description: 'Conversational interface concept helping colleagues find authorised internal HR, payroll, annual-leave and workplace information more efficiently.', visibility: 'confidential' },
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
    projectsLabel: 'Work projects',
    projects: [
      { name: 'UI Delivery and Transformation', description: 'Frontend testing, Jenkins/Git workflows, debugging, defect investigation and release validation for digital banking changes.', visibility: 'confidential' },
      { name: 'HTML Email', description: 'Internal HTML email template development and communication support across Lloyds Banking Group.', visibility: 'confidential' },
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
    projectsLabel: 'Work Trainee',
    projects: [
      { name: 'HR', description: 'Shadowing and organisational learning across HR and business operations.' },
      { name: 'Mobile Engineering', description: 'Exposure to iOS, Android, Touch ID, Apple Pay, authentication and mobile banking workflows.' },
      { name: 'UI Delivery and Transformation', description: 'The trainee rotation that most closely matched my interests and helped shape my move into UI/frontend work.' },
      { name: 'DevOps', description: 'Exposure to testing, release workflows, collaboration and software delivery processes.' },
    ],
  },
];
