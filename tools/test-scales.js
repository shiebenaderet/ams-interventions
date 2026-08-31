'use strict';
const assert = require('assert');
const { loadBrowserGlobal } = require('./load');
const S = loadBrowserGlobal('js/ams-scales.js', 'AMSScales');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { console.error('FAIL: ' + name + '\n  ' + e.message); process.exitCode = 1; }
}

test('growthBand uses the handout bands: 1-33 low, 34-59 typical, 60-99 high', function () {
  assert.strictEqual(S.growthBand(30), 'low');
  assert.strictEqual(S.growthBand(33), 'low');
  assert.strictEqual(S.growthBand(34), 'typical');
  assert.strictEqual(S.growthBand(59), 'typical');
  assert.strictEqual(S.growthBand(60), 'high');
  assert.strictEqual(S.growthBand(99), 'high');
});

test('growthBand returns null for a suppressed group', function () {
  assert.strictEqual(S.growthBand(null), null);
  assert.strictEqual(S.growthBand(undefined), null);
});

test('attendanceBand separates crisis from merely low', function () {
  assert.strictEqual(S.attendanceBand(38.5), 'critical');
  assert.strictEqual(S.attendanceBand(47.4), 'critical');
  assert.strictEqual(S.attendanceBand(58.2), 'low');
  assert.strictEqual(S.attendanceBand(65.4), 'low');
  assert.strictEqual(S.attendanceBand(72.1), 'mid');
  assert.strictEqual(S.attendanceBand(79.9), 'mid');
  assert.strictEqual(S.attendanceBand(83.9), 'high');
});

test('attendanceBand returns null for a suppressed group', function () {
  assert.strictEqual(S.attendanceBand(null), null);
});

test('placement splits the five i-Ready steps at the on-grade boundary', function () {
  // Asian reading: 35 mid/above, 21 early on, 13 one below, 8 two below, 23 three+
  const r = S.placement([35, 21, 13, 8, 23]);
  assert.strictEqual(r.onGrade, 56);
  assert.strictEqual(r.below, 44);
  assert.strictEqual(r.total, 100);
});

test('placement does not force rows to total 100', function () {
  // Rounding in the handout can leave a row at 99 or 101; report it, do not fix it.
  const r = S.placement([33, 0, 33, 0, 33]);
  assert.strictEqual(r.total, 99);
});

test('pctToCount applies a percentage to an assessed count', function () {
  assert.strictEqual(S.pctToCount(70, 114), 80);
  assert.strictEqual(S.pctToCount(42, 217), 91);
  assert.strictEqual(S.pctToCount(64, 173), 111);
});

test('pctToCount returns null rather than a fake zero for missing input', function () {
  assert.strictEqual(S.pctToCount(null, 100), null);
  assert.strictEqual(S.pctToCount(50, null), null);
});

test('parseAssessed reads the handout n/total form', function () {
  assert.deepStrictEqual(S.parseAssessed('104/107'), { assessed: 104, total: 107 });
  assert.deepStrictEqual(S.parseAssessed('3/3'), { assessed: 3, total: 3 });
});

test('parseAssessed rejects a malformed or impossible count', function () {
  assert.strictEqual(S.parseAssessed('107'), null);
  assert.strictEqual(S.parseAssessed(''), null);
  assert.strictEqual(S.parseAssessed(null), null);
  assert.strictEqual(S.parseAssessed('120/107'), null, 'assessed cannot exceed total');
});

test('scaleStep maps the five ordered steps to the ramp tokens', function () {
  assert.strictEqual(S.scaleStep(0), 'var(--scale-on-2)');
  assert.strictEqual(S.scaleStep(1), 'var(--scale-on-1)');
  assert.strictEqual(S.scaleStep(2), 'var(--scale-bel-1)');
  assert.strictEqual(S.scaleStep(3), 'var(--scale-bel-2)');
  assert.strictEqual(S.scaleStep(4), 'var(--scale-bel-3)');
});

test('scaleStep falls back to a neutral for an out-of-range index', function () {
  assert.strictEqual(S.scaleStep(9), 'var(--line)');
  assert.strictEqual(S.scaleStep(-1), 'var(--line)');
});

test('delta reports magnitude and direction', function () {
  assert.deepStrictEqual(S.delta(2.20, 1.82), { value: -0.38, direction: 'down' });
  assert.deepStrictEqual(S.delta(6.43, 6.80), { value: 0.37, direction: 'up' });
  assert.deepStrictEqual(S.delta(15, 15), { value: 0, direction: 'flat' });
});

test('delta treats a move inside the tolerance as flat', function () {
  // Students with disabilities: 1.83 -> 1.82 is noise, not recovery.
  assert.strictEqual(S.delta(1.83, 1.82, 0.15).direction, 'flat');
  assert.strictEqual(S.delta(1.83, 1.82, 0).direction, 'down');
});

console.log('OK - ' + passed + ' scale tests passed.');
