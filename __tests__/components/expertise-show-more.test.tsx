import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionGlobalConfig } from 'framer-motion';
import Expertise from '@/components/sections/Expertise';

// The icon cloud renders to canvas and reads the theme; it isn't under test.
jest.mock('@/components/sections/FullStackOverview', () => ({
  __esModule: true,
  default: () => null,
}));

const EXPECTED: Record<string, { visible: string[]; hidden: string[] }> = {
  Frontend: {
    visible: ['React', 'Next.js', 'TypeScript', 'JavaScript'],
    hidden: ['React Native', 'HTML5', 'CSS', 'PostCSS'],
  },
  'Backend & APIs': { visible: ['Node.js'], hidden: ['REST API', 'Django', 'JWT Authentication'] },
  'Testing & Quality': { visible: ['Jest', 'React Testing Library'], hidden: ['Playwright', 'TDD'] },
  'Cloud & DevOps': {
    visible: ['AWS', 'Google Cloud Platform'],
    hidden: ['Cloudflare', 'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions'],
  },
  'Databases & ORM': {
    visible: ['PostgreSQL', 'MongoDB'],
    hidden: ['MySQL', 'SQLite', 'Supabase', 'Prisma ORM'],
  },
  'Development Tools': {
    visible: ['Postman', 'Browser DevTools'],
    hidden: ['Local Development Environment', 'Jira', 'Confluence'],
  },
  'Security & Authentication': {
    visible: ['JWT', 'OAuth 2.0'],
    hidden: ['CORS', 'Helmet', 'bcrypt', 'HTTPS / TLS', 'OWASP'],
  },
  'AI Solutions': {
    visible: ['Fast AI Solutions', 'Generative AI Applications', 'AI Chatbots & Virtual Assistants'],
    hidden: ['AI-Powered Search', 'Document AI & Data Extraction', 'Production-Ready AI Applications'],
  },
  'LLMs & Agentic AI': {
    visible: ['Large Language Models (LLMs)', 'AI Agents & Agentic Workflows', 'Prompt Engineering'],
    hidden: ['Tool / Function Calling', 'Structured AI Outputs', 'Streaming AI Responses'],
  },
  'RAG, Search & Machine Learning': {
    visible: ['Retrieval-Augmented Generation (RAG)', 'Vector Databases', 'Embeddings & Semantic Search'],
    hidden: ['Natural Language Processing (NLP)', 'Machine Learning Integration'],
  },
  'AI APIs & Integrations': {
    visible: ['OpenAI API Integration', 'Anthropic / Claude API Integration', 'Gemini API Integration'],
    hidden: [
      'Model Context Protocol (MCP)',
      'AI API Development',
      'REST API Integration',
      'Secure AI API Integration',
    ],
  },
  'AI Backend Development': {
    visible: ['AI Development Environments', 'FastAPI Development', 'Python AI Development'],
    hidden: ['AI Backend Architecture', 'Database Integration', 'PostgreSQL / SQL Integration'],
  },
  'AI Automation, Cloud & Operations': {
    visible: ['AI Automation', 'Workflow Automation', 'Cloud AI Deployment'],
    hidden: [
      'Docker & Containerization',
      'AWS AI Solutions',
      'CI/CD for AI Applications',
      'AI Testing & Evaluation',
      'LLM Observability',
      'Performance Optimization',
    ],
  },
};

function card(title: string) {
  const heading = screen.getAllByRole('heading', { level: 3 }).find((h) => h.textContent === title);
  return heading!.closest('article') as HTMLElement;
}

function chips(title: string) {
  return within(card(title))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);
}

function expandedWord(title: string) {
  const button = within(card(title)).getAllByRole('button').find((b) => b.hasAttribute('aria-expanded'));
  return button?.getAttribute('aria-expanded') === 'true' ? 'less' : 'more';
}

function toggle(title: string) {
  return within(card(title)).getByRole('button', { name: `Show ${expandedWord(title)} for ${title}` });
}

async function renderAllCategories() {
  const user = userEvent.setup();
  render(<Expertise />);
  const more = screen.queryByRole('button', { name: /show more technology categories/i });
  if (more) await user.click(more);
  return user;
}

describe('Expertise skill categories', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('shows only the primary skills for each category by default', async () => {
    await renderAllCategories();

    for (const [title, { visible }] of Object.entries(EXPECTED)) {
      expect(chips(title)).toEqual(visible);
      const button = toggle(title);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveTextContent('Show More');
      // The controlled region exists even while collapsed.
      expect(document.getElementById(button.getAttribute('aria-controls')!)).not.toBeNull();
    }
    expect(screen.queryByRole('heading', { level: 3, name: 'AI & LLM' })).toBeNull();
  });

  it('expands and collapses each category independently without duplicating skills', async () => {
    const user = await renderAllCategories();

    const opened = ['Frontend', 'Cloud & DevOps', 'AI Solutions', 'AI Automation, Cloud & Operations'];
    for (const title of opened) await user.click(toggle(title));

    for (const title of opened) {
      const { visible, hidden } = EXPECTED[title];
      expect(chips(title)).toEqual([...visible, ...hidden]);
      expect(toggle(title)).toHaveAttribute('aria-expanded', 'true');
      expect(toggle(title)).toHaveTextContent('Show Less');
      const controlled = document.getElementById(toggle(title).getAttribute('aria-controls')!);
      expect(within(controlled!).getAllByRole('listitem').map((li) => li.textContent)).toEqual(hidden);
    }
    // Untouched categories stay collapsed.
    for (const title of ['Backend & APIs', 'LLMs & Agentic AI']) {
      expect(chips(title)).toEqual(EXPECTED[title].visible);
      expect(toggle(title)).toHaveAttribute('aria-expanded', 'false');
    }

    await user.click(toggle('Frontend'));

    await waitFor(() => expect(chips('Frontend')).toEqual(EXPECTED.Frontend.visible));
    expect(toggle('Frontend')).toHaveTextContent('Show More');
    expect(chips('Cloud & DevOps')).toHaveLength(7);
    expect(chips('AI Solutions')).toHaveLength(6);
  });

  it('toggles from the keyboard', async () => {
    const user = await renderAllCategories();

    const title = 'RAG, Search & Machine Learning';
    const { visible, hidden } = EXPECTED[title];
    toggle(title).focus();
    await user.keyboard('{Enter}');
    expect(chips(title)).toEqual([...visible, ...hidden]);
    expect(toggle(title)).toHaveAttribute('aria-expanded', 'true');
    expect(toggle(title)).toHaveFocus();

    await user.keyboard(' ');
    await waitFor(() => expect(chips(title)).toEqual(visible));
    expect(toggle(title)).toHaveAttribute('aria-expanded', 'false');
  });
});
