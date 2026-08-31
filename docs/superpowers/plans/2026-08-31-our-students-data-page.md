# "Our Students" Data Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the standalone August 2026 PD data summary into the AMS Interventions site as `data.html`, fully conformed to the site's visual system and split along the repo's file conventions.

**Architecture:** Prose lives in HTML; only charts are generated. `data.html` carries every heading, dek, takeaway and note as real markup with `<div class="chart" data-chart="<id>">` mount points. `js/ams-data.js` fills each mount by calling a primitive from `js/ams-charts.js`, which draws using pure helpers from `js/ams-scales.js` and the transcription in `data/school-data.js`.

**Tech Stack:** Plain ES5-style browser JavaScript, no build step, no dependencies. Node (any recent version) runs the test files directly via `tools/load.js`, which executes browser globals in the host realm.

**Spec:** `docs/superpowers/specs/2026-08-31-ams-student-data-page-design.md`

## Global Constraints

- **No build step, no dependencies.** Every file is loaded directly by the browser via `<script src>`. Do not add npm, bundlers, or import/export syntax.
- **Script style is ES5-compatible IIFE**, matching `js/ams-core.js`: `(function () { 'use strict'; ... })();` assigning to a `window.*` global at the end. Do not use `const`/`let`/arrow functions in `js/*.js` files — the existing files use `var` and `function`. Node test files under `tools/` may use modern syntax; they already do.
- **House rules from `css/style.css:7-16` are binding.** Radius 0. No full borders — separation comes from hairlines, ground shift and space. Colour is a mark, not a container. 1px hairlines only. Fraunces names things, Outfit says everything else.
- **Never green/red for ordered scales.** Use the `--scale-*` ramp defined in Task 3.
- **`null` in the data means the handout reported `N<10` or left the cell blank.** Never estimate it, never interpolate it, never render it as a zero-length bar. It renders as the text "not reported (N<10)".
- **`AMSData.growthDistrict` is Edmonds School District data, not Alderwood.** Any chart drawing from it must say so on the chart itself.
- **All user-facing strings pass through `AMSCore.escapeHtml`** before entering `innerHTML`.
- **Ordered scales always print the numeric value as text.** Colour is never the only channel.
- **No dark mode.** Do not add `prefers-color-scheme` blocks or a theme toggle.

---

### Task 1: Pure scale helpers

Band classification and unit conversion, with no DOM access, so the rules that decide "is this low growth" are testable under plain node.

**Files:**
- Create: `js/ams-scales.js`
- Create: `tools/test-scales.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `window.AMSScales` with
  - `growthBand(sgp)` → `'low' | 'typical' | 'high' | null`
  - `attendanceBand(pct)` → `'critical' | 'low' | 'mid' | 'high' | null`
  - `placement(v)` → `{ onGrade: number, below: number, total: number }`
  - `pctToCount(pct, assessed)` → `number | null`
  - `parseAssessed(str)` → `{ assessed: number, total: number } | null`
  - `scaleStep(i)` → `string` (a `var(--scale-…)` CSS value)
  - `delta(a, b, tol)` → `{ value: number, direction: 'up' | 'down' | 'flat' }`

- [ ] **Step 1: Write the failing tests**

Create `tools/test-scales.js`:

```javascript
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
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node tools/test-scales.js`
Expected: throws `Missing file: js/ams-scales.js`

- [ ] **Step 3: Write the minimal implementation**

Create `js/ams-scales.js`:

```javascript
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
    var a = v || [];
    var on = (a[0] || 0) + (a[1] || 0);
    var below = (a[2] || 0) + (a[3] || 0) + (a[4] || 0);
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
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node tools/test-scales.js`
Expected: `OK - 14 scale tests passed.`

- [ ] **Step 5: Confirm nothing else broke**

Run: `node tools/test-core.js && node tools/check-data.js`
Expected: both print their existing OK lines.

- [ ] **Step 6: Commit**

```bash
git add js/ams-scales.js tools/test-scales.js
git commit -m "Add pure scale helpers for the student data page

Band classification and unit conversion for the PD data charts, kept
free of the DOM so tools/test-scales.js can run them under node — the
same arrangement js/ams-core.js already uses.

Every helper returns null for a suppressed group rather than a number,
so an N<10 row can never come out of these functions looking like a
zero."
```

---

### Task 2: The transcription and its integrity check

The handout's figures, and a checker that catches a fat-fingered digit.

**Files:**
- Create: `data/school-data.js`
- Create: `tools/check-school-data.js`

**Interfaces:**
- Consumes: `AMSScales.parseAssessed`, `AMSScales.placement` (Task 1).
- Produces: `window.AMSData` with keys `meta`, `growthSchool`, `growthDistrict`, `prof`, `wsif`, `wsifYears`, `att`, `iready`, `iLabels`, `fnc`, `survey`. Exact row shapes are in the spec's "Data model" table.

- [ ] **Step 1: Write the integrity checker first**

Create `tools/check-school-data.js`. It runs against data that does not exist yet, so it will fail loudly:

```javascript
'use strict';
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
    const total = S.placement(r.v).total;
    check(Math.abs(total - 100) <= 1, at + ': steps total ' + total + '%, expected 100 (+/-1 for rounding)');
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-school-data.js`
Expected: throws `Missing file: data/school-data.js`

- [ ] **Step 3: Write the transcription**

Create `data/school-data.js`. Copy every figure verbatim from the `D` object in the standalone summary page — `growthSchool`, `growthDistrict`, `prof`, `wsif`, `wsifYears`, `att`, `iready`, `iLabels`, `fnc`, `survey` — changing only the global name and adding the `meta` block. Do not retype the numbers by hand; copy the literals.

The file header and `meta` block:

```javascript
/* AMS student data — the August 2026 PD handout, transcribed.
 *
 * Source: "AMS Copy of Edmonds School Data Template for PD August 2026" (16pp).
 * Every figure here comes from that handout. Nothing is computed, estimated,
 * or pulled from elsewhere.
 *
 * null means the handout reported N<10 or left the cell blank. Never replace a
 * null with a number.
 *
 * After editing, run: node tools/check-school-data.js
 */
window.AMSData = {
  meta: {
    handout: 'AMS Copy of Edmonds School Data Template for PD August 2026',
    session: 'August 31, 2026 Professional Learning',
    school: 'Alderwood Middle School',
    growthDistrictNote:
      'Reports the Edmonds School District as a whole, not Alderwood. It is the ' +
      'only growth data available for program groups, and Alderwood may sit above ' +
      'or below it.',
    sources: [
      { k: 'Growth & proficiency', v: 'SBA/WCAS, 2024-25' },
      { k: 'WSIF', v: '2023, 2024, 2025 cycles' },
      { k: 'Attendance', v: '2024-25' },
      { k: 'i-Ready', v: 'Spring 2026' },
      { k: 'Grades', v: 'S2 24-25 to S2 25-26' },
      { k: 'Survey', v: 'Spring 2026' }
    ]
  },

  // ... growthSchool, growthDistrict, prof, wsif, wsifYears, att,
  //     iready, iLabels, fnc, survey — copied verbatim ...
};
```

- [ ] **Step 4: Run the checker and verify it passes**

Run: `node tools/check-school-data.js`
Expected: `OK - school data checks passed (27 growth rows, 9 WSIF groups, 22 i-Ready rows).`

If it reports an i-Ready row totalling 99 or 101, that is the handout's own rounding and the ±1 tolerance covers it. If it reports a larger gap, a digit was mistyped — fix the transcription, not the tolerance.

- [ ] **Step 5: Commit**

```bash
git add data/school-data.js tools/check-school-data.js
git commit -m "Transcribe the August 2026 PD handout with an integrity check

Every figure from the 16-page district handout, verified against the
PDF. Nulls are the handout's own N<10 suppressions and stay null.

The checker catches the failure mode that matters for a hand
transcription: a mistyped digit. It bounds percentages, percentiles and
WSIF scores, confirms each i-Ready row's five steps total 100 within
rounding, parses every assessed count, and fails if one measure of a
paired row is suppressed while its partner is not."
```

---
### Task 3: Design tokens and chart styles

The visual foundation everything after this draws on. Nothing renders yet, but the tokens and classes exist and can be eyeballed against the house rules.

**Files:**
- Modify: `css/style.css` — add tokens inside `:root` (after the tier identity block, around line 49) and a chart section before `/* ---------- callouts` (around line 342)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--scale-on-2`, `--scale-on-1`, `--scale-bel-1`, `--scale-bel-2`, `--scale-bel-3`, and the class names every later task writes markup against.

- [ ] **Step 1: Add the ramp tokens**

In `css/style.css`, immediately after the `--t3-ink: #594073;` line inside `:root`:

```css
    /* Ordered data scales — navy is on grade, terracotta is below, and the
       split between them is the boundary. Deliberately not a traffic light:
       see house rule 3. Every step clears 3:1 against --cream (14.03, 4.88,
       3.73, 5.30, 8.09), the WCAG floor for non-text. Adjacent steps are
       weaker than that, so stacked segments keep a 2px gap and let the
       ground do the separating. */
    --scale-on-2:  #14223A;
    --scale-on-1:  #4A6B8F;
    --scale-bel-1: #C75B2A;
    --scale-bel-2: #A4462C;
    --scale-bel-3: #7E2E14;
```

- [ ] **Step 2: Add the chart styles**

Insert before the `/* ---------- callouts: leading rule, no fill box ---------- */` comment:

```css
/* ===========================================================
   Student data charts
   Mount points are <div class="chart" data-chart="id">, filled
   by js/ams-data.js. House rules apply: no radius, no shadow,
   no full borders. A chart is separated by a hairline and space.
   =========================================================== */

.chart { margin-top: 1.25rem; }

.chart-title {
    font-family: var(--sans);
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--faint);
    padding-bottom: .45rem;
    border-bottom: 1px solid var(--line);
    margin-bottom: .9rem;
}

.chart-source { font-size: .78rem; color: var(--faint); margin: .5rem 0 0; }

.chart-link {
    display: inline-block;
    margin-top: .6rem;
    font-size: .78rem;
    color: var(--muted);
}

/* ---- shared row scaffolding ---- */
.bar-row, .gb-row, .div-row, .stack-row, .db-row {
    display: grid;
    grid-template-columns: var(--labelw, 200px) 1fr;
    gap: .75rem;
    align-items: center;
}

.bar-lab, .gb-lab, .div-lab, .stack-lab, .db-lab-text {
    font-size: .78rem;
    color: var(--muted);
    text-align: right;
    line-height: 1.25;
}

.bar-row.is-total .bar-lab, .stack-row.is-total .stack-lab { color: var(--ink); font-weight: 600; }

