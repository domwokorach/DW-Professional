# Dominic Wokorach Olanya — Portfolio

A Next.js portfolio that includes a live Internal AI Search Assistant proof of concept. The assistant uses the OpenAI Responses API and File Search to answer questions from a fictional workplace knowledge base.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add a current OpenAI API key.
3. Run `npm run dev` and open `http://localhost:3000/projects/internal-ai-search-assistant`.

Never commit `.env.local` or expose an API key in client-side code. If a key is shared publicly, revoke it before using this project.

## Knowledge base

The repository includes fictional sample documents under `docs/sample-knowledge-base`. To create a new vector store from them, add your API key to `.env.local`, run `npm run setup:vector-store`, and copy the returned vector-store ID into `OPENAI_VECTOR_STORE_ID`.

If you already have a vector store, set its ID directly and skip the setup command.

## Checks

- `npm run lint`
- `npm run build`
