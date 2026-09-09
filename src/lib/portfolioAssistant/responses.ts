import { skillCategories } from "@/data/skills";
import { services } from "@/data/services";
import { aiCapabilities } from "@/data/aiServices";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { experience, education, certifications } from "@/data/experience";
import type { ChatAction, IntentResponse } from "./types";

const SECTION: Record<string, ChatAction> = {
  services: { label: "View Services →", href: "#services" },
  projects: { label: "View 04 / Projects →", href: "#projects" },
  skills: { label: "View Skills →", href: "#expertise" },
  experience: { label: "View Experience →", href: "#experience" },
  gallery: { label: "View Gallery →", href: "#gallery" },
  contact: { label: "Contact Me →", href: "#contact" },
};

const RESUME_ACTION: ChatAction = { label: "View Resume →", href: "#resume-modal" };
const LINKEDIN_ACTION: ChatAction = {
  label: "View LinkedIn →",
  href: "https://www.linkedin.com/in/dominic-w-3673523b/",
  external: true,
};
const GITHUB_ACTION: ChatAction = {
  label: "View GitHub →",
  href: "https://github.com/domwokorach",
  external: true,
};
const TEAMS_EMAIL = "dominic-wokorach-o@outlook.com";

function findExperienceByOrg(orgMatch: string) {
  return experience.filter((item) =>
    item.org.toLowerCase().includes(orgMatch.toLowerCase())
  );
}

function describeRoles(roles: ReturnType<typeof findExperienceByOrg>): string {
  return roles
    .map((role) => `${role.role} (${role.period}) — ${role.focus}`)
    .join(" ");
}

function skillNamesFor(categoryTitle: string): string[] {
  const category = skillCategories.find((c) => c.title === categoryTitle);
  return category ? category.items.map((item) => item.name) : [];
}

function technologyAnswer(tech: string, categoryTitle: string): IntentResponse {
  const inStack = skillCategories.some((category) =>
    category.items.some((item) => item.name.toLowerCase() === tech.toLowerCase())
  );

  if (!inStack) {
    return {
      content: `I don't have enough verified portfolio information to answer that accurately. Please contact Dominic directly through the contact form or email for more information.`,
      actions: [SECTION.contact],
    };
  }

  return {
    content: `Yes. ${tech} is part of Dominic's ${categoryTitle.toLowerCase()} technology stack. You can explore the Skills and Projects sections for examples of how it's been used.`,
    actions: [SECTION.skills, SECTION.projects],
  };
}

