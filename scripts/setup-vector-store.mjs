// One-time setup script: uploads the fictional sample knowledge base to OpenAI
// and creates a vector store for the File Search tool used by /api/chat.
//
// Run with: npm run setup:vector-store
// Then copy the printed OPENAI_VECTOR_STORE_ID into .env.local

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

const KB_DIR = path.join(process.cwd(), "docs", "sample-knowledge-base");

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY. Set it in your shell or .env.local before running this script.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(KB_DIR, f));

  if (files.length === 0) {
    console.error(`No documents found in ${KB_DIR}`);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} document(s)...`);

  const uploaded = [];
  for (const filePath of files) {
    const file = await client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
    uploaded.push(file.id);
    console.log(`  Uploaded ${path.basename(filePath)} -> ${file.id}`);
  }

  console.log("Creating vector store...");
  const vectorStore = await client.vectorStores.create({
    name: "Portfolio AI Search Assistant — Sample Knowledge Base",
    file_ids: uploaded,
  });

  console.log("\nVector store created.");
  console.log(`OPENAI_VECTOR_STORE_ID=${vectorStore.id}`);
  console.log("\nAdd the line above to .env.local, then restart your dev server.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
