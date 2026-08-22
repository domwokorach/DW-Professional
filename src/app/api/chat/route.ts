import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGE_LENGTH = 2_000;

const SYSTEM_PROMPT =
  "You are the Internal AI Search Assistant, a helper for colleagues asking about HR, payroll, and working hours policies. Answer only using the provided knowledge base via file search. If the answer isn't in the knowledge base, say you don't have that information.";

export async function POST(req: Request) {
  let message: unknown;

  try {
    ({ message } = (await req.json()) as { message?: unknown });
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return new Response("Missing message", { status: 400 });
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return new Response(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`, {
      status: 400,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
  if (!apiKey || !vectorStoreId) {
    return new Response("Assistant is not configured", { status: 503 });
  }

  const client = new OpenAI({ apiKey });

  let stream;
  try {
    stream = await client.responses.create({
      model: "gpt-4o-mini",
      instructions: SYSTEM_PROMPT,
      input: trimmedMessage,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
          max_num_results: 8,
        },
      ],
      stream: true,
    });
  } catch (error) {
    console.error("Unable to start OpenAI response stream", error);
    const detail = error instanceof Error ? error.message : String(error);
    return new Response(`Assistant is unavailable: ${detail}`, { status: 502 });
  }

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
      "X-Content-Type-Options": "nosniff",
    },
  });
}
