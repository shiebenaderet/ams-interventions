'use strict';
/* Does the written analysis still agree with the data?
 *
 * data.html carries about 130 distinct figures inside its prose — takeaway
 * paragraphs, notes, verdict cards, the limits list. Those sentences are
 * hand-written and cannot be generated, so when data/school-data.js is
 * updated they do not update with it. Nothing else in this repo notices.
 *
 * This tool reads every number out of the prose and reports the ones that no
 * longer appear anywhere in AMSData. It is a REVIEW AID, not a pass/fail
 * gate on correctness: a number can be absent from the data and still be
 * right, because the prose also quotes figures it computed (a gap between
 * two measures, a headcount derived from a percentage). Those live in
 * DERIVED below, each with the sum that produces it.
 *
 * What it catches: a sentence still quoting last year's figure after the
 * transcription moved on.
 * What it cannot catch: a sentence whose figure is right but whose claim is
 * now wrong — "the highest attendance in the school" stays a sentence about
 * rank, and rank is not a number in the prose.
 *
 * Run it after every data update:  node tools/check-prose-figures.js
 */
const fs = require('fs');
const path = require('path');
const { loadBrowserGlobal } = require('./load');

const D = loadBrowserGlobal('data/school-data.js', 'AMSData');

// Figures the prose works out for itself. Keep the note: it is the only
// record of where each came from, and a stale one here hides a stale
// sentence there.
const DERIVED = {
  '1.7':  'math-minus-ELA gap, English learners (11.9 - 10.2)',
  '3.5':  'math-minus-ELA gap, students with disabilities (12.2 - 8.7)',
  '5.6':  '504 minus students-with-disabilities attendance (63.8 - 58.2)',
  '6.2':  'girls minus boys, ELA Level 3+ (49.7 - 43.5)',
  '6.7':  'math-minus-ELA gap, Asian (61.9 - 55.2)',
  '7.5':  'girls minus boys, ELA growth (58.5 - 51.0)',
  '8.9':  '504 minus non-504 attendance (63.8 - 72.7)',
  '17.2': 'math-minus-ELA gap, White (54.8 - 37.6)',
  '20.5': 'math-minus-ELA gap, girls (49.7 - 29.2)',
  '22.2': 'math-minus-ELA gap, Section 504 (53.3 - 31.1)',
  '22.8': 'low-income math gap (45.1 - 22.3)',
  '41.9': 'ELA gap, disabilities vs without (54.1 - 12.2)',
  '48':   'i-Ready on-grade share, two or more races (34 + 14)',
  '48.7': 'ELA gap, English learners vs non (60.6 - 11.9)',
  '80':   'headcount, special education 3+ below reading (70% of 114)',
  '81':   'headcount, special education 3+ below math (70% of 115)',
  '90':   'rhetorical — "a zero that a 90% cannot recover from"',
  '91':   'headcount, Hispanic/Latino 3+ below reading (42% of 217)',
  '111':  'headcount, English learners 3+ below reading (64% of 173)'
};

const known = new Set();
JSON.stringify(D).replace(/-?\d+(\.\d+)?/g, function (m) {
  known.add(m);
  known.add(String(parseFloat(m)));
  return m;
});

const html = fs.readFileSync(path.join(__dirname, '..', 'data.html'), 'utf8');
const blocks = html.match(/<p>[\s\S]*?<\/p>|<li>[\s\S]*?<\/li>/g) || [];

const orphans = new Map();   // number -> the sentences quoting it
blocks.forEach(function (block) {
  const text = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  (text.match(/\d+(\.\d+)?/g) || []).forEach(function (n) {
    if (known.has(n) || known.has(String(parseFloat(n))) || DERIVED[n]) return;
    if (!orphans.has(n)) orphans.set(n, new Set());
    orphans.get(n).add(text.length > 150 ? text.slice(0, 150) + '…' : text);
  });
});

const totalNums = new Set();
blocks.forEach(function (b) {
  (b.replace(/<[^>]+>/g, ' ').match(/\d+(\.\d+)?/g) || []).forEach(function (n) { totalNums.add(n); });
});

if (orphans.size === 0) {
  console.log('OK - prose figures agree with the data (' + totalNums.size +
    ' distinct figures: ' + (totalNums.size - Object.keys(DERIVED).length) +
    ' matched against AMSData, ' + Object.keys(DERIVED).length + ' declared as derived).');
  process.exit(0);
}

console.error('check-prose-figures: ' + orphans.size +
  ' figure(s) in the prose appear nowhere in data/school-data.js.\n');
console.error('Each is either a sentence left stale by a data update, or a figure the');
console.error('prose computed. If it is computed, add it to DERIVED in this file with');
console.error('the sum that produces it. If it is stale, fix the sentence.\n');
[...orphans.keys()].sort(function (a, b) { return a - b; }).forEach(function (n) {
  console.error('  ' + n);
  orphans.get(n).forEach(function (s) { console.error('      ' + s); });
});
process.exit(1);
