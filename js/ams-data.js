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

  render['sources'] = function (mount) {
    var html = '<div class="chart-legend">';
    data.meta.sources.forEach(function (s) {
      html += '<span class="chart-legend-item"><strong>' + Core.escapeHtml(s.k) +
              '</strong> ' + Core.escapeHtml(s.v) + '</span>';
    });
    mount.innerHTML = html + '</div>';
  };

  // Growth against achievement. The crosshair is the school average, so each
  // quadrant reads relative to Alderwood rather than the state.
  function growthScatter(subject, key, avg) {
    var placements = {
      'Asian': 't', 'Black/African American': 'r', 'Hispanic/Latino': 'r',
      'Two or More Races': 'l', 'White': key === 'math' ? 't' : 'r',
      'Female': key === 'math' ? 'l' : 'r', 'Male': key === 'math' ? 'r' : 'l',
      'All Students': 'b'
    };
    var profRows = data.prof.race.concat(data.prof.gender);
    var points = [];
    Object.keys(placements).forEach(function (name) {
      var gr = null, pr = null;
      data.growthSchool.forEach(function (r) { if (r.g === name) gr = r; });
      profRows.forEach(function (r) { if (r.g === name) pr = r; });
      if (!gr || !pr || gr[key] == null || pr[key] == null) return;
      points.push({
        g: name.replace('Black/African American', 'Black/African Am.')
               .replace('Two or More Races', 'Two or more races'),
        x: gr[key], y: pr[key], lp: placements[name],
        ref: name === 'All Students',
        color: name === 'All Students' ? 'var(--faint)' : 'var(--navy)'
      });
    });

    return C.scatter({
      x0: 42, x1: 72, y0: 8, y1: 72,
      xTicks: [45, 50, 55, 60, 65, 70], yTicks: [10, 20, 30, 40, 50, 60],
      ySuffix: '%',
      xLabel: 'Median student growth percentile →',
      yLabel: '% at Level 3 or 4 →',
      refX: avg.x, refY: avg.y,
      quadrants: [
        { text: 'Ahead and pulling away', at: 'ne' },
        { text: 'Ahead but slowing', at: 'nw' },
        { text: 'Behind but catching up', at: 'se' },
        { text: 'Behind and falling further', at: 'sw' }
      ],
      aria: subject + ' growth against proficiency by student group. ' +
            'The full figures are in the data table at the end of this page.',
      points: points
    });
  }

  render['growth-scatter-ela'] = function (m) {
    m.appendChild(growthScatter('English Language Arts', 'ela', { x: 55, y: 46.7 }));
  };
  render['growth-scatter-math'] = function (m) {
    m.appendChild(growthScatter('Math', 'math', { x: 56, y: 32.3 }));
  };

  render['wsif-sparkgrid'] = function (m) {
    m.appendChild(C.sparkgrid(data.wsif, {
      lo: 1, hi: 8.5, gridlines: [2, 4, 6, 8],
      labels: data.wsifYears, tolerance: 0.15
    }));
  };

  var SUBJECTS = [
    { key: 'ela', name: 'ELA', color: 'var(--navy)' },
    { key: 'math', name: 'Math', color: 'var(--warm)' },
    { key: 'sci', name: 'Science', color: 'var(--sage)' }
  ];

  render['prof-race-gender'] = function (m) {
    var rows = [{ header: 'Race / ethnicity' }].concat(data.prof.race,
               [{ header: 'Gender' }], data.prof.gender);
    m.appendChild(C.gbars(rows, SUBJECTS, { max: 80, labelw: '190px' }));
    m.appendChild(subjectLegend());
  };

  render['prof-program'] = function (m) {
    m.appendChild(C.gbars(data.prof.prog, SUBJECTS, { max: 80, labelw: '210px' }));
    m.appendChild(subjectLegend());
  };

  function subjectLegend() {
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML = SUBJECTS.map(function (s) {
      return '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:' +
             s.color + '"></span>' + s.name + '</span>';
    }).join('');
    return l;
  }

  // How far math trails ELA. Sorted so the widest shortfall leads.
  render['math-gap'] = function (m) {
    var rows = data.prof.race.concat(data.prof.gender, data.prof.prog)
      .filter(function (r) { return r.ela != null && r.math != null; })
      .map(function (r) {
        return { g: r.g, v: Math.round((r.math - r.ela) * 10) / 10, ela: r.ela, math: r.math };
      })
      .sort(function (a, b) { return a.v - b.v; });

    m.appendChild(C.divbars(rows, {
      max: 42, labelw: '215px',
      posColor: 'var(--navy)', negColor: 'var(--warm)',
      fmt: function (v) { return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + ' pts'; }
    }));
  };

  render['iready-ela'] = function (m) { m.appendChild(irStack('ela')); };
  render['iready-math'] = function (m) { m.appendChild(irStack('math')); };

  function irStack(subject) {
    var wrap = document.createElement('div');
    wrap.appendChild(C.divstack(data.iready[subject], { labels: data.iLabels }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML = data.iLabels.map(function (label, i) {
      return '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:' +
             window.AMSScales.scaleStep(i) + '"></span>' + Core.escapeHtml(label) + '</span>';
    }).join('');
    wrap.appendChild(l);
    return wrap;
  }

  // The same rows as headcounts. Gender rows contain every student in the
  // school and would dwarf the planning groups; the two smallest race groups
  // are 3 and 5 students, where a count is not meaningful.
  var COUNT_EXCLUDE = /Native Hawaiian|American Indian|Female|Male/;

  function irCounts(subject) {
    return data.iready[subject]
      .filter(function (r) { return !COUNT_EXCLUDE.test(r.g); })
      .map(function (r) {
        var n = window.AMSScales.parseAssessed(r.n);
        return { g: r.g, v: window.AMSScales.pctToCount(r.v[4], n.assessed),
                 pct: r.v[4], n: n.assessed };
      })
      .sort(function (a, b) { return b.v - a.v; });
  }

  render['iready-count-ela'] = function (m) { m.appendChild(irCountBars('ela')); };
  render['iready-count-math'] = function (m) { m.appendChild(irCountBars('math')); };

  function irCountBars(subject) {
    return C.hbars(irCounts(subject), {
      max: 120, labelw: '200px',
      fmt: function (v) { return '≈' + v + ' students'; },
      colorFn: function (r) {
        return r.v >= 80 ? 'var(--scale-bel-3)'
             : (r.v >= 55 ? 'var(--scale-bel-2)' : 'var(--navy)');
      }
    });
  }

  // Two different tests with different cut scores. Not a growth measure —
  // what is worth reading is which groups they disagree about.
  render['iready-vs-sba'] = function (m) {
    var pairs = [['Asian', 61.9, 56], ['Black or African American', 42.5, 51],
      ['Hispanic or Latino', 31.2, 29], ['Two or more Races', 63.3, 48],
      ['White', 54.8, 48], ['Female', 49.7, 48], ['Male', 43.5, 38],
      ['English Learner', 11.9, 14], ['Special Education', 12.2, 14]];
    var rows = pairs.map(function (p) {
      return { g: p[0], a: p[1], b: p[2], v: Math.round((p[2] - p[1]) * 10) / 10 };
    }).sort(function (x, y) { return y.v - x.v; });

    m.appendChild(C.divbars(rows, {
      max: 18, labelw: '215px',
      posColor: 'var(--sage)', negColor: 'var(--warm)',
      fmt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' pts'; }
    }));
  };

  Array.prototype.forEach.call(mounts, function (mount) {
    var id = mount.getAttribute('data-chart');
    if (!render[id]) { return; }
    render[id](mount);
  });
})();