.bar-nd { font-size: .72rem; color: var(--faint); font-style: italic; }

.bar-group-label {
    font-family: var(--sans);
    font-size: .64rem;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--faint);
    margin: 1rem 0 .4rem;
    padding-bottom: .3rem;
    border-bottom: 1px solid var(--line-2);
}
.bar-group-label:first-child { margin-top: 0; }

/* ---- hbars ---- */
.bar-row { padding: .18rem 0; }
.bar-track { position: relative; height: 1.15rem; display: flex; align-items: center; }
.bar-fill { height: .8rem; background: var(--navy); min-width: 2px; }
.bar-val {
    position: absolute;
    font-size: .72rem;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    padding-left: .45rem;
    white-space: nowrap;
}
.bar-row.is-total .bar-val { color: var(--ink); font-weight: 700; }
.bar-ref { position: absolute; top: -2px; bottom: -2px; border-left: 1px dashed var(--faint); }

.bar-ref-label {
    font-family: var(--sans);
    font-size: .64rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--faint);
    margin-top: .6rem;
    display: flex;
    align-items: center;
    gap: .45rem;
}
.bar-ref-label::before { content: ""; width: 20px; border-top: 1px dashed var(--faint); }

/* ---- gbars: one line per series ---- */
.gb-row { padding: .4rem 0; border-bottom: 1px solid var(--line-2); }
.gb-row:last-child { border-bottom: 0; }
.gb-set { display: flex; flex-direction: column; gap: 2px; }
.gb-line { position: relative; height: .9rem; display: flex; align-items: center; }
.gb-fill { height: .62rem; min-width: 2px; }
.gb-val {
    position: absolute;
    font-size: .68rem;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    padding-left: .4rem;
    white-space: nowrap;
}

/* ---- divbars: centred on zero ---- */
.div-row { padding: .2rem 0; }
.div-track { position: relative; height: 1.35rem; margin-right: 4.5rem; }
.div-axis { position: absolute; top: 0; bottom: 0; left: 50%; border-left: 1px solid var(--line); }
.div-fill { position: absolute; top: .28rem; height: .8rem; }
.div-val {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: .72rem;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    white-space: nowrap;
}

/* ---- divstack: split at the on-grade boundary ---- */
.stack-row { padding: .22rem 0; }
.stack-outer { position: relative; margin: 0 3.6rem 0 2.6rem; }
.stack { display: flex; height: 1.3rem; gap: 2px; align-items: stretch; }
.stack-seg { min-width: 0; }
.stack-axis { position: absolute; top: -3px; bottom: -3px; border-left: 1px solid var(--faint); }
.stack-end {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: .7rem;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    white-space: nowrap;
}
.stack-end--worst { color: var(--warm-d); font-weight: 700; }

/* ---- dumbbell: before and after ---- */
.db-row { padding: .35rem 0; border-bottom: 1px solid var(--line-2); }
.db-row:last-child { border-bottom: 0; }
.db-track { position: relative; height: 1.35rem; }
.db-line { position: absolute; top: 50%; height: 2px; transform: translateY(-50%); background: var(--line); }
.db-line.is-worse { background: var(--warm); }
.db-line.is-better { background: var(--sage); }
.db-dot {
    position: absolute;
    top: 50%;
    width: .62rem;
    height: .62rem;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 2px var(--cream);
}
.db-val {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding-left: .75rem;
    font-size: .72rem;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    white-space: nowrap;
}
.db-val .is-worse { color: var(--warm-d); }
.db-val .is-better { color: var(--sage); }

/* ---- sparkgrid: small multiples on one scale ---- */
.spark-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.1rem 1.4rem;
}
.spark { border-top: 1px solid var(--line-2); padding-top: .6rem; }
.spark h4 {
    font-family: var(--serif);
    font-size: .84rem;
    font-weight: 600;
    color: var(--navy);
    letter-spacing: 0;
    text-transform: none;
    margin: 0;
    line-height: 1.2;
    min-height: 2.4em;
}
.spark-delta { font-size: .7rem; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: .15rem; }
.spark-delta.is-up { color: var(--sage); }
.spark-delta.is-down { color: var(--warm-d); }
.spark-delta.is-flat { color: var(--faint); }
.spark svg { display: block; width: 100%; height: 3.6rem; margin-top: .4rem; overflow: visible; }
.spark-x { display: flex; justify-content: space-between; font-size: .6rem; color: var(--faint); margin-top: .25rem; font-variant-numeric: tabular-nums; }
.spark-now { font-size: .95rem; font-weight: 700; font-variant-numeric: tabular-nums; margin-top: .2rem; color: var(--ink); }

/* ---- scatter ---- */
.scatter-wrap { overflow-x: auto; }
.scatter-wrap svg { display: block; min-width: 520px; width: 100%; height: auto; overflow: visible; }
.sc-quad {
    font-family: var(--sans);
    font-size: .6rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    fill: var(--faint);
}
.sc-axis {
    font-family: var(--sans);
    font-size: .64rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    fill: var(--faint);
}
.sc-point-label {
    font-family: var(--sans);
    font-size: .7rem;
    fill: var(--ink);
    font-weight: 600;
    stroke: var(--cream);
    stroke-width: 3.5px;
    paint-order: stroke fill;
    stroke-linejoin: round;
}
.sc-point-label.is-ref { fill: var(--faint); font-weight: 400; }

/* ---- legend ---- */
.chart-legend { display: flex; flex-wrap: wrap; gap: .3rem 1.1rem; margin-top: .85rem; font-size: .74rem; color: var(--muted); }
.chart-legend-item { display: inline-flex; align-items: center; gap: .4rem; }
.chart-legend-sw { width: .7rem; height: .7rem; flex: none; }

/* ---- verdict blocks: left rule, no card ---- */
.verdict-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.4rem 1.8rem; margin-top: 1.3rem; }
.verdict { border-left: 3px solid var(--line); padding: .1rem 0 .1rem 1.05rem; }
.verdict--up { border-left-color: var(--sage); }
.verdict--watch { border-left-color: var(--gold); }
.verdict--down { border-left-color: var(--warm-d); }
.verdict-tag {
    font-family: var(--sans);
    font-size: .62rem;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--faint);
}
.verdict h3 { font-size: 1.04rem; margin: .3rem 0 .35rem; }
.verdict p { font-size: .9rem; margin-bottom: .7rem; }
.verdict-evid { list-style: none; padding: 0; margin: 0; }
.verdict-evid li {
    display: flex;
    justify-content: space-between;
    gap: .8rem;
    align-items: baseline;
    padding: .3rem 0;
    border-bottom: 1px solid var(--line-2);
    font-size: .8rem;
    color: var(--muted);
}
.verdict-evid li:last-child { border-bottom: 0; }
.verdict-evid .v { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.verdict-evid .v.is-pos { color: var(--sage); }
.verdict-evid .v.is-neg { color: var(--warm-d); }

/* ---- data tables ---- */
.data-table { margin-top: .7rem; border-top: 1px solid var(--line-2); }
.data-table summary {
    cursor: pointer;
    padding: .6rem 0;
    font-size: .8rem;
    font-weight: 600;
    color: var(--muted);
}
.data-table summary:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
.data-table-scroll { overflow-x: auto; padding-bottom: .3rem; }
.data-table table { border-collapse: collapse; width: 100%; font-size: .76rem; font-variant-numeric: tabular-nums; }
.data-table th, .data-table td { padding: .35rem .7rem; text-align: right; border-bottom: 1px solid var(--line-2); white-space: nowrap; }
.data-table th {
    font-family: var(--sans);
    font-size: .62rem;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--faint);
    font-weight: 700;
}
.data-table th:first-child, .data-table td:first-child { text-align: left; }

