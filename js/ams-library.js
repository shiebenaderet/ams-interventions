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
        var label = d.name;
        if (d.note) label += ' (' + d.note + ')';
        if (d.status === 'must-have') label += ' ★';
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
