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
  },
  {
    slug: "innovation-community",
    number: "02",
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
    number: "03",
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
    slug: "halifax-piggy-banking",
    number: "04",
    title: "Halifax Piggy Banking",
    subtitle: "Exploring digital banking experiences for younger customers.",
    label: "Concept / UX Prototype",
    categories: ["UX/UI", "Digital Banking", "Prototyping"],
    summary:
      "Designed UX prototypes and wireframes for a digital banking concept aimed at younger customers, exploring how banking interactions could be made approachable, intuitive and engaging for a youth audience.",
    technology: ["UX Prototyping", "Wireframing", "Interaction Design", "Mobile-first Design"],
    size: "large",
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
      "AI Search Concept",
      "Chatbot UX",
      "Information Retrieval",
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
      "Explored and built a proof-of-concept AI search experience focused on improving access to internal knowledge resources.",
      "Developed the chatbot UX and search-interface design for the concept.",
      "Considered information retrieval concepts for surfacing relevant internal knowledge.",
      "Built the proof of concept with accessibility as a core consideration.",
    ],
    accessibility:
      "Designed with keyboard accessibility, semantic HTML, clear focus states, high colour contrast and screen-reader-friendly labelling in mind, so the assistant could supplement normal navigation rather than replace it inaccessibly.",
    outcome: {
      heading: "What I Learned",
      text: "A proof-of-concept exploring how AI-powered conversational search could improve the discoverability and accessibility of internal knowledge resources.",
    },
  },
];