@media (max-width: 640px) {
    .bar-row, .gb-row, .div-row, .stack-row, .db-row { grid-template-columns: 1fr; gap: .15rem; }
    .bar-lab, .gb-lab, .div-lab, .stack-lab, .db-lab-text { text-align: left; font-weight: 600; color: var(--ink); }
    .div-track { margin-right: 0; }
    .stack-outer { margin: 0 2.6rem; }
}
```

- [ ] **Step 3: Verify the ramp contrast holds**

Run:

```bash
node -e '
const lum = h => { const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
["#14223A","#4A6B8F","#C75B2A","#A4462C","#7E2E14"].forEach(c=>{
  const r = ratio(c,"#F5F0E8");
  console.log(c, r.toFixed(2)+":1", r>=3?"ok":"FAILS");
});'
```
Expected: five lines, all `ok`.

- [ ] **Step 4: Confirm no house rule was broken**

Run: `grep -nE "border-radius|box-shadow" css/style.css | grep -v "back-to-top"`
Expected: no output. (`.back-to-top` in `js/main.js` is pre-existing and out of scope.)

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "Add the ordered-scale ramp and chart styles

Five ramp tokens split at the on-grade/below-grade boundary rather than
around a neutral midpoint, because i-Ready has two on-grade categories
and three below-grade ones. All five clear 3:1 against the cream ground.

Chart chrome follows the house rules: hairline rules and space do the
separating, no radius, no shadow, no full borders. Verdict blocks reuse
the left-rule idiom the callouts already use."
```

---

### Task 4: Bar primitives

The three bar shapes eight of the ten sections need.

**Files:**
- Create: `js/ams-charts.js`
- Create: `tools/preview-charts.html`

**Interfaces:**
- Consumes: `AMSCore.escapeHtml`, `AMSScales.scaleStep`.
- Produces: `window.AMSCharts` with `hbars(rows, opts)`, `gbars(rows, series, opts)`, `divbars(rows, opts)`, each returning an `HTMLElement`. Tasks 5 and 6 add five more functions to the same object.

Row and option shapes:

- `hbars(rows, opts)` — `rows` is `[{g, v, total?, hi?} | {header}]`. `opts`: `{max, labelw, ref, fmt(v), colorFn(row)}`. `colorFn` returns a CSS colour value.
- `gbars(rows, series, opts)` — `rows` is `[{g, ...keys}]`; `series` is `[{key, name, color}]`. `opts`: `{max, labelw}`.
- `divbars(rows, opts)` — `rows` is `[{g, v, note?}]`. `opts`: `{max, labelw, posColor, negColor, fmt(v)}`.

- [ ] **Step 1: Create the preview harness**

Create `tools/preview-charts.html` — a scratch page for eyeballing primitives without the full data page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chart primitive preview</title>
<link rel="stylesheet" href="../css/style.css">
</head>
<body class="tier-1" data-root="../">
<main id="main" class="container">
  <section>
    <h2>Chart primitives</h2>
    <p>Scratch page for checking primitives against the house rules. Not linked from the site.</p>
    <div id="preview"></div>
  </section>
</main>
<script src="../js/ams-core.js"></script>
<script src="../js/ams-scales.js"></script>
<script src="../js/ams-charts.js"></script>
<script>
(function () {
  var host = document.getElementById('preview');
  var C = window.AMSCharts;

  function show(title, node) {
    var h = document.createElement('div');
    h.className = 'chart-title';
    h.textContent = title;
    host.appendChild(h);
    host.appendChild(node);
  }

  show('hbars with a group header and reference line', C.hbars([
    { header: 'Race / ethnicity' },
    { g: 'Asian', v: 83.9 },
    { g: 'Black/African American', v: 84.9 },
    { g: 'Hispanic/Latino', v: 65.4 },
    { g: 'American Indian/Alaskan Native', v: null },
    { g: 'All Students', v: 72.1, total: true }
  ], { max: 100, ref: 72.1, fmt: function (v) { return v.toFixed(1) + '%'; } }));

  show('gbars, three series', C.gbars([
    { g: 'Asian', ela: 61.9, math: 55.2, sci: 47.3 },
    { g: 'Hispanic/Latino', ela: 31.2, math: 17.6, sci: 25.7 },
    { g: 'American Indian/Alaskan Native', ela: null, math: null, sci: null }
  ], [
    { key: 'ela', name: 'ELA', color: 'var(--navy)' },
    { key: 'math', name: 'Math', color: 'var(--warm)' },
    { key: 'sci', name: 'Science', color: 'var(--sage)' }
  ], { max: 80 }));

  show('divbars centred on zero', C.divbars([
    { g: 'Two or More Races', v: -30.0 },
    { g: 'Asian', v: -6.7 },
    { g: 'Homeless', v: 5.0 }
  ], { max: 35, fmt: function (v) { return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + ' pts'; } }));
})();
</script>
</body>
</html>
```

- [ ] **Step 2: Write the three primitives**

Create `js/ams-charts.js`:

```javascript
/* AMS student data — chart primitives.
 *
 * Each function takes rows plus options and returns a detached DOM element for
 * the caller to append. They never read the document and never fetch data, so
 * the same primitive serves any section of data.html.
 *
 * A null value is a suppressed group (N<10). Every primitive renders that as
 * the words "not reported (N<10)" — never a zero-length bar, which would read
 * as a real zero.
 *
 * Ordered scales must also print their value as text: colour is never the only
 * channel carrying meaning.
 */
(function () {
  'use strict';
  var Core = window.AMSCore;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function notReported() {
    return el('span', 'bar-nd', 'not reported (N&lt;10)');
  }

  function pct(v) {
    return v == null ? '—' : (Math.round(v * 10) / 10) + '%';
  }

  /* ---- horizontal bars ------------------------------------------------- */
  function hbars(rows, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      if (r.header) {
        box.appendChild(el('div', 'bar-group-label', Core.escapeHtml(r.header)));
        return;
      }
      var row = el('div', 'bar-row' + (r.total || r.hi ? ' is-total' : ''));
      if (o.labelw) row.style.setProperty('--labelw', o.labelw);
      row.appendChild(el('div', 'bar-lab', Core.escapeHtml(r.g)));

      var track = el('div', 'bar-track');
      if (r.v == null) {
        track.appendChild(notReported());
      } else {
        var w = Math.max(0, Math.min(100, r.v / max * 100));
        var fill = el('div', 'bar-fill');
        fill.style.width = w + '%';
        if (o.colorFn) fill.style.background = o.colorFn(r);
        track.appendChild(fill);

        var val = el('span', 'bar-val', Core.escapeHtml(o.fmt ? o.fmt(r.v) : pct(r.v)));
        val.style.left = w + '%';
        track.appendChild(val);
      }
      if (o.ref != null) {
        var ref = el('div', 'bar-ref');
        ref.style.left = (o.ref / max * 100) + '%';
        track.appendChild(ref);
      }
      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- grouped bars, one line per series ------------------------------- */
  function gbars(rows, series, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      if (r.header) {
        box.appendChild(el('div', 'bar-group-label', Core.escapeHtml(r.header)));
        return;
      }
      var row = el('div', 'gb-row');
      if (o.labelw) row.style.setProperty('--labelw', o.labelw);
      row.appendChild(el('div', 'gb-lab', Core.escapeHtml(r.g)));

      var set = el('div', 'gb-set');
      series.forEach(function (s, i) {
        var line = el('div', 'gb-line');
        if (r[s.key] == null) {
          // Say it once per row, not once per series.
          if (i === 0) line.appendChild(notReported());
        } else {
          var w = Math.max(0, Math.min(100, r[s.key] / max * 100));
          var fill = el('div', 'gb-fill');
          fill.style.width = w + '%';
          fill.style.background = s.color;
          line.appendChild(fill);
          var val = el('span', 'gb-val', Core.escapeHtml(pct(r[s.key])));
          val.style.left = w + '%';
          line.appendChild(val);
        }
        set.appendChild(line);
      });
      row.appendChild(set);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- diverging bars centred on zero ---------------------------------- */
  function divbars(rows, opts) {
    var o = opts || {};
    var max = o.max || Math.max.apply(null, rows.map(function (r) { return Math.abs(r.v); })) * 1.15;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var row = el('div', 'div-row');
      row.style.setProperty('--labelw', o.labelw || '210px');
      row.appendChild(el('div', 'div-lab', Core.escapeHtml(r.g)));

      var track = el('div', 'div-track');
      track.appendChild(el('div', 'div-axis'));

      var w = Math.abs(r.v) / max * 50;
      var fill = el('div', 'div-fill');
      fill.style.width = w + '%';
      fill.style.background = r.v >= 0 ? (o.posColor || 'var(--navy)') : (o.negColor || 'var(--warm)');
      if (r.v >= 0) fill.style.left = '50%'; else fill.style.right = '50%';
      track.appendChild(fill);

      var val = el('div', 'div-val', Core.escapeHtml(
        o.fmt ? o.fmt(r.v) : ((r.v > 0 ? '+' : '') + r.v.toFixed(1))));
      if (r.v >= 0) { val.style.left = (50 + w) + '%'; val.style.paddingLeft = '.5rem'; }
      else { val.style.right = (50 + w) + '%'; val.style.paddingRight = '.5rem'; }
      track.appendChild(val);

      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars
  };
})();
```

- [ ] **Step 3: Check it renders**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=4000 --dump-dom http://localhost:8765/tools/preview-charts.html \
  2>/dev/null | grep -c "bar-fill\|gb-fill\|div-fill"
kill %1
```
Expected: a non-zero count. Then open `http://localhost:8765/tools/preview-charts.html` in a browser and confirm by eye: no rounded corners, no shadows, the suppressed rows read "not reported (N<10)", and every bar has its number printed beside it.

- [ ] **Step 4: Commit**

```bash
git add js/ams-charts.js tools/preview-charts.html
git commit -m "Add bar chart primitives

hbars, gbars and divbars, each taking rows plus options and returning a
detached element. They never touch the document or fetch data, so one
primitive serves any section of the page.

Suppressed groups render the words 'not reported (N<10)' rather than a
zero-length bar, which would read as a real zero. Every bar prints its
value as text so colour is never the only channel.

tools/preview-charts.html is a scratch page for checking primitives
against the house rules; it is not linked from the site."
```

---
### Task 5: Stack and dumbbell primitives

The i-Ready placement shape and the before/after shape.

**Files:**
- Modify: `js/ams-charts.js` — add two functions, extend the `window.AMSCharts` export
- Modify: `tools/preview-charts.html` — add two preview blocks

**Interfaces:**
- Consumes: `AMSCore.escapeHtml`, `AMSScales.placement`, `AMSScales.scaleStep`, and the private `el()` / `notReported()` helpers already in `js/ams-charts.js`.
- Produces: `AMSCharts.divstack(rows, opts)` and `AMSCharts.dumbbell(rows, opts)`, both returning an `HTMLElement`.

Shapes:

- `divstack(rows, opts)` — `rows` is `[{g, v: [5 numbers], n}]`, ordered mid/above, early-on, one-below, two-below, three+-below. `opts`: `{labelw}`. Rows align on the on-grade/below-grade boundary, so the split runs down the chart as a single axis.
- `dumbbell(rows, opts)` — `rows` is `[{g, a, b}]` where `a` is the earlier value. `opts`: `{max, labelw, aColor, bColor, fmt(a, b), unit}`.

- [ ] **Step 1: Write divstack and dumbbell**

Insert into `js/ams-charts.js` before the `window.AMSCharts = {` line:

```javascript
  /* ---- diverging stack, split at the on-grade boundary ----------------- */
  function divstack(rows, opts) {
    var o = opts || {};
    var S = window.AMSScales;

    // Every row shares one axis position, so the widest on-grade share and the
    // widest below-grade share together define the drawing width.
    var maxOn = 0, maxBelow = 0;
    rows.forEach(function (r) {
      var p = S.placement(r.v);
      if (p.onGrade > maxOn) maxOn = p.onGrade;
      if (p.below > maxBelow) maxBelow = p.below;
    });
    var span = maxOn + maxBelow;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var p = S.placement(r.v);
      var row = el('div', 'stack-row');
      row.style.setProperty('--labelw', o.labelw || '250px');
      row.appendChild(el('div', 'stack-lab', Core.escapeHtml(r.g)));

      var outer = el('div', 'stack-outer');
      var stack = el('div', 'stack');
      stack.style.marginLeft = ((maxOn - p.onGrade) / span * 100) + '%';
      stack.style.width = (p.total / span * 100) + '%';

      r.v.forEach(function (value, i) {
        if (!value) return;
        var seg = el('div', 'stack-seg');
        seg.style.flex = value + ' 0 0';
        seg.style.background = S.scaleStep(i);
        seg.setAttribute('title', r.g + ' — ' + window.AMSData.iLabels[i] + ': ' + value + '%');
        stack.appendChild(seg);
      });
      outer.appendChild(stack);

      var axis = el('div', 'stack-axis');
      axis.style.left = (maxOn / span * 100) + '%';
      outer.appendChild(axis);

      // On-grade share to the left of the axis, worst-case share to the right.
      var left = el('div', 'stack-end', p.onGrade + '%');
      left.style.right = (100 - (maxOn - p.onGrade) / span * 100) + '%';
      left.style.paddingRight = '.45rem';
      outer.appendChild(left);

      var right = el('div', 'stack-end stack-end--worst', r.v[4] + '%');
      right.style.left = ((maxOn + p.below) / span * 100) + '%';
      right.style.paddingLeft = '.45rem';
      outer.appendChild(right);

      row.appendChild(outer);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- dumbbell: two points on one track ------------------------------- */
  function dumbbell(rows, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var row = el('div', 'db-row');
      row.style.setProperty('--labelw', o.labelw || '210px');
      row.appendChild(el('div', 'db-lab-text', Core.escapeHtml(r.g)));

      var track = el('div', 'db-track');
      if (r.a == null || r.b == null) {
        track.appendChild(notReported());
        row.appendChild(track);
        box.appendChild(row);
        return;
      }

      var xa = r.a / max * 100, xb = r.b / max * 100;
      var moved = r.b > r.a ? ' is-worse' : (r.b < r.a ? ' is-better' : '');
      var line = el('div', 'db-line' + (o.neutral ? '' : moved));
      line.style.left = Math.min(xa, xb) + '%';
      line.style.width = Math.abs(xb - xa) + '%';
      track.appendChild(line);

      var d1 = el('div', 'db-dot');
      d1.style.left = xa + '%';
      d1.style.background = o.aColor || 'var(--line)';
      var d2 = el('div', 'db-dot');
      d2.style.left = xb + '%';
      d2.style.background = o.bColor || 'var(--navy)';
      track.appendChild(d1);
      track.appendChild(d2);

      var val = el('div', 'db-val', o.fmt
        ? o.fmt(r.a, r.b)
        : Core.escapeHtml(r.a + (o.unit || '') + ' → ') + '<b>' +
          Core.escapeHtml(r.b + (o.unit || '')) + '</b>');
      val.style.left = Math.max(xa, xb) + '%';
      track.appendChild(val);

      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }
```

Then extend the export:

```javascript
  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars,
    divstack: divstack,
    dumbbell: dumbbell
  };
```

- [ ] **Step 2: Add preview blocks**

Append inside the IIFE in `tools/preview-charts.html`, before its closing `})();`:

```javascript
  window.AMSData = { iLabels: ['Mid or above grade', 'Early on grade',
    'One grade below', 'Two grades below', 'Three+ grades below'] };

  show('divstack, split at the on-grade boundary', C.divstack([
    { g: 'Asian', v: [35, 21, 13, 8, 23], n: '104/107' },
    { g: 'White', v: [24, 24, 18, 6, 28], n: '215/218' },
    { g: 'Special Education', v: [8, 6, 10, 6, 70], n: '114/119' },
    { g: 'English Learner', v: [6, 8, 13, 9, 64], n: '173/177' }
  ], {}));

  show('dumbbell, before and after', C.dumbbell([
    { g: 'All Students', a: 8, b: 9 },
    { g: 'Students experiencing homelessness', a: 15, b: 22 },
    { g: 'Hispanic/Latino', a: 13, b: 12 },
    { g: 'Multilingual Learners', a: 15, b: 15 },
    { g: 'American Indian or Alaska Native', a: null, b: null }
  ], { max: 34, unit: '%', aColor: 'var(--line)', bColor: 'var(--navy)' }));
```

- [ ] **Step 3: Check both render**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=4000 --dump-dom http://localhost:8765/tools/preview-charts.html \
  2>/dev/null > /tmp/preview.html
kill %1
grep -c "stack-seg" /tmp/preview.html
grep -c "db-dot" /tmp/preview.html
```
Expected: at least 18 `stack-seg` and 8 `db-dot`.

Then open it in a browser and confirm: the four stack rows share one vertical axis line; Special Education and English Learner sit visibly further right than Asian; the suppressed dumbbell row reads "not reported (N<10)" with no dots; the "got worse" connector is terracotta and the "got better" one is sage.

- [ ] **Step 4: Commit**

```bash
git add js/ams-charts.js tools/preview-charts.html
git commit -m "Add stack and dumbbell primitives

divstack aligns every row on the on-grade/below-grade boundary so the
split reads as one axis down the chart, which is what makes the depth of
each group's gap comparable at a glance.

dumbbell colours its connector by direction of travel — terracotta for
worse, sage for better — and prints both values, so the direction never
depends on colour alone."
```

---

### Task 6: Sparkline, scatter and table primitives

The last three shapes: nine WSIF panels on one scale, the labelled scatters, and the data tables that serve as the charts' text alternative.

**Files:**
- Modify: `js/ams-charts.js` — add three functions, extend the export
- Modify: `tools/preview-charts.html` — add three preview blocks

**Interfaces:**
- Consumes: `AMSCore.escapeHtml`, `AMSScales.delta`, and the private `el()` helper.
- Produces: `AMSCharts.sparkgrid(rows, opts)`, `AMSCharts.scatter(opts)`, `AMSCharts.table(cols, rows, caption)`.

Shapes:

- `sparkgrid(rows, opts)` — `rows` is `[{g, v: [numbers]}]`. `opts`: `{lo, hi, gridlines: [numbers], labels: [strings], tolerance}`. Every panel shares the `lo`–`hi` scale, which is what makes the panels comparable.
- `scatter(opts)` — `{w, h, x0, x1, y0, y1, xTicks, yTicks, xSuffix, ySuffix, xLabel, yLabel, refX, refY, quadrants: [{text, at}], points: [{g, x, y, lp, color, ref}], aria}`. `lp` places the label: `'l'`, `'r'`, `'t'` or `'b'`.
- `table(cols, rows, caption)` — `cols` is `[string]`, `rows` is `[[cell]]` where a `null` cell renders "not reported".

- [ ] **Step 1: Write the three primitives**

Insert into `js/ams-charts.js` before the export:

```javascript
  /* ---- small multiples on one shared scale ----------------------------- */
  function sparkgrid(rows, opts) {
    var o = opts || {};
    var S = window.AMSScales;
    var lo = o.lo == null ? 0 : o.lo;
    var hi = o.hi == null ? 10 : o.hi;
    var labels = o.labels || [];
    var W = 100, H = 52;
    var grid = el('div', 'spark-grid');

    rows.forEach(function (r) {
      var panel = el('div', 'spark');
      panel.appendChild(el('h4', null, Core.escapeHtml(r.g)));

      var d = S.delta(r.v[0], r.v[r.v.length - 1], o.tolerance || 0);
      var mark = d.direction === 'flat' ? '→' : (d.direction === 'up' ? '▲' : '▼');
      panel.appendChild(el('div', 'spark-delta is-' + d.direction,
        mark + ' ' + (d.value > 0 ? '+' : '') + d.value.toFixed(2) + ' since ' +
        Core.escapeHtml(labels[0] || 'start')));

      var sx = function (i) { return 6 + i * (W - 12) / (r.v.length - 1); };
      var sy = function (v) { return H - 6 - (v - lo) / (hi - lo) * (H - 12); };

      var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
      (o.gridlines || []).forEach(function (v) {
        g += '<line x1="0" x2="' + W + '" y1="' + sy(v) + '" y2="' + sy(v) +
             '" stroke="var(--line-2)" stroke-width=".8" vector-effect="non-scaling-stroke"/>';
      });
      g += '<polyline points="' + r.v.map(function (v, i) { return sx(i) + ',' + sy(v); }).join(' ') +
           '" fill="none" stroke="var(--navy)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
      r.v.forEach(function (v, i) {
        var last = i === r.v.length - 1;
        g += '<circle cx="' + sx(i) + '" cy="' + sy(v) + '" r="' + (last ? 3.2 : 2.2) +
             '" fill="' + (last ? 'var(--navy)' : 'var(--faint)') +
             '" stroke="var(--cream)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
      });
      g += '</svg>';

      var svg = el('div', null, g);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', r.g + ': ' +
        labels.map(function (l, i) { return l + ' ' + r.v[i].toFixed(2); }).join(', '));
      panel.appendChild(svg);

      var xs = el('div', 'spark-x');
      labels.forEach(function (l) { xs.appendChild(el('span', null, Core.escapeHtml(l))); });
      panel.appendChild(xs);
      panel.appendChild(el('div', 'spark-now', r.v[r.v.length - 1].toFixed(2)));
      grid.appendChild(panel);
    });
    return grid;
  }

  /* ---- labelled scatter ------------------------------------------------ */
  function scatter(o) {
    var W = o.w || 720, H = o.h || 420;
    var mL = 58, mR = 26, mT = 18, mB = 52;
    var px = function (v) { return mL + (v - o.x0) / (o.x1 - o.x0) * (W - mL - mR); };
    var py = function (v) { return H - mB - (v - o.y0) / (o.y1 - o.y0) * (H - mT - mB); };

    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
            Core.escapeHtml(o.aria || '') + '">';

    (o.yTicks || []).forEach(function (v) {
      g += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + py(v) + '" y2="' + py(v) + '" stroke="var(--line-2)"/>';
      g += '<text x="' + (mL - 9) + '" y="' + (py(v) + 4) + '" text-anchor="end" font-size="10.5" fill="var(--faint)" font-variant-numeric="tabular-nums">' + v + (o.ySuffix || '') + '</text>';
    });
    (o.xTicks || []).forEach(function (v) {
      g += '<line y1="' + mT + '" y2="' + (H - mB) + '" x1="' + px(v) + '" x2="' + px(v) + '" stroke="var(--line-2)"/>';
      g += '<text y="' + (H - mB + 16) + '" x="' + px(v) + '" text-anchor="middle" font-size="10.5" fill="var(--faint)" font-variant-numeric="tabular-nums">' + v + (o.xSuffix || '') + '</text>';
    });

    if (o.refX != null) g += '<line x1="' + px(o.refX) + '" x2="' + px(o.refX) + '" y1="' + mT + '" y2="' + (H - mB) + '" stroke="var(--faint)" stroke-dasharray="4 4"/>';
    if (o.refY != null) g += '<line y1="' + py(o.refY) + '" y2="' + py(o.refY) + '" x1="' + mL + '" x2="' + (W - mR) + '" stroke="var(--faint)" stroke-dasharray="4 4"/>';

    (o.quadrants || []).forEach(function (q) {
      var east = q.at === 'ne' || q.at === 'se';
      var top = q.at === 'ne' || q.at === 'nw';
      g += '<text class="sc-quad" x="' + (east ? W - mR - 6 : mL + 6) + '" y="' + (top ? mT + 14 : H - mB - 8) +
           '" text-anchor="' + (east ? 'end' : 'start') + '">' + Core.escapeHtml(q.text) + '</text>';
    });

    g += '<text class="sc-axis" x="' + ((mL + W - mR) / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + Core.escapeHtml(o.xLabel) + '</text>';
    g += '<text class="sc-axis" transform="translate(14,' + ((mT + H - mB) / 2) + ') rotate(-90)" text-anchor="middle">' + Core.escapeHtml(o.yLabel) + '</text>';

    o.points.forEach(function (p) {
      var X = px(p.x), Y = py(p.y);
      g += '<circle cx="' + X + '" cy="' + Y + '" r="6.5" fill="' + (p.color || 'var(--navy)') +
           '" stroke="var(--cream)" stroke-width="2"/>';
      var lx = X + 12, ly = Y + 4, anchor = 'start';
      if (p.lp === 'l') { lx = X - 12; anchor = 'end'; }
      else if (p.lp === 't') { lx = X; ly = Y - 13; anchor = 'middle'; }
      else if (p.lp === 'b') { lx = X; ly = Y + 21; anchor = 'middle'; }
      g += '<text class="sc-point-label' + (p.ref ? ' is-ref' : '') + '" x="' + lx + '" y="' + ly +
           '" text-anchor="' + anchor + '">' + Core.escapeHtml(p.g) + '</text>';
    });

    g += '</svg>';
    return el('div', 'scatter-wrap', g);
  }

  /* ---- data table: the charts' text alternative ------------------------ */
  function table(cols, rows, caption) {
    var d = el('details', 'data-table');
    d.appendChild(el('summary', null, 'Data table — ' + Core.escapeHtml(caption)));

    var html = '<table><caption class="visually-hidden">' + Core.escapeHtml(caption) +
               '</caption><thead><tr>';
    cols.forEach(function (c) { html += '<th scope="col">' + Core.escapeHtml(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>';
      r.forEach(function (v, i) {
        var cell = v == null
          ? '<span class="bar-nd">not reported</span>'
          : Core.escapeHtml(String(v));
        html += i === 0 ? '<th scope="row">' + cell + '</th>' : '<td>' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    var scroll = el('div', 'data-table-scroll', html);
    d.appendChild(scroll);
    return d;
  }
```

Extend the export to all eight:

```javascript
  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars,
    divstack: divstack,
    dumbbell: dumbbell,
    sparkgrid: sparkgrid,
    scatter: scatter,
    table: table
  };
```

- [ ] **Step 2: Add the visually-hidden utility**

`table()` uses a `.visually-hidden` caption. Add to `css/style.css` beside the existing `.skip-link` rules:

```css
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}
```

- [ ] **Step 3: Add preview blocks**

Append inside the IIFE in `tools/preview-charts.html`:

```javascript
  show('sparkgrid, nine panels on one scale', C.sparkgrid([
    { g: 'All Students', v: [5.45, 4.25, 4.95] },
    { g: 'Students with Disabilities', v: [2.20, 1.83, 1.82] },
    { g: 'White', v: [6.43, 6.45, 6.80] }
  ], { lo: 1, hi: 8.5, gridlines: [2, 4, 6, 8],
       labels: ['2023', '2024', '2025'], tolerance: 0.15 }));

  show('scatter with quadrants', C.scatter({
    x0: 42, x1: 72, y0: 8, y1: 72,
    xTicks: [45, 50, 55, 60, 65, 70], yTicks: [10, 30, 50, 70],
    ySuffix: '%', xLabel: 'Median growth percentile →', yLabel: '% at Level 3 or 4 →',
    refX: 55, refY: 46.7,
    quadrants: [{ text: 'Ahead and pulling away', at: 'ne' },
                { text: 'Behind and falling further', at: 'sw' }],
    aria: 'ELA growth against proficiency by student group',
    points: [
      { g: 'Asian', x: 55, y: 61.9, lp: 't' },
      { g: 'Hispanic/Latino', x: 47, y: 31.2, lp: 'r' },
      { g: 'All Students', x: 55, y: 46.7, lp: 'b', ref: true, color: 'var(--faint)' }
    ]
  }));

  show('data table', C.table(['Group', 'ELA SGP', 'Math SGP'], [
    ['All Students', '55', '56'],
    ['American Indian/Alaskan Native', null, null]
  ], 'student growth, Alderwood 2024-25'));
```

- [ ] **Step 4: Check all three render**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=4000 --dump-dom http://localhost:8765/tools/preview-charts.html \
  2>/dev/null > /tmp/preview.html
kill %1
grep -c "spark-now" /tmp/preview.html
grep -c "sc-point-label" /tmp/preview.html
grep -c "data-table" /tmp/preview.html
```
Expected: 3, 3, and at least 2.

Then open in a browser and confirm: the three sparkline panels share one scale, so the Students-with-Disabilities line sits visibly at the bottom of its box while White sits near the top; the scatter's dashed crosshair meets at (55, 46.7); the table's suppressed row reads "not reported"; opening the `<details>` reveals it.

- [ ] **Step 5: Confirm nothing regressed**

Run: `node tools/test-core.js && node tools/test-scales.js && node tools/check-data.js && node tools/check-school-data.js`
Expected: four OK lines.

- [ ] **Step 6: Commit**

```bash
git add js/ams-charts.js tools/preview-charts.html css/style.css
git commit -m "Add sparkgrid, scatter and table primitives

sparkgrid holds every panel to one shared scale, which is the whole
point of small multiples: the nine WSIF groups are only comparable if
their axes are identical.

table() emits real th scope attributes and a visually-hidden caption. It
is the text alternative for the charts, not an appendix, so it has to
stand on its own for a screen reader."
```

---

### Task 7: The page shell and site-wide navigation

`data.html` exists, is reachable from every page, and renders its prose. No charts yet.

**Files:**
- Create: `data.html`
- Modify: 34 files carrying `class="main-nav"` — 7 top-level pages, `TEMPLATE.html`, and 26 intervention detail pages
- Modify: `index.html` — add a link in the "Also here" list

**Interfaces:**
- Consumes: nothing.
- Produces: `data.html` with a `<main id="main" class="container">` containing ten `<section>` elements, each with an `<h2>` and empty `<div class="chart" data-chart="<id>">` mount points. Tasks 8 and 9 fill the prose and wire the charts.

- [ ] **Step 1: Add the nav item everywhere**

The detail pages path their links with a `../../` prefix, so the prefix has to be derived per file rather than hardcoded. Run:

```bash
node -e '
const fs = require("fs"), cp = require("child_process");
const files = cp.execSync("grep -rl \x27class=\"main-nav\"\x27 --include=\x27*.html\x27 .")
  .toString().trim().split("\n");
let changed = 0;
files.forEach(f => {
  let s = fs.readFileSync(f, "utf8");
  if (s.includes(">Our Students<")) return;
  // Take the prefix from this page own Framework link, so detail pages
  // get ../../ and top-level pages get nothing.
  const m = /<li><a href="([^"]*)framework\.html"[^>]*>Framework<\/a><\/li>/.exec(s);
  if (!m) { console.error("no Framework link in " + f); process.exit(1); }
  s = s.replace(m[0], m[0] + "\n                <li><a href=\"" + m[1] + "data.html\">Our Students</a></li>");
  fs.writeFileSync(f, s);
  changed++;
});
console.log("added nav item to " + changed + " files");
'
```
Expected: `added nav item to 34 files`

- [ ] **Step 2: Verify every nav got it, with the right prefix**

Run:

```bash
grep -c '>Our Students<' $(grep -rl 'class="main-nav"' --include='*.html' .) | grep -v ':1$' || echo "all 34 have exactly one"
grep -h 'data.html">Our Students' interventions/tier1/modeling.html index.html
```
Expected: `all 34 have exactly one`, then two lines — the detail page's href starts `../../`, the index page's does not.

- [ ] **Step 3: Add the index link**

In `index.html`, inside the "Also here" `<ul class="features">`, after the Framework line:

```html
                <li><a href="data.html">Our Students</a> — what the August 2026 PD data says about which groups need a strategy this year</li>
```

- [ ] **Step 4: Create the page shell**

Create `data.html`. Copy the head, header, nav and footer structure from `library.html` exactly, changing the title, subtitle and the `active` nav item. The `<main>` holds ten sections:

```html
    <main id="main" class="container" tabindex="-1">
        <section class="hero">
            <h2>What the numbers say about who is thriving and who is not</h2>
            <p>Every figure on this page comes from the district data handout for the August 31 PD session — nothing is pulled from elsewhere. Where the handout suppressed a group for small size, it stays suppressed here. A few charts combine two of the handout's measures or convert a percentage to a headcount; each says so where it appears.</p>
            <div class="chart" data-chart="sources"></div>
        </section>

        <section><h2>The headline read</h2></section>
        <section><h2>Growth against achievement</h2></section>
        <section><h2>Where each group has moved, 2023 to 2025</h2></section>
        <section><h2>Who is reaching grade level</h2></section>
        <section><h2>How far below grade level, right now</h2></section>
        <section><h2>Growth by program — district figures</h2></section>
        <section><h2>Who is in the room</h2></section>
        <section><h2>Failing grades, and which way they moved</h2></section>
        <section><h2>What students say about school</h2></section>
        <section><h2>What this handout cannot tell you</h2></section>
    </main>
```

Scripts at the end, in dependency order:

```html
    <script src="data/interventions.js"></script>
    <script src="data/school-data.js"></script>
    <script src="js/ams-core.js"></script>
    <script src="js/ams-scales.js"></script>
    <script src="js/ams-charts.js"></script>
    <script src="js/ams-data.js"></script>
    <script src="js/ams-search.js"></script>
    <script src="js/main.js"></script>
```

`data/interventions.js` is included because `js/ams-search.js` needs it for ⌘K.

- [ ] **Step 5: Create a placeholder js/ams-data.js**

So the page does not 404 on a script:

```javascript
/* AMS student data — page composition. Finds each <div class="chart"
 * data-chart="id"> in data.html and fills it with the right primitive.
 */
(function () {
  'use strict';
  var data = window.AMSData, Core = window.AMSCore, C = window.AMSCharts;
  var mounts = document.querySelectorAll('.chart[data-chart]');
  if (!mounts.length) return;

  if (!data || !Core || !C) {
    Array.prototype.forEach.call(mounts, function (m) {
      m.textContent = "Student data didn't load. data/school-data.js probably has a typo — run: node tools/check-school-data.js";
    });
    return;
  }

  var render = {};   // Tasks 8 and 9 populate this, keyed by data-chart id.

  Array.prototype.forEach.call(mounts, function (mount) {
    var id = mount.getAttribute('data-chart');
    if (!render[id]) { return; }
    render[id](mount);
  });
})();
```

- [ ] **Step 6: Verify the page loads and every link resolves**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
for p in index start library departments framework tier1 tier2 tier3 data; do
  printf "%-12s " $p
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8765/$p.html
done
curl -s -o /dev/null -w "detail page: %{http_code}\n" http://localhost:8765/interventions/tier1/modeling.html
kill %1
```
Expected: `200` for all ten.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the Our Students page shell and site-wide nav item

data.html carries the ten section headings and the chart mount points;
prose and charts land in the next two commits.

The nav item went into all 34 files that carry the nav — the seven
top-level pages, TEMPLATE.html, and the 26 intervention detail pages.
The detail pages path their links with a ../../ prefix, so the script
took each page's prefix from its own Framework link rather than
assuming one."
```

---
### Task 8: Sections 1 to 5 — prose and charts

**Files:**
- Modify: `data.html` — fill the hero and sections 1 to 5
- Modify: `js/ams-data.js` — add the `render` entries for those sections

**Interfaces:**
- Consumes: `AMSCharts.hbars`, `.gbars`, `.divbars`, `.divstack`, `.sparkgrid`, `.scatter` (Tasks 4–6); `AMSScales.growthBand`, `.pctToCount`, `.parseAssessed` (Task 1); `window.AMSData` (Task 2).
- Produces: filled mount points `sources`, `growth-scatter-ela`, `growth-scatter-math`, `wsif-sparkgrid`, `prof-race-gender`, `prof-program`, `math-gap`, `iready-ela`, `iready-math`, `iready-count-ela`, `iready-count-math`, `iready-vs-sba`.

**Prose conversion rules.** The written analysis is copied verbatim from the standalone summary page. Three mechanical changes:

1. The summary wraps emphasis in `<b style='display:inline;color:var(--ink)'>`. Drop the inline style and use plain `<strong>`; `css/style.css:190` already styles `strong`.
2. `takeaway(html)` blocks become `<div class="takeaway"><b>What to do with this</b>…</div>`, written as markup.
3. `note plain` blocks become the site's existing `<div class="note">`.

Do not reword the analysis. If a sentence reads oddly after the markup change, leave it and raise it at review.

- [ ] **Step 1: Write the hero source line and section 1**

In `data.html`, the hero mount and the six verdict blocks. Section 1's full markup, as the pattern every later section follows:

```html
        <section>
            <h2>The headline read</h2>
            <p>Six groups stand out once every measure on the handout is laid side by side — three moving in a good direction, three that a strategy has to reach this year. Each claim below links back to the specific figures that support it.</p>

            <div class="verdict-grid">
                <div class="verdict verdict--up">
                    <div class="verdict-tag">Strongest position</div>
                    <h3>Asian students</h3>
                    <p>The only group that is at or near the top of every single measure on the handout — growth, proficiency, attendance, grades, and how students report feeling about school.</p>
                    <ul class="verdict-evid">
                        <li><span>Math growth (SGP)</span><span class="v is-pos">68 · high</span></li>
                        <li><span>ELA Level 3+</span><span class="v is-pos">61.9%</span></li>
                        <li><span>Attendance</span><span class="v is-pos">83.9%</span></li>
                        <li><span>WSIF 2025</span><span class="v is-pos">7.33</span></li>
                        <li><span>F/NC grades</span><span class="v is-pos">2%</span></li>
                        <li><span>Sense of belonging</span><span class="v is-pos">72%</span></li>
                    </ul>
                </div>
                <!-- Five more, copied from the standalone page's mk() calls:
                     Black/African American (up), Two or more races (watch),
                     Students with disabilities (down), English/multilingual
                     learners (down), Hispanic/Latino (down). Each keeps its
                     tag, heading, paragraph and six evidence rows verbatim;
                     'pos' and 'neg' become is-pos and is-neg. -->
            </div>

            <div class="note">
                <strong>One structural note before the charts.</strong> Nearly every group's WSIF score dropped in 2024 and recovered in 2025. That common shape means the 2024 dip is probably not nine separate stories. The groups worth talking about are the ones that broke the pattern — students with disabilities, who never recovered, and White students, who never dipped.
            </div>
        </section>
```

- [ ] **Step 2: Write the hero source-line renderer**

In `js/ams-data.js`, inside the `render` object:

```javascript
  render['sources'] = function (mount) {
    var html = '<div class="chart-legend">';
    data.meta.sources.forEach(function (s) {
      html += '<span class="chart-legend-item"><strong>' + Core.escapeHtml(s.k) +
              '</strong> ' + Core.escapeHtml(s.v) + '</span>';
    });
    mount.innerHTML = html + '</div>';
  };
```

- [ ] **Step 3: Write sections 2 and 3 prose and renderers**

Section 2 markup carries two mounts and its takeaway. The renderers:

```javascript
  // Growth against achievement. The crosshair is the school average, so each
  // quadrant reads relative to Alderwood rather than the state.
  function growthScatter(subject, key, avg) {
    var placements = {
      'Asian': 't', 'Black/African American': 'r', 'Hispanic/Latino': 'r',
      'Two or More Races': 'l', 'White': key === 'math' ? 't' : 'r',
      'Female': key === 'math' ? 'l' : 'r', 'Male': key === 'math' ? 'r' : 'l',
      'All Students': 'b'
    };
    var profRows = data.prof.race.concat(data.prof.gender);
    var points = [];
    Object.keys(placements).forEach(function (name) {
      var gr = null, pr = null;
      data.growthSchool.forEach(function (r) { if (r.g === name) gr = r; });
      profRows.forEach(function (r) { if (r.g === name) pr = r; });
      if (!gr || !pr || gr[key] == null || pr[key] == null) return;
      points.push({
        g: name.replace('Black/African American', 'Black/African Am.')
               .replace('Two or More Races', 'Two or more races'),
        x: gr[key], y: pr[key], lp: placements[name],
        ref: name === 'All Students',
        color: name === 'All Students' ? 'var(--faint)' : 'var(--navy)'
      });
    });

    return C.scatter({
      x0: 42, x1: 72, y0: 8, y1: 72,
      xTicks: [45, 50, 55, 60, 65, 70], yTicks: [10, 20, 30, 40, 50, 60],
      ySuffix: '%',
      xLabel: 'Median student growth percentile →',
      yLabel: '% at Level 3 or 4 →',
      refX: avg.x, refY: avg.y,
      quadrants: [
        { text: 'Ahead and pulling away', at: 'ne' },
        { text: 'Ahead but slowing', at: 'nw' },
        { text: 'Behind but catching up', at: 'se' },
        { text: 'Behind and falling further', at: 'sw' }
      ],
      aria: subject + ' growth against proficiency by student group. ' +
            'The full figures are in the data table at the end of this page.',
      points: points
    });
  }

  render['growth-scatter-ela'] = function (m) {
    m.appendChild(growthScatter('English Language Arts', 'ela', { x: 55, y: 46.7 }));
  };
  render['growth-scatter-math'] = function (m) {
    m.appendChild(growthScatter('Math', 'math', { x: 56, y: 32.3 }));
  };

  render['wsif-sparkgrid'] = function (m) {
    m.appendChild(C.sparkgrid(data.wsif, {
      lo: 1, hi: 8.5, gridlines: [2, 4, 6, 8],
      labels: data.wsifYears, tolerance: 0.15
    }));
  };
```

- [ ] **Step 4: Write sections 4 and 5 renderers**

```javascript
  var SUBJECTS = [
    { key: 'ela', name: 'ELA', color: 'var(--navy)' },
    { key: 'math', name: 'Math', color: 'var(--warm)' },
    { key: 'sci', name: 'Science', color: 'var(--sage)' }
  ];

  render['prof-race-gender'] = function (m) {
    var rows = [{ header: 'Race / ethnicity' }].concat(data.prof.race,
               [{ header: 'Gender' }], data.prof.gender);
    m.appendChild(C.gbars(rows, SUBJECTS, { max: 80, labelw: '190px' }));
    m.appendChild(subjectLegend());
  };

  render['prof-program'] = function (m) {
    m.appendChild(C.gbars(data.prof.prog, SUBJECTS, { max: 80, labelw: '210px' }));
    m.appendChild(subjectLegend());
  };

  function subjectLegend() {
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML = SUBJECTS.map(function (s) {
      return '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:' +
             s.color + '"></span>' + s.name + '</span>';
    }).join('');
    return l;
  }

  // How far math trails ELA. Sorted so the widest shortfall leads.
  render['math-gap'] = function (m) {
    var rows = data.prof.race.concat(data.prof.gender, data.prof.prog)
      .filter(function (r) { return r.ela != null && r.math != null; })
      .map(function (r) {
        return { g: r.g, v: Math.round((r.math - r.ela) * 10) / 10, ela: r.ela, math: r.math };
      })
      .sort(function (a, b) { return a.v - b.v; });

    m.appendChild(C.divbars(rows, {
      max: 42, labelw: '215px',
      posColor: 'var(--navy)', negColor: 'var(--warm)',
      fmt: function (v) { return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + ' pts'; }
    }));
  };

  render['iready-ela'] = function (m) { m.appendChild(irStack('ela')); };
  render['iready-math'] = function (m) { m.appendChild(irStack('math')); };

  function irStack(subject) {
    var wrap = document.createElement('div');
    wrap.appendChild(C.divstack(data.iready[subject], {}));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML = data.iLabels.map(function (label, i) {
      return '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:' +
             window.AMSScales.scaleStep(i) + '"></span>' + Core.escapeHtml(label) + '</span>';
    }).join('');
    wrap.appendChild(l);
    return wrap;
  }

  // The same rows as headcounts. Gender rows contain every student in the
  // school and would dwarf the planning groups; the two smallest race groups
  // are 3 and 5 students, where a count is not meaningful.
  var COUNT_EXCLUDE = /Native Hawaiian|American Indian|Female|Male/;

  function irCounts(subject) {
    return data.iready[subject]
      .filter(function (r) { return !COUNT_EXCLUDE.test(r.g); })
      .map(function (r) {
        var n = window.AMSScales.parseAssessed(r.n);
        return { g: r.g, v: window.AMSScales.pctToCount(r.v[4], n.assessed),
                 pct: r.v[4], n: n.assessed };
      })
      .sort(function (a, b) { return b.v - a.v; });
  }

  render['iready-count-ela'] = function (m) { m.appendChild(irCountBars('ela')); };
  render['iready-count-math'] = function (m) { m.appendChild(irCountBars('math')); };

  function irCountBars(subject) {
    return C.hbars(irCounts(subject), {
      max: 120, labelw: '200px',
      fmt: function (v) { return '≈' + v + ' students'; },
      colorFn: function (r) {
        return r.v >= 80 ? 'var(--scale-bel-3)'
             : (r.v >= 55 ? 'var(--scale-bel-2)' : 'var(--navy)');
      }
    });
  }

  // Two different tests with different cut scores. Not a growth measure —
  // what is worth reading is which groups they disagree about.
  render['iready-vs-sba'] = function (m) {
    var pairs = [['Asian', 61.9, 56], ['Black or African American', 42.5, 51],
      ['Hispanic or Latino', 31.2, 29], ['Two or more Races', 63.3, 48],
      ['White', 54.8, 48], ['Female', 49.7, 48], ['Male', 43.5, 38],
      ['English Learner', 11.9, 14], ['Special Education', 12.2, 14]];
    var rows = pairs.map(function (p) {
      return { g: p[0], a: p[1], b: p[2], v: Math.round((p[2] - p[1]) * 10) / 10 };
    }).sort(function (x, y) { return y.v - x.v; });

    m.appendChild(C.divbars(rows, {
      max: 18, labelw: '215px',
      posColor: 'var(--sage)', negColor: 'var(--warm)',
      fmt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' pts'; }
    }));
  };
```

- [ ] **Step 5: Verify sections 1 to 5 render**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=5000 --dump-dom http://localhost:8765/data.html 2>/dev/null > /tmp/data.html
kill %1
for c in verdict-evid sc-point-label spark-now gb-fill div-fill stack-seg; do
  printf "%-18s %s\n" "$c" "$(grep -c $c /tmp/data.html)"
done
grep -c 'class="chart" data-chart="[^"]*"></div>' /tmp/data.html
```
Expected: non-zero for each class, and the last count is the number of mounts still empty — should be only the section 6 to 10 ids.

- [ ] **Step 6: Commit**

```bash
git add data.html js/ams-data.js
git commit -m "Fill sections 1-5 of the Our Students page

Prose is markup and charts are generated, so the analysis stands without
JavaScript. The verdict blocks are the left-rule idiom the callouts
already use rather than the cards they were.

The i-Ready headcount charts exclude the gender rows, which contain every
student in the school and would dwarf the planning groups, and the two
race groups of 3 and 5 students, where a count is not meaningful."
```

---

### Task 9: Sections 6 to 10 — prose, charts and tables

**Files:**
- Modify: `data.html` — fill sections 6 to 10
- Modify: `js/ams-data.js` — add the remaining `render` entries

**Interfaces:**
- Consumes: `AMSCharts.hbars`, `.dumbbell`, `.divbars`, `.scatter`, `.table`; `AMSScales.growthBand`, `.attendanceBand`; `window.AMSData`.
- Produces: filled mount points `growth-prog-ela`, `growth-prog-math`, `plan-compare`, `attendance-all`, `attendance-scatter-race`, `attendance-scatter-prog`, `fnc-prog`, `fnc-race`, `fnc-scatter`, `survey-dumbbell`, `gender-gap`, `all-tables`.

**Prose conversion rules** are the same three as Task 8, repeated here because tasks may be read out of order: drop the inline `style` from `<b>` and use plain `<strong>`; write `takeaway()` calls as `<div class="takeaway"><b>What to do with this</b>…</div>`; write `note plain` blocks as `<div class="note">`. Do not reword the analysis.

Section 6 must carry the district caveat as visible markup, not only a footnote:

```html
            <div class="note">
                <strong>This chart is district data, not Alderwood data.</strong> It is the one page of the handout that changes unit of analysis. Treat it as context for the program groups, and do not quote it as a school figure.
            </div>
```

- [ ] **Step 1: Write the section 6 and 7 renderers**

```javascript
  var GROWTH_COLORS = {
    low: 'var(--scale-bel-3)', typical: 'var(--scale-bel-1)', high: 'var(--navy)'
  };

  function growthProgram(key) {
    var rows = data.growthDistrict
      .filter(function (r) { return r[key] != null; })
      .slice()
      .sort(function (a, b) { return b[key] - a[key]; })
      .map(function (r) { return { g: r.g, v: r[key], flag: r.flag }; });

    var wrap = document.createElement('div');
    wrap.appendChild(C.hbars(rows, {
      max: 80, labelw: '210px',
      fmt: function (v) { return v.toFixed(0); },
      colorFn: function (r) { return GROWTH_COLORS[window.AMSScales.growthBand(r.v)]; }
    }));

    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--scale-bel-3)"></span>Low growth (1–33)</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--scale-bel-1)"></span>Typical growth (34–59)</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>High growth (60–99)</span>';
    wrap.appendChild(l);
    return wrap;
  }

  render['growth-prog-ela'] = function (m) { m.appendChild(growthProgram('ela')); };
  render['growth-prog-math'] = function (m) { m.appendChild(growthProgram('math')); };

  // Section 504 beside students with disabilities. Two groups with formal
  // support plans; the growth rows are district-wide and say so.
  render['plan-compare'] = function (m) {
    var rows = [
      { g: 'ELA, % at Level 3+ · Alderwood', a: 12.2, b: 53.3 },
      { g: 'Math, % at Level 3+ · Alderwood', a: 8.7, b: 31.1 },
      { g: 'Science, % at Level 3+ · Alderwood', a: 19.6, b: 41.7 },
      { g: 'Regular attendance · Alderwood', a: 58.2, b: 63.8 },
      { g: 'ELA median growth (SGP) · District', a: 40.0, b: 63.0 },
      { g: 'Math median growth (SGP) · District', a: 50.0, b: 53.0 }
    ];
    m.appendChild(C.dumbbell(rows, {
      max: 95, labelw: '250px', neutral: true,
      aColor: 'var(--warm)', bColor: 'var(--navy)',
      fmt: function (a, b) {
        return '<b>' + b + '</b> Section 504 · ' + a + ' students with disabilities';
      }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Section 504</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--warm)"></span>Students with disabilities</span>';
    m.appendChild(l);
  };

  var ATT_COLORS = {
    critical: 'var(--scale-bel-3)', low: 'var(--scale-bel-1)',
    mid: 'var(--navy)', high: 'var(--sage)'
  };

  render['attendance-all'] = function (m) {
    var rows = [{ header: 'All students' }].concat(data.att.all,
      [{ header: 'Gender' }], data.att.gender,
      [{ header: 'Race / ethnicity' }], data.att.race,
      [{ header: 'Program and characteristic' }], data.att.prog);

    m.appendChild(C.hbars(rows, {
      max: 100, ref: 72.1, labelw: '215px',
      fmt: function (v) { return v.toFixed(1) + '%'; },
      colorFn: function (r) {
        return r.total ? 'var(--navy-d)' : ATT_COLORS[window.AMSScales.attendanceBand(r.v)];
      }
    }));
    var ref = document.createElement('div');
    ref.className = 'bar-ref-label';
    ref.textContent = 'All Students · 72.1%';
    m.appendChild(ref);
  };

  function attendanceScatter(points, aria) {
    return C.scatter({
      x0: 34, x1: 92, y0: 5, y1: 70,
      xTicks: [40, 50, 60, 70, 80, 90], yTicks: [10, 20, 30, 40, 50, 60],
      xSuffix: '%', ySuffix: '%',
      xLabel: 'Regular attendance →', yLabel: '% at ELA Level 3 or 4 →',
      refX: 72.1, refY: 46.7, aria: aria,
      points: points
    });
  }

  render['attendance-scatter-race'] = function (m) {
    m.appendChild(attendanceScatter([
      { g: 'Asian', x: 83.9, y: 61.9, lp: 'l' },
      { g: 'Black/African Am.', x: 84.9, y: 42.5, lp: 'l' },
      { g: 'Hispanic/Latino', x: 65.4, y: 31.2, lp: 'l' },
      { g: 'Two or more races', x: 68.8, y: 63.3, lp: 't' },
      { g: 'White', x: 68.9, y: 54.8, lp: 'l' },
      { g: 'Female', x: 72.6, y: 49.7, lp: 'r' },
      { g: 'Male', x: 71.7, y: 43.5, lp: 'b' },
      { g: 'All students', x: 72.1, y: 46.7, lp: 'l', ref: true, color: 'var(--faint)' }
    ], 'Attendance against ELA proficiency by race, ethnicity and gender'));
  };

  render['attendance-scatter-prog'] = function (m) {
    m.appendChild(attendanceScatter([
      { g: 'English learners', x: 64.8, y: 11.9, lp: 'r', color: 'var(--warm)' },
      { g: 'Non-ELL', x: 75.3, y: 60.6, lp: 't', color: 'var(--warm)' },
      { g: 'Students w/ disabilities', x: 58.2, y: 12.2, lp: 'l', color: 'var(--warm)' },
      { g: 'Without disabilities', x: 75.4, y: 54.1, lp: 'r', color: 'var(--warm)' },
      { g: 'Low-income', x: 66.8, y: 35.4, lp: 'l', color: 'var(--warm)' },
      { g: 'Non-low income', x: 78.5, y: 61.1, lp: 'r', color: 'var(--warm)' },
      { g: 'Homeless', x: 38.5, y: 15.0, lp: 'r', color: 'var(--warm)' },
      { g: 'Non-homeless', x: 73.4, y: 47.7, lp: 'l', color: 'var(--warm)' },
      { g: 'Section 504', x: 63.8, y: 53.3, lp: 'l', color: 'var(--warm)' }
    ], 'Attendance against ELA proficiency by program and characteristic'));
  };
```

- [ ] **Step 2: Write the section 8 and 9 renderers**

```javascript
  function fncDumbbell(rows) {
    return C.dumbbell(rows, {
      max: 34, labelw: '200px',
      aColor: 'var(--line)', bColor: 'var(--navy)',
      fmt: function (a, b) {
        var d = b - a;
        var cls = d > 0 ? 'is-worse' : (d < 0 ? 'is-better' : '');
        var note = d === 0 ? 'no change' : (d > 0 ? '+' : '') + d + ' pts';
        return a + '% → <b>' + b + '%</b> <span class="' + cls + '">' + note + '</span>';
      }
    });
  }

  render['fnc-prog'] = function (m) { m.appendChild(fncDumbbell(data.fnc.prog)); };
  render['fnc-race'] = function (m) { m.appendChild(fncDumbbell(data.fnc.race)); };

  // A group high on both axes is passing the test and failing the class.
  render['fnc-scatter'] = function (m) {
    m.appendChild(C.scatter({
      x0: 0, x1: 25, y0: 5, y1: 70,
      xTicks: [0, 5, 10, 15, 20, 25], yTicks: [10, 20, 30, 40, 50, 60],
      xSuffix: '%', ySuffix: '%',
      xLabel: '% of grades that were F or No Credit →',
      yLabel: '% at ELA Level 3 or 4 →',
      refX: 9, refY: 46.7,
      quadrants: [{ text: 'Passing the test, failing the class', at: 'ne' }],
      aria: 'Failing grade rate against ELA proficiency by group',
      points: [
        { g: 'Asian', x: 2, y: 61.9, lp: 'r' },
        { g: 'Two or more races', x: 13, y: 63.3, lp: 'l' },
        { g: 'White', x: 8, y: 54.8, lp: 'l' },
        { g: 'All students', x: 9, y: 46.7, lp: 'b', ref: true, color: 'var(--faint)' },
        { g: 'Black/African Am.', x: 10, y: 42.5, lp: 'r' },
        { g: 'Free/reduced meals', x: 14, y: 35.4, lp: 'r', color: 'var(--warm)' },
        { g: 'Hispanic/Latino', x: 12, y: 31.2, lp: 'l' },
        { g: 'Homeless', x: 22, y: 15.0, lp: 'l', color: 'var(--warm)' },
        { g: 'Special education', x: 12, y: 12.2, lp: 'r', color: 'var(--warm)' },
        { g: 'Multilingual learners', x: 15, y: 11.9, lp: 'r', color: 'var(--warm)' }
      ]
    }));
  };

  render['survey-dumbbell'] = function (m) {
    var rows = data.survey.rows.map(function (r) {
      return { g: r.g, a: r.rel, b: r.belong };
    });
    m.appendChild(C.dumbbell(rows, {
      max: 100, labelw: '215px', neutral: true,
      aColor: 'var(--navy)', bColor: 'var(--gold)',
      fmt: function (a, b) { return '<b>' + a + '%</b> teachers · ' + b + '% belonging'; }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Teacher–student relationships</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--gold)"></span>Sense of belonging</span>';
    m.appendChild(l);
  };

  // Every measure on one axis. Girls' figure minus boys'.
  render['gender-gap'] = function (m) {
    var rows = [
      { g: 'ELA median growth (SGP)', f: 58.5, mm: 51.0 },
      { g: 'ELA, % at Level 3+', f: 49.7, mm: 43.5 },
      { g: 'Regular attendance', f: 72.6, mm: 71.7 },
      { g: 'Math median growth (SGP)', f: 53.0, mm: 57.5 },
      { g: 'Math, % at Level 3+', f: 29.2, mm: 35.1 },
      { g: 'Sense of belonging', f: 62.0, mm: 68.0 },
      { g: 'Science, % at Level 3+', f: 37.2, mm: 44.9 },
      { g: 'Teacher–student relationships', f: 44.0, mm: 55.0 }
    ].map(function (r) {
      return { g: r.g, v: Math.round((r.f - r.mm) * 10) / 10 };
    }).sort(function (a, b) { return b.v - a.v; });

    m.appendChild(C.divbars(rows, {
      max: 13, labelw: '230px',
      posColor: 'var(--navy)', negColor: 'var(--warm)',
      fmt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1); }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Girls ahead</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--warm)"></span>Boys ahead</span>';
    m.appendChild(l);
  };
```

- [ ] **Step 3: Write the section 10 tables renderer**

```javascript
  // Nine tables. These are the text alternative for every chart above, so
  // they carry the full transcription, suppressions included.
  render['all-tables'] = function (m) {
    function num(v) { return v == null ? null : String(Math.round(v * 10) / 10); }
    function pctS(v) { return v == null ? null : (Math.round(v * 10) / 10) + '%'; }

    m.appendChild(C.table(['Group', 'ELA SGP', 'Math SGP'],
      data.growthSchool.map(function (r) { return [r.g, num(r.ela), num(r.math)]; }),
      'student growth, Alderwood 2024–25'));

    m.appendChild(C.table(['Group', 'ELA SGP', 'Math SGP'],
      data.growthDistrict.map(function (r) { return [r.g, num(r.ela), num(r.math)]; }),
      'student growth, Edmonds School District 2024–25'));

    m.appendChild(C.table(['Group', 'ELA L3+', 'Math L3+', 'Science L3+'],
      data.prof.race.concat(data.prof.gender, data.prof.prog).map(function (r) {
        return [r.g, pctS(r.ela), pctS(r.math), pctS(r.sci)];
      }), 'proficiency (Level 3 or 4), 2024–25'));

    m.appendChild(C.table(['Group'].concat(data.wsifYears, ['Change']),
      data.wsif.map(function (r) {
        var d = window.AMSScales.delta(r.v[0], r.v[2]);
        return [r.g, r.v[0].toFixed(2), r.v[1].toFixed(2), r.v[2].toFixed(2),
                (d.value > 0 ? '+' : '') + d.value.toFixed(2)];
      }), 'WSIF final score'));

    m.appendChild(C.table(['Group', 'Regular attendance'],
      data.att.all.concat(data.att.gender, data.att.race, data.att.prog)
        .map(function (r) { return [r.g, pctS(r.v)]; }),
      'attendance, 2024–25'));

    ['ela', 'math'].forEach(function (subject) {
      m.appendChild(C.table(
        ['Group', 'Assessed'].concat(data.iLabels),
        data.iready[subject].map(function (r) {
          return [r.g, r.n].concat(r.v.map(function (v) { return v + '%'; }));
        }),
        'i-Ready ' + (subject === 'ela' ? 'reading' : 'math') + ', Spring 2026'));
    });

    m.appendChild(C.table(['Group', 'S2 24–25', 'S2 25–26', 'Change'],
      data.fnc.prog.concat(data.fnc.race).map(function (r) {
        if (r.a == null) return [r.g, null, null, null];
        var d = r.b - r.a;
        return [r.g, r.a + '%', r.b + '%', (d > 0 ? '+' : '') + d + ' pts'];
      }), 'F / No-Credit grades'));

    m.appendChild(C.table(['Group', 'Teacher relationships', 'Sense of belonging'],
      [['All students', data.survey.overall.rel + '%', data.survey.overall.belong + '%']]
        .concat(data.survey.rows.map(function (r) {
          return [r.g, r.rel == null ? null : r.rel + '%',
                       r.belong == null ? null : r.belong + '%'];
        })),
      'student survey, Spring 2026'));
  };
```

- [ ] **Step 4: Verify every mount is filled**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=6000 --dump-dom http://localhost:8765/data.html 2>/dev/null > /tmp/data.html
kill %1
echo "empty mounts: $(grep -c 'data-chart="[^"]*"></div>' /tmp/data.html)"
echo "data tables:  $(grep -c 'class="data-table"' /tmp/data.html)"
```
Expected: `empty mounts: 0` and `data tables: 9`.

- [ ] **Step 5: Commit**

```bash
git add data.html js/ams-data.js
git commit -m "Fill sections 6-10 of the Our Students page

The district caveat on the growth-by-program charts is visible markup on
the chart rather than a footnote, because that page of the handout is
the one place the unit of analysis changes and quoting it as a school
figure would be wrong.

The nine data tables carry the full transcription including every
suppression. They are the text alternative for the charts above, not an
appendix, so they have to be complete."
```

---

### Task 10: Accessibility pass and final verification

**Files:**
- Modify: `data.html` — add a data-table link under each chart
- Modify: `js/ams-charts.js` — add `role="img"` and `aria-label` where missing

**Interfaces:**
- Consumes: everything from Tasks 1 to 9.
- Produces: no new API.

- [ ] **Step 1: Give every chart a link to its table**

Under each `<div class="chart">` in `data.html`, add a link to the matching table in section 10. Give each `<details class="data-table">` an id via the caption, and link like:

```html
            <p class="chart-link"><a href="#table-attendance">See these figures as a table</a></p>
```

Add the id in `table()` by slugifying the caption. In `js/ams-charts.js`, inside `table()`, after `var d = el('details', 'data-table');`:

```javascript
    d.id = 'table-' + caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
```

Opening a closed `<details>` when linked to is browser-native in current Chrome, Safari and Firefox; no script needed.

- [ ] **Step 2: Confirm no chart depends on colour alone**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=6000 --dump-dom http://localhost:8765/data.html 2>/dev/null > /tmp/data.html
kill %1
echo "bars without a printed value:"
node -e '
const fs=require("fs");
const h=fs.readFileSync("/tmp/data.html","utf8");
const fills=(h.match(/class="bar-fill"/g)||[]).length;
const vals=(h.match(/class="bar-val"/g)||[]).length;
console.log("  bar-fill "+fills+" vs bar-val "+vals+(fills===vals?"  ok":"  MISMATCH"));
const gf=(h.match(/class="gb-fill"/g)||[]).length;
const gv=(h.match(/class="gb-val"/g)||[]).length;
console.log("  gb-fill  "+gf+" vs gb-val  "+gv+(gf===gv?"  ok":"  MISMATCH"));'
echo "suppressed rows rendered as text: $(grep -c 'bar-nd' /tmp/data.html)"
echo "charts with an aria-label:        $(grep -c 'role="img"' /tmp/data.html)"
```
Expected: both counts match, `bar-nd` is non-zero, and `role="img"` is non-zero.

- [ ] **Step 3: Check the page has no console errors**

Run:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --virtual-time-budget=6000 --enable-logging=stderr --dump-dom \
  http://localhost:8765/data.html 2>&1 >/dev/null | grep -iE "error|uncaught" | grep -v "favicon" || echo "no console errors"
kill %1
```
Expected: `no console errors`

- [ ] **Step 4: Run the whole test suite**

Run: `node tools/test-core.js && node tools/test-scales.js && node tools/check-data.js && node tools/check-school-data.js`
Expected: four OK lines.

- [ ] **Step 5: Confirm the house rules survived**

Run: `grep -nE "border-radius|box-shadow|prefers-color-scheme" css/style.css | grep -v "back-to-top"`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Link every chart to its data table and verify the page

The charts' values were reachable only by hovering with a mouse. Rather
than build focus management for eight chart types, each chart now links
to its table in section 10 and carries an aria-label, which makes the
tables the real text alternative instead of an appendix.

Verified: every bar prints its value, every suppressed group renders as
text, no console errors, all four test files pass, and no radius,
shadow or dark-mode block entered the stylesheet."
```

---

## Self-review notes

Checked against the spec on 2026-08-31:

- **Spec coverage.** Every spec section maps to a task: architecture → Tasks 1, 2, 4–7; palette → Task 3; chart inventory → Tasks 4–6, 8, 9; accessibility → Task 10; testing → Tasks 1, 2, 10. The spec's "out of scope" list is not implemented anywhere, as intended.
- **One correction to the spec.** The spec said the nav item lands on "all six" existing pages. It is 34 files — seven top-level pages, `TEMPLATE.html`, and 26 intervention detail pages, which path their nav with a `../../` prefix. Task 7 derives the prefix per file rather than assuming one.
- **Naming consistency.** `AMSScales`, `AMSCharts`, `AMSData` are used identically in every task. The dumbbell option is `neutral` in Tasks 5, 9. The scatter label option is `lp` throughout. `scaleStep` returns a `var(--scale-…)` string in Tasks 1, 5, 8.
- **One deliberate omission.** The spec's data model table names a `grp` field on `growthSchool` rows. Nothing in the plan reads it; it is kept in the transcription because the handout groups its rows that way, and dropping it would lose information the next person might need.
