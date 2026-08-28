(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;

  var body = document.getElementById('libBody');
  var count = document.getElementById('libCount');
  var search = document.getElementById('libSearch');
  if (!body) return;
  if (!data || !Core) {
    body.textContent = "Intervention data didn't load. data/interventions.js probably has a typo — run: node tools/check-data.js";
    return;
  }

  var root = document.body.getAttribute('data-root') || '';

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

  function categories() {
    var seen = {}, out = [];
    data.interventions.forEach(function (iv) {
      (iv.categories || []).forEach(function (c) {
        if (!seen[c]) { seen[c] = true; out.push(c); }
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
      var esc = Core.escapeHtml(name);
      html += '<button type="button" class="tag" aria-pressed="false" ' +
              'data-filter="department" data-value="' + esc + '">' + esc + '</button>';
    });
    host.innerHTML = html;
  }

  function buildCatFilters() {
    var host = document.getElementById('catFilters');
    if (!host) return;
    var html = '<button type="button" class="tag active" aria-pressed="true" ' +
               'data-filter="category" data-value="">All categories</button>';
    categories().forEach(function (name) {
      var esc = Core.escapeHtml(name);
      html += '<button type="button" class="tag" aria-pressed="false" ' +
              'data-filter="category" data-value="' + esc + '">' + esc + '</button>';
    });
    host.innerHTML = html;
  }

  function render() {
    var rows = Core.filterInterventions(data.interventions, state);
    rows = Core.sortInterventions(rows, state.sortKey, state.sortDir);

    body.innerHTML = rows.map(function (iv) {
      var depts = (iv.departments || []).map(function (d) {
        var cls = d.status === 'must-have' ? 'dept-tag dept-tag--must' : 'dept-tag';
        var label = Core.escapeHtml(d.name);
        if (d.note) label += ' (' + Core.escapeHtml(d.note) + ')';
        if (d.status === 'must-have') label += ' ★';
        return '<span class="' + cls + '" title="' + Core.escapeHtml(d.status) + '">' + label + '</span>';
      }).join('');
      var cats = (iv.categories || []).map(function (c) { return Core.escapeHtml(c); }).join(', ');
      return '<tr>' +
        '<td class="lib-name"><a href="' + root + iv.url + '">' +
          (iv.icon ? Core.escapeHtml(iv.icon) + ' ' : '') + Core.escapeHtml(iv.name) + '</a></td>' +
        '<td><span class="tier-chip t' + iv.tier + '">Tier ' + iv.tier + '</span></td>' +
        '<td>' + cats + '</td>' +
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
  buildCatFilters();
  render();
})();
