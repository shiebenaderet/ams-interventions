'use strict';
const fs = require('fs');
const path = require('path');
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

// --- hardcoded page-composition figures still match AMSData ----------------
// js/ams-data.js hardcodes roughly a hundred individual figures in five
// spots instead of deriving them from AMSData at render time: the
// iready-vs-sba pairs, the plan-compare rows, both attendance-scatter point
// arrays, the fnc-scatter points, and the gender-gap rows. Every one is
// correct today, but nothing previously caught a future edit to
// school-data.js that left one of them stale. Re-derive each hardcoded
// figure from AMSData here and fail loudly, with the group name and both
// values, when one drifts.
//
// The literal arrays are pulled out of the actual js/ams-data.js source
// text with a regex, not retyped by hand into this file -- so a hand-edit
// to the hardcoded figure itself (not just a school-data.js change) is
// exactly what this section is built to catch too.
const jsDataSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'ams-data.js'), 'utf8');

function sourceBlock(startMarker, endMarker) {
  const start = jsDataSrc.indexOf(startMarker);
  if (start === -1) {
    throw new Error('check-school-data: marker not found in js/ams-data.js: "' + startMarker + '"');
  }
  const end = jsDataSrc.indexOf(endMarker, start + startMarker.length);
  if (end === -1) {
    throw new Error('check-school-data: end marker not found in js/ams-data.js: "' + endMarker + '"');
  }
  return jsDataSrc.slice(start, end);
}

// Some page-composition arrays now call REF.<measure>() instead of writing a
// school-wide figure down, so this evaluator supplies the same lookups
// ams-data.js uses. That is deliberate: evaluating with real values still
// proves the array reaches the RIGHT field, so a crosshair wired to
// profMath() where profEla() belongs is still caught. What it no longer has
// to catch is drift, because a derived value cannot drift.
function schoolWide(list, key) {
  let hit = null;
  (list || []).forEach(function (r) { if (r.g === 'All Students') hit = r; });
  if (!hit || hit[key] == null) {
    throw new Error('check-school-data: no All Students row for "' + key + '"');
  }
  return hit[key];
}

const REF = {
  growthEla:  function () { return schoolWide(D.growthSchool, 'ela'); },
  growthMath: function () { return schoolWide(D.growthSchool, 'math'); },
  profEla:    function () { return schoolWide(D.prof.race, 'ela'); },
  profMath:   function () { return schoolWide(D.prof.race, 'math'); },
  attendance: function () { return schoolWide(D.att.all, 'v'); },
  fncNow:     function () { return schoolWide(D.fnc.prog, 'b'); }
};

function literalArray(blockSrc, re) {
  const m = re.exec(blockSrc);
  if (!m) {
    throw new Error('check-school-data: could not locate the expected literal array in js/ams-data.js\n' +
      '  (the block being searched was: ' + blockSrc.slice(0, 80) + '...)');
  }
  return new Function('REF', 'return ' + m[1] + ';')(REF);
}

function findRow(rows, name) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].g === name) return rows[i];
  }
  return undefined;
}

function checkFigure(chart, groupLabel, field, actual, expected) {
  check(actual === expected,
    'js/ams-data.js "' + chart + '" (' + groupLabel + ', ' + field + '): hardcoded value ' +
    JSON.stringify(actual) + ' does not match AMSData value ' + JSON.stringify(expected));
}

const profAll = D.prof.race.concat(D.prof.gender, D.prof.prog);

