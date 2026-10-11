import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateClockAngles, getLondonMonth, getLondonTime } from '../src/components/rolex-clock/useRealTimeClock';

test('clock hands point to twelve at midnight and noon', () => {
  assert.deepEqual(calculateClockAngles({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }), { hour: 0, minute: 0, second: 0 });
  assert.deepEqual(calculateClockAngles({ hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }), { hour: 0, minute: 0, second: 0 });
});

test('clock hands move continuously and proportionally', () => {
  const angles = calculateClockAngles({ hours: 3, minutes: 15, seconds: 30, milliseconds: 500 });
  assert.equal(angles.second, 183);
  assert.equal(angles.minute, 93.05);
  assert.equal(angles.hour, 97.75);
});

test('London time follows GMT in winter and BST in summer', () => {
  assert.deepEqual(getLondonTime(new Date('2026-01-15T12:30:45.250Z')), { day: 15, hours: 12, minutes: 30, seconds: 45, milliseconds: 250 });
  assert.deepEqual(getLondonTime(new Date('2026-07-15T12:30:45.250Z')), { day: 15, hours: 13, minutes: 30, seconds: 45, milliseconds: 250 });
});

test('London time handles the spring and autumn changeovers', () => {
  assert.equal(getLondonTime(new Date('2026-03-29T00:59:59Z')).hours, 0);
  assert.equal(getLondonTime(new Date('2026-03-29T01:00:00Z')).hours, 2);
  assert.equal(getLondonTime(new Date('2026-10-25T00:59:59Z')).hours, 1);
  assert.equal(getLondonTime(new Date('2026-10-25T01:00:00Z')).hours, 1);
});

test('London date rolls over at UK midnight, not the visitor\'s', () => {
  assert.equal(getLondonTime(new Date('2026-06-30T22:59:59Z')).day, 30);
  assert.equal(getLondonTime(new Date('2026-06-30T23:00:00Z')).day, 1);
  assert.equal(getLondonTime(new Date('2026-12-31T23:59:59Z')).day, 31);
  assert.equal(getLondonTime(new Date('2027-01-01T00:00:00Z')).day, 1);
});

test('London date and month follow the UK calendar, including leap years', () => {
  assert.equal(getLondonTime(new Date('2028-02-29T12:00:00Z')).day, 29);
  assert.equal(getLondonTime(new Date('2028-03-01T00:00:00Z')).day, 1);
  assert.equal(getLondonMonth(new Date('2028-02-29T23:59:59Z')), 'February');
  assert.equal(getLondonMonth(new Date('2028-03-01T00:00:00Z')), 'March');
  assert.equal(getLondonMonth(new Date('2027-02-28T23:59:59Z')), 'February');
  assert.equal(getLondonMonth(new Date('2027-03-01T00:00:00Z')), 'March');
  // 23:30 UTC on 30 June is already 00:30 on 1 July in London (BST)
  assert.equal(getLondonMonth(new Date('2026-06-30T23:30:00Z')), 'July');
  assert.equal(getLondonMonth(new Date('2026-12-31T23:59:59Z')), 'December');
  assert.equal(getLondonMonth(new Date('2027-01-01T00:00:00Z')), 'January');
});
