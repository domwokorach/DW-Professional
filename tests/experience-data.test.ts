import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { education, experiences } from '../src/data/experience';
import { formatDuration, monthsBetween } from '../src/lib/experience-duration';

const named = (name: string) => experiences.find((e) => ('roles' in e ? e.employer : e.navLabel) === name);

describe('employer history content', () => {
  test('timeline order and years: Freelance, Sky, Travel, Lloyds, Leonard Cheshire, Lion Web Vision, then Education', () => {
    assert.deepEqual(experiences.map((e) => ('roles' in e ? e.employer : e.navLabel)), ['Freelance', 'Sky', 'Travel', 'Lloyds Banking Group', 'Leonard Cheshire', 'Lion Web Vision']);
    assert.deepEqual(experiences.map((e) => e.start.iso.slice(0, 4)), ['2024', '2024', '2022', '2014', '2013', '2013']);
    assert.equal(education[0].start.iso.slice(0, 4), '2005');
  });

  test('Freelance is current, with 8 projects that all keep a URL', () => {
    const f = named('Freelance');
    assert.ok(f && !('roles' in f));
    assert.equal(f.end, undefined);
    assert.equal(f.projects?.length, 8);
    for (const p of f.projects ?? []) assert.match(p.url ?? '', /^https:\/\//, `${p.name} must keep its URL`);
  });

  test('Sky: Jun 2024 – Aug 2024, 3 months, Osterley, hybrid', () => {
    const s = named('Sky');
    assert.ok(s && !('roles' in s));
    assert.equal(s.start.label, 'Jun 2024');
    assert.equal(s.end?.label, 'Aug 2024');
    assert.equal(formatDuration(monthsBetween(s.start.iso, s.end?.iso)), '3 months');
    assert.equal(s.location, 'Osterley, London, United Kingdom');
    assert.equal(s.workplaceType, 'Hybrid');
  });

  test('Travel is a career break with no invented workplace type', () => {
    const t = named('Travel');
    assert.ok(t && !('roles' in t));
    assert.equal(t.kind, 'career-break');
    assert.equal(t.employmentType, 'Career Break');
    assert.equal(t.workplaceType, undefined);
    assert.equal(formatDuration(monthsBetween(t.start.iso, t.end?.iso)), '2 years 6 months');
  });

  test('Lloyds: one employer, 5 years 3 months, four roles with the specified periods and durations', () => {
    const l = named('Lloyds Banking Group');
    assert.ok(l && 'roles' in l);
    assert.equal(formatDuration(monthsBetween(l.start.iso, l.end?.iso)), '5 years 3 months');
    assert.equal(l.roles.length, 4);
    const expected = [
      ['Senior Software Engineer', '2018-09', '2020-01', '1 year 5 months'],
      ['Architecture, Methodology & Innovation — Applied Technology', '2016-03', '2018-09', '2 years 7 months'],
      ['UI Transformation', '2015-03', '2016-09', '1 year 7 months'],
      ['Trainee Digital Transformation', '2014-11', '2015-03', '5 months'],
    ];
    expected.forEach(([role, start, end, duration], i) => {
      assert.equal(l.roles[i].role, role);
      assert.equal(l.roles[i].start.iso, start);
      assert.equal(l.roles[i].end?.iso, end);
      assert.equal(formatDuration(monthsBetween(start, end)), duration, role);
    });
    // Overlapping periods are real (e.g. UI Transformation overlaps Architecture, Mar–Sep 2016): they are kept, not clipped.
    assert.ok(l.roles[1].start.iso < (l.roles[2].end?.iso ?? ''));
  });
});
