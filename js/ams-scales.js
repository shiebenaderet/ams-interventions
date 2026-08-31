/* AMS student data — pure scale logic. No DOM access lives in this file, which
 * is what lets tools/test-scales.js run it under plain node. Same arrangement
 * as js/ams-core.js.
 *
 * A null anywhere in the data means the handout reported N<10 or left the cell
 * blank. Every function here returns null rather than a number in that case:
 * a suppressed group must never come out looking like a zero.
 */
(function () {
  'use strict';

  // The handout's own bands, printed on its first page.
  function growthBand(sgp) {
    if (sgp == null) return null;
    if (sgp <= 33) return 'low';
    if (sgp <= 59) return 'typical';
    return 'high';
  }

  // Not from the handout — these are our reading thresholds. "critical" is the
  // under-half mark, where fewer than one student in two attends regularly.
  function attendanceBand(pct) {
    if (pct == null) return null;
    if (pct < 50) return 'critical';
    if (pct < 66) return 'low';
    if (pct < 80) return 'mid';
    return 'high';
  }

  // i-Ready reports five ordered steps; the first two are on grade level.
  function placement(v) {
    if (v == null || !Array.isArray(v) || v.length !== 5) return null;
    for (var i = 0; i < 5; i++) {
      if (typeof v[i] !== 'number' || !isFinite(v[i])) return null;
    }
    var on = v[0] + v[1];
    var below = v[2] + v[3] + v[4];
    return { onGrade: on, below: below, total: on + below };
  }

  function pctToCount(pct, assessed) {
    if (pct == null || assessed == null) return null;
    return Math.round(pct / 100 * assessed);
  }

  function parseAssessed(str) {
    if (typeof str !== 'string') return null;
    var m = /^(\d+)\/(\d+)$/.exec(str.trim());
    if (!m) return null;
    var assessed = parseInt(m[1], 10), total = parseInt(m[2], 10);
    if (assessed > total) return null;
    return { assessed: assessed, total: total };
  }

  var STEPS = ['var(--scale-on-2)', 'var(--scale-on-1)',
               'var(--scale-bel-1)', 'var(--scale-bel-2)', 'var(--scale-bel-3)'];

  function scaleStep(i) {
    return STEPS[i] || 'var(--line)';
  }

  function delta(a, b, tol) {
    if (a == null || b == null) return null;
    var value = Math.round((b - a) * 100) / 100;
    var t = tol || 0;
    var direction = Math.abs(value) <= t ? 'flat' : (value > 0 ? 'up' : (value < 0 ? 'down' : 'flat'));
    return { value: value, direction: direction };
  }

  window.AMSScales = {
    growthBand: growthBand,
    attendanceBand: attendanceBand,
    placement: placement,
    pctToCount: pctToCount,
    parseAssessed: parseAssessed,
    scaleStep: scaleStep,
    delta: delta
  };
})();
