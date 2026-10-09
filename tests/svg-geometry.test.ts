import assert from 'node:assert/strict';
import test from 'node:test';
import { svgCoordinate } from '../src/components/rolex-clock/svgGeometry';

test('SVG coordinates have deterministic fixed precision', () => {
  assert.equal(svgCoordinate(812.863971525983), '812.864');
  assert.equal(svgCoordinate(177.49528944691025), '177.495');
  assert.equal(svgCoordinate(500 + Math.cos(-Math.PI / 2) * 421), '500.000');
});
