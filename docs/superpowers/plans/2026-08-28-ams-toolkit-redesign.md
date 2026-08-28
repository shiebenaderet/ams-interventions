# AMS Toolkit Navigation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the AMS MTSS toolkit three doors into one library — global search, a filterable index of all 26 interventions, and a problem-first triage tool — all rendering from a single hand-editable data file.

**Architecture:** One data file (`data/interventions.js`) sets `window.AMS` and becomes the source of truth for every view, including the existing tier pages. Pure query/filter/sort/ladder logic lives in `js/ams-core.js`, which touches no DOM and is unit-tested with plain `node`. Thin view modules (`ams-library.js`, `ams-search.js`, `ams-triage.js`) do DOM wiring only. Pages declare `data-root` on `<body>` so scripts resolve paths correctly from any directory depth.

**Tech Stack:** Plain HTML, CSS, ES5-compatible JavaScript. No build step, no package manager, no runtime dependencies. Node is used **only** to run optional validation and unit tests — never to build or serve the site.

**Spec:** `docs/superpowers/specs/2026-08-28-ams-toolkit-redesign-design.md`

## Global Constraints

- **No build step.** The site must continue to work by double-clicking `index.html` from the filesystem (`file://`). Never introduce `fetch()` of a `.json` file — it is blocked over `file://`.
- **No runtime dependencies.** No npm packages, no CDN scripts, no frameworks. Node's built-in modules only, and only in `tools/`.
- **No `package.json`.** Tests and checks run as `node tools/<file>.js`.
- **ES5-compatible browser JS.** No optional chaining, no `??`, no arrow functions in shipped `js/` files — the existing codebase targets broad school-device compatibility.
- **Preserve existing accessibility patterns**: `.skip-link` on every page, `<main id="main" tabindex="-1">`, filter controls as `<button>` with `aria-pressed`, visible focus states.
- **Preserve per-tier theming**: `body.tier-1` / `tier-2` / `tier-3` drives `--tier-accent`. Never hardcode tier colors in new CSS.
- **26 interventions exactly.** 10 Tier 1, 8 Tier 2, 8 Tier 3.
- **Intervention `id` equals its detail-page filename without `.html`.**
- Commit after every task.

---

## File Structure

**Created:**
- `data/interventions.js` — the 26 intervention records and 10 problem records. Hand-edited. Sets `window.AMS`.
- `js/ams-core.js` — pure functions: matching, filtering, sorting, ladder assembly. No DOM, no globals beyond `window.AMSCore`.
- `js/ams-library.js` — renders the Library table and its controls.
- `js/ams-search.js` — the global search palette.
- `js/ams-triage.js` — renders the triage problem list and escalation ladder.
- `js/ams-cards.js` — renders intervention cards on tier pages from data.
- `library.html` — All Interventions.
- `start.html` — Find a Strategy (triage).
- `framework.html` — MTSS explainer, moved off the homepage.
- `tools/load.js` — loads a browser global into node via `vm`, for tests.
- `tools/check-data.js` — data integrity validator.
- `tools/test-core.js` — unit tests for `js/ams-core.js`.

**Modified:**
- `index.html` — becomes the landing page.
- `tier1.html`, `tier2.html`, `tier3.html` — cards render from data.
- `TEMPLATE.html` — new nav + `data-root`.
- All 26 `interventions/**/*.html` — new nav + `data-root` + search script.
- `css/style.css` — styles for the new views.
- `README.md`, `QUICKSTART.md`, `CONTENT-STATUS.md`.

**Responsibility boundary:** `ams-core.js` never touches `document`. View modules never contain filtering or matching logic. This is what makes the logic testable without a DOM or any dependency.

---

# Phase 1 — Data layer and Library

### Task 1: Validation harness (red)

Build the validator **before** the data file so it starts red and proves it actually detects problems.

**Files:**
- Create: `tools/load.js`
- Create: `tools/check-data.js`

**Interfaces:**
- Produces: `loadBrowserGlobal(relPath, globalName)` → the value a browser script assigned to `window.<globalName>`. Used by `tools/check-data.js` and `tools/test-core.js`.

- [ ] **Step 1: Write the loader**

Create `tools/load.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Runs a browser-style script (one that assigns to `window.X`) in an
// isolated context and returns that global. Lets node read the same
// files the browser loads, with no bundler and no dependencies.
function loadBrowserGlobal(relPath, globalName) {
  const abs = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(abs)) {
    throw new Error('Missing file: ' + relPath);
  }
  const src = fs.readFileSync(abs, 'utf8');
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.runInNewContext(src, sandbox);
  if (!(globalName in sandbox)) {
    throw new Error(relPath + ' did not define window.' + globalName);
  }
  return sandbox[globalName];
}

module.exports = { loadBrowserGlobal };
```

- [ ] **Step 2: Write the validator**

Create `tools/check-data.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadBrowserGlobal } = require('./load');

const ROOT = path.join(__dirname, '..');
const TIERS = [1, 2, 3];
const DEPT_STATUS = ['must-have', 'using', 'exploring'];
const EXPECTED_COUNT = 26;

const failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }

const AMS = loadBrowserGlobal('data/interventions.js', 'AMS');
const interventions = AMS.interventions || [];
const problems = AMS.problems || [];

check(interventions.length === EXPECTED_COUNT,
  'Expected ' + EXPECTED_COUNT + ' interventions, found ' + interventions.length);

const seenIds = {};
const byId = {};

interventions.forEach(function (iv, i) {
  const at = 'interventions[' + i + '] (' + (iv.id || '?') + ')';

  check(typeof iv.id === 'string' && iv.id.length > 0, at + ': missing id');
  check(!seenIds[iv.id], at + ': duplicate id "' + iv.id + '"');
  seenIds[iv.id] = true;
  byId[iv.id] = iv;

  check(typeof iv.name === 'string' && iv.name.length > 0, at + ': missing name');
  check(typeof iv.description === 'string' && iv.description.length > 0, at + ': missing description');
  check(typeof iv.bestFor === 'string' && iv.bestFor.length > 0, at + ': missing bestFor');
  check(TIERS.indexOf(iv.tier) !== -1, at + ': tier must be 1, 2 or 3 (got ' + iv.tier + ')');
  check(Number.isInteger(iv.rating) && iv.rating >= 1 && iv.rating <= 5,
    at + ': rating must be an integer 1-5 (got ' + iv.rating + ')');
  check(Array.isArray(iv.categories) && iv.categories.length > 0, at + ': categories must be a non-empty array');
  check(Array.isArray(iv.problems), at + ': problems must be an array');

  check(typeof iv.url === 'string' && iv.url.length > 0, at + ': missing url');
  if (typeof iv.url === 'string') {
    check(fs.existsSync(path.join(ROOT, iv.url)), at + ': url does not exist on disk -> ' + iv.url);
    const expected = iv.url.split('/').pop().replace(/\.html$/, '');
    check(expected === iv.id, at + ': id "' + iv.id + '" does not match filename "' + expected + '"');
    check(iv.url.indexOf('interventions/tier' + iv.tier + '/') === 0,
      at + ': url directory does not match tier ' + iv.tier + ' -> ' + iv.url);
  }

  check(Array.isArray(iv.departments), at + ': departments must be an array');
  (iv.departments || []).forEach(function (d) {
    check(typeof d.name === 'string' && d.name.length > 0, at + ': department missing name');
    check(DEPT_STATUS.indexOf(d.status) !== -1,
      at + ': department "' + d.name + '" has invalid status "' + d.status + '"');
  });
});

// Tier distribution
const counts = { 1: 0, 2: 0, 3: 0 };
interventions.forEach(function (iv) { if (counts[iv.tier] !== undefined) counts[iv.tier]++; });
check(counts[1] === 10, 'Expected 10 Tier 1 interventions, found ' + counts[1]);
check(counts[2] === 8, 'Expected 8 Tier 2 interventions, found ' + counts[2]);
check(counts[3] === 8, 'Expected 8 Tier 3 interventions, found ' + counts[3]);

// Problems
const problemIds = {};
problems.forEach(function (p, i) {
  const at = 'problems[' + i + '] (' + (p.id || '?') + ')';
  check(typeof p.id === 'string' && p.id.length > 0, at + ': missing id');
  check(!problemIds[p.id], at + ': duplicate problem id "' + p.id + '"');
  problemIds[p.id] = true;
  check(typeof p.label === 'string' && p.label.length > 0, at + ': missing label');
  check(typeof p.shortLabel === 'string' && p.shortLabel.length > 0, at + ': missing shortLabel');
  check(Array.isArray(p.steps) && p.steps.length > 0, at + ': steps must be a non-empty array');

  (p.steps || []).forEach(function (s, j) {
    const sAt = at + '.steps[' + j + ']';
    check(TIERS.indexOf(s.tier) !== -1, sAt + ': tier must be 1, 2 or 3');
    check(typeof s.framing === 'string' && s.framing.length > 0, sAt + ': missing framing');

    const hasIvs = Array.isArray(s.interventions);
    const hasRef = !!s.referral;
    check(hasIvs !== hasRef, sAt + ': must have exactly one of interventions or referral');

    if (hasIvs) {
      s.interventions.forEach(function (id) {
        check(!!byId[id], sAt + ': unknown intervention id "' + id + '"');
      });
    }
    if (hasRef) {
      check(typeof s.referral.who === 'string' && s.referral.who.length > 0, sAt + ': referral missing who');
      check(typeof s.referral.detail === 'string' && s.referral.detail.length > 0, sAt + ': referral missing detail');
    }
  });
});

// Cross-reference: every problem an intervention claims must exist
interventions.forEach(function (iv) {
  (iv.problems || []).forEach(function (pid) {
    check(!!problemIds[pid], 'interventions (' + iv.id + '): unknown problem id "' + pid + '"');
  });
});

if (failures.length) {
  console.error('\nFAIL - ' + failures.length + ' problem(s):\n');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}
console.log('OK - ' + interventions.length + ' interventions, ' + problems.length + ' problems, all checks passed.');
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node tools/check-data.js`
Expected: FAIL — `Missing file: data/interventions.js`