// 1. iready-vs-sba: column a is the Alderwood SBA ELA Level 3+ figure
// (data.prof), column b is data.iready.ela's on-grade share (v[0] + v[1],
// i.e. AMSScales.placement(...).onGrade) for the same group. The group name
// in this pairs array matches data.iready.ela's `g` exactly, so only the
// prof side needs a name mapping.
const IR_VS_SBA_TO_PROF = {
  'Asian': 'Asian',
  'Black or African American': 'Black/African American',
  'Hispanic or Latino': 'Hispanic/Latino',
  'Two or more Races': 'Two or More Races',
  'White': 'White',
  'Female': 'Female',
  'Male': 'Male',
  'English Learner': 'English Language Learners',
  'Special Education': 'Students with Disabilities'
};
const irVsSbaPairs = literalArray(
  sourceBlock("render['iready-vs-sba'] = function (m) {", 'var GROWTH_COLORS ='),
  /var pairs = (\[[\s\S]*?\]\]);/
);
irVsSbaPairs.forEach(function (p) {
  const label = p[0], a = p[1], b = p[2];
  const profRow = findRow(profAll, IR_VS_SBA_TO_PROF[label]);
  const irRow = findRow(D.iready.ela, label);
  check(!!profRow, 'iready-vs-sba (' + label + '): no AMSData prof row named "' + IR_VS_SBA_TO_PROF[label] + '"');
  check(!!irRow, 'iready-vs-sba (' + label + '): no AMSData iready.ela row named "' + label + '"');
  if (profRow) checkFigure('iready-vs-sba', label, 'a = SBA ELA L3+', a, profRow.ela);
  if (irRow) {
    const placement = S.placement(irRow.v);
    checkFigure('iready-vs-sba', label, 'b = i-Ready on-grade share', b, placement ? placement.onGrade : null);
  }
});

// 2. plan-compare: a is Students with Disabilities, b is Section 504,
// across six measures in a fixed order -- three Alderwood proficiency
// rows, one Alderwood attendance row, then two district growth rows.
const planCompareRows = literalArray(
  sourceBlock("render['plan-compare'] = function (m) {", 'var ATT_COLORS ='),
  /var rows = (\[[\s\S]*?\]);/
);
const pcDisProf = findRow(D.prof.prog, 'Students with Disabilities');
const pc504Prof = findRow(D.prof.prog, 'Section 504');
const pcDisAtt = findRow(D.att.prog, 'Students with Disabilities');
const pc504Att = findRow(D.att.prog, 'Section 504');
const pcDisGrowth = findRow(D.growthDistrict, 'Students with Disabilities');
const pc504Growth = findRow(D.growthDistrict, 'Section 504');
const planCompareExpected = [
  { field: 'ELA L3+ (Alderwood)', a: pcDisProf.ela, b: pc504Prof.ela },
  { field: 'Math L3+ (Alderwood)', a: pcDisProf.math, b: pc504Prof.math },
  { field: 'Science L3+ (Alderwood)', a: pcDisProf.sci, b: pc504Prof.sci },
  { field: 'attendance (Alderwood)', a: pcDisAtt.v, b: pc504Att.v },
  { field: 'ELA growth SGP (district)', a: pcDisGrowth.ela, b: pc504Growth.ela },
  { field: 'Math growth SGP (district)', a: pcDisGrowth.math, b: pc504Growth.math }
];
check(planCompareRows.length === planCompareExpected.length,
  'plan-compare: expected ' + planCompareExpected.length + ' rows, found ' + planCompareRows.length);
planCompareRows.forEach(function (row, i) {
  const exp = planCompareExpected[i];
  if (!exp) return;
  checkFigure('plan-compare', row.g, exp.field + ' (a = disabilities)', row.a, exp.a);
  checkFigure('plan-compare', row.g, exp.field + ' (b = Section 504)', row.b, exp.b);
});

