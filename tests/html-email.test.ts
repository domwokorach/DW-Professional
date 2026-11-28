import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, test } from 'node:test';
import { renderAllEmails, renderEmail, TEMPLATE_ORDER, TEMPLATES } from '../src/components/experience/html-email/email-templates';

describe('internal HTML email templates', () => {
  test('all four templates exist, in order, with distinct content', () => {
    assert.deepEqual(TEMPLATE_ORDER, ['internal', 'events', 'news', 'welcome']);
    assert.deepEqual(renderAllEmails().map((e) => e.tab), ['Internal Communications', 'Events', 'News', 'Welcome to New Colleagues']);
    assert.equal(new Set(TEMPLATE_ORDER.map((id) => TEMPLATES[id].headline)).size, 4);
    assert.equal(new Set(TEMPLATE_ORDER.map(renderEmail)).size, 4);
  });

  for (const id of TEMPLATE_ORDER) {
    describe(id, () => {
      const t = TEMPLATES[id];
      const html = renderEmail(id);

      test('is a complete document with no JavaScript, forms or remote links', () => {
        assert.match(html, /^<!DOCTYPE html>/);
        assert.match(html, /<html lang="en-GB"/);
        assert.doesNotMatch(html, /<script|<form|<iframe|javascript:|\son[a-z]+=/i);
        const urls = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]);
        for (const u of urls) assert.match(u, /^https:\/\/www\.dominicwokorach\.me\/email\/[\w-]+\.png$/, `only hosted email images allowed: ${u}`);
      });

      test('uses table layout, inline CSS, a 600px container and web-safe fonts', () => {
        assert.match(html, /max-width:600px/);
        assert.match(html, /<table role="presentation"/);
        assert.match(html, /<!--\[if mso\]>/);
        assert.match(html, /font-family:Arial, Helvetica, sans-serif/);
        assert.match(html, /@media only screen and \(max-width:480px\)/);
      });

      test('has its own headline, content and two calls to action', () => {
        for (const text of [t.headline, t.intro, t.cta, t.closing.cta, ...t.features.flatMap((f) => [f.title.replace('&', '&amp;'), f.text])]) {
          assert.ok(html.includes(text.replace('&', '&amp;').replace('&amp;amp;', '&amp;')) || html.includes(text), `missing: ${text}`);
        }
        assert.match(html, new RegExp(`<a href="#"[^>]*>${t.cta}</a>`));
        assert.match(html, new RegExp(`<a href="#"[^>]*>${t.closing.cta}</a>`));
        assert.equal((html.match(/<h1/g) ?? []).length, 1);
      });

      test('images exist at 2x display size, with a descriptive hero alt and decorative thumbnails', () => {
        const files = [...html.matchAll(/\/email\/([\w-]+\.png)/g)].map((m) => m[1]);
        assert.equal(files.length, 4, 'one hero and three thumbnails');
        for (const f of files) assert.ok(existsSync(`public/email/${f}`), `${f} must exist`);
        assert.match(html, new RegExp(`hero-${id}\\.png" width="600" height="220" alt="[^"]{20,}"`));
        assert.equal((html.match(/thumb-[\w-]+\.png" width="64" height="64" alt=""/g) ?? []).length, 3);
      });

      test('has no promotional content and states it is not official', () => {
        assert.doesNotMatch(html, /\$\s?\d|discount|checkout|% off|bundle|price/i);
        assert.match(html, /Not an official Lloyds Banking Group communication/);
      });
    });
  }
});