This confirms the validator detects a missing data file rather than passing vacuously.

- [ ] **Step 4: Commit**

```bash
git add tools/load.js tools/check-data.js
git commit -m "Add data validation harness for the intervention data file"
```

---

### Task 2: Extract the 26 intervention records (green)

**Files:**
- Create: `data/interventions.js`
- Reference (read-only): `tier1.html`, `tier2.html`, `tier3.html`

**Interfaces:**
- Produces: `window.AMS.interventions` — array of 26 records matching the schema in the spec. Every later task reads this.

- [ ] **Step 1: Extract records programmatically, do not retype**

Records must be derived from the existing tier-page markup so nothing is invented or dropped. Write a throwaway extraction script and inspect its output before saving:

```bash
node -e '
const fs = require("fs");
[1,2,3].forEach(function (t) {
  const html = fs.readFileSync("tier" + t + ".html", "utf8");
  const cards = html.split("<a href=\"interventions/").slice(1);
  cards.forEach(function (c) {
    const url  = "interventions/" + c.split("\"")[0];
    const tags = (c.match(/data-tags=\"([^\"]*)\"/) || [,""])[1];
    const h3   = (c.match(/<h3>([^<]*)<\/h3>/) || [,""])[1];
    const stars= (c.match(/class=\"rating\">([^<]*)</) || [,""])[1];
    const desc = (c.match(/class=\"description\">([^<]*)</) || [,""])[1];
    const best = (c.match(/<strong>Best for:<\/strong>\s*([^<]*)</) || [,""])[1];
    const depts= (c.match(/class=\"dept-tags\">([\s\S]*?)<\/div>/) || [,""])[1];
    console.log(JSON.stringify({ tier: t, url: url, tags: tags, h3: h3, stars: stars,
      desc: desc.trim(), best: best.trim(),
      depts: (depts.match(/<span class=\"dept-tag\">([^<]*)<\/span>/g) || [])
        .map(function (s) { return s.replace(/<[^>]*>/g, ""); }) }));
  });
});
' | head -40
```

Read the output. The `h3` field contains a leading emoji plus the name — split them into `icon` and `name`. `stars` (`★★★★☆`) converts to an integer by counting `★`. A dept string like `Math (must-have)` becomes `{ "name": "Math", "status": "must-have" }`; `Science (exploring)` becomes `status: "exploring"`; a bare `Social Studies` becomes `status: "using"`.

- [ ] **Step 2: Write the data file**

Create `data/interventions.js`. Keep it hand-editable — this is the file Mr. B maintains, so formatting matters. Leave `problems: []` on every record for now; Task 8 fills them in.

```js
/* AMS Interventions — single source of truth.
 *
 * To add an intervention:
 *   1. Add a record below (keep the list alphabetical within its tier).
 *   2. Create the detail page at the path in `url`.
 *   3. Run: node tools/check-data.js
 *
 * id      must match the detail page filename without ".html"
 * tier    1, 2 or 3
 * rating  integer 1-5 (stars are rendered from this)
 * status  "must-have" | "using" | "exploring"
 */
window.AMS = {
  interventions: [
    {
      id: 'organizational-systems',
      name: 'Organizational Systems',
      icon: '📋',
      tier: 1,
      url: 'interventions/tier1/organizational-systems.html',
      rating: 4,
      categories: ['organization'],
      description: 'Consistent structures that help all students track assignments, materials, and deadlines.',
      bestFor: 'Executive functioning, time management',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'Electives', status: 'using' }
      ],
      problems: []
    }
    // ... 25 more, same shape, extracted from the tier pages
  ],

  problems: []
};
```

All 26 must be present: 10 Tier 1, 8 Tier 2, 8 Tier 3.

- [ ] **Step 3: Run the validator to verify it passes**

Run: `node tools/check-data.js`
Expected: `OK - 26 interventions, 0 problems, all checks passed.`

If it reports a url that does not exist or an id/filename mismatch, fix the record — do not relax the check.

- [ ] **Step 4: Verify no drift from the current pages**

Every card on the tier pages must have exactly one matching record:

```bash
node -e '
const { loadBrowserGlobal } = require("./tools/load");
const fs = require("fs");
const AMS = loadBrowserGlobal("data/interventions.js", "AMS");
const ids = AMS.interventions.map(function (i) { return i.id; }).sort();
const linked = [];
[1,2,3].forEach(function (t) {
  const html = fs.readFileSync("tier" + t + ".html", "utf8");
  (html.match(/interventions\/tier[123]\/[a-z0-9-]+\.html/g) || []).forEach(function (u) {
    const id = u.split("/").pop().replace(".html", "");
    if (linked.indexOf(id) === -1) linked.push(id);
  });
});
linked.sort();
const missing = linked.filter(function (i) { return ids.indexOf(i) === -1; });
const extra   = ids.filter(function (i) { return linked.indexOf(i) === -1; });
console.log("linked on tier pages:", linked.length, "| in data:", ids.length);
console.log("missing from data:", missing);
console.log("in data but not linked:", extra);
'
```

Expected: `linked on tier pages: 26 | in data: 26`, and both lists empty.

- [ ] **Step 5: Commit**

```bash
git add data/interventions.js
git commit -m "Extract 26 intervention records into data/interventions.js"
```

---

### Task 3: Pure query logic

**Files:**
- Create: `js/ams-core.js`
- Create: `tools/test-core.js`

**Interfaces:**
- Consumes: `window.AMS` from Task 2.
- Produces: `window.AMSCore` with:
  - `matchesQuery(intervention, query)` → `boolean`
  - `filterInterventions(list, filters)` → `Array` — `filters` is `{ tier, category, department, query }`, any key optional, `null`/absent means no constraint. Extra keys on the object are ignored, so a view may pass its whole state object. Task 4 relies on both the `query` key and that tolerance.
  - `sortInterventions(list, key, dir)` → new sorted `Array` — `key` is `'name' | 'tier' | 'rating'`, `dir` is `'asc' | 'desc'`
  - `starString(rating)` → `string`

- [ ] **Step 1: Write the failing tests**

Create `tools/test-core.js`:

