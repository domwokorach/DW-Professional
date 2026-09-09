import { intents } from "./intents";

function normalize(input: string): string {
  return ` ${input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

export function matchIntent(rawInput: string): string | null {
  const normalized = normalize(rawInput);
  let bestId: string | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (normalized.includes(` ${keyword.toLowerCase().trim()} `.replace(/ {2,}/g, " "))) {
        score += keyword.split(" ").length;
      } else if (normalized.includes(keyword.toLowerCase().trim())) {
        score += 0.5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = intent.id;
    }
  }

  return bestScore > 0 ? bestId : null;
}
