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

// A department can sit at a different status on each intervention, so the
// practice tests need their own fixture rather than reusing `sample`.
const mixed = [
  { id: 'a', name: 'Alpha', tier: 1, rating: 3, categories: [], description: '', bestFor: '',
    departments: [{ name: 'Math', status: 'using' }, { name: 'Science', status: 'exploring' }] },
  { id: 'b', name: 'Bravo', tier: 1, rating: 3, categories: [], description: '', bestFor: '',
    departments: [{ name: 'Math', status: 'must-have' }] },
  { id: 'c', name: 'Charlie', tier: 1, rating: 3, categories: [], description: '', bestFor: '',
    departments: [{ name: 'Science', status: 'exploring' }] }
];

test('deptMark treats using as in practice with no suffix', function () {
  const m = Core.deptMark({ name: 'Math', status: 'using' });
  assert.strictEqual(m.inPractice, true);
  assert.strictEqual(m.suffix, '');
});

test('deptMark treats must-have as in practice and stars it', function () {
  const m = Core.deptMark({ name: 'Math', status: 'must-have' });
  assert.strictEqual(m.inPractice, true);
  assert.strictEqual(m.suffix, ' ★');
});

test('deptMark treats exploring as not yet in practice and says so in text', function () {
  const m = Core.deptMark({ name: 'Science', status: 'exploring' });
  assert.strictEqual(m.inPractice, false);
  assert.strictEqual(m.suffix, ' (exploring)');
});

test('deptMark gives each status its own class so colour is not the only signal', function () {
  const seen = ['using', 'must-have', 'exploring'].map(function (s) {
    return Core.deptMark({ name: 'D', status: s }).cls;
  });
  assert.strictEqual(new Set(seen).size, 3);
  seen.forEach(function (c) { assert.ok(/(^| )dept-tag( |$)/.test(c), c + ' keeps the base class'); });
});

test('deptMark falls back for an unrecognised status without claiming practice', function () {
  const m = Core.deptMark({ name: 'D', status: 'piloting' });
  assert.strictEqual(m.inPractice, false);
  assert.strictEqual(m.suffix, ' (piloting)');
  assert.strictEqual(m.cls, 'dept-tag');
});

test('deptMark treats a missing status as in practice, matching the data default', function () {
  const m = Core.deptMark({ name: 'D' });
  assert.strictEqual(m.inPractice, true);
  assert.strictEqual(m.status, 'using');
});

test('filterInterventions by practice in-practice keeps using and must-have', function () {
  const r = Core.filterInterventions(mixed, { practice: 'in-practice' });
  assert.deepStrictEqual(r.map(function (i) { return i.id; }), ['a', 'b']);
});

test('filterInterventions by practice exploring keeps only what nobody has adopted yet', function () {
  const r = Core.filterInterventions(mixed, { practice: 'exploring' });
  assert.deepStrictEqual(r.map(function (i) { return i.id; }), ['a', 'c']);
});

test('filterInterventions scopes practice to the selected department', function () {
  // Alpha is `using` in Math but `exploring` in Science — the pair of filters
  // must read Science's own status, not "some department somewhere".
  const r = Core.filterInterventions(mixed, { department: 'Science', practice: 'in-practice' });
  assert.strictEqual(r.length, 0);
});

test('filterInterventions returns a department its own in-practice rows', function () {
  const r = Core.filterInterventions(mixed, { department: 'Math', practice: 'in-practice' });
  assert.deepStrictEqual(r.map(function (i) { return i.id; }), ['a', 'b']);
});

test('departmentPractice groups a department by status', function () {
  const r = Core.departmentPractice(mixed, ['Math']);
  assert.deepStrictEqual(r.mustHave.map(function (i) { return i.id; }), ['b']);
  assert.deepStrictEqual(r.using.map(function (i) { return i.id; }), ['a']);
  assert.deepStrictEqual(r.exploring, []);
});

test('departmentPractice merges the aliases a department goes by', function () {
  const r = Core.departmentPractice(mixed, ['Math', 'Science']);
  const all = [].concat(r.mustHave, r.using, r.exploring).map(function (i) { return i.id; });
  assert.deepStrictEqual(all.sort(), ['a', 'b', 'c']);
});

test('departmentPractice takes the strongest claim when aliases disagree', function () {
  // Alpha is `using` under Math and `exploring` under Science. A team that
  // already runs something is running it — the weaker record must not demote it.
  const r = Core.departmentPractice(mixed, ['Math', 'Science']);
  assert.deepStrictEqual(r.using.map(function (i) { return i.id; }), ['a']);
  assert.deepStrictEqual(r.exploring.map(function (i) { return i.id; }), ['c']);
});

test('departmentPractice counts every intervention the team already runs', function () {
  const r = Core.departmentPractice(mixed, ['Math']);
  assert.strictEqual(r.inPracticeCount, 2);
});

test('departmentPractice sorts each group by name', function () {
  const r = Core.departmentPractice([mixed[2], mixed[0]], ['Science']);
  assert.deepStrictEqual(r.exploring.map(function (i) { return i.name; }), ['Alpha', 'Charlie']);
});

test('departmentPractice returns empty groups for a department with no interventions', function () {
  const r = Core.departmentPractice(mixed, ['Woodshop']);
  assert.deepStrictEqual(r.mustHave, []);
  assert.deepStrictEqual(r.using, []);
  assert.deepStrictEqual(r.exploring, []);
  assert.strictEqual(r.inPracticeCount, 0);
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

test('escapeHtml escapes &, <, >, ", \'', function () {
  assert.strictEqual(Core.escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
});

test('escapeHtml replaces & first so < does not become &amp;lt;', function () {
  assert.strictEqual(Core.escapeHtml('<'), '&lt;');
});

test('escapeHtml returns empty string for null and undefined', function () {
  assert.strictEqual(Core.escapeHtml(null), '');
  assert.strictEqual(Core.escapeHtml(undefined), '');
});

test('escapeHtml leaves an ordinary string untouched', function () {
  assert.strictEqual(Core.escapeHtml('Chunking'), 'Chunking');
});

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

test('searchAll returns host-realm arrays that deepStrictEqual plain arrays', function () {
  const r = Core.searchAll({ interventions: [], problems: [] }, 'anything');
  assert.deepStrictEqual(r.interventions, []);
  assert.deepStrictEqual(r.departments, []);
});

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

console.log('OK - ' + passed + ' core tests passed.');
