import type { CaseStudy } from "@/types/caseStudy";

export const caseStudies: CaseStudy[] = [
  {
    slug: "specialist-disability",
    number: "01",
    title: "Specialist Disability",
    subtitle: "Improving accessibility across online banking experiences.",
    categories: ["Accessibility", "Digital Banking", "Frontend"],
    summary:
      "Contributed to accessibility-focused work within online banking, helping create digital experiences that were more usable and inclusive for customers with disabilities.",
    technology: ["Accessibility", "Semantic HTML", "Frontend Development", "Digital Banking"],
    size: "large",
    visualDirection:
      "Accessible banking interface with high-contrast typography and clear keyboard-navigable structure.",
    context:
      "A digital banking environment serving customers with a wide range of accessibility requirements.",
    challenge:
      "Supporting accessible frontend experiences and improving usability for people with disabilities.",
    contribution: [
      "Contributed to accessibility-focused frontend development within an online banking environment.",
      "Worked on semantic, keyboard-friendly interface structure to support inclusive interaction.",
      "Considered screen-reader behaviour and responsive layout when implementing interface changes.",
    ],
    accessibility:
      "Work was guided by WCAG-conscious development practices, including semantic markup, keyboard accessibility and screen-reader considerations, without claiming a specific certified conformance level.",
    outcome: {
      heading: "What I Learned",
      text: "This work deepened my understanding of how frontend implementation decisions directly affect accessibility outcomes for real customers, and shaped how I approach inclusive design in every project since.",
    },
    mediaType: "video",
    mediaSrc:
      "https://res.cloudinary.com/dkkuwmr42/video/upload/v1783170985/videoplayback_1_qa4kbj.mov",
    mediaAlt: "Screen recording walkthrough of accessible digital banking interface work",
  },
  {
    slug: "halifax-piggy-banking",
    number: "02",
    title: "Halifax Piggy Banking",
    subtitle: "Exploring digital banking experiences for younger customers.",
    label: "Concept / UX Prototype",
    categories: ["UX/UI", "Digital Banking", "Prototyping"],
    summary:
      "Designed UX prototypes and wireframes for a digital banking concept aimed at younger customers, exploring how banking interactions could be made approachable, intuitive and engaging for a youth audience.",
    technology: ["UX Prototyping", "Wireframing", "Interaction Design", "Mobile-first Design"],
    size: "half",
    visualDirection:
      "UX wireframes and mobile banking concept screens exploring youth-friendly savings interactions — presented as concept reconstructions, not production screens.",
    context:
      "An early-stage digital banking concept exploring how savings and banking interactions could be reimagined for a younger customer audience.",
    challenge:
      "Designing banking interactions that feel approachable and engaging to a youth audience, without sacrificing clarity or trust.",
    contribution: [
      "Designed UX prototypes and wireframes for the digital banking concept.",
      "Explored information hierarchy and interaction design for youth-focused banking journeys.",
      "Approached the concept with mobile-first thinking throughout.",
    ],
    uxApproach:
      "Wireframes and prototypes focused on simplifying savings interactions and information hierarchy, using a mobile-first approach suited to a younger, mobile-native audience.",
    outcome: {
      heading: "What I Learned",
      text: "Prototyping for a distinct audience segment sharpened my approach to information hierarchy and interaction design, and reinforced the value of exploring concepts before committing to production engineering.",
    },
    mediaType: "image",
    mediaSrc: "/images/case-studies/halifax-piggy-banking.webp",
    mediaAlt: "Piggy Bank youth digital banking prototype landing page",
    prototypeHref: "https://piggy-bank-wine.vercel.app/",
  },
  {
    slug: "innovation-community",
    number: "03",
    title: "Innovation Community",
    subtitle: "Supporting the Innovation Communities Conference 2018.",
    categories: ["Frontend Development", "Innovation", "Events"],
    summary:
      "Worked as part of the team supporting the delivery of the Innovation Communities Conference 2018, contributing to the digital experience used to support innovation programmes and community engagement.",
    technology: ["Frontend Development", "Responsive UI", "Reusable Components", "Agile"],
    size: "half",
    visualDirection:
      "Enterprise event platform and community-network visual language, editorial in tone.",
    context:
      "An enterprise event platform supporting innovation programmes and employee engagement initiatives, including the Innovation Communities Conference 2018.",
    challenge:
      "Delivering a reliable digital experience for a large internal conference, supporting community engagement and innovation programmes.",
    contribution: [
      "Contributed as part of the delivery team supporting the Innovation Communities Conference 2018.",
      "Developed frontend components for the enterprise event platform.",
      "Collaborated within an Agile team across sprint cycles and release schedules.",
    ],
    outcome: {
      heading: "What I Learned",
      text: "Delivering as part of a team under conference deadlines reinforced the value of reusable components and close collaboration across design, product and engineering.",
    },
  },
  {
    slug: "innovation-x",
    number: "04",
    title: "Innovation X",
    subtitle: "Making internal knowledge and people easier to discover.",
    categories: ["Neo4j", "Search", "Frontend", "Internal Tools"],
    summary:
      "Contributed to an Innovation X internal search experience backed by Neo4j graph database technology. My frontend work included CSS3 interface improvements and toolbar icons designed to make people-search functionality clearer and easier to use.",
    technology: ["Neo4j", "CSS3", "Frontend Development", "Search UX"],
    size: "half",
    visualDirection:
      "Graph relationships, connected nodes and a search-toolbar interface, inspired by graph-database visual language without reproducing any proprietary interface.",
    context:
      "An internal knowledge and people-search tool built on Neo4j graph database technology, intended to help colleagues discover relevant people and information.",
    challenge:
      "Internal knowledge and people-search tools need clear navigation and discoverability so users can quickly find relevant colleagues and information.",
    contribution: [
      "Supported a Neo4j graph database initiative improving internal search and knowledge discovery.",
      "Implemented CSS3 styling improvements across the search interface.",
      "Added toolbar icons to make people-search functionality clearer and easier to use.",
      "Worked collaboratively within an innovation team on frontend interface development.",
    ],
    engineeringApproach:
      "Frontend improvements were implemented with CSS3, focused on toolbar clarity and visual affordance for search actions, working alongside the Neo4j-backed data layer.",
    outcome: {
      heading: "What I Learned",
      text: "This project showed how small, considered frontend details — like clear toolbar iconography — can materially improve how people navigate complex, graph-based search tools.",
    },
  },
  {
    slug: "internal-ai-search-assistant",
    number: "05",
    title: "Internal AI Search Assistant",
    subtitle:
      "Exploring a conversational way for colleagues to find internal information more easily.",
    label: "Proof of Concept",
    categories: ["AI Search", "Chatbot UX", "Accessibility", "Internal Tools"],
    summary:
      "A proof-of-concept conversational search experience designed to help colleagues discover internal knowledge and workplace information more easily, exploring natural-language search instead of manual intranet navigation.",
    technology: [
      "Next.js",
      "OpenAI Responses API",
      "File Search",
      "Accessibility",
    ],
    size: "large",
    visualDirection:
      "A chat interface, search bar, suggested questions and knowledge-result cards — communicating search, knowledge and conversation rather than generic AI imagery.",
    mockup: "chatbot",
    context:
      "Important employee information can be distributed across different intranet pages, systems and internal resources, making it difficult for colleagues to quickly find the information they need.",
    challenge:
      "Explore a simpler way for colleagues to find relevant internal information without needing to know exactly where it is stored.",
    idea:
      "Use a conversational AI search assistant where colleagues can ask questions using natural language, rather than navigating through department pages, documents and policies to find an answer.",
    experience:
      "The concept explored providing direct access to information across areas such as HR, payroll, working hours, annual leave, payslips, invoices and internal opportunities, without claiming every source was fully integrated.",
    contribution: [
      "Built a working proof-of-concept AI search experience focused on improving access to internal knowledge resources.",
      "Developed the chatbot UX and search-interface design for the concept.",
      "Connected the OpenAI Responses API to a vector-store-backed sample knowledge base.",
      "Built the proof of concept with accessibility as a core consideration.",
    ],
    accessibility:
      "Designed with keyboard accessibility, semantic HTML, clear focus states, high colour contrast and screen-reader-friendly labelling in mind, so the assistant could supplement normal navigation rather than replace it inaccessibly.",
    outcome: {
      heading: "What I Learned",
      text: "A proof-of-concept exploring how AI-powered conversational search could improve the discoverability and accessibility of internal knowledge resources.",
    },
  },
  {
    slug: "ui-delivery-transformation",
    number: "06",
    title: "UI Delivery & Transformation",
    subtitle: "Supporting reliable digital banking releases across Lloyds Bank and Halifax.",
    categories: ["Frontend Engineering", "Digital Banking", "Release Quality"],
    summary:
      "As part of the UI Delivery & Transformation team, I supported the review, testing and resolution of frontend issues across customer-facing digital banking experiences for Lloyds Bank and Halifax. Our team reviewed defects, error codes and application updates before business releases, helping ensure changes were tested and validated across desktop and mobile environments before progressing through the wider release process.",
    technology: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "Git",
      "Jenkins",
      "Testing",
      "CI/CD",
      "Responsive UI",
    ],
    size: "large",
    visualDirection:
      "Portfolio reconstruction of a desktop and mobile banking interface, a defect/error panel, a code-review view, a Git and Jenkins pipeline, and a release timeline — generic reconstructions rather than any confidential internal banking system.",
    context:
      "Digital banking platforms operate at significant scale, meaning frontend defects and release issues can affect customer experience across desktop and mobile channels. Working within UI Delivery & Transformation required careful investigation, testing and collaboration before changes could progress towards a business release.",
    challenge:
      "Investigating and resolving frontend defects across customer-facing banking interfaces, and validating changes across desktop and mobile before they could progress through the wider release process — without any single person owning or approving production releases individually.",
    contribution: [
      "Reviewed reported frontend errors and defects across customer-facing digital banking interfaces.",
      "Investigated error codes to help identify the underlying cause of reported issues.",
      "Supported fixes to customer-facing interfaces using HTML5, CSS3 and JavaScript.",
      "Tested changes across desktop and mobile environments.",
      "Reviewed application updates ahead of business releases.",
      "Used Git within the day-to-day development workflow for managing and reviewing code changes.",
      "Worked with Jenkins-based delivery processes as part of the wider CI/CD environment.",
      "Collaborated with DevOps and engineering colleagues to help resolve defects before business releases.",
    ],
    engineeringApproach:
      "Investigated and resolved frontend defects using HTML, CSS and JavaScript, with attention to responsive behaviour across desktop and mobile banking experiences. Git formed part of the development workflow for managing and reviewing code changes, while Jenkins supported build and delivery processes within the wider CI/CD environment. I contributed to and supported these tools and processes as part of a team, rather than designing or administering the CI/CD infrastructure itself.",
    uxApproach:
      "Reviewed application changes and tested fixes before release, helping identify issues and verify that updates behaved as expected across supported digital banking environments — including desktop testing, mobile testing and regression checking.",
    workflow: [
      "Issue Reported",
      "Investigate",
      "Reproduce Error",
      "Identify Cause",
      "Implement Fix",
      "Desktop / Mobile Testing",
      "Git Commit",
      "Code Review",
      "Jenkins Build",
      "Test / DevOps Review",
      "Validation",
      "Business Release",
    ],
    jiraWorkflow: ["To Do", "In Progress", "Blocked", "Review", "Test", "Done"],
    terminal: {
      label: "UI Delivery / Release Validation",
      heading: "Engineering Terminal",
      subtitle:
        "A reconstructed terminal view illustrating frontend debugging, testing, Git workflows and release validation.",
      intro:
        "This reconstructed terminal visual illustrates the type of frontend investigation, testing, source-control and release-validation workflow associated with my UI Delivery & Transformation experience.",
      caption:
        "The visual is intentionally generic and does not reproduce confidential internal systems, source code or production data.",
      tags: ["HTML5", "CSS3", "JavaScript", "Git", "Jenkins", "CI/CD"],
      blocks: [
        {
          command: "issue-status UI-042",
          lines: [
            { text: "Responsive navigation alignment issue" },
            { text: "Device: Mobile · Environment: Test" },
          ],
        },
        {
          command: "investigate",
          lines: [
            { text: "Inspecting HTML structure..." },
            { text: "Inspecting CSS breakpoints..." },
            { text: "Reproducing issue in mobile viewport..." },
            { text: "✓ Issue reproduced", kind: "success" },
          ],
        },
        {
          command: "apply-fix",
          lines: [
            { text: "CSS adjustment applied to navigation component" },
            { text: "✓ Fix implemented", kind: "success" },
          ],
        },
        {
          command: "git status",
          lines: [
            { text: "On branch feature/ui-navigation-fix" },
            { text: "Changes ready for review" },
          ],
        },
        {
          command: "npm run test",
          lines: [
            { text: "Running frontend checks..." },
            { text: "✓ HTML validation passed", kind: "success" },
            { text: "✓ CSS validation passed", kind: "success" },
            { text: "✓ JavaScript validation passed", kind: "success" },
            { text: "✓ Desktop checks passed", kind: "success" },
            { text: "✓ Mobile checks passed", kind: "success" },
            { text: "Tests completed successfully." },
          ],
        },
        {
          command: "git diff --stat",
          lines: [
            { text: "styles.css       | 12 ++++++------" },
            { text: "interface.js     |  8 ++++----" },
            { text: "components/      |  4 ++--" },
          ],
        },
        {
          command: "npm run build",
          lines: [
            { text: "Creating production build..." },
            { text: "✓ Compile", kind: "success" },
            { text: "✓ Test", kind: "success" },
            { text: "✓ Validate", kind: "success" },
            { text: "Build completed." },
          ],
        },
        {
          command: "release-status",
          lines: [
            { text: "Code Review       PASS" },
            { text: "Frontend Test     PASS" },
            { text: "Build             PASS" },
            { text: "Validation        PASS" },
            { text: "Status: Ready for next review stage" },
          ],
        },
      ],
    },
    outcome: {
      heading: "What I Learned",
      text: "Working within an Agile delivery team, where stand-ups helped the team understand what was To Do, In Progress, Blocked or Done, reinforced how much careful investigation, testing and cross-team collaboration sit behind a single reliable banking release — and shaped how I approach release quality and defect investigation since.",
    },
  },
  {
    slug: "sky-cloud-native-engineering",
    number: "07",
    title: "Sky — Cloud-Native Engineering",
    subtitle: "Supporting catalogue, pricing and billing services across distributed cloud-native systems.",
    categories: ["Software Engineering", "Cloud", "APIs", "Microservices"],
    summary:
      "Contributed to cloud-native applications and AWS-hosted microservices supporting catalogue, pricing and billing workflows within Sky's engineering environment. Worked across API integration, testing, CI/CD and containerised deployments, collaborating within an Agile Scrum team to support reliable software delivery across distributed systems.",
    technology: [
      "AWS",
      "REST APIs",
      "Microservices",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "Git",
      "CI/CD",
      "Automated Testing",
      "Agile Scrum",
      "Monitoring",
      "Logging",
      "Debugging",
    ],
    size: "large",
    visualDirection:
      "Abstract technical diagrams of API architecture, microservices, containers, CI/CD pipelines and monitoring — portfolio reconstructions rather than any reproduction of confidential Sky systems, repositories, dashboards or architecture.",
    context:
      "Modern catalogue, pricing and billing platforms depend on multiple services communicating reliably across distributed systems. My work at Sky involved contributing to applications and API integrations within a cloud-native engineering environment, supporting services deployed using modern container and CI/CD technologies.",
    challenge:
      "Supporting reliable communication between application components and AWS-hosted microservices across catalogue, pricing and billing domains, as part of a wider engineering team rather than as an individual system owner.",
    contribution: [
      "Contributed to AWS-hosted microservices supporting catalogue, pricing and billing workflows.",
      "Worked with API functionality across distributed services, supporting communication between application components and microservices.",
      "Supported containerised application delivery using Docker and Kubernetes as part of the wider deployment environment.",
      "Worked within an Agile Scrum team delivering software changes through established CI/CD workflows, including Jenkins-supported build and deployment processes.",
      "Applied automated testing, structured Git workflows and code-review practices to support consistent and maintainable software delivery.",
      "Contributed to monitoring, logging and debugging activities to support investigation of application behaviour within the wider engineering environment.",
    ],
    engineeringApproach:
      "Contributed to cloud-native applications operating within an AWS environment and worked with containerised services deployed using Docker and Kubernetes. Contributed to API functionality and engineering practices designed to support reliable communication and platform stability across distributed services, rather than architecting the platform individually.",
    accessibility:
      "In distributed cloud systems, observability helps engineering teams understand application behaviour, investigate failures and maintain reliable services — this shaped how defect investigation and debugging were approached day to day.",
    branchDiagrams: [
      {
        title: "Catalogue, Pricing & Billing Architecture",
        root: "Customer / Internal Application",
        mid: "API Layer",
        branches: ["Catalogue Service", "Pricing Service", "Billing Service"],
        footer: "AWS Services",
      },
      {
        title: "Observability",
        root: "Running Services",
        branches: ["Logs", "Metrics", "Errors"],
        footer: "Monitoring → Investigation → Resolution",
        note: "Supported Kubernetes-based deployments and contributed to monitoring, logging and debugging activities within the wider engineering environment.",
      },
    ],
    pipelines: [
      {
        title: "Continuous Integration & Delivery",
        stages: ["Code", "Git", "Pull Request", "Code Review", "Automated Tests", "Jenkins", "Build", "Deploy", "Validate"],
        note: "Representative delivery workflow — the exact pipeline structure varied by service.",
      },
      {
        title: "Container Deployment",
        stages: ["Application", "Docker Container", "Container Registry", "Kubernetes", "Running Service"],
      },
      {
        title: "Git Workflow",
        stages: ["Feature", "Development", "Commit", "Push", "Pull Request", "Code Review", "Testing", "Merge"],
      },
    ],
    jiraWorkflow: ["Sprint Planning", "Stand-ups", "Development", "Code Review", "Testing", "Release", "Retrospective"],
    outcome: {
      heading: "What I Learned",
      text: "Contributed to the engineering and delivery of cloud-native application functionality supporting catalogue, pricing and billing workflows within Sky's production environment — deepening my practical experience with distributed systems, containerisation and CI/CD as part of a collaborative Agile Scrum team.",
    },
  },
];
