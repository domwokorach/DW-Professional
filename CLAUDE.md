
# DW-Professional — Claude Code Instructions

## Project Overview

Project: DW-Professional
Owner: Dominic Wokorach Olanya
Website: https://www.dominicwokorach.me
Repository: domwokorach/DW-Professional

Maintain a professional, responsive and accessible
software engineering portfolio.

## Technology Stack

- Next.js and React
- TypeScript
- Tailwind CSS
- shadcn/ui and Animate UI
- Prisma and PostgreSQL where already configured
- GitHub for version control
- Vercel for deployment
- Cloudinary for hosted media where applicable

Follow the project's existing architecture and versions.
Do not introduce new frameworks unnecessarily.

## Token and Context Efficiency

- Keep explanations concise and relevant.
- Inspect only files relevant to the current task.
- Search for specific components before opening files.
- Avoid repeated reads of unchanged files.
- Avoid unnecessary repository-wide searches.
- Do not invoke agents or MCP tools without a clear need.
- Reuse information already available in the session.
- Avoid generating lengthy documentation unless requested.
- Do not run repeated builds without a reason.

## Development Workflow

1. Identify the relevant files.
2. Inspect existing implementation patterns.
3. Make the smallest changes that solve the request.
4. Preserve unrelated functionality.
5. Run relevant validation.
6. Summarise changes and results.

For simple tasks, proceed directly.
For complex tasks, provide a short implementation plan.

## Frontend Standards

- Use TypeScript and existing React conventions.
- Prefer reusable components.
- Follow the existing Next.js routing structure.
- Use Tailwind CSS for styling.
- Reuse installed shadcn/ui components.
- Avoid duplicate code and unnecessary dependencies.
- Maintain readable, maintainable code.

## UI/UX Requirements

- Preserve the existing portfolio design.
- Support desktop, tablet and mobile screens.
- Maintain light and dark theme compatibility.
- Ensure accessible keyboard navigation.
- Use semantic HTML and accessible labels.
- Provide visible focus indicators.
- Respect prefers-reduced-motion.
- Avoid unintended layout shifts.
- Keep animations smooth and subtle.
- Preserve existing hero interactions unless requested.

## Portfolio Content

- Preserve existing career timeline entries.
- Preserve project titles and descriptions.
- Use exact project URLs supplied by the owner.
- Do not create duplicate project entries.
- Maintain existing portfolio access workflows.
- Do not publish confidential internal projects.
- Never invent professional experience or credentials.

## Security and Privacy

- Never expose credentials or environment secrets.
- Never commit .env files containing secrets.
- Protect private API routes and admin functions.
- Validate and sanitise user input.
- Preserve authentication and authorisation checks.
- Do not expose confidential project assets.
- Do not weaken security controls for convenience.

## Database and API Changes

- Follow existing Prisma schema conventions.
- Do not delete or overwrite production data.
- Never run production migrations without approval.
- Validate API request data.
- Handle API errors safely.
- Avoid logging personal data or credentials.

## Git and Deployment

- Inspect existing changes before editing.
- Never discard unrelated working-tree changes.
- Do not force-push or rewrite Git history.
- Do not commit or push unless requested.
- Do not deploy without explicit permission.
- Preserve existing Vercel configuration.

## Testing and Verification

- Use scripts defined in package.json.
- Run targeted checks for changed functionality.
- Run TypeScript and lint checks when relevant.
- Run a production build for substantial changes.
- Do not repeatedly execute passing checks.
- Report failed or unavailable tests accurately.
- Do not claim success without verification.

## Completion Response

Keep the final report concise:

- Changes: What was updated
- Files: Which files changed
- Validation: Checks and results
- Issues: Any outstanding problems

Avoid unnecessary repetition.