// 3 & 4. attendance-scatter-race / attendance-scatter-prog: x is
// data.att's value, y is data.prof's ELA figure, for the same group under
// (sometimes differing) names in each source.
const RACE_SCATTER_MAP = {
  'Asian': { attList: D.att.race, attName: 'Asian', profList: D.prof.race, profName: 'Asian' },
  'Black/African Am.': { attList: D.att.race, attName: 'Black/African American', profList: D.prof.race, profName: 'Black/African American' },
  'Hispanic/Latino': { attList: D.att.race, attName: 'Hispanic/Latino', profList: D.prof.race, profName: 'Hispanic/Latino' },
  'Two or more races': { attList: D.att.race, attName: 'Two or More Races', profList: D.prof.race, profName: 'Two or More Races' },
  'White': { attList: D.att.race, attName: 'White', profList: D.prof.race, profName: 'White' },
  'Female': { attList: D.att.gender, attName: 'Female', profList: D.prof.gender, profName: 'Female' },
  'Male': { attList: D.att.gender, attName: 'Male', profList: D.prof.gender, profName: 'Male' },
  'All students': { attList: D.att.all, attName: 'All Students', profList: D.prof.race, profName: 'All Students' }
};
const attScatterRacePoints = literalArray(
  sourceBlock("render['attendance-scatter-race'] = function (m) {", "render['attendance-scatter-prog'] = function (m) {"),
  /attendanceScatter\((\[[\s\S]*?\])\s*,\s*'/
);
attScatterRacePoints.forEach(function (pt) {
  const map = RACE_SCATTER_MAP[pt.g];
  check(!!map, 'attendance-scatter-race: no mapping defined for "' + pt.g + '"');
  if (!map) return;
  const attRow = findRow(map.attList, map.attName);
  const profRow = findRow(map.profList, map.profName);
  check(!!attRow, 'attendance-scatter-race (' + pt.g + '): no AMSData att row named "' + map.attName + '"');
  check(!!profRow, 'attendance-scatter-race (' + pt.g + '): no AMSData prof row named "' + map.profName + '"');
  if (attRow) checkFigure('attendance-scatter-race', pt.g, 'x = attendance', pt.x, attRow.v);
  if (profRow) checkFigure('attendance-scatter-race', pt.g, 'y = ELA L3+', pt.y, profRow.ela);
});

const PROG_SCATTER_MAP = {
  'English learners': { attName: 'English Language Learners', profName: 'English Language Learners' },
  'Non-ELL': { attName: 'Non-English Language Learners', profName: 'Non-English Language Learners' },
  'Students w/ disabilities': { attName: 'Students with Disabilities', profName: 'Students with Disabilities' },
  'Without disabilities': { attName: 'Students without Disabilities', profName: 'Students without Disabilities' },
  'Low-income': { attName: 'Low Income', profName: 'Low-Income' },
  'Non-low income': { attName: 'Non-Low Income', profName: 'Non-Low Income' },
  'Homeless': { attName: 'Homeless', profName: 'Homeless' },
  'Non-homeless': { attName: 'Non-Homeless', profName: 'Non-Homeless' },
  'Section 504': { attName: 'Section 504', profName: 'Section 504' }
};
const attScatterProgPoints = literalArray(
  sourceBlock("render['attendance-scatter-prog'] = function (m) {", 'function fncDumbbell(rows)'),
  /attendanceScatter\((\[[\s\S]*?\])\s*,\s*'/
);
attScatterProgPoints.forEach(function (pt) {
  const map = PROG_SCATTER_MAP[pt.g];
  check(!!map, 'attendance-scatter-prog: no mapping defined for "' + pt.g + '"');
  if (!map) return;
  const attRow = findRow(D.att.prog, map.attName);
  const profRow = findRow(D.prof.prog, map.profName);
  check(!!attRow, 'attendance-scatter-prog (' + pt.g + '): no AMSData att.prog row named "' + map.attName + '"');
  check(!!profRow, 'attendance-scatter-prog (' + pt.g + '): no AMSData prof.prog row named "' + map.profName + '"');
  if (attRow) checkFigure('attendance-scatter-prog', pt.g, 'x = attendance', pt.x, attRow.v);
  if (profRow) checkFigure('attendance-scatter-prog', pt.g, 'y = ELA L3+', pt.y, profRow.ela);
});

// 5. fnc-scatter: x is data.fnc's most recent semester (b = S2 25-26), y is
// data.prof's ELA figure. The grade report and the assessment pages use
// different group vocabularies (documented in data.html's "Group
// definitions differ slightly across sources" note), so both sides are
// named explicitly per point rather than assumed to match.
const FNC_SCATTER_MAP = {
  'Asian': { fncList: D.fnc.race, fncName: 'Asian', profList: D.prof.race, profName: 'Asian' },
  'Two or more races': { fncList: D.fnc.race, fncName: 'Two or More Races', profList: D.prof.race, profName: 'Two or More Races' },
  'White': { fncList: D.fnc.race, fncName: 'White', profList: D.prof.race, profName: 'White' },
  'All students': { fncList: D.fnc.prog, fncName: 'All Students', profList: D.prof.race, profName: 'All Students' },
  'Black/African Am.': { fncList: D.fnc.race, fncName: 'Black or African American', profList: D.prof.race, profName: 'Black/African American' },
  'Free/reduced meals': { fncList: D.fnc.prog, fncName: 'Students eligible for free/reduced meals', profList: D.prof.prog, profName: 'Low-Income' },
  'Hispanic/Latino': { fncList: D.fnc.race, fncName: 'Hispanic/Latino', profList: D.prof.race, profName: 'Hispanic/Latino' },
  'Homeless': { fncList: D.fnc.prog, fncName: 'Students experiencing homelessness', profList: D.prof.prog, profName: 'Homeless' },
  'Special education': { fncList: D.fnc.prog, fncName: 'Special Education', profList: D.prof.prog, profName: 'Students with Disabilities' },
  'Multilingual learners': { fncList: D.fnc.prog, fncName: 'Multilingual Learners', profList: D.prof.prog, profName: 'English Language Learners' }
};
const fncScatterPoints = literalArray(
  sourceBlock("render['fnc-scatter'] = function (m) {", "render['survey-dumbbell'] = function (m) {"),
  /points:\s*(\[[\s\S]*?\])\s*\n\s*\}\)\);/
);
fncScatterPoints.forEach(function (pt) {
  const map = FNC_SCATTER_MAP[pt.g];
  check(!!map, 'fnc-scatter: no mapping defined for "' + pt.g + '"');
  if (!map) return;
  const fncRow = findRow(map.fncList, map.fncName);
  const profRow = findRow(map.profList, map.profName);
  check(!!fncRow, 'fnc-scatter (' + pt.g + '): no AMSData fnc row named "' + map.fncName + '"');
  check(!!profRow, 'fnc-scatter (' + pt.g + '): no AMSData prof row named "' + map.profName + '"');
  if (fncRow) checkFigure('fnc-scatter', pt.g, 'x = F/NC S2 25-26', pt.x, fncRow.b);
  if (profRow) checkFigure('fnc-scatter', pt.g, 'y = ELA L3+', pt.y, profRow.ela);
});

