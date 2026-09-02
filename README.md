# Dominic Wokorach

A responsive software engineering portfolio built with Next.js, React, and TypeScript. It presents professional experience, services, skills, and case studies alongside interactive weather and AI search demonstrations.

**Live site:** [dominicwokorach.me](https://www.dominicwokorach.me/)

## Features

- Responsive, accessible single-page portfolio
- Detailed project case studies with dynamic routes
- Professional experience timeline and categorized skills
- Location-aware weather widget powered by OpenWeather
- Internal AI Search Assistant powered by the OpenAI Responses API and File Search
- Dynamic London greeting and current UK timezone
- Cookie preferences and legal pages
- SEO metadata, sitemap, and robots configuration
- Motion effects with reduced-motion support

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)
- [OpenAI API](https://platform.openai.com/docs/)
- [OpenWeather API](https://openweathermap.org/api)

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- OpenAI and OpenWeather API keys for the optional interactive demos

### Installation

1. Clone the repository and enter its directory.

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create a local environment file.

   ```bash
   cp .env.example .env.local
   ```

4. Add the required credentials to `.env.local`.

   ```dotenv
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_VECTOR_STORE_ID=your_vector_store_id
   OPENWEATHER_API_KEY=your_openweather_api_key
   ```

5. Start the development server.

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

The main portfolio works without API credentials. The AI assistant and weather widget show an unavailable state until their respective variables are configured.

## AI search assistant setup

The repository includes fictional sample documents in `docs/sample-knowledge-base`. To create a vector store for the demo:

1. Set `OPENAI_API_KEY` in `.env.local`.
2. Run the setup script.

   ```bash
   npm run setup:vector-store
   ```

3. Copy the returned ID into `.env.local` as `OPENAI_VECTOR_STORE_ID`.
4. Restart the development server.

If you already have a compatible vector store, set its ID directly and skip the setup script.

> Keep API keys server-side. Never add a `NEXT_PUBLIC_` prefix to these credentials or commit `.env.local`.

## Project structure

```text
src/
├── app/                  # Pages, metadata, and API routes
├── components/           # Layout, sections, project UI, and shared components
├── data/                 # Portfolio content and case-study data
├── lib/                  # Utilities, animations, consent, and weather helpers
└── types/                # Shared TypeScript types
docs/
└── sample-knowledge-base # Fictional documents used by the AI demo
public/
└── images/               # Static portfolio assets
scripts/
└── setup-vector-store.mjs
```

## Customizing the portfolio

Most portfolio content is separated from the UI:

- Navigation, social links, email, and location: `src/data/navigation.ts`
- Projects: `src/data/projects.ts`
- Detailed case studies: `src/data/caseStudies.ts`
- Experience and education: `src/data/experience.ts`
- Services: `src/data/services.ts`
- Skills: `src/data/skills.ts`
- Site metadata and canonical URL: `src/app/layout.tsx`
- Portrait and static assets: `public/images/`

Update the hard-coded site URL in `src/app/layout.tsx`, `src/app/sitemap.ts`, and `src/app/robots.ts` before deploying your own version.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run setup:vector-store` | Upload the sample documents and create an OpenAI vector store |

## Validation

Before opening a pull request or deploying, run:

```bash
npm run lint
npm run build
```

## Releases

Stable releases are published through GitHub Releases.

[View Releases](https://github.com/domwokorach/DW-Professional/releases)

## Contributing

Contributions, suggestions and bug reports are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Commit your work
6. Open a pull request

Please keep contributions focused, accessible and consistent with the existing project structure. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style and testing details.

## Author

**Dominic Wokorach**

Software Engineer & Frontend Developer

- Portfolio: <https://www.dominicwokorach.me/>
- GitHub: <https://github.com/domwokorach>
- LinkedIn: <https://www.linkedin.com/in/dominic-w-3673523b/>

## License

This project is licensed under the MIT License.
See the `LICENSE` file for details.