```js
'use strict';
const assert = require('assert');
const { loadBrowserGlobal } = require('./load');
const Core = loadBrowserGlobal('js/ams-core.js', 'AMSCore');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { console.error('FAIL: ' + name + '\n  ' + e.message); process.exitCode = 1; }
}

const sample = [
  { id: 'chunking', name: 'Chunking', tier: 2, rating: 4,
    categories: ['instruction'], description: 'Break complex tasks into smaller steps.',
    bestFor: 'Executive functioning, task completion',
    departments: [{ name: 'Math', status: 'using' }] },
  { id: 'modeling', name: 'Modeling', tier: 1, rating: 5,
    categories: ['instruction'], description: 'Gradual release of responsibility.',
    bestFor: 'Skill development',
    departments: [{ name: 'Math', status: 'must-have' }, { name: 'Electives', status: 'using' }] },
  { id: 'crisis-intervention', name: 'Crisis Intervention', tier: 3, rating: 5,
    categories: ['behavior'], description: 'Safety plan for students in crisis.',
    bestFor: 'Safety concerns',
    departments: [{ name: 'Science', status: 'exploring' }] }
];

test('matchesQuery finds by name, case-insensitively', function () {
  assert.strictEqual(Core.matchesQuery(sample[0], 'chunk'), true);
  assert.strictEqual(Core.matchesQuery(sample[0], 'CHUNK'), true);
});

test('matchesQuery finds by description and bestFor', function () {
  assert.strictEqual(Core.matchesQuery(sample[0], 'smaller steps'), true);
  assert.strictEqual(Core.matchesQuery(sample[0], 'executive'), true);
});

test('matchesQuery finds by department name', function () {
  assert.strictEqual(Core.matchesQuery(sample[1], 'electives'), true);
});

test('matchesQuery rejects a non-match', function () {
  assert.strictEqual(Core.matchesQuery(sample[0], 'wraparound'), false);
});

test('matchesQuery treats an empty query as a match', function () {
  assert.strictEqual(Core.matchesQuery(sample[0], ''), true);
  assert.strictEqual(Core.matchesQuery(sample[0], '   '), true);
});

test('filterInterventions with no filters returns everything', function () {
  assert.strictEqual(Core.filterInterventions(sample, {}).length, 3);
});

test('filterInterventions by tier', function () {
  const r = Core.filterInterventions(sample, { tier: 2 });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].id, 'chunking');
});

test('filterInterventions by category', function () {
  assert.strictEqual(Core.filterInterventions(sample, { category: 'instruction' }).length, 2);
});

test('filterInterventions by department', function () {
  assert.strictEqual(Core.filterInterventions(sample, { department: 'Math' }).length, 2);
});

test('filterInterventions combines filters with AND', function () {
  const r = Core.filterInterventions(sample, { tier: 1, department: 'Math' });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].id, 'modeling');
});

test('filterInterventions returns empty when nothing matches', function () {
  assert.strictEqual(Core.filterInterventions(sample, { tier: 3, department: 'Math' }).length, 0);
});

test('filterInterventions applies the query key', function () {
  const r = Core.filterInterventions(sample, { query: 'chunk' });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].id, 'chunking');
});

test('filterInterventions ignores unknown keys so a view can pass its state', function () {
  const r = Core.filterInterventions(sample, { tier: 1, sortKey: 'name', sortDir: 'asc' });
  assert.strictEqual(r.length, 1);
});

test('sortInterventions by name ascending', function () {
  const r = Core.sortInterventions(sample, 'name', 'asc');
  assert.deepStrictEqual(r.map(function (i) { return i.name; }),
    ['Chunking', 'Crisis Intervention', 'Modeling']);
});

test('sortInterventions by rating descending, ties broken by name', function () {
  const r = Core.sortInterventions(sample, 'rating', 'desc');
  assert.deepStrictEqual(r.map(function (i) { return i.name; }),
    ['Crisis Intervention', 'Modeling', 'Chunking']);
});

test('sortInterventions does not mutate its input', function () {
  const before = sample.map(function (i) { return i.id; });
  Core.sortInterventions(sample, 'name', 'desc');
  assert.deepStrictEqual(sample.map(function (i) { return i.id; }), before);
});

test('starString renders filled and empty stars', function () {
  assert.strictEqual(Core.starString(4), '★★★★☆');
  assert.strictEqual(Core.starString(5), '★★★★★');
});

console.log('OK - ' + passed + ' core tests passed.');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tools/test-core.js`
Expected: FAIL — `Missing file: js/ams-core.js`

- [ ] **Step 3: Write the implementation**

Create `js/ams-core.js`. ES5 only — no arrow functions, no optional chaining.

```js
/* AMS Interventions — pure logic. No DOM access lives in this file, which
 * is what lets tools/test-core.js run it under plain node. */
(function () {
  'use strict';

  function haystack(iv) {
    var parts = [iv.name, iv.description, iv.bestFor];
    (iv.departments || []).forEach(function (d) { parts.push(d.name); });
    (iv.categories || []).forEach(function (c) { parts.push(c); });
    return parts.join(' ').toLowerCase();
  }

  function matchesQuery(iv, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return true;
    return haystack(iv).indexOf(q) !== -1;
  }

  function filterInterventions(list, filters) {
    var f = filters || {};
    return list.filter(function (iv) {
      if (f.tier && iv.tier !== f.tier) return false;
      if (f.category && (iv.categories || []).indexOf(f.category) === -1) return false;
      if (f.department) {
        var hit = (iv.departments || []).some(function (d) { return d.name === f.department; });
        if (!hit) return false;
      }
      if (f.query && !matchesQuery(iv, f.query)) return false;
      return true;
    });
  }

  function sortInterventions(list, key, dir) {
    var sign = dir === 'desc' ? -1 : 1;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'rating' || key === 'tier') { av = a[key]; bv = b[key]; }
      else { av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); }
      if (av < bv) return -1 * sign;
      if (av > bv) return 1 * sign;
      // Stable, predictable tiebreak so equal ratings read alphabetically.
      var an = (a.name || '').toLowerCase(), bn = (b.name || '').toLowerCase();
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
  }

  function starString(rating) {
    var n = Math.max(0, Math.min(5, rating || 0));
    return new Array(n + 1).join('★') + new Array(5 - n + 1).join('☆');
  }

  window.AMSCore = {
    matchesQuery: matchesQuery,
    filterInterventions: filterInterventions,
    sortInterventions: sortInterventions,
    starString: starString
  };
})();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/test-core.js`
Expected: `OK - 17 core tests passed.`

- [ ] **Step 5: Commit**

```bash
git add js/ams-core.js tools/test-core.js
git commit -m "Add pure query, filter and sort logic with node unit tests"
```

---

### Task 4: The Library page

**Files:**
- Create: `library.html`
- Create: `js/ams-library.js`
- Modify: `css/style.css` (append a Library section)

**Interfaces:**
- Consumes: `window.AMS`, `window.AMSCore` from Tasks 2–3.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create the page shell**

Create `library.html`, copying the header, nav, skip link, and footer from `tier1.html` so it matches existing structure. Key parts:

```html
<body class="tier-1" data-root="">
    <a class="skip-link" href="#main">Skip to main content</a>
    <!-- header and nav copied from tier1.html; nav gets a Library link -->
    <main id="main" class="container" tabindex="-1">
        <section>
            <h2>All Interventions</h2>
            <p>Every intervention in the toolkit. Filter by tier, category, or department, or sort by name or rating.</p>

            <div class="search-container">
                <input type="text" id="libSearch" class="search-box"
                       placeholder="Filter interventions…" aria-label="Filter interventions">
            </div>

            <div class="filter-tags" role="group" aria-label="Filter by tier">
                <button type="button" class="tag active" aria-pressed="true" data-filter="tier" data-value="">All tiers</button>
                <button type="button" class="tag" aria-pressed="false" data-filter="tier" data-value="1">Tier 1</button>
                <button type="button" class="tag" aria-pressed="false" data-filter="tier" data-value="2">Tier 2</button>
                <button type="button" class="tag" aria-pressed="false" data-filter="tier" data-value="3">Tier 3</button>
            </div>

            <div class="filter-tags" role="group" aria-label="Filter by department" id="deptFilters"></div>

            <p class="lib-count" id="libCount" role="status" aria-live="polite"></p>

            <div class="lib-scroll">
                <table class="lib-table">
                    <thead>
                        <tr>
                            <th><button type="button" class="lib-sort" data-sort="name">Intervention</button></th>
                            <th><button type="button" class="lib-sort" data-sort="tier">Tier</button></th>
                            <th>Category</th>
                            <th>Used by</th>
                            <th><button type="button" class="lib-sort" data-sort="rating">Rating</button></th>
                        </tr>
                    </thead>
                    <tbody id="libBody"></tbody>
                </table>
            </div>
        </section>
    </main>
    <script src="data/interventions.js"></script>
    <script src="js/ams-core.js"></script>
    <script src="js/ams-library.js"></script>
    <script src="js/main.js"></script>
</body>
```

