'use strict';
/* Integrity checker for data/school-data.js.
 *
 * What this catches: values outside their valid range (percentages, growth
 * percentiles, WSIF scores), wrong shapes (wrong array length, non-array
 * where an array is expected), i-Ready rows whose five steps don't total
 * 100 within rounding, unparseable assessed counts, a group named twice in
 * one list, one half of a paired measure (F/NC, survey) suppressed while
 * its partner isn't, and a missing district caveat in meta.
 *
 * What this does NOT catch: a mistyped digit that stays in range. 55.0
 * typed as 65.0 passes every check here except inside an i-Ready row,
 * where the steps-total-100 constraint happens to also catch it. Outside
 * that block, range/shape checks cannot tell a correct figure from a wrong
 * one that's still plausible.
 *
 * What actually protects against that: every figure was checked page by
 * page against the source PDF, and this file's transcription was
 * programmatically compared key-by-key against the source block it was
 * copied from.
 */
const { loadBrowserGlobal } = require('./load');

const D = loadBrowserGlobal('data/school-data.js', 'AMSData');
const S = loadBrowserGlobal('js/ams-scales.js', 'AMSScales');

const failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }

function isPct(v) { return v === null || (typeof v === 'number' && v >= 0 && v <= 100); }
function isSgp(v) { return v === null || (typeof v === 'number' && v >= 1 && v <= 99); }

// --- every percentage is a percentage -------------------------------------
[['prof.race', D.prof.race], ['prof.gender', D.prof.gender], ['prof.prog', D.prof.prog]]
  .forEach(function ([label, rows]) {
    rows.forEach(function (r, i) {
      ['ela', 'math', 'sci'].forEach(function (k) {
        check(isPct(r[k]), label + '[' + i + '] (' + r.g + '): ' + k + ' is not a percentage (' + r[k] + ')');
      });
    });
  });

['all', 'gender', 'race', 'prog'].forEach(function (k) {
  D.att[k].forEach(function (r, i) {
    check(isPct(r.v), 'att.' + k + '[' + i + '] (' + r.g + '): ' + r.v + ' is not a percentage');
  });
});

// --- growth percentiles are percentiles ------------------------------------
D.growthSchool.forEach(function (r, i) {
  check(isSgp(r.ela), 'growthSchool[' + i + '] (' + r.g + '): ela ' + r.ela + ' outside 1-99');
  check(isSgp(r.math), 'growthSchool[' + i + '] (' + r.g + '): math ' + r.math + ' outside 1-99');
});
D.growthDistrict.forEach(function (r, i) {
  check(isSgp(r.ela), 'growthDistrict[' + i + '] (' + r.g + '): ela ' + r.ela + ' outside 1-99');
  check(isSgp(r.math), 'growthDistrict[' + i + '] (' + r.g + '): math ' + r.math + ' outside 1-99');
});

// --- WSIF is a 1-10 score, three cycles per group --------------------------
D.wsif.forEach(function (r, i) {
  check(Array.isArray(r.v) && r.v.length === 3,
    'wsif[' + i + '] (' + r.g + '): expected 3 cycles, found ' + (r.v || []).length);
  (r.v || []).forEach(function (v, j) {
    check(typeof v === 'number' && v >= 1 && v <= 10,
      'wsif[' + i + '] (' + r.g + '): cycle ' + j + ' score ' + v + ' outside 1-10');
  });
});
check(D.wsifYears.length === 3, 'wsifYears must name exactly 3 cycles');

// --- i-Ready rows are five steps that total about 100 ----------------------
['ela', 'math'].forEach(function (subject) {
  D.iready[subject].forEach(function (r, i) {
    const at = 'iready.' + subject + '[' + i + '] (' + r.g + ')';
    check(Array.isArray(r.v) && r.v.length === 5, at + ': expected 5 placement steps');
    (r.v || []).forEach(function (v, j) {
      check(typeof v === 'number', at + ': step ' + j + ' (' + v + ') is not a number');
    });
    const placement = S.placement(r.v);
    if (placement === null) {
      check(false, at + ': placement steps are malformed, cannot total them');
    } else {
      check(Math.abs(placement.total - 100) <= 1,
        at + ': steps total ' + placement.total + '%, expected 100 (+/-1 for rounding)');
    }
    const n = S.parseAssessed(r.n);
    check(n !== null, at + ': assessed count "' + r.n + '" is not a valid n/total');
  });
});
check(D.iLabels.length === 5, 'iLabels must name exactly 5 placement steps');

// --- F/NC rates are percentages, both semesters ----------------------------
['prog', 'race'].forEach(function (k) {
  D.fnc[k].forEach(function (r, i) {
    check(isPct(r.a), 'fnc.' + k + '[' + i + '] (' + r.g + '): S2 24-25 value ' + r.a + ' is not a percentage');
    check(isPct(r.b), 'fnc.' + k + '[' + i + '] (' + r.g + '): S2 25-26 value ' + r.b + ' is not a percentage');
    check((r.a === null) === (r.b === null),
      'fnc.' + k + '[' + i + '] (' + r.g + '): one semester is suppressed and the other is not');
  });
});

// --- survey ---------------------------------------------------------------
D.survey.rows.forEach(function (r, i) {
  check(isPct(r.belong), 'survey.rows[' + i + '] (' + r.g + '): belong ' + r.belong + ' is not a percentage');
  check(isPct(r.rel), 'survey.rows[' + i + '] (' + r.g + '): rel ' + r.rel + ' is not a percentage');
  check((r.belong === null) === (r.rel === null),
    'survey.rows[' + i + '] (' + r.g + '): one measure is suppressed and the other is not');
});

// --- no group is named twice inside one list ------------------------------
function noDuplicates(label, rows) {
  const seen = {};
  rows.forEach(function (r) {
    check(!seen[r.g], label + ': "' + r.g + '" appears twice');
    seen[r.g] = true;
  });
}
noDuplicates('growthSchool', D.growthSchool);
noDuplicates('growthDistrict', D.growthDistrict);
noDuplicates('wsif', D.wsif);
noDuplicates('iready.ela', D.iready.ela);
noDuplicates('iready.math', D.iready.math);
noDuplicates('survey.rows', D.survey.rows);

// --- the district caveat must be recorded in the data, not only in prose ---
check(D.meta && D.meta.growthDistrictNote &&
      /district/i.test(D.meta.growthDistrictNote),
  'meta.growthDistrictNote must state that growthDistrict is district-wide');

if (failures.length) {
  console.error('check-school-data: ' + failures.length + ' problem(s)\n');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}

const groups = D.growthSchool.length + D.growthDistrict.length;
console.log('OK - school data checks passed (' + groups + ' growth rows, ' +
  D.wsif.length + ' WSIF groups, ' +
  (D.iready.ela.length + D.iready.math.length) + ' i-Ready rows).');