const RESPONSES: Record<string, () => IntentResponse> = {
  services: () => {
    const titles = services.map((s) => s.title).join(", ");
    return {
      content: `Dominic offers services across ${titles}. Each service page covers what's included in more detail.`,
      actions: [SECTION.services],
    };
  },
  projects: () => {
    const freelanceCount = projects.length;
    const caseStudyCount = caseStudies.length;
    return {
      content: `You can explore Dominic's selected software engineering, frontend and freelance work in 04 / Projects — including ${freelanceCount} freelance projects and ${caseStudyCount} in-depth case studies.`,
      actions: [SECTION.projects],
    };
  },
  skills: () => {
    const categories = skillCategories.map((c) => c.title).join(", ");
    return {
      content: `Dominic's technical skills span ${categories}. You can see the full breakdown, including core tools, in the Skills section.`,
      actions: [SECTION.skills, SECTION.projects],
    };
  },
  education: () => {
    const list = education
      .filter((e) => e.institution)
      .map((e) => `${e.qualification} from ${e.institution}`)
      .join(", ");
    const certs = [...certifications.codecademy, ...certifications.hackerrank, ...certifications.additional];
    return {
      content: `Dominic's education includes ${list}, alongside certifications covering ${Array.from(new Set(certs)).join(", ")}.`,
      actions: [SECTION.experience],
    };
  },
  experience: () => {
    const years = "8+";
    return {
      content: `I have ${years} years of experience across software engineering, frontend development, digital products and related technologies, including roles at Sky and Lloyds Banking Group.`,
      actions: [SECTION.experience],
    };
  },
  gallery: () => ({
    content: `You can browse photos and visuals from Dominic's work and projects in the Gallery section.`,
    actions: [SECTION.gallery],
  }),
  contact: () => ({
    content: `You can reach Dominic through the contact form on this site, where you can share details about the opportunity, role and company.`,
    actions: [SECTION.contact],
  }),
  email: () => ({
    content: `The best way to reach Dominic is through the contact form so your message reaches him directly.`,
    actions: [SECTION.contact],
  }),
  accessibility: () => {
    const accessibilityService = services.find((s) => s.title === "Specialist Accessibility");
    const items = accessibilityService ? accessibilityService.items.join(", ") : "WCAG 2.2, keyboard accessibility, screen-reader compatibility, colour contrast and accessibility testing";
    return {
      content: `Yes. Dominic specialises in accessible development, covering ${items}.`,
      actions: [SECTION.services],
    };
  },
  sky: () => {
    const roles = findExperienceByOrg("Sky");
    if (!roles.length) {
      return {
        content: `I don't have enough verified portfolio information to answer that accurately. Please contact Dominic directly through the contact form or email for more information.`,
        actions: [SECTION.contact],
      };
    }
    return {
      content: `Yes, Dominic worked at Sky as a ${describeRoles(roles)}`,
      actions: [SECTION.experience],
    };
  },
  lloyds: () => {
    const roles = findExperienceByOrg("Lloyds");
    if (!roles.length) {
      return {
        content: `I don't have enough verified portfolio information to answer that accurately. Please contact Dominic directly through the contact form or email for more information.`,
        actions: [SECTION.contact],
      };
    }
    return {
      content: `Yes, Dominic worked at Lloyds Banking Group across several roles: ${describeRoles(roles)}`,
      actions: [SECTION.experience],
    };
  },
  react: () => technologyAnswer("React", "Frontend"),
  typescript: () => technologyAnswer("TypeScript", "Frontend"),
  javascript: () => technologyAnswer("JavaScript", "Frontend"),
  html: () => technologyAnswer("HTML5", "Frontend"),
  css: () => technologyAnswer("CSS3", "CSS & Styling"),
  nodejs: () => technologyAnswer("Node.js", "Backend & APIs"),
  d3: () => ({
    content: `Yes. D3.js is part of Dominic's toolkit for building custom data visualisations, as seen in some of his project work.`,
    actions: [SECTION.projects, SECTION.skills],
  }),
  aws: () => technologyAnswer("AWS", "Cloud & DevOps"),
  uiux: () => {
    const items = skillNamesFor("UI/UX & Design");
    return {
      content: `Dominic combines frontend engineering with UX/UI design, covering ${items.join(", ")}.`,
      actions: [SECTION.skills, SECTION.services],
    };
  },
  design: () => ({
    content: `Design is a core part of Dominic's work — from UX prototyping and wireframing to design systems and accessible visual design. See the Services and Skills sections for detail.`,
    actions: [SECTION.services, SECTION.skills],
  }),
  innovation: () => ({
    content: `Dominic has worked on innovation-focused initiatives, including an enterprise innovation and employee-engagement platform at Lloyds Banking Group and AI-driven proof-of-concept work.`,
    actions: [SECTION.experience, SECTION.projects],
  }),
  aiDevelopment: () => {
    const groups = aiCapabilities.map((c) => c.title).join(", ");
    return {
      content: `Yes. Dominic designs and ships AI solutions — from AI chatbots and agentic workflows to secure integrations with providers like OpenAI, Anthropic and Gemini — covering ${groups}.`,
      actions: [SECTION.services, SECTION.projects],
    };
  },
  testing: () => {
    const items = skillNamesFor("Testing & Quality");
    return {
      content: `Testing is part of Dominic's engineering practice, covering ${items.join(", ")}.`,
      actions: [SECTION.skills, SECTION.services],
    };
  },
  frontendDevelopment: () => ({
    content: `Frontend development is one of Dominic's core specialisms — building accessible, responsive, high-performance interfaces with React, Next.js and TypeScript.`,
    actions: [SECTION.skills, SECTION.projects],
  }),
  softwareEngineering: () => ({
    content: `Dominic's software engineering work covers application and component architecture, API development, testing, CI/CD and cloud deployment — see the Services and Experience sections for real examples.`,
    actions: [SECTION.services, SECTION.experience],
  }),

  salary: () => ({
    content: `I'm currently looking for opportunities around £40,000 and upward, depending on the role, responsibilities and overall package.`,
  }),
  availability: () => ({
    content: `I'm available to start immediately.`,
  }),
  teams: () => ({
    content: `You're welcome to send a Microsoft Teams interview invitation to ${TEAMS_EMAIL}. I can review the invitation and confirm my availability.`,
    actions: [{ label: `Email ${TEAMS_EMAIL} →`, href: `mailto:${TEAMS_EMAIL}`, external: true }],
  }),
  recruiterInterest: () => ({
    content: `Thank you for your interest. Please use the contact form or email me with details about the opportunity, role and company.`,
    actions: [SECTION.contact],
  }),
  phone: () => ({
    content: `I currently prefer initial recruitment communication by email or through the website contact form. Please send the opportunity details there and I'll respond accordingly.`,
    actions: [SECTION.contact],
  }),
  resume: () => ({
    content: `Yes. Please use the Resume section and enter your email address. You'll receive a verification PIN by email. After successful verification, you can download and review my CV.`,
    actions: [RESUME_ACTION],
  }),
  reasonForLeaving: () => ({
    content: `I'm looking for new challenges where I can broaden my experience, contribute my existing engineering skills and help a company improve and grow its digital products.`,
  }),
  jobDescription: () => ({
    content: `Of course. Please send the job description and relevant opportunity details by email or through the contact form.`,
    actions: [SECTION.contact],
  }),
  linkedin: () => ({
    content: `You can view and connect with me on LinkedIn.`,
    actions: [LINKEDIN_ACTION],
  }),
  github: () => ({
    content: `You can explore my repositories and development work on GitHub.`,
    actions: [GITHUB_ACTION],
  }),
};

export const FALLBACK_RESPONSE: IntentResponse = {
  content:
    "I don't have enough verified portfolio information to answer that accurately. Please contact Dominic directly through the contact form or email for more information.",
  actions: [{ label: "Contact Dominic →", href: "#contact" }],
};

export function getResponseForIntent(intentId: string | null): IntentResponse {
  if (!intentId) return FALLBACK_RESPONSE;
  const builder = RESPONSES[intentId];
  return builder ? builder() : FALLBACK_RESPONSE;
}
