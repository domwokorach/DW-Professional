import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { CertificatePreview } from '../src/components/learning/CertificationsCarousel';
import { bringCardToFront, showNextCard, showPreviousCard } from '../src/components/learning/carouselStack';
import { listAllCertificateObjects, mapCertificateObject } from '../src/lib/certifications';
import type { Certification } from '../src/types';

const imageCertificate: Certification = {
  id: 'certificate-1',
  number: '01',
  name: 'React Certificate',
  objectKey: 'frontend/react.png',
  fileType: 'image',
  url: 'https://signed.example/react.png?signature=private',
};

test('paginates S3 listings, filters unsupported files, and prevents duplicates', async () => {
  const tokens: Array<string | undefined> = [];
  let page = 0;
  const objects = await listAllCertificateObjects(async (command) => {
    tokens.push(command.input.ContinuationToken);
    page += 1;
    return page === 1
      ? { Contents: [{ Key: 'react.pdf' }, { Key: 'notes.txt' }], IsTruncated: true, NextContinuationToken: 'page-2' }
      : { Contents: [{ Key: 'react.pdf' }, { Key: 'sql.webp' }], IsTruncated: false };
  }, 'certifications-access-point');
  assert.deepEqual(tokens, [undefined, 'page-2']);
  assert.deepEqual(objects.map(({ Key }) => Key), ['react.pdf', 'sql.webp']);
});

test('handles an empty S3 response', async () => {
  const objects = await listAllCertificateObjects(async () => ({ Contents: [], IsTruncated: false }), 'certifications-access-point');
  assert.deepEqual(objects, []);
});

test('maps actual S3 metadata and rejects unsafe verification links', () => {
  const mapped = mapCertificateObject(
    { Key: 'backend/rest_api_intermediate certificate.pdf' },
    { title: 'REST API Intermediate', issuer: 'HackerRank', 'issued-at': '2025-10-01', 'credential-url': 'javascript:alert(1)' },
    'https://signed.example/rest.pdf?signature=private',
    0,
  );
  assert.equal(mapped.name, 'REST API Intermediate');
  assert.equal(mapped.issuer, 'HackerRank');
  assert.equal(mapped.issuedAt, '2025-10-01');
  assert.equal(mapped.credentialUrl, undefined);
  assert.equal(mapped.url, 'https://signed.example/rest.pdf?signature=private');
  assert.equal(mapped.fileType, 'pdf');
});

test('uses filename data when optional S3 metadata is missing', () => {
  const mapped = mapCertificateObject({ Key: 'frontend/react_basic+certificate.png' }, {}, 'https://signed.example/react.png', 2);
  assert.equal(mapped.name, 'React Basic');
  assert.equal(mapped.issuer, undefined);
  assert.equal(mapped.number, '03');
});

test('stack navigation supports selection and both interaction directions', () => {
  const stack = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  assert.deepEqual(bringCardToFront(stack, 'one').map(({ id }) => id), ['two', 'three', 'one']);
  assert.deepEqual(showNextCard(stack).map(({ id }) => id), ['three', 'one', 'two']);
  assert.deepEqual(showPreviousCard(stack).map(({ id }) => id), ['two', 'three', 'one']);
});

test('renders loading and error states for private certificate previews', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  });
  const { cleanup, fireEvent, render, screen } = await import('@testing-library/react');
  render(createElement(CertificatePreview, { certificate: imageCertificate }));
  assert.match(screen.getByTestId('certificate-fallback').textContent ?? '', /loading certificate preview/i);
  fireEvent.error(screen.getByAltText('React Certificate certificate'));
  assert.match(screen.getByTestId('certificate-fallback').textContent ?? '', /preview unavailable/i);
  cleanup();
  dom.window.close();
});