- [ ] **Step 2: Write the view module**

Create `js/ams-library.js`:

```js
(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  if (!data || !Core) return;

  var body = document.getElementById('libBody');
  var count = document.getElementById('libCount');
  var search = document.getElementById('libSearch');
  if (!body) return;

  var state = { tier: null, category: null, department: null, query: '',
                sortKey: 'name', sortDir: 'asc' };

  function departments() {
    var seen = {}, out = [];
    data.interventions.forEach(function (iv) {
      (iv.departments || []).forEach(function (d) {
        if (!seen[d.name]) { seen[d.name] = true; out.push(d.name); }
      });
    });
    return out.sort();
  }

  function buildDeptFilters() {
    var host = document.getElementById('deptFilters');
    if (!host) return;
    var html = '<button type="button" class="tag active" aria-pressed="true" ' +
               'data-filter="department" data-value="">All departments</button>';
    departments().forEach(function (name) {
      html += '<button type="button" class="tag" aria-pressed="false" ' +
              'data-filter="department" data-value="' + name + '">' + name + '</button>';
    });
    host.innerHTML = html;
  }

  function render() {
    var rows = Core.filterInterventions(data.interventions, state);
    rows = Core.sortInterventions(rows, state.sortKey, state.sortDir);

    body.innerHTML = rows.map(function (iv) {
      var depts = (iv.departments || []).map(function (d) {
        var cls = d.status === 'must-have' ? 'dept-tag dept-tag--must' : 'dept-tag';
        var label = d.status === 'must-have' ? d.name + ' ★' : d.name;
        return '<span class="' + cls + '" title="' + d.status + '">' + label + '</span>';
      }).join('');
      return '<tr>' +
        '<td class="lib-name"><a href="' + iv.url + '">' +
          (iv.icon ? iv.icon + ' ' : '') + iv.name + '</a></td>' +
        '<td><span class="tier-chip t' + iv.tier + '">Tier ' + iv.tier + '</span></td>' +
        '<td>' + (iv.categories || []).join(', ') + '</td>' +
        '<td><span class="depts">' + depts + '</span></td>' +
        '<td class="lib-stars">' + Core.starString(iv.rating) + '</td>' +
      '</tr>';
    }).join('');

    if (count) {
      count.textContent = rows.length === data.interventions.length
        ? 'Showing all ' + rows.length + ' interventions'
        : 'Showing ' + rows.length + ' of ' + data.interventions.length + ' interventions';
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-filter]') : null;
    if (btn) {
      var key = btn.getAttribute('data-filter');
      var raw = btn.getAttribute('data-value');
      state[key] = raw === '' ? null : (key === 'tier' ? parseInt(raw, 10) : raw);
      var group = btn.parentNode.querySelectorAll('[data-filter="' + key + '"]');
      Array.prototype.forEach.call(group, function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
      return;
    }
    var sortBtn = e.target.closest ? e.target.closest('.lib-sort') : null;
    if (sortBtn) {
      var k = sortBtn.getAttribute('data-sort');
      if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = k; state.sortDir = k === 'rating' ? 'desc' : 'asc'; }
      render();
    }
  });

  if (search) {
    search.addEventListener('input', function () { state.query = search.value; render(); });
  }

  buildDeptFilters();
  render();
})();
```

- [ ] **Step 3: Add the styles**

Append to `css/style.css`. Reuse existing tokens — do not hardcode tier colors:

```css
/* ===== Library ===== */
.lib-scroll { overflow-x: auto; }
.lib-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.lib-table th { text-align: left; }
.lib-name a { color: var(--text-dark); font-weight: 600; text-decoration: none; }
.lib-name a:hover { color: var(--tier-accent); text-decoration: underline; }
.lib-stars { color: #B86E00; white-space: nowrap; font-variant-numeric: tabular-nums; }
.lib-count { font-size: 0.9rem; color: var(--text-light); margin: 0.5rem 0 1rem; }
.lib-sort {
    background: none; border: 0; padding: 0; font: inherit;
    color: inherit; cursor: pointer; text-transform: inherit; letter-spacing: inherit;
}
.lib-sort::after { content: " ↕"; opacity: 0.5; }
.tier-chip {
    font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.5rem;
    border-radius: 10px; white-space: nowrap;
}
.tier-chip.t1 { background: rgba(74,144,226,0.15); color: #1F5B99; }
.tier-chip.t2 { background: rgba(245,166,35,0.18); color: #92610A; }
.tier-chip.t3 { background: rgba(126,211,33,0.18); color: #4A7D0E; }
.dept-tag--must { background: #FFF3CD; color: #7A5600; font-weight: 600; }
```

- [ ] **Step 4: Verify in a browser**

Open `library.html` **by double-clicking it in Finder** (not via a server) — this is the `file://` check that matters.

Confirm:
- 26 rows render, and the count reads "Showing all 26 interventions".
- Clicking "Tier 2" narrows to 8 rows and the count updates.
- Clicking a department narrows further; tier + department combine.
- Typing "chunk" in the filter box leaves one row.
- Clicking "Rating" sorts 5-star first; clicking again reverses.
- Clicking an intervention name opens its detail page.
- No errors in the browser console.

- [ ] **Step 5: Commit**

```bash
git add library.html js/ams-library.js css/style.css
git commit -m "Add Library page rendering all 26 interventions from data"
```

---

### Task 5: Tier pages render from data

**Files:**
- Create: `js/ams-cards.js`
- Modify: `tier1.html`, `tier2.html`, `tier3.html`

**Interfaces:**
- Consumes: `window.AMS`, `window.AMSCore`.
- Produces: nothing consumed later.

- [ ] **Step 1: Write the card renderer**

Create `js/ams-cards.js`:

```js
(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  var host = document.querySelector('.intervention-list[data-tier]');
  if (!data || !Core || !host) return;

  var tier = parseInt(host.getAttribute('data-tier'), 10);
  var root = document.body.getAttribute('data-root') || '';

  var list = Core.sortInterventions(
    Core.filterInterventions(data.interventions, { tier: tier }), 'name', 'asc');

  host.innerHTML = list.map(function (iv) {
    var depts = (iv.departments || []).map(function (d) {
      var label = d.status === 'using' ? d.name : d.name + ' (' + d.status + ')';
      return '<span class="dept-tag">' + label + '</span>';
    }).join('');
    return '<a href="' + root + iv.url + '" class="intervention-card" data-tags="' +
             (iv.categories || []).join(' ') + '">' +
      '<h3>' + (iv.icon ? iv.icon + ' ' : '') + iv.name + '</h3>' +
      '<div class="rating">' + Core.starString(iv.rating) + '</div>' +
      '<p class="description">' + iv.description + '</p>' +
      '<p><strong>Best for:</strong> ' + iv.bestFor + '</p>' +
      '<div class="dept-tags">' + depts + '</div>' +
    '</a>';
  }).join('');
})();
```

- [ ] **Step 2: Replace the hardcoded cards**

In each of `tier1.html`, `tier2.html`, `tier3.html`:

1. Add `data-root=""` to `<body>`.
2. Replace the entire contents of `<div class="intervention-list">…</div>` — every hardcoded `<a class="intervention-card">` — with nothing, and add the tier attribute:
   ```html
   <div class="intervention-list" data-tier="1"></div>
   ```
   (Use `data-tier="2"` and `data-tier="3"` on the respective pages.)
3. Before `</body>`, add the scripts ahead of the existing `js/main.js`:
   ```html
   <script src="data/interventions.js"></script>
   <script src="js/ams-core.js"></script>
   <script src="js/ams-cards.js"></script>
   <script src="js/main.js"></script>
   ```

Leave all surrounding prose — "About Tier 1", "Characteristics of Quality Tier 1", "Implementation Tips" — untouched.

- [ ] **Step 3: Verify against what the pages showed before**

