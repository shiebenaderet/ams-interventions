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

  /* How a department's stake in an intervention should read.
   *
   * `inPractice` is the answer to "are we already doing this?" — must-have and
   * using both mean yes, exploring means not yet. `suffix` carries that same
   * distinction as text so the tags never rely on colour alone.
   *
   * An unrecognised status is shown verbatim and counted as not-in-practice:
   * better to under-claim than to tell a team they run something they don't.
   */
  var DEPT_MARKS = {
    'must-have': { cls: 'dept-tag dept-tag--must',      suffix: ' ★',
                   title: 'Must-have — this team committed to it', inPractice: true },
    'using':     { cls: 'dept-tag dept-tag--using',     suffix: '',
                   title: 'Already in practice', inPractice: true },
    'exploring': { cls: 'dept-tag dept-tag--exploring', suffix: ' (exploring)',
                   title: 'Exploring — not yet in practice', inPractice: false }
  };

  function deptMark(d) {
    var status = (d && d.status) || 'using';
    var known = DEPT_MARKS[status];
    if (known) {
      return { status: status, cls: known.cls, suffix: known.suffix,
               title: known.title, inPractice: known.inPractice };
    }
    return { status: status, cls: 'dept-tag', suffix: ' (' + status + ')',
             title: status, inPractice: false };
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
      if (f.practice) {
        // Scoped to the chosen department when there is one: a strategy can be
        // routine in Math and still only an idea in Science.
        var scope = (iv.departments || []).filter(function (d) {
          return !f.department || d.name === f.department;
        });
        var want = f.practice === 'in-practice';
        var match = scope.some(function (d) { return deptMark(d).inPractice === want; });
        if (!match) return false;
      }
      if (f.query && !matchesQuery(iv, f.query)) return false;
      return true;
    });
  }

  /* Everything one department already runs, grouped for display.
   *
   * `names` is a list because a department goes by several names in the data —
   * School Counseling covers "Counseling", "Counseling & Psych", "Admin + Psych"
   * and "FRA". Each group is sorted by name; `inPracticeCount` is what a
   * heading should show.
   */
  function departmentPractice(list, names) {
    var wanted = names || [];
    var out = { mustHave: [], using: [], exploring: [], inPracticeCount: 0 };

    (list || []).forEach(function (iv) {
      var mine = (iv.departments || []).filter(function (d) {
        return wanted.indexOf(d.name) !== -1;
      });
      if (!mine.length) return;
      // A department listed twice on one intervention takes its strongest claim.
      var status = 'exploring';
      mine.forEach(function (d) {
        var s = deptMark(d).status;
        if (s === 'must-have') status = 'must-have';
        else if (s === 'using' && status !== 'must-have') status = 'using';
      });
      if (status === 'must-have') out.mustHave.push(iv);
      else if (status === 'using') out.using.push(iv);
      else out.exploring.push(iv);
    });

    ['mustHave', 'using', 'exploring'].forEach(function (k) {
      out[k] = sortInterventions(out[k], 'name', 'asc');
    });
    out.inPracticeCount = out.mustHave.length + out.using.length;
    return out;
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

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  window.AMSCore = {
    matchesQuery: matchesQuery,
    deptMark: deptMark,
    filterInterventions: filterInterventions,
    departmentPractice: departmentPractice,
    sortInterventions: sortInterventions,
    starString: starString,
    escapeHtml: escapeHtml,
    searchAll: searchAll,
    buildLadder: buildLadder
  };
})();
