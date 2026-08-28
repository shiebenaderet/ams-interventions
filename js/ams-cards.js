(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  var host = document.querySelector('.intervention-list[data-tier]');
  if (!data || !Core || !host) return;

  var tier = parseInt(host.getAttribute('data-tier'), 10);
  var root = document.body.getAttribute('data-root') || '';

  var list = Core.filterInterventions(data.interventions, { tier: tier }).slice();
  list.sort(function (a, b) { return a.order - b.order; });

  host.innerHTML = list.map(function (iv) {
    var depts = (iv.departments || []).map(function (d) {
      var label = Core.escapeHtml(d.name);
      if (d.note) {
        label += ' (' + Core.escapeHtml(d.note) + ')';
      } else if (d.status !== 'using') {
        label += ' (' + Core.escapeHtml(d.status) + ')';
      }
      return '<span class="dept-tag">' + label + '</span>';
    }).join('');
    var categories = (iv.categories || []).map(function (c) { return Core.escapeHtml(c); });
    var rating = '<div class="rating">' + Core.starString(iv.rating);
    if (iv.ratingNote) {
      rating += ' (' + Core.escapeHtml(iv.ratingNote) + ')';
    }
    rating += '</div>';
    return '<a href="' + root + iv.url + '" class="intervention-card" data-tags="' +
             categories.join(' ') + '">' +
      '<h3>' + (iv.icon ? Core.escapeHtml(iv.icon) + ' ' : '') + Core.escapeHtml(iv.name) + '</h3>' +
      rating +
      '<p class="description">' + Core.escapeHtml(iv.description) + '</p>' +
      '<p><strong>Best for:</strong> ' + Core.escapeHtml(iv.bestFor) + '</p>' +
      '<div class="dept-tags">' + depts + '</div>' +
    '</a>';
  }).join('');
})();
