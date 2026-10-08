import type { Project } from '@/types';

export const projects: Project[] = [
  {
    id: 'specialist-disability',
    title: 'Specialist Disability',
    headline: 'Improving accessibility across online banking experiences.',
    description: [
      'Contributed to accessibility-focused work within online banking, helping create digital experiences that were more usable and inclusive for customers with disabilities.',
    ],
    category: 'Accessibility',
    focus: ['Accessibility', 'Digital Banking', 'Frontend'],
    tech: ['Accessibility', 'Semantic HTML', 'Frontend Development', 'Digital Banking'],
  },
  {
    id: 'innovation-x',
    title: 'Innovation X',
    headline: 'Making internal knowledge and people easier to discover.',
    description: [
      'Contributed to an Innovation X internal search experience backed by Neo4j graph database technology. My frontend work included CSS3 interface improvements and toolbar icons designed to make people-search functionality clearer and easier to use.',
    ],
    category: 'Internal Tools',
    focus: ['Neo4j', 'Search', 'Frontend', 'Internal Tools'],
    tech: ['Neo4j', 'CSS3', 'Frontend Development', 'Search UX'],
    url: 'https://organisation-overview.vercel.app/',
  },
  {
    id: 'innovation-community',
    title: 'Innovation Community',
    headline: 'Supporting the Innovation Communities Conference 2018.',
    description: [
      'Worked as part of the team supporting the delivery of the Innovation Communities Conference 2018, contributing to the digital experience used to support innovation programmes and community engagement.',
    ],
    category: 'Events',
    focus: ['Frontend Development', 'Innovation', 'Events'],
    tech: ['Frontend Development', 'Responsive UI', 'Reusable Components', 'Agile'],
  },
  {
    id: 'halifax-piggy-banking',
    title: 'Halifax Piggy Banking',
    headline: 'Exploring digital banking experiences for younger customers.',
    description: [
      'Designed UX prototypes and wireframes for a digital banking concept aimed at younger customers, exploring how banking interactions could be made approachable, intuitive, and engaging for a youth audience.',
    ],
    category: 'UX/UI',
    focus: ['UX/UI', 'Digital Banking', 'Prototyping'],
    tech: ['UX Prototyping', 'Wireframing', 'Interaction Design', 'Mobile-first Design'],
    url: 'https://piggy-bank-wine.vercel.app/',
  },
  {
    id: 'ai-search-assistant',
    title: 'Internal AI Chatbot Prototype',
    description: [
      'Conversational interface concept helping colleagues find authorised internal HR, payroll, annual-leave and workplace information more efficiently.',
    ],
    category: 'Internal Project',
    focus: ['AI Search', 'Chatbot UX', 'Accessibility', 'Internal Tools'],
    tech: ['Conversational UI', 'Information Retrieval', 'Accessible UX'],
    confidential: true,
  },
  {
    id: 'ui-delivery',
    title: 'UI Delivery & Transformation',
    headline: 'Supporting reliable digital banking releases across Lloyds Bank and Halifax.',
    description: [
      'As part of the UI Delivery & Transformation team, I supported the review, testing, and resolution of frontend issues across customer-facing digital banking experiences for Lloyds Bank and Halifax.',
      'Our team reviewed defects, error codes, and application updates before business releases, helping ensure changes were tested and validated across desktop and mobile environments before progressing through the wider release process.',
    ],
    category: 'Release Quality',
    focus: ['Frontend Engineering', 'Digital Banking', 'Release Quality'],
    tech: ['HTML5', 'CSS3', 'JavaScript', 'Git', 'Jenkins'],
  },
];
