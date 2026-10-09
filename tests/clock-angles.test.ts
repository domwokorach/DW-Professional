import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateClockAngles } from '../src/components/rolex-clock/useRealTimeClock';

test('clock hands point to twelve at midnight and noon', () => {
  const midnight = calculateClockAngles(new Date(2026, 0, 1, 0, 0, 0, 0));
  const noon = calculateClockAngles(new Date(2026, 0, 1, 12, 0, 0, 0));
  assert.deepEqual(midnight, { hour: 0, minute: 0, second: 0 });
  assert.deepEqual(noon, { hour: 0, minute: 0, second: 0 });
});

test('clock hands move continuously and proportionally', () => {
  const angles = calculateClockAngles(new Date(2026, 0, 1, 3, 15, 30, 500));
  assert.equal(angles.second, 183);
  assert.equal(angles.minute, 93.05);
  assert.equal(angles.hour, 97.75);
});
