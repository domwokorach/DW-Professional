import { createSign } from "node:crypto";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";

export const runtime = "nodejs";

const translationCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 10_000;
const MAX_ITEMS = 100;
const MAX_CHARACTERS = 20_000;

const protectedTerms = [
  "Dominic Wokorach",
  "Dominic",
  "Sky",
  "Lloyds Banking Group",
  "Lloyds Bank",
  "Halifax",
  "LinkedIn",
  "GitHub",
  "Innovation X",
  "Halifax Piggy Banking",
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "HTML5",
  "CSS3",
  "Python",
  "OpenAI",
  "AWS",
  "Docker",
  "Kubernetes",
  "Neo4j",
  "Jenkins",
  "Git",
];

function protect(text: string) {
  const values: string[] = [];
  let masked = text.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.\w+/gi, (value) => {
    values.push(value);
    return `__PORTFOLIO_NT_${values.length - 1}__`;
  });

  for (const term of protectedTerms.sort((a, b) => b.length - a.length)) {
    masked = masked.replaceAll(term, () => {
      values.push(term);
      return `__PORTFOLIO_NT_${values.length - 1}__`;
    });
  }
  return { masked, values };
}

function restore(text: string, values: string[]) {
  return text.replace(/__PORTFOLIO_NT_(\d+)__/g, (_, index: string) => values[Number(index)] ?? "");
}

function decodeEntities(text: string) {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
  };
  return text
    .replace(/&(amp|quot|apos|lt|gt);|&#39;/g, (entity) => named[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function toAmericanEnglish(text: string) {
  const spellings: Array<[RegExp, string]> = [
    [/\bspecialising\b/gi, "specializing"],
    [/\bspecialise\b/gi, "specialize"],
    [/\borganisations\b/gi, "organizations"],
    [/\borganisation\b/gi, "organization"],
    [/\bcolour\b/gi, "color"],
    [/\bcolours\b/gi, "colors"],
    [/\bcatalogue\b/gi, "catalog"],
    [/\bprogrammes\b/gi, "programs"],
    [/\bprogramme\b/gi, "program"],
    [/\bcentre\b/gi, "center"],
    [/\btravelling\b/gi, "traveling"],
  ];
  return spellings.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

const TRANSLATION_TIMEOUT_MS = 8_000;

function base64url(input: Buffer | string) {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getServiceAccountAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  if (!clientEmail || !rawPrivateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60 > now) {
    return cachedAccessToken.token;
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/cloud-translation",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claims}`;
  const signature = base64url(createSign("RSA-SHA256").update(signingInput).sign(privateKey));
  const assertion = `${signingInput}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Service account token exchange failed: ${response.status}`);
  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) return null;

  cachedAccessToken = { token: payload.access_token, expiresAt: now + (payload.expires_in ?? 3600) };
  return cachedAccessToken.token;
}

async function translateWithServiceAccount(texts: string[], target: string) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) return null;

  const accessToken = await getServiceAccountAccessToken();
  if (!accessToken) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: texts,
          sourceLanguageCode: "en",
          targetLanguageCode: target.split("-")[0],
          mimeType: "text/plain",
        }),
        cache: "no-store",
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Translation provider timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) throw new Error("Translation provider rate limit exceeded");
  if (!response.ok) throw new Error(`Translation provider returned ${response.status}`);

  const payload = (await response.json()) as {
    translations?: Array<{ translatedText?: string }>;
  };
  return payload.translations?.map((item) => item.translatedText ?? "") ?? null;
}

async function translateWithGoogle(texts: string[], target: string) {
  const apiKey = process.env.TRANSLATION_API_KEY;
  if (!apiKey) return null;

  const endpoint = process.env.TRANSLATION_API_URL || "https://translation.googleapis.com/language/translate/v2";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source: "en",
        target: target.split("-")[0],
        format: "text",
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Translation provider timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) throw new Error("Translation provider rate limit exceeded");
  if (!response.ok) throw new Error(`Translation provider returned ${response.status}`);

  const payload = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  return payload.data?.translations?.map((item) => item.translatedText ?? "") ?? null;
}

async function translate(texts: string[], target: string) {
  try {
    const viaServiceAccount = await translateWithServiceAccount(texts, target);
    if (viaServiceAccount) return viaServiceAccount;
  } catch (error) {
    console.error(
      "Service account translation failed, falling back to API key:",
      error instanceof Error ? error.message : "unknown error"
    );
  }
  return translateWithGoogle(texts, target);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { locale?: string; texts?: unknown };
    if (!isLocale(body.locale) || !Array.isArray(body.texts)) {
      return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
    }

    const texts = body.texts.filter((text): text is string => typeof text === "string");
    const characters = texts.reduce((total, text) => total + text.length, 0);
    if (texts.length > MAX_ITEMS || characters > MAX_CHARACTERS) {
      return NextResponse.json({ error: "Translation request is too large." }, { status: 413 });
    }

    if (body.locale === defaultLocale) return NextResponse.json({ translations: texts });
    if (body.locale === "en-US") {
      return NextResponse.json({ translations: texts.map(toAmericanEnglish) });
    }

    const results = new Array<string>(texts.length);
    const missing: Array<{ index: number; text: string; masked: string; values: string[] }> = [];
    texts.forEach((text, index) => {
      const key = `${body.locale}:${text}`;
      const cached = translationCache.get(key);
      if (cached !== undefined) results[index] = cached;
      else missing.push({ index, text, ...protect(text) });
    });

    let fallback = false;

    if (missing.length > 0) {
      try {
        const translated = await translate(
          missing.map((item) => item.masked),
          body.locale
        );

        if (!translated) {
          fallback = true;
          missing.forEach((item) => {
            results[item.index] = item.text;
          });
        } else {
          missing.forEach((item, translatedIndex) => {
            const value = restore(decodeEntities(translated[translatedIndex] || item.text), item.values);
            results[item.index] = value;
            if (translationCache.size >= MAX_CACHE_ENTRIES) {
              const oldest = translationCache.keys().next().value;
              if (oldest) translationCache.delete(oldest);
            }
            translationCache.set(`${body.locale}:${item.text}`, value);
          });
        }
      } catch (error) {
        // Log safely: never include translated text or the API key, only the failure reason.
        console.error("Translation provider error:", error instanceof Error ? error.message : "unknown error");
        fallback = true;
        missing.forEach((item) => {
          results[item.index] = item.text;
        });
      }
    }

    return NextResponse.json({ translations: results, fallback: fallback || undefined });
  } catch (error) {
    console.error("Translation request failed", error);
    return NextResponse.json({ error: "Translation is temporarily unavailable." }, { status: 502 });
  }
}
