(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  var list = document.getElementById('triageList');
  var out = document.getElementById('triageResult');
  if (!data || !Core || !list || !out) return;

  var root = document.body.getAttribute('data-root') || '';

  list.innerHTML = data.problems.map(function (p) {
    return '<button type="button" class="triage-opt" role="listitem" ' +
           'data-problem="' + Core.escapeHtml(p.id) + '" aria-pressed="false">' + Core.escapeHtml(p.label) + '</button>';
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
        inner = '<div class="triage-referral"><strong>' + Core.escapeHtml(s.referral.who) + '</strong>' +
                '<p>' + Core.escapeHtml(s.referral.detail) + '</p></div>';
      } else {
        inner = '<div class="triage-items">' + s.items.map(function (iv) {
          return '<a class="triage-item" href="' + root + iv.url + '">' +
                 (iv.icon ? Core.escapeHtml(iv.icon) + ' ' : '') + Core.escapeHtml(iv.name) + '</a>';
        }).join('') + '</div>';
      }
      return '<div class="triage-rung t' + s.tier + '">' +
               '<div class="triage-rung__head">' +
                 '<span class="tier-chip t' + s.tier + '">Tier ' + s.tier + '</span>' +
                 '<span class="triage-framing">' + Core.escapeHtml(s.framing) + '</span>' +
               '</div>' + inner +
             '</div>';
    }).join('');

    out.innerHTML = '<h2>' + Core.escapeHtml(problem.label) + '</h2><div class="triage-ladder">' + rungs + '</div>';
    out.hidden = false;
    var status = document.getElementById('triageStatus');
    if (status) { status.textContent = 'Showing supports for: ' + problem.label; }
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
