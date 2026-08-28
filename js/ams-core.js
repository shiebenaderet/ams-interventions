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

  window.AMSCore = {
    matchesQuery: matchesQuery,
    filterInterventions: filterInterventions,
    sortInterventions: sortInterventions,
    starString: starString,
    escapeHtml: escapeHtml,
    searchAll: searchAll
  };
})();
