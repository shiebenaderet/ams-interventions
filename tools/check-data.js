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
  check(iv.ratingNote === undefined || (typeof iv.ratingNote === 'string' && iv.ratingNote.length > 0),
    at + ': ratingNote has invalid value "' + iv.ratingNote + '"');
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
    check(d.note === undefined || (typeof d.note === 'string' && d.note.length > 0),
      at + ': department "' + d.name + '" has invalid note "' + d.note + '"');
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
