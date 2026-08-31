/* Departments page — the generated half.
 *
 * The rest of departments.html is hand-written from what each team said on
 * 10/3 and stays that way. This fills one block per section with what
 * data/interventions.js records that team as already running, so the page
 * can't drift from the toolkit.
 *
 * The join lives in the markup: `data-dept` is a comma-separated list of the
 * names that team goes by in the data ("Counseling, Counseling & Psych,
 * Admin + Psych, FRA"). Add a name there rather than to a map in here.
 */
(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  var hosts = document.querySelectorAll('.dept-practice[data-dept]');
  if (!hosts.length) return;

  if (!data || !Core) {
    Array.prototype.forEach.call(hosts, function (host) {
      host.textContent = "Intervention data didn't load. data/interventions.js probably has a typo — run: node tools/check-data.js";
    });
    return;
  }

  var root = document.body.getAttribute('data-root') || '';

  function names(host) {
    return host.getAttribute('data-dept').split(',').map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function row(iv, starred) {
    return '<li>' +
      '<a href="' + root + iv.url + '">' + Core.escapeHtml(iv.name) + '</a> ' +
      '<span class="tier-chip t' + iv.tier + '">Tier ' + iv.tier + '</span>' +
      (starred ? ' <span class="dept-tag dept-tag--must">must-have ★</span>' : '') +
    '</li>';
  }

  Array.prototype.forEach.call(hosts, function (host) {
    var groups = Core.departmentPractice(data.interventions, names(host));
    if (!groups.inPracticeCount && !groups.exploring.length) return;

    var html = '';

    if (groups.inPracticeCount) {
      html += '<h3>Already in practice <span class="dept-practice-count">' +
              groups.inPracticeCount + '</span></h3>' +
        '<p class="dept-practice-note">What the toolkit records this team as already doing. ' +
        'Starred entries are the must-haves the team committed to.</p>' +
        '<ul class="features dept-practice-list">' +
          groups.mustHave.map(function (iv) { return row(iv, true); }).join('') +
          groups.using.map(function (iv) { return row(iv, false); }).join('') +
        '</ul>';
    }

    if (groups.exploring.length) {
      html += '<p class="dept-practice-exploring"><strong>Exploring, not yet in practice:</strong> ' +
        groups.exploring.map(function (iv) {
          return '<a href="' + root + iv.url + '">' + Core.escapeHtml(iv.name) + '</a>';
        }).join(', ') + '</p>';
    }

    host.innerHTML = html;
  });
})();
