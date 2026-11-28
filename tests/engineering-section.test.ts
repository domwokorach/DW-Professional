import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { EngineeringSection } from '../src/components/engineering';
import { engineeringCards, engineeringLinks } from '../src/components/engineering/engineering-data';

const REPO = 'https://github.com/domwokorach/DW-Professional';
const render = () => new JSDOM(renderToStaticMarkup(createElement(EngineeringSection))).window.document;

test('shows the heading, subtitle and one card per engineering capability', () => {
  const doc = render();
  assert.match(doc.querySelector('h2')!.textContent!, /Built\. Tested\. Delivered\./);
  assert.match(doc.querySelector('.section-heading p')!.textContent!, /Engineering beyond the interface/);
  assert.equal(doc.querySelectorAll('.engineering-card').length, 10);
  assert.equal(doc.querySelector('section')!.getAttribute('aria-labelledby'), 'engineering-heading');
});

test('provides the six evidence links, each opening safely in a new tab', () => {
  const links = [...render().querySelectorAll('.engineering-links a')];
  assert.deepEqual(links.map((a) => a.textContent!.replace(/\s*\(opens in a new tab\)\s*/, '').trim()), Object.values(engineeringLinks).map((l) => l.label));
  for (const a of links) {
    assert.equal(a.getAttribute('target'), '_blank');
    assert.match(a.getAttribute('rel')!, /noopener/);
  }
});

test('every card link has an accessible name that includes its title', () => {
  for (const a of render().querySelectorAll('.engineering-card a')) {
    assert.match(a.getAttribute('aria-label')!, /^[A-Z][\w\s/.]+: .+ \(opens in a new tab\)$/);
  }
});

test('repository links point at files that exist in this repository', () => {
  const hrefs = [...engineeringCards.map((c) => c.link.href), ...Object.values(engineeringLinks).map((l) => l.href)];
  for (const href of hrefs.filter((h) => h.startsWith(`${REPO}/blob/master/`) || h.startsWith(`${REPO}/tree/master/`))) {
    const relative = href.replace(/^.*\/(blob|tree)\/master\//, '');
    assert.ok(existsSync(new URL(`../${relative}`, import.meta.url)), `${relative} should exist`);
  }
});

test('card titles are unique, so no entry is duplicated', () => {
  const titles = engineeringCards.map((c) => c.title);
  assert.equal(new Set(titles).size, titles.length);
});
