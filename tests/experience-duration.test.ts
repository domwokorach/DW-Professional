import assert from 'node:assert/strict';
import test from 'node:test';
import { education, experiences } from '../src/data/experience';
import { formatDuration, monthsBetween, totalMonths } from '../src/lib/experience-duration';

const NOW = new Date('2026-11-25T12:00:00Z');
const label = (start: string, end?: string) => formatDuration(monthsBetween(start, end, NOW));

test('durations match the supplied career history', () => {
  assert.equal(label('2024-06', '2024-08'), '3 months');
  assert.equal(label('2022-01', '2024-06'), '2 years 6 months');
  assert.equal(label('2014-11', '2020-01'), '5 years 3 months');
  assert.equal(label('2018-09', '2020-01'), '1 year 5 months');
  assert.equal(label('2016-03', '2018-09'), '2 years 7 months');
  assert.equal(label('2015-03', '2016-09'), '1 year 7 months');
  assert.equal(label('2014-11', '2015-03'), '5 months');
  assert.equal(label('2013-09', '2014-05'), '9 months');
  assert.equal(label('2013-08', '2013-09'), '2 months');
  assert.equal(label('2005-09', '2009-05'), '3 years 9 months');
});

test('an active role grows from today rather than a hardcoded value', () => {
  assert.equal(monthsBetween('2024-01', undefined, NOW), 35);
  assert.equal(monthsBetween('2024-01', undefined, new Date('2026-12-01T00:00:00Z')), 36);
});

test('total experience merges overlapping periods instead of summing them', () => {
  assert.equal(totalMonths([{ start: '2024-01', end: '2024-06' }, { start: '2024-03', end: '2024-09' }]), 9);
  assert.equal(totalMonths([{ start: '2024-01', end: '2024-02' }, { start: '2024-03', end: '2024-04' }]), 4);
  assert.equal(totalMonths([{ start: '2024-01', end: '2024-02' }, { start: '2024-06', end: '2024-06' }]), 3);
  assert.equal(totalMonths([]), 0);
});

test('experience data lists the ongoing role first, then ended roles newest first, with Lloyds grouped', () => {
  assert.equal(experiences[0].end, undefined);
  const ended = experiences.slice(1);
  assert.ok(ended.every((e) => e.end));
  const ends = ended.map((e) => e.end!.iso);
  assert.deepEqual(ends, [...ends].sort().reverse());
  const lloyds = experiences.find((e) => 'roles' in e);
  assert.ok(lloyds && 'roles' in lloyds);
  assert.equal(lloyds.roles.length, 4);
  assert.equal(experiences.filter((e) => 'roles' in e).length, 1);
  assert.equal(education.length, 1);
});
