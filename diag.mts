import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
import { TranslationServiceClient } from '@google-cloud/translate';
import { readCredentials } from './src/lib/i18n/translation.server';
const c = readCredentials()!;
const client = new TranslationServiceClient({ fallback: true, projectId: c.projectId, credentials: { client_email: c.clientEmail!, private_key: c.privateKey! } } as any);
const end = Date.now() + 120_000;
while (true) {
  try { const [r] = await client.translateText({ parent: `projects/${c.projectId}/locations/global`, contents: ['About me'], mimeType: 'text/plain', sourceLanguageCode: 'en', targetLanguageCode: 'fr' }); console.log('OK', JSON.stringify(r.translations?.map(t => t.translatedText))); break; }
  catch (e: any) { if (Date.now() > end) { console.log('still denied:', String(e.message).replace(/\s+/g,' ').slice(0,250)); break; } await new Promise(r => setTimeout(r, 15000)); }
}
