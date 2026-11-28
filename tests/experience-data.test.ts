import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { education, experiences } from '../src/data/experience';
import { formatDuration, monthsBetween } from '../src/lib/experience-duration';

const named = (name: string) => experiences.find((e) => ('roles' in e ? e.employer : e.navLabel) === name);

describe('employer history content', () => {
  test('timeline order and years: Freelance, Professional Development, Sky, Travel, Lloyds, Leonard Cheshire, Lion Web Vision, then Education', () => {
    assert.deepEqual(experiences.map((e) => ('roles' in e ? e.employer : e.navLabel)), ['Freelance', 'Development', 'Sky', 'Travel', 'Lloyds Banking Group', 'Leonard Cheshire', 'Lion Web Vision']);
    assert.deepEqual(experiences.map((e) => e.start.iso.slice(0, 4)), ['2024', '2024', '2024', '2022', '2014', '2013', '2013']);
    assert.equal(education[0].start.iso.slice(0, 4), '2005');
  });

  test('Freelance is current and lists no project block', () => {
    const f = named('Freelance');
    assert.ok(f && !('roles' in f));
    assert.equal(f.end, undefined);
    assert.equal(f.projects, undefined);
  });

  test('Sky: Jun 2024 – Sep 2026, 2 years 4 months, Osterley, hybrid', () => {
    const s = named('Sky');
    assert.ok(s && !('roles' in s));
    assert.equal(s.start.label, 'Jun 2024');
    assert.equal(s.end?.label, 'Sep 2026');
    assert.equal(formatDuration(monthsBetween(s.start.iso, s.end?.iso)), '2 years 4 months');
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

  test('Lloyds: one employer, 5 years 4 months, four roles with the specified periods and durations', () => {
    const l = named('Lloyds Banking Group');
    assert.ok(l && 'roles' in l);
    assert.equal(formatDuration(monthsBetween(l.start.iso, l.end?.iso)), '5 years 4 months');
    assert.equal(l.roles.length, 4);
    const expected = [
      ['Frontend Developer', '2018-09', '2020-01', '1 year 5 months'],
      ['Web Developer – Innovation, Architecture and Strategy', '2016-03', '2018-09', '2 years 7 months'],
      ['Software Engineer', '2015-03', '2016-03', '1 year 1 month'],
      ['Trainee Digital Transformation', '2014-10', '2015-03', '6 months'],
    ];
    expected.forEach(([role, start, end, duration], i) => {
      assert.equal(l.roles[i].role, role);
      assert.equal(l.roles[i].start.iso, start);
      assert.equal(l.roles[i].end?.iso, end);
      assert.equal(formatDuration(monthsBetween(start, end)), duration, role);
    });
    // Consecutive roles: each starts in the month the previous one (in time) ended.
    assert.equal(l.roles[1].start.iso, l.roles[2].end?.iso);
  });
});
