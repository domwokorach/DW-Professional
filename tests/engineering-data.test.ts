import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { capabilities, engineeringLinks, repoUrl } from '../src/data/engineering';

const root = join(import.meta.dirname, '..');

describe('engineering section content', () => {
  test('exactly ten capability cards with unique sequential numbers 01–10', () => {
    assert.equal(capabilities.length, 10);
    assert.deepEqual(capabilities.map((c) => c.number), ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
    assert.equal(new Set(capabilities.map((c) => c.id)).size, 10);
    assert.equal(new Set(capabilities.map((c) => c.title)).size, 10);
  });

  test('titles match the specified capabilities, in order', () => {
    assert.deepEqual(capabilities.map((c) => c.title), [
      'Automated Testing', 'Jenkins CI/CD', 'GitHub Actions', 'TypeScript', 'Code Quality',
      'Security', 'Accessibility', 'Vercel Deployment', 'GitHub Source Code', 'System Architecture',
    ]);
  });

  test('every card and link points at a file or folder that exists in the repository', () => {
    for (const link of [...capabilities.map((c) => c.link), ...engineeringLinks.filter((l) => !l.href)]) {
      assert.ok(existsSync(join(root, link.path)), `${link.label}: "${link.path || '/'}" does not exist in the repository`);
    }
  });

  test('links are exact github.com URLs on the default branch', () => {
    for (const c of capabilities) {
      const url = repoUrl(c.link);
      assert.match(url, /^https:\/\/github\.com\/domwokorach\/DW-Professional(\/(blob|tree)\/master\/[\w./-]+)?$/);
    }
    assert.equal(repoUrl({ path: 'Jenkinsfile', kind: 'blob' }), 'https://github.com/domwokorach/DW-Professional/blob/master/Jenkinsfile');
    assert.deepEqual(engineeringLinks.map((l) => l.label), [
      'View GitHub Source Code', 'View CI/CD Pipelines', 'Explore Automated Tests', 'View Jenkins Pipeline', 'View Engineering Documentation',
    ]);
  });
});