// 6. gender-gap: every row is Female's figure and Male's figure from a
// named AMSData list, both for the same field.
const GENDER_GAP_SOURCES = {
  'ELA median growth (SGP)': { list: D.growthSchool, field: 'ela' },
  'ELA, % at Level 3+': { list: D.prof.gender, field: 'ela' },
  'Regular attendance': { list: D.att.gender, field: 'v' },
  'Math median growth (SGP)': { list: D.growthSchool, field: 'math' },
  'Math, % at Level 3+': { list: D.prof.gender, field: 'math' },
  'Sense of belonging': { list: D.survey.rows, field: 'belong' },
  'Science, % at Level 3+': { list: D.prof.gender, field: 'sci' },
  'Teacher–student relationships': { list: D.survey.rows, field: 'rel' }
};
const genderGapRows = literalArray(
  sourceBlock("render['gender-gap'] = function (m) {", '// Nine tables'),
  /var rows = (\[[\s\S]*?\])\s*\.map/
);
genderGapRows.forEach(function (row) {
  const src = GENDER_GAP_SOURCES[row.g];
  check(!!src, 'gender-gap: no mapping defined for "' + row.g + '"');
  if (!src) return;
  const femaleRow = findRow(src.list, 'Female');
  const maleRow = findRow(src.list, 'Male');
  check(!!femaleRow, 'gender-gap (' + row.g + '): no AMSData row named "Female" in the source list');
  check(!!maleRow, 'gender-gap (' + row.g + '): no AMSData row named "Male" in the source list');
  if (femaleRow) checkFigure('gender-gap', row.g, 'f = Female ' + src.field, row.f, femaleRow[src.field]);
  if (maleRow) checkFigure('gender-gap', row.g, 'mm = Male ' + src.field, row.mm, maleRow[src.field]);
});

if (failures.length) {
  console.error('check-school-data: ' + failures.length + ' problem(s)\n');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}

const groups = D.growthSchool.length + D.growthDistrict.length;
console.log('OK - school data checks passed (' + groups + ' growth rows, ' +
  D.wsif.length + ' WSIF groups, ' +
  (D.iready.ela.length + D.iready.math.length) + ' i-Ready rows).');