```bash
git stash && node -e '
const fs=require("fs");
[1,2,3].forEach(function(t){
  const h=fs.readFileSync("tier"+t+".html","utf8");
  const n=(h.match(/class="intervention-card"/g)||[]).length;
  console.log("tier"+t+" cards before:", n);
});' && git stash pop
```

Expected before: tier1 10, tier2 8, tier3 8.

Now open each tier page from `file://` and confirm the same counts render, with the same names, star ratings, and department badges. The existing search box and tag filters must still work — they operate on `.intervention-card` elements, which now exist after render.

- [ ] **Step 4: Commit**

```bash
git add js/ams-cards.js tier1.html tier2.html tier3.html
git commit -m "Render tier page cards from the shared data file"
```

---

**PHASE 1 CHECKPOINT.** The site is shippable here: drift is gone and the Library exists. Review before continuing.

---

# Phase 2 — Global search

### Task 6: Search result assembly

**Files:**
- Modify: `js/ams-core.js`
- Modify: `tools/test-core.js`

**Interfaces:**
- Produces: `AMSCore.searchAll(data, query)` → `{ interventions: Array, departments: Array<string> }`. Returns at most 8 interventions. An empty or whitespace query returns empty arrays (the palette shows a hint instead of all 26).

- [ ] **Step 1: Write the failing tests**

Append to `tools/test-core.js`, before the final `console.log`:

```js
const searchData = {
  interventions: sample,
  problems: []
};

test('searchAll returns matching interventions', function () {
  const r = Core.searchAll(searchData, 'chunk');
  assert.strictEqual(r.interventions.length, 1);
  assert.strictEqual(r.interventions[0].id, 'chunking');
});

test('searchAll returns matching department names', function () {
  const r = Core.searchAll(searchData, 'elect');
  assert.deepStrictEqual(r.departments, ['Electives']);
});

test('searchAll returns empty for a blank query', function () {
  const r = Core.searchAll(searchData, '   ');
  assert.strictEqual(r.interventions.length, 0);
  assert.strictEqual(r.departments.length, 0);
});

test('searchAll returns empty arrays when nothing matches', function () {
  const r = Core.searchAll(searchData, 'zzzzz');
  assert.strictEqual(r.interventions.length, 0);
  assert.strictEqual(r.departments.length, 0);
});

test('searchAll caps interventions at 8', function () {
  const many = [];
  for (let i = 0; i < 20; i++) {
    many.push({ id: 'x' + i, name: 'Match ' + i, tier: 1, rating: 3,
                categories: ['instruction'], description: 'd', bestFor: 'b', departments: [] });
  }
  assert.strictEqual(Core.searchAll({ interventions: many, problems: [] }, 'match').interventions.length, 8);
});

test('searchAll does not duplicate department names', function () {
  const r = Core.searchAll({ interventions: [
    { id: 'a', name: 'A', tier: 1, rating: 3, categories: [], description: '', bestFor: '',
      departments: [{ name: 'Math', status: 'using' }] },
    { id: 'b', name: 'B', tier: 1, rating: 3, categories: [], description: '', bestFor: '',
      departments: [{ name: 'Math', status: 'must-have' }] }
  ], problems: [] }, 'math');
  assert.deepStrictEqual(r.departments, ['Math']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tools/test-core.js`
Expected: FAIL — `Core.searchAll is not a function`

- [ ] **Step 3: Implement**

In `js/ams-core.js`, add before the `window.AMSCore = {...}` assignment:

```js
  var MAX_RESULTS = 8;

  function searchAll(data, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return { interventions: [], departments: [] };

    var ivs = (data.interventions || []).filter(function (iv) {
      return matchesQuery(iv, q);
    }).slice(0, MAX_RESULTS);

    var seen = {}, depts = [];
    (data.interventions || []).forEach(function (iv) {
      (iv.departments || []).forEach(function (d) {
        if (d.name.toLowerCase().indexOf(q) !== -1 && !seen[d.name]) {
          seen[d.name] = true;
          depts.push(d.name);
        }
      });
    });

    return { interventions: ivs, departments: depts.sort() };
  }
```

