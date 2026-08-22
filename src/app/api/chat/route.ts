import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT =
  "You are the Internal AI Search Assistant, a helper for colleagues asking about HR, payroll, and working hours policies. Answer only using the provided knowledge base via file search. If the answer isn't in the knowledge base, say you don't have that information.";

export async function POST(req: Request) {
  const { message } = await req.json();

  if (typeof message !== "string" || !message.trim()) {
    return new Response("Missing message", { status: 400 });
  }

  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
  if (!process.env.OPENAI_API_KEY || !vectorStoreId) {
    return new Response("Assistant is not configured", { status: 503 });
  }

  const stream = await client.responses.create({
    model: "gpt-4o-mini",
    instructions: SYSTEM_PROMPT,
    input: message,
    tools: [{ type: "file_search", vector_store_ids: [vectorStoreId] }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
