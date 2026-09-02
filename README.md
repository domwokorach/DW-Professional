# DW Professional Portfolio

A modern professional portfolio showcasing my work as a Software Engineer & Frontend Developer.

🌐 Live Portfolio: <https://www.dominicwokorach.me/>

## About

DW Professional is my personal software engineering and freelance portfolio.

The website showcases my professional experience, freelance projects, case studies, technical skills and development journey through a responsive, accessible and modern user interface.

It is designed for recruiters, hiring managers, freelance clients, engineering teams and technology professionals who want to understand my experience and the digital products I build.

## Contents

- [Features](#features)
- [Freelance Projects](#freelance-projects)
- [Case Studies](#case-studies)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Deployment](#deployment)
- [Releases](#releases)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features

- Responsive, accessible single-page portfolio
- Fixed navigation header with mobile menu
- Professional experience timeline
- Freelance project showcase with live-project links
- Detailed case studies with dynamic routes
- Categorised technical skills
- Career gallery slider with lightbox, thumbnail navigation and video support
- Contact section (client-side, opens a pre-filled email via `mailto:`)
- Dynamic London greeting and current UK timezone
- Location-aware weather widget powered by OpenWeather
- Internal AI Search Assistant demo, powered by the OpenAI Responses API and File Search over a vector store
- Motion effects with `prefers-reduced-motion` support
- Cookie preferences and legal pages (privacy, terms, cookies)
- SEO metadata, sitemap and robots configuration
- Dark, premium UI design

## Freelance Projects

Selected freelance and independent projects, presented with live links and short, factual descriptions:

- **[News](https://the-daily-wire-two.vercel.app/)** — a modern news web application delivering UK and world headlines across politics, business, health, tech, sport and weather, built with Next.js and TypeScript.
- **[Dog Booking System](https://booking-system-for-dogs.vercel.app/)** — a booking-system application for managing dog-related appointments (grooming, training, daycare, boarding), built with React and TypeScript.
- **[JIRA Project Management System](https://jiraprojectmanagementsystem.vercel.app/)** — a project-management application exploring task organisation, issue tracking and workflow-based delivery, built with React and TypeScript.

Full write-ups (technology, challenge, approach, outcome) are available on each project's detail page in the live portfolio.

## Case Studies

Professional case studies covering real work and concept explorations. Each one distinguishes **my individual contribution** from the wider organisation, team or platform it sat within, and concept/prototype work is clearly labelled as such:

- **Sky — Cloud-Native Engineering** — contributing to AWS-hosted microservices supporting catalogue, pricing and billing, within a wider Agile Scrum engineering team.
- **Specialist Disability** — accessibility-focused frontend work within online banking.
- **Halifax Piggy Banking** *(Concept / UX Prototype)* — UX prototypes and wireframes exploring digital banking for younger customers.
- **UI Delivery & Transformation** — reviewing, testing and resolving frontend issues across customer-facing digital banking interfaces for Lloyds Bank and Halifax.
- **Innovation Community** — supporting delivery of the Innovation Communities Conference 2018.
- **Innovation X** — frontend improvements to an internal Neo4j-backed search experience.
- **Internal AI Search Assistant** *(Proof of Concept)* — a working chatbot demo (built into this repository) exploring conversational search over internal knowledge.

Full case studies, including context, challenge and outcome, are available on each case study's detail page in the live portfolio.

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React (icons)
- Embla Carousel (gallery slider)

### Backend & APIs

- Next.js Route Handlers (Node.js runtime)
- REST APIs

### AI

- OpenAI API
- OpenAI Responses API
- File Search over an OpenAI Vector Store

### External APIs

- OpenWeather API

### Development

- Git
- GitHub
- ESLint
- npm

### Hosting

- Vercel

### Media

- Cloudinary (gallery images and video)

## Architecture

```text
Browser
   ↓
Next.js Application (App Router)
   ↓
React Components
   ↓
Route Handlers (src/app/api)
   ↓
External Services
```

For the two features that talk to external services:

```text
Browser
   │
   ├── Weather Widget ── /api/weather ── OpenWeather API
   │
   └── AI Search Assistant demo ── /api/chat ── OpenAI Responses API ── File Search ── Vector Store
```

The contact section does not call a backend API — it composes a `mailto:` link client-side and hands off to the visitor's email client.

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── chat/           # AI Search Assistant streaming endpoint
│   │   └── weather/        # OpenWeather proxy endpoint
│   ├── projects/[slug]/    # Freelance project & case study detail pages
│   ├── cookies/, privacy/, terms/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── sitemap.ts, robots.ts
│
├── components/
│   ├── layout/              # Header, Navigation, MobileNavigation, Footer
│   ├── sections/             # Home page sections (Hero, About, Services, Projects, Experience, Gallery, Contact, …)
│   ├── project/              # Project & case-study cards and detail-page visuals
│   ├── gallery/               # Gallery slider and lightbox
│   ├── experience/            # Experience timeline item
│   ├── weather/                # Weather widget
│   └── ui/                     # Generic reusable UI (Button, Container, SectionHeading, modals, …)
│
├── data/                        # Typed portfolio content (projects, case studies, experience, skills, gallery, navigation)
├── lib/                          # Animations, weather helpers, cookie-consent logic, small utilities
└── types/                        # Shared TypeScript types

docs/sample-knowledge-base/         # Fictional documents used by the AI Search Assistant demo
scripts/setup-vector-store.mjs      # Uploads the sample docs and creates an OpenAI vector store
public/images/                      # Local static assets (portrait, project/case-study screenshots)
```

Gallery media is hosted on Cloudinary rather than in `public/` (see `next.config.ts` for the allowed remote pattern).

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- OpenAI and OpenWeather API keys for the optional interactive demos

### Installation

```bash
git clone https://github.com/domwokorach/DW-Professional.git
cd DW-Professional
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The main portfolio works without any API credentials. The AI Search Assistant and weather widget show an unavailable state until their respective environment variables are configured.

### AI Search Assistant setup

The repository includes fictional sample documents in `docs/sample-knowledge-base`. To create a vector store for the demo:

1. Set `OPENAI_API_KEY` in `.env.local`.
2. Run `npm run setup:vector-store`.
3. Copy the returned ID into `.env.local` as `OPENAI_VECTOR_STORE_ID`.
4. Restart the development server.

If you already have a compatible vector store, set its ID directly and skip the setup script.

## Environment Variables

All environment variables are server-only and must never be prefixed with `NEXT_PUBLIC_`.

```env
OPENAI_API_KEY=
OPENAI_VECTOR_STORE_ID=
OPENWEATHER_API_KEY=
```

| Variable | Used by | Required for |
| --- | --- | --- |
| `OPENAI_API_KEY` | `src/app/api/chat/route.ts` | AI Search Assistant demo |
| `OPENAI_VECTOR_STORE_ID` | `src/app/api/chat/route.ts` | AI Search Assistant demo |
| `OPENWEATHER_API_KEY` | `src/app/api/weather/route.ts` | Weather widget |

> Keep API keys server-side. Never commit `.env.local` or add real values to `.env.example`, README.md, or a client component.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run setup:vector-store` | Upload the sample documents and create an OpenAI vector store |

There is no automated test suite yet — validate changes with `npm run lint` and `npm run build` (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Accessibility

The portfolio is designed with accessibility in mind, including:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Accessible form labels
- Responsive typography
- Sufficient colour contrast
- Reduced-motion preferences
- Descriptive alternative text

## Performance

- `next/image` for local screenshots with responsive `sizes`
- Lazy loading for gallery slides beyond the first, which loads eagerly with `priority`
- Cloudinary-hosted gallery media rather than bundling large files locally
- Framer Motion animations limited to `transform`/`opacity`, with `prefers-reduced-motion` respected throughout
- Static generation for the home page and every project/case-study detail route via `generateStaticParams`

## Deployment

The portfolio is deployed through Vercel and connected to the production domain:

<https://www.dominicwokorach.me/>

## Releases

Versioned production releases are available through GitHub Releases.

<https://github.com/domwokorach/DW-Professional/releases>

## Contributors

This project is currently independently designed, developed and maintained by **Dominic Wokorach**.

External contributions may be accepted through pull requests.

## Contributing

Contributions, suggestions and bug reports are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Commit your work
6. Push the branch
7. Open a pull request

Please keep contributions focused, accessible and consistent with the existing project structure. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style and testing details.

## License

This project is licensed under the MIT License.
See [LICENSE](LICENSE) for details.

## Author

**Dominic Wokorach**

Software Engineer & Frontend Developer

- Portfolio: <https://www.dominicwokorach.me/>
- GitHub: <https://github.com/domwokorach>
- LinkedIn: <https://www.linkedin.com/in/dominic-w-3673523b/>
