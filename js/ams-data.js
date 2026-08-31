/* AMS student data — page composition. Finds each <div class="chart"
 * data-chart="id"> in data.html and fills it with the right primitive.
 */
(function () {
  'use strict';
  var data = window.AMSData, Core = window.AMSCore, C = window.AMSCharts;
  var mounts = document.querySelectorAll('.chart[data-chart]');
  if (!mounts.length) return;

  if (!data || !Core || !C) {
    Array.prototype.forEach.call(mounts, function (m) {
      m.textContent = "Student data didn't load. data/school-data.js probably has a typo — run: node tools/check-school-data.js";
    });
    return;
  }

  var render = {};   // Tasks 8 and 9 populate this, keyed by data-chart id.

  Array.prototype.forEach.call(mounts, function (mount) {
    var id = mount.getAttribute('data-chart');
    if (!render[id]) { return; }
    render[id](mount);
  });
})();