And add `searchAll: searchAll,` to the exported object.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/test-core.js`
Expected: `OK - 23 core tests passed.`

- [ ] **Step 5: Commit**

```bash
git add js/ams-core.js tools/test-core.js
git commit -m "Add search result assembly to core logic"
```

---

### Task 7: The search palette, wired sitewide

**Files:**
- Create: `js/ams-search.js`
- Modify: `css/style.css`
- Modify: all 26 `interventions/**/*.html`, plus `index.html`, `tier1/2/3.html`, `departments.html`, `library.html`, `TEMPLATE.html`

**Interfaces:**
- Consumes: `AMSCore.searchAll`, `window.AMS`, and `document.body[data-root]`.

- [ ] **Step 1: Write the palette**

Create `js/ams-search.js`:

```js
(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  if (!data || !Core) return;

  var root = document.body.getAttribute('data-root') || '';
  var open = false, results = [], active = 0, lastFocus = null;

  var el = document.createElement('div');
  el.className = 'ams-palette';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Search interventions');
  el.hidden = true;
  el.innerHTML =
    '<div class="ams-palette__box">' +
      '<input type="text" class="ams-palette__input" id="amsQ" autocomplete="off" ' +
             'placeholder="Search interventions…" aria-label="Search interventions" ' +
             'aria-controls="amsResults" aria-expanded="false">' +
      '<div class="ams-palette__results" id="amsResults" role="listbox"></div>' +
      '<p class="sr-only" id="amsStatus" role="status" aria-live="polite"></p>' +
      '<p class="ams-palette__hint"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p>' +
    '</div>';
  document.body.appendChild(el);

  var input = el.querySelector('#amsQ');
  var list = el.querySelector('#amsResults');

  function render() {
    if (!results.length) {
      list.innerHTML = input.value.trim()
        ? '<p class="ams-palette__empty">No matches.</p>'
        : '<p class="ams-palette__empty">Type to search all 26 interventions.</p>';
      return;
    }
    list.innerHTML = results.map(function (r, i) {
      var sel = i === active ? ' is-active' : '';
      if (r.kind === 'dept') {
        return '<a class="ams-palette__item' + sel + '" role="option" aria-selected="' +
               (i === active) + '" href="' + root + 'departments.html">' +
               '<span class="ams-palette__t">' + r.name + '</span>' +
               '<span class="ams-palette__s">Department</span></a>';
      }
      return '<a class="ams-palette__item' + sel + '" role="option" aria-selected="' +
             (i === active) + '" href="' + root + r.iv.url + '">' +
             '<span class="ams-palette__t">' + (r.iv.icon ? r.iv.icon + ' ' : '') + r.iv.name + '</span>' +
             '<span class="tier-chip t' + r.iv.tier + '">Tier ' + r.iv.tier + '</span></a>';
    }).join('');
  }

  function update() {
    var found = Core.searchAll(data, input.value);
    results = found.interventions.map(function (iv) { return { kind: 'iv', iv: iv }; })
      .concat(found.departments.map(function (n) { return { kind: 'dept', name: n }; }));
    active = 0;
    input.setAttribute('aria-expanded', results.length ? 'true' : 'false');
    render();
    // Screen readers get a count; the visual list alone announces nothing.
    var status = document.getElementById('amsStatus');
    if (status) {
      status.textContent = !input.value.trim() ? ''
        : results.length === 0 ? 'No matches.'
        : results.length + (results.length === 1 ? ' result.' : ' results.');
    }
  }

  function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    el.hidden = false;
    input.value = '';
    update();
    input.focus();
  }

  function hide() {
    if (!open) return;
    open = false;
    el.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); open ? hide() : show(); return;
    }
    if (e.key === '/' && !open && !typing) { e.preventDefault(); show(); return; }
    if (!open) return;

    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'Tab') {
      // Trap focus: the palette is modal, so Tab must not reach the page behind it.
      var focusable = el.querySelectorAll('input, a[href]');
      if (!focusable.length) { e.preventDefault(); return; }
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault(); active = Math.max(active - 1, 0); render(); return;
    }
    if (e.key === 'Enter' && results.length) {
      e.preventDefault();
      var link = list.querySelectorAll('.ams-palette__item')[active];
      if (link) window.location.href = link.getAttribute('href');
    }
  });

  input.addEventListener('input', update);
  el.addEventListener('click', function (e) { if (e.target === el) hide(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ams-search]') : null;
    if (t) { e.preventDefault(); show(); }
  });
})();
```

- [ ] **Step 2: Add the styles**

Append to `css/style.css`:

```css
/* ===== Global search palette ===== */
.ams-palette {
    position: fixed; inset: 0; z-index: 3000;
    background: rgba(20,26,32,0.45);
    display: flex; justify-content: center; align-items: flex-start;
    padding: 10vh 1rem 1rem;
}
.ams-palette[hidden] { display: none; }
.ams-palette__box {
    background: var(--white); width: min(100%, 520px);
    border-radius: var(--radius); box-shadow: var(--shadow-hover); overflow: hidden;
}
.ams-palette__input {
    width: 100%; padding: 1rem 1.25rem; font-size: 1.05rem; font-family: inherit;
    border: 0; border-bottom: 1px solid var(--border-color); outline: none;
}
.ams-palette__results { max-height: 46vh; overflow-y: auto; }
.ams-palette__item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.7rem 1.25rem; text-decoration: none; color: var(--text-dark);
    border-left: 3px solid transparent;
}
.ams-palette__item.is-active { background: var(--bg-light); border-left-color: var(--tier-accent); }
.ams-palette__t { font-weight: 600; }
.ams-palette__s { margin-left: auto; font-size: 0.8rem; color: var(--text-light); }
.ams-palette__item .tier-chip { margin-left: auto; }
.ams-palette__empty { padding: 1.25rem; margin: 0; color: var(--text-light); font-size: 0.95rem; }
.ams-palette__hint {
    display: flex; gap: 0.75rem; flex-wrap: wrap; margin: 0;
    padding: 0.6rem 1.25rem; border-top: 1px solid var(--border-light);
    background: var(--bg-light); font-size: 0.75rem; color: var(--text-light);
}
.ams-palette__hint kbd {
    border: 1px solid var(--border-color); border-radius: 3px;
    padding: 0 0.25rem; background: var(--white); font-size: 0.7rem;
}
.nav-search { margin-left: auto; }
@media print { .ams-palette { display: none !important; } }
```

- [ ] **Step 3: Wire every page**

Every page needs three things. Root-level pages use `data-root=""`; the 26 detail pages use `data-root="../../"`.

```bash
# Detail pages: add data-root, then the scripts before js/main.js
for f in interventions/tier*/*.html; do
  perl -0pi -e 's/<body class="tier-([123])">/<body class="tier-$1" data-root="..\/..\/">/' "$f"
  perl -0pi -e 's{<script src="\.\./\.\./js/main\.js"></script>}{<script src="../../data/interventions.js"></script>\n    <script src="../../js/ams-core.js"></script>\n    <script src="../../js/ams-search.js"></script>\n    <script src="../../js/main.js"></script>}' "$f"
done

# Root pages that do not already have the scripts
for f in index.html departments.html TEMPLATE.html; do
  perl -0pi -e 's/<body class="tier-([123])">/<body class="tier-$1" data-root="">/' "$f"
done
```

Then add `<script src="js/ams-search.js"></script>` to `index.html`, `departments.html`, `library.html`, and `tier1/2/3.html` (which already load `data/interventions.js` and `js/ams-core.js` from earlier tasks).

Add a search affordance to the nav on every page, as the last `<li>`:

```html
<li class="nav-search"><a href="#" data-ams-search>🔍 Search <kbd>⌘K</kbd></a></li>
```

- [ ] **Step 4: Verify**

```bash
# Every page must declare data-root
grep -L 'data-root=' index.html tier1.html tier2.html tier3.html departments.html library.html TEMPLATE.html interventions/tier*/*.html
```
Expected: no output.

```bash
# Detail pages must load the search script
grep -L 'ams-search.js' interventions/tier*/*.html
```
Expected: no output.

In a browser, from a **detail page two levels deep** (`interventions/tier2/chunking.html`) opened via `file://`:
- Press `Cmd/Ctrl-K` — palette opens, input focused.
- Type `model` — Modeling appears with a Tier 1 chip.
- Press `↓` then `Enter` — navigates correctly, with no broken `../../` path.
- Press `Esc` — palette closes and focus returns to the element that had it.
- Press `/` while not in a text field — palette opens.
- With the palette open, hold `Tab` through every result and past the last one — focus must cycle back to the input, never onto the page behind the overlay. `Shift+Tab` from the input must wrap to the last result.
- Confirm `#amsStatus` updates its text as you type (inspect the element; it is visually hidden by `.sr-only` but read aloud by screen readers).

- [ ] **Step 5: Commit**

```bash
git add js/ams-search.js css/style.css index.html tier1.html tier2.html tier3.html departments.html library.html TEMPLATE.html interventions/
git commit -m "Add global search palette available from every page"
```

---

**PHASE 2 CHECKPOINT.** Review before continuing.

---

# Phase 3 — Triage

### Task 8: Author the problem taxonomy

**Files:**
- Modify: `data/interventions.js`

**Interfaces:**
- Produces: `window.AMS.problems` — 10 records, and a populated `problems` array on each intervention.

- [ ] **Step 1: Write the problems**

Replace `problems: []` at the bottom of `data/interventions.js` with the 10 records from the spec. Full shape for the first, referral, and referral-only cases:

```js
  problems: [
    {
      id: 'wont-start',
      label: "Won't start tasks / doesn't turn work in",
      shortLabel: "Won't start work",
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['organizational-systems', 'modeling'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['chunking', 'frequent-check-ins', 'parent-communication'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['student-collaboration', 'paraprofessional-support'] }
      ]
    },
    // cant-access-text, academic-language, cant-show-it, disengaged,
    // cant-focus, behavior, behind-grade-level — same shape, mappings
    // per the spec's taxonomy table.
    {
      id: 'safety',
      label: 'Safety or mental health concern',
      shortLabel: 'Safety concern',
      steps: [
        { tier: 3, framing: 'Go now — do not wait',
          referral: { who: 'School counselor or SST',
                      detail: 'Counselors are the point of contact for each student. SST meets Wednesdays at 10:00 AM.' } },
        { tier: 3, framing: 'Formal supports',
          interventions: ['crisis-intervention', 'wraparound-services', 'student-collaboration'] }
      ]
    },
    {
      id: 'attendance',
      label: 'Missing a lot of school',
      shortLabel: 'Attendance',
      steps: [
        { tier: 1, framing: 'This is already tracked — talk to the people who own it',
          referral: { who: 'Family Resource Advocate or attendance secretary',
                      detail: 'Attendance is monitored for all students. Bring persistent concerns to SST, Wednesdays at 10:00 AM.' } }
      ]
    }
  ]
```

`safety` must never carry a "try for 4–6 weeks" framing. `attendance` has exactly one step.

- [ ] **Step 2: Populate `problems` on each intervention**

Set each intervention's `problems` array to the problem ids that list it. Derive it rather than doing it by hand:

```bash
node -e '
const { loadBrowserGlobal } = require("./tools/load");
const AMS = loadBrowserGlobal("data/interventions.js", "AMS");
const map = {};
AMS.problems.forEach(function (p) {
  p.steps.forEach(function (s) {
    (s.interventions || []).forEach(function (id) {
      (map[id] = map[id] || []); if (map[id].indexOf(p.id) === -1) map[id].push(p.id);
    });
  });
});
AMS.interventions.forEach(function (iv) {
  console.log(iv.id + ": " + JSON.stringify(map[iv.id] || []));
});'
```

Copy each result into the matching record.

- [ ] **Step 3: Validate**

Run: `node tools/check-data.js`
Expected: `OK - 26 interventions, 10 problems, all checks passed.`

The validator already enforces that each step has exactly one of `interventions` or `referral`, and that every referenced id exists in both directions.

- [ ] **Step 4: Commit**

```bash
git add data/interventions.js
git commit -m "Add the 10-problem triage taxonomy with strategy and referral steps"
```

---

### Task 9: Ladder assembly

**Files:**
- Modify: `js/ams-core.js`
- Modify: `tools/test-core.js`

**Interfaces:**
- Produces: `AMSCore.buildLadder(problem, interventions)` → array of `{ tier, framing, kind: 'strategies'|'referral', items: Array, referral: Object|null }`. Unknown intervention ids are dropped rather than rendering as broken links.

- [ ] **Step 1: Write the failing tests**

Append to `tools/test-core.js`:

```js
test('buildLadder resolves intervention ids to objects', function () {
  const p = { id: 'p', label: 'L', shortLabel: 'S',
    steps: [{ tier: 1, framing: 'Start here', interventions: ['modeling'] }] };
  const r = Core.buildLadder(p, sample);
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].kind, 'strategies');
  assert.strictEqual(r[0].items[0].name, 'Modeling');
  assert.strictEqual(r[0].framing, 'Start here');
});

test('buildLadder marks referral steps', function () {
  const p = { id: 'p', label: 'L', shortLabel: 'S',
    steps: [{ tier: 3, framing: 'Go now', referral: { who: 'Counselor', detail: 'Wednesdays' } }] };
  const r = Core.buildLadder(p, sample);
  assert.strictEqual(r[0].kind, 'referral');
  assert.strictEqual(r[0].referral.who, 'Counselor');
  assert.strictEqual(r[0].items.length, 0);
});

test('buildLadder drops unknown intervention ids', function () {
  const p = { id: 'p', label: 'L', shortLabel: 'S',
    steps: [{ tier: 1, framing: 'F', interventions: ['modeling', 'does-not-exist'] }] };
  assert.strictEqual(Core.buildLadder(p, sample)[0].items.length, 1);
});

test('buildLadder preserves step order', function () {
  const p = { id: 'p', label: 'L', shortLabel: 'S', steps: [
    { tier: 1, framing: 'One', interventions: ['modeling'] },
    { tier: 2, framing: 'Two', interventions: ['chunking'] }
  ] };
  const r = Core.buildLadder(p, sample);
  assert.deepStrictEqual(r.map(function (s) { return s.framing; }), ['One', 'Two']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tools/test-core.js`
Expected: FAIL — `Core.buildLadder is not a function`

- [ ] **Step 3: Implement**

Add to `js/ams-core.js` and export it:

```js
  function buildLadder(problem, interventions) {
    var byId = {};
    (interventions || []).forEach(function (iv) { byId[iv.id] = iv; });

    return (problem.steps || []).map(function (s) {
      if (s.referral) {
        return { tier: s.tier, framing: s.framing, kind: 'referral',
                 items: [], referral: s.referral };
      }
      var items = (s.interventions || []).map(function (id) { return byId[id]; })
        .filter(function (iv) { return !!iv; });
      return { tier: s.tier, framing: s.framing, kind: 'strategies',
               items: items, referral: null };
    });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/test-core.js`
Expected: `OK - 27 core tests passed.`

- [ ] **Step 5: Commit**

```bash
git add js/ams-core.js tools/test-core.js
git commit -m "Add escalation ladder assembly supporting referral steps"
```

---

### Task 10: The triage page

**Files:**
- Create: `start.html`
- Create: `js/ams-triage.js`
- Modify: `css/style.css`

- [ ] **Step 1: Create the page shell**

Create `start.html` with the standard header, skip link, nav, and footer, plus:

```html
<body class="tier-1" data-root="">
    <main id="main" class="container" tabindex="-1">
        <section>
            <h2>Find a Strategy</h2>
            <p>Start with what you're seeing. Each answer moves from universal supports through targeted and intensive ones — try Tier 1 first, and add rather than replace as you move down.</p>
            <div class="triage-list" id="triageList" role="list"></div>
        </section>
        <section id="triageResult" hidden aria-live="polite"></section>
    </main>
    <script src="data/interventions.js"></script>
    <script src="js/ams-core.js"></script>
    <script src="js/ams-triage.js"></script>
    <script src="js/ams-search.js"></script>
    <script src="js/main.js"></script>
</body>
```

- [ ] **Step 2: Write the view module**

Create `js/ams-triage.js`:

```js
(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  var list = document.getElementById('triageList');
  var out = document.getElementById('triageResult');
  if (!data || !Core || !list || !out) return;

  var root = document.body.getAttribute('data-root') || '';

  list.innerHTML = data.problems.map(function (p) {
    return '<button type="button" class="triage-opt" role="listitem" ' +
           'data-problem="' + p.id + '" aria-pressed="false">' + p.label + '</button>';
  }).join('');

  function show(id) {
    var problem = null;
    data.problems.forEach(function (p) { if (p.id === id) problem = p; });
    if (!problem) return;

    Array.prototype.forEach.call(list.querySelectorAll('.triage-opt'), function (b) {
      var on = b.getAttribute('data-problem') === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var rungs = Core.buildLadder(problem, data.interventions).map(function (s) {
      var inner;
      if (s.kind === 'referral') {
        inner = '<div class="triage-referral"><strong>' + s.referral.who + '</strong>' +
                '<p>' + s.referral.detail + '</p></div>';
      } else {
        inner = '<div class="triage-items">' + s.items.map(function (iv) {
          return '<a class="triage-item" href="' + root + iv.url + '">' +
                 (iv.icon ? iv.icon + ' ' : '') + iv.name + '</a>';
        }).join('') + '</div>';
      }
      return '<div class="triage-rung t' + s.tier + '">' +
               '<div class="triage-rung__head">' +
                 '<span class="tier-chip t' + s.tier + '">Tier ' + s.tier + '</span>' +
                 '<span class="triage-framing">' + s.framing + '</span>' +
               '</div>' + inner +
             '</div>';
    }).join('');

    out.innerHTML = '<h2>' + problem.label + '</h2><div class="triage-ladder">' + rungs + '</div>';
    out.hidden = false;
    if (window.location.hash !== '#' + id) {
      window.history.replaceState(null, '', '#' + id);
    }
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-problem]') : null;
    if (btn) show(btn.getAttribute('data-problem'));
  });

  if (window.location.hash) show(window.location.hash.slice(1));
})();
```

- [ ] **Step 3: Add the styles**

Append to `css/style.css`:

```css
/* ===== Triage ===== */
.triage-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem; }
.triage-opt {
    text-align: left; padding: 0.9rem 1.1rem; font-size: 1rem; font-family: inherit;
    background: var(--white); border: 2px solid var(--border-color);
    border-radius: var(--radius); color: var(--text-dark); cursor: pointer;
}
.triage-opt:hover { border-color: var(--tier-accent); }
.triage-opt.is-active { border-color: var(--text-dark); background: var(--bg-light); font-weight: 600; }
.triage-ladder { border-left: 3px solid var(--border-color); padding-left: 1.5rem; margin-top: 1.5rem; }
.triage-rung { position: relative; padding-bottom: 1.75rem; }
.triage-rung::before {
    content: ""; position: absolute; left: -1.95rem; top: 0.4rem;
    width: 0.75rem; height: 0.75rem; border-radius: 50%; border: 3px solid var(--white);
}
.triage-rung.t1::before { background: var(--tier1-color); }
.triage-rung.t2::before { background: var(--tier2-color); }
.triage-rung.t3::before { background: var(--tier3-color); }
.triage-rung__head { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
.triage-framing { font-size: 0.9rem; color: var(--text-light); font-style: italic; }
.triage-items { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.triage-item {
    padding: 0.4rem 0.8rem; background: var(--bg-light); border: 1px solid var(--border-color);
    border-radius: var(--radius-sm); text-decoration: none; color: var(--text-dark); font-size: 0.95rem;
}
.triage-item:hover { border-color: var(--tier-accent); color: var(--tier-accent); }
.triage-referral { background: #FFF3CD; border-left: 4px solid var(--tier2-color); padding: 1rem 1.25rem; border-radius: var(--radius-sm); }
.triage-referral p { margin: 0.25rem 0 0; }
```

- [ ] **Step 4: Verify**

Open `start.html` from `file://`:
- 10 problems listed.
- Clicking "Won't start tasks" shows three rungs: Tier 1, Tier 2, Tier 3, each with framing text and linked strategies.
- Clicking "Safety or mental health concern" shows the referral rung **first**, with no "try for 4–6 weeks" text anywhere.
- Clicking "Missing a lot of school" shows exactly one rung, a referral, with no empty Tier 1 or Tier 2 rungs.
- The URL updates to `start.html#wont-start`; reloading that URL reopens the same problem.
- Every strategy link resolves.

- [ ] **Step 5: Commit**

```bash
git add start.html js/ams-triage.js css/style.css
git commit -m "Add Find a Strategy triage page with escalation ladders"
```

---

**PHASE 3 CHECKPOINT.** Review before continuing.

---

# Phase 4 — Landing and Framework split

### Task 11: Move the MTSS framework to its own page

**Files:**
- Create: `framework.html`
- Modify: `index.html`

- [ ] **Step 1: Create the page**

Create `framework.html` with the standard shell (`data-root=""`), and move these sections **verbatim** out of `index.html` into it:

- `.mtss-pyramid` — the three tier blocks with their "View Tier N Interventions" buttons
- `.data-decisions` — Universal Screening, Progress Monitoring, Case Review
- `.sst` — the Student Study Team section, including the Wednesday 10:00 AM detail
- `.goals` — MTSS Goals 2025–26

Page heading: `<h2>The MTSS Framework at AMS</h2>`, with the hero paragraph explaining the whole-child framework moved here too.

Nothing is rewritten — this is a move. The tier buttons in `.mtss-pyramid` remain the primary route to `tier1/2/3.html` now that they are off the nav.

- [ ] **Step 2: Remove those sections from `index.html`**

Delete the moved sections. Leave `index.html` temporarily thin — Task 12 rebuilds it.

- [ ] **Step 3: Verify nothing was lost**

```bash
for s in "Universal Screening" "Student Study Team" "Wednesdays at 10:00" "MTSS Goals" "Case Review"; do
  printf '%-28s framework:%s index:%s\n' "$s" \
    "$(grep -c "$s" framework.html)" "$(grep -c "$s" index.html)"
done
```
Expected: each string present in `framework.html`, absent from `index.html`.

- [ ] **Step 4: Commit**

```bash
git add framework.html index.html
git commit -m "Move MTSS framework content to its own page"
```

---

### Task 12: The landing page and sitewide nav

**Files:**
- Modify: `index.html`
- Modify: all pages (nav), `TEMPLATE.html`

- [ ] **Step 1: Build the landing**

Rewrite `index.html`'s `<main>` as a short orientation plus routes into the three doors. No table, no framework wall:

```html
<main id="main" class="container" tabindex="-1">
    <section class="hero">
        <h2>The AMS Intervention Toolkit</h2>
        <p>A shared, practical menu of the supports AMS staff use across academics, behavior, and the whole child — organized by tier, built from our own department planning, and maintained as we try new things.</p>
        <p>Use it in department meetings, when planning for a specific student, or when you want to know what another team is already doing.</p>
    </section>

    <section>
        <h2>Three ways in</h2>
        <div class="card-grid">
            <div class="card">
                <h3><a href="start.html">Find a Strategy →</a></h3>
                <p>Start from what you're seeing with a student. Walks you from universal supports through targeted and intensive ones.</p>
            </div>
            <div class="card">
                <h3><a href="library.html">All Interventions →</a></h3>
                <p>All 26, filterable by tier, category, and department, sortable by effectiveness.</p>
            </div>
            <div class="card">
                <h3><a href="#" data-ams-search>Search →</a></h3>
                <p>Know the name already? Press <kbd>⌘K</kbd> or <kbd>/</kbd> from any page.</p>
            </div>
        </div>
    </section>

    <section>
        <h2>Browse by tier</h2>
        <div class="card-grid">
            <div class="card"><h3><a href="tier1.html">Tier 1 — Universal</a></h3><p>High-quality core instruction for all students. Meets the needs of about 80%.</p></div>
            <div class="card"><h3><a href="tier2.html">Tier 2 — Targeted</a></h3><p>Supplemental support, usually in small groups, <strong>in addition to</strong> core instruction.</p></div>
            <div class="card"><h3><a href="tier3.html">Tier 3 — Intensive</a></h3><p>The most individualized support, for students with significant or persistent needs.</p></div>
        </div>
    </section>

    <section>
        <h2>Also here</h2>
        <ul class="features">
            <li><a href="departments.html">By Department</a> — what each AMS team committed to on 10/3, and what they still need</li>
            <li><a href="framework.html">The MTSS Framework</a> — how tiers, data, and the Student Study Team fit together</li>
        </ul>
    </section>
</main>
```

- [ ] **Step 2: Update the nav everywhere**

The nav becomes, on every page (root-level paths shown; detail pages prefix `../../`):

```html
<ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="start.html">Find a Strategy</a></li>
    <li><a href="library.html">All Interventions</a></li>
    <li><a href="departments.html">Departments</a></li>
    <li><a href="framework.html">Framework</a></li>
    <li class="nav-search"><a href="#" data-ams-search>🔍 Search <kbd>⌘K</kbd></a></li>
</ul>
```

Apply to `index.html`, `start.html`, `library.html`, `framework.html`, `tier1/2/3.html`, `departments.html`, `TEMPLATE.html`, and all 26 detail pages. Set `class="active"` on the matching link per page. `js/main.js` already highlights the current page by filename; verify it still matches.

- [ ] **Step 3: Verify**

```bash
# No page still links to a nav that no longer exists, and none is missing the new links
grep -L 'start.html' index.html library.html framework.html tier1.html tier2.html tier3.html departments.html TEMPLATE.html interventions/tier*/*.html
```
Expected: no output.

```bash
# Full link integrity across the site
for f in *.html interventions/tier*/*.html; do
  d=$(dirname "$f")
  grep -o 'href="[^"#]*\.html"' "$f" | sed 's/href="//;s/"//' | sort -u | while read -r l; do
    case "$l" in http*) continue;; esac
    [ -f "$d/$l" ] || echo "BROKEN $f -> $l"
  done
done
```
Expected: no output.

Then open `index.html` from `file://` and confirm all six nav links work, the three door cards route correctly, and the Search card opens the palette.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Rebuild homepage as a landing and update nav sitewide"
```

---

**PHASE 4 CHECKPOINT.** Review before continuing.

---

# Phase 5 — Documentation

### Task 13: Update the docs to match reality

**Files:**
- Modify: `README.md`, `QUICKSTART.md`, `CONTENT-STATUS.md`

- [ ] **Step 1: Rewrite the "Adding New Interventions" instructions**

Both `README.md` and `QUICKSTART.md` currently tell contributors to **hand-edit a card into the tier page**. That is now wrong and will silently produce an intervention that the Library, search, and triage cannot see. Replace with:

```markdown
### Adding a new intervention

1. Add a record to `data/interventions.js` (keep it alphabetical within its tier).
2. Copy `TEMPLATE.html` to `interventions/tierN/your-id.html`. The filename
   must match the record's `id`.
3. Fill in the page content.
4. Run `node tools/check-data.js` to confirm the record is valid and the
   page exists.

The intervention then appears automatically on its tier page, in the
Library, in search, and — if you listed any `problems` — in Find a Strategy.
```

- [ ] **Step 2: Update the project structure block**

Add `data/`, `tools/`, `library.html`, `start.html`, `framework.html` to the structure diagram in `README.md`, and describe each new `js/` module.

- [ ] **Step 3: Document the file:// constraint**

Add to `README.md` under Technical Requirements, so no future contributor "modernizes" it into a bug:

```markdown
**Note on the data file:** `data/interventions.js` is a JavaScript file, not
JSON, on purpose. Browsers block `fetch()` of local `.json` files over
`file://`, which would break opening the site by double-clicking
`index.html`. Keep it as a `<script>`-loaded file.
```

- [ ] **Step 4: Update `CONTENT-STATUS.md`**

Add a short section noting that intervention metadata now lives in `data/interventions.js` and that `node tools/check-data.js` validates it. Content-depth tracking stays as it is.

- [ ] **Step 5: Final verification**

```bash
node tools/check-data.js && node tools/test-core.js
```
Expected: both pass.

Open `index.html` by double-clicking from Finder one last time and walk all three doors.

- [ ] **Step 6: Commit**

```bash
git add README.md QUICKSTART.md CONTENT-STATUS.md
git commit -m "Update documentation for the data-driven intervention model"
```

---

## Done

All five phases complete. The site has three doors over one data file, validated by `node tools/check-data.js` and `node tools/test-core.js`, with no build step and no dependencies.
