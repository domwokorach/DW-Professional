import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { certifications } from '../src/data/certifications';
import { CertificatePreview } from '../src/components/learning/CertificationsCarousel';
import { bringCardToFront, showNextCard, showPreviousCard } from '../src/components/learning/carouselStack';

test('contains exactly the 13 supplied S3 certificates', () => {
  assert.equal(certifications.length, 13);
  assert.equal(new Set(certifications.map(({ id }) => id)).size, 13);
  assert.ok(certifications.every(({ url }) => url.startsWith('https://certifications-dw.s3.eu-west-2.amazonaws.com/')));
  assert.ok(certifications.every(({ category, technology, level }) => category && technology && level));
});

test('stack navigation selects, advances, and reverses cards', () => {
  const stack = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  assert.deepEqual(bringCardToFront(stack, 'one').map(({ id }) => id), ['two', 'three', 'one']);
  assert.deepEqual(showNextCard(stack).map(({ id }) => id), ['three', 'one', 'two']);
  assert.deepEqual(showPreviousCard(stack).map(({ id }) => id), ['two', 'three', 'one']);
});

test('renders a graceful fallback when a thumbnail is unavailable', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  });
  const { cleanup, render, screen } = await import('@testing-library/react');
  render(createElement(CertificatePreview, { certificate: certifications[0] }));
  assert.match(screen.getByTestId('certificate-fallback').textContent ?? '', /preview unavailable/i);
  cleanup();
  dom.window.close();
});
