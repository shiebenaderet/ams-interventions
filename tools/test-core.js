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

console.log('OK - ' + passed + ' core tests passed.');
