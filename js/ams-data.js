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

  // Every reference line and crosshair on this page marks a school-wide
  // figure. Look them up from AMSData rather than writing them down: a
  // hardcoded 72.1 would quietly disagree with the tables the next time the
  // handout is updated, and a crosshair in the wrong place misreads every
  // quadrant on the chart it sits in.
  function schoolWide(list, key) {
    var hit = null;
    (list || []).forEach(function (r) { if (r.g === 'All Students') hit = r; });
    if (!hit || hit[key] == null) {
      throw new Error('ams-data: no All Students row for "' + key + '" — ' +
        'a reference line depends on it. Check data/school-data.js.');
    }
    return hit[key];
  }

  var REF = {
    growthEla:  function () { return schoolWide(data.growthSchool, 'ela'); },
    growthMath: function () { return schoolWide(data.growthSchool, 'math'); },
    profEla:    function () { return schoolWide(data.prof.race, 'ela'); },
    profMath:   function () { return schoolWide(data.prof.race, 'math'); },
    attendance: function () { return schoolWide(data.att.all, 'v'); },
    fncNow:     function () { return schoolWide(data.fnc.prog, 'b'); }
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
    m.appendChild(growthScatter('English Language Arts', 'ela', { x: REF.growthEla(), y: REF.profEla() }));
  };
  render['growth-scatter-math'] = function (m) {
    m.appendChild(growthScatter('Math', 'math', { x: REF.growthMath(), y: REF.profMath() }));
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
      fmt: function (v) { return (v < 0 ? '−' : (v > 0 ? '+' : '')) + Math.abs(v).toFixed(1) + ' pts'; }
    }));
  };

  var GROWTH_COLORS = {
    low: 'var(--scale-bel-3)', typical: 'var(--scale-bel-1)', high: 'var(--navy)'
  };

  function growthProgram(key) {
    var rows = data.growthDistrict
      .filter(function (r) { return r[key] != null; })
      .slice()
      .sort(function (a, b) { return b[key] - a[key]; })
      .map(function (r) { return { g: r.g, v: r[key], flag: r.flag }; });

    var wrap = document.createElement('div');
    wrap.appendChild(C.hbars(rows, {
      max: 80, labelw: '210px',
      fmt: function (v) { return v.toFixed(0); },
      colorFn: function (r) { return GROWTH_COLORS[window.AMSScales.growthBand(r.v)]; }
    }));

    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--scale-bel-3)"></span>Low growth (1–33)</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--scale-bel-1)"></span>Typical growth (34–59)</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>High growth (60–99)</span>';
    wrap.appendChild(l);
    return wrap;
  }

  render['growth-prog-ela'] = function (m) { m.appendChild(growthProgram('ela')); };
  render['growth-prog-math'] = function (m) { m.appendChild(growthProgram('math')); };

  // Section 504 beside students with disabilities. Two groups with formal
  // support plans; the growth rows are district-wide and say so.
  render['plan-compare'] = function (m) {
    var rows = [
      { g: 'ELA, % at Level 3+ · Alderwood', a: 12.2, b: 53.3 },
      { g: 'Math, % at Level 3+ · Alderwood', a: 8.7, b: 31.1 },
      { g: 'Science, % at Level 3+ · Alderwood', a: 19.6, b: 41.7 },
      { g: 'Regular attendance · Alderwood', a: 58.2, b: 63.8 },
      { g: 'ELA median growth (SGP) · District', a: 40.0, b: 63.0 },
      { g: 'Math median growth (SGP) · District', a: 50.0, b: 53.0 }
    ];
    m.appendChild(C.dumbbell(rows, {
      max: 95, labelw: '250px', neutral: true,
      aColor: 'var(--warm)', bColor: 'var(--navy)',
      fmt: function (a, b) {
        return '<b>' + b + '</b> Section 504 · ' + a + ' students with disabilities';
      }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Section 504</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--warm)"></span>Students with disabilities</span>';
    m.appendChild(l);
  };

  var ATT_COLORS = {
    critical: 'var(--scale-bel-3)', low: 'var(--scale-bel-1)',
    mid: 'var(--navy)', high: 'var(--sage)'
  };

  render['attendance-all'] = function (m) {
    // data/school-data.js flags the school-wide row with `all: 1`; hbars'
    // contract reads `total` (or `hi`) for its emphasis class and colour.
    // Normalise the name here at the call site rather than changing hbars.
    var allRows = data.att.all.map(function (r) {
      return { g: r.g, v: r.v, total: r.all };
    });
    var rows = [{ header: 'All students' }].concat(allRows,
      [{ header: 'Gender' }], data.att.gender,
      [{ header: 'Race / ethnicity' }], data.att.race,
      [{ header: 'Program and characteristic' }], data.att.prog);

    m.appendChild(C.hbars(rows, {
      max: 100, ref: REF.attendance(), labelw: '215px',
      fmt: function (v) { return v.toFixed(1) + '%'; },
      colorFn: function (r) {
        return r.total ? 'var(--navy-d)' : ATT_COLORS[window.AMSScales.attendanceBand(r.v)];
      }
    }));
    var ref = document.createElement('div');
    ref.className = 'bar-ref-label';
    ref.textContent = 'All Students · ' + REF.attendance().toFixed(1) + '%';
    m.appendChild(ref);
  };

  function attendanceScatter(points, aria) {
    return C.scatter({
      x0: 34, x1: 92, y0: 5, y1: 70,
      xTicks: [40, 50, 60, 70, 80, 90], yTicks: [10, 20, 30, 40, 50, 60],
      xSuffix: '%', ySuffix: '%',
      xLabel: 'Regular attendance →', yLabel: '% at ELA Level 3 or 4 →',
      refX: REF.attendance(), refY: REF.profEla(), aria: aria,
      points: points
    });
  }

  render['attendance-scatter-race'] = function (m) {
    m.appendChild(attendanceScatter([
      { g: 'Asian', x: 83.9, y: 61.9, lp: 'l' },
      { g: 'Black/African Am.', x: 84.9, y: 42.5, lp: 'l' },
      { g: 'Hispanic/Latino', x: 65.4, y: 31.2, lp: 'l' },
      { g: 'Two or more races', x: 68.8, y: 63.3, lp: 't' },
      { g: 'White', x: 68.9, y: 54.8, lp: 'l' },
      { g: 'Female', x: 72.6, y: 49.7, lp: 'r' },
      { g: 'Male', x: 71.7, y: 43.5, lp: 'b' },
      { g: 'All students', x: REF.attendance(), y: REF.profEla(), lp: 'l', ref: true, color: 'var(--faint)' }
    ], 'Attendance against ELA proficiency by race, ethnicity and gender'));
  };

  render['attendance-scatter-prog'] = function (m) {
    m.appendChild(attendanceScatter([
      { g: 'English learners', x: 64.8, y: 11.9, lp: 'r', color: 'var(--warm)' },
      { g: 'Non-ELL', x: 75.3, y: 60.6, lp: 't', color: 'var(--warm)' },
      { g: 'Students w/ disabilities', x: 58.2, y: 12.2, lp: 'l', color: 'var(--warm)' },
      { g: 'Without disabilities', x: 75.4, y: 54.1, lp: 'r', color: 'var(--warm)' },
      { g: 'Low-income', x: 66.8, y: 35.4, lp: 'l', color: 'var(--warm)' },
      { g: 'Non-low income', x: 78.5, y: 61.1, lp: 'r', color: 'var(--warm)' },
      { g: 'Homeless', x: 38.5, y: 15.0, lp: 'r', color: 'var(--warm)' },
      { g: 'Non-homeless', x: 73.4, y: 47.7, lp: 'l', color: 'var(--warm)' },
      { g: 'Section 504', x: 63.8, y: 53.3, lp: 'l', color: 'var(--warm)' }
    ], 'Attendance against ELA proficiency by program and characteristic'));
  };

  function fncDumbbell(rows) {
    return C.dumbbell(rows, {
      max: 34, labelw: '200px',
      aColor: 'var(--line)', bColor: 'var(--navy)',
      fmt: function (a, b) {
        var d = b - a;
        var cls = d > 0 ? 'is-worse' : (d < 0 ? 'is-better' : '');
        var note = d === 0 ? 'no change' : (d > 0 ? '+' : '') + d + ' pts';
        return a + '% → <b>' + b + '%</b> <span class="' + cls + '">' + note + '</span>';
      }
    });
  }

  render['fnc-prog'] = function (m) { m.appendChild(fncDumbbell(data.fnc.prog)); };
  render['fnc-race'] = function (m) { m.appendChild(fncDumbbell(data.fnc.race)); };

  // A group high on both axes is passing the test and failing the class.
  render['fnc-scatter'] = function (m) {
    m.appendChild(C.scatter({
      x0: 0, x1: 25, y0: 5, y1: 70,
      xTicks: [0, 5, 10, 15, 20, 25], yTicks: [10, 20, 30, 40, 50, 60],
      xSuffix: '%', ySuffix: '%',
      xLabel: '% of grades that were F or No Credit →',
      yLabel: '% at ELA Level 3 or 4 →',
      refX: REF.fncNow(), refY: REF.profEla(),
      quadrants: [{ text: 'Passing the test, failing the class', at: 'ne' }],
      aria: 'Failing grade rate against ELA proficiency by group',
      points: [
        { g: 'Asian', x: 2, y: 61.9, lp: 'r' },
        { g: 'Two or more races', x: 13, y: 63.3, lp: 'l' },
        { g: 'White', x: 8, y: 54.8, lp: 'l' },
        { g: 'All students', x: REF.fncNow(), y: REF.profEla(), lp: 'b', ref: true, color: 'var(--faint)' },
        { g: 'Black/African Am.', x: 10, y: 42.5, lp: 'r' },
        { g: 'Free/reduced meals', x: 14, y: 35.4, lp: 'r', color: 'var(--warm)' },
        { g: 'Hispanic/Latino', x: 12, y: 31.2, lp: 'l' },
        { g: 'Homeless', x: 22, y: 15.0, lp: 'l', color: 'var(--warm)' },
        { g: 'Special education', x: 12, y: 12.2, lp: 'r', color: 'var(--warm)' },
        { g: 'Multilingual learners', x: 15, y: 11.9, lp: 'r', color: 'var(--warm)' }
      ]
    }));
  };

  render['survey-dumbbell'] = function (m) {
    var rows = data.survey.rows.map(function (r) {
      return { g: r.g, a: r.rel, b: r.belong };
    });
    m.appendChild(C.dumbbell(rows, {
      max: 100, labelw: '215px', neutral: true,
      aColor: 'var(--navy)', bColor: 'var(--gold)',
      fmt: function (a, b) { return '<b>' + a + '%</b> teachers · ' + b + '% belonging'; }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Teacher–student relationships</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--gold)"></span>Sense of belonging</span>';
    m.appendChild(l);
  };

  // Every measure on one axis. Girls' figure minus boys' figure.
  render['gender-gap'] = function (m) {
    var rows = [
      { g: 'ELA median growth (SGP)', f: 58.5, mm: 51.0 },
      { g: 'ELA, % at Level 3+', f: 49.7, mm: 43.5 },
      { g: 'Regular attendance', f: 72.6, mm: 71.7 },
      { g: 'Math median growth (SGP)', f: 53.0, mm: 57.5 },
      { g: 'Math, % at Level 3+', f: 29.2, mm: 35.1 },
      { g: 'Sense of belonging', f: 62.0, mm: 68.0 },
      { g: 'Science, % at Level 3+', f: 37.2, mm: 44.9 },
      { g: 'Teacher–student relationships', f: 44.0, mm: 55.0 }
    ].map(function (r) {
      return { g: r.g, v: Math.round((r.f - r.mm) * 10) / 10 };
    }).sort(function (a, b) { return b.v - a.v; });

    m.appendChild(C.divbars(rows, {
      max: 13, labelw: '230px',
      posColor: 'var(--navy)', negColor: 'var(--warm)',
      fmt: function (v) { return (v < 0 ? '−' : (v > 0 ? '+' : '')) + Math.abs(v).toFixed(1); }
    }));
    var l = document.createElement('div');
    l.className = 'chart-legend';
    l.innerHTML =
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--navy)"></span>Girls ahead</span>' +
      '<span class="chart-legend-item"><span class="chart-legend-sw" style="background:var(--warm)"></span>Boys ahead</span>';
    m.appendChild(l);
  };

  // Nine tables. These are the text alternative for every chart above, so
  // they carry the full transcription, suppressions included.
  render['all-tables'] = function (m) {
    function num(v) { return v == null ? null : String(Math.round(v * 10) / 10); }
    function pctS(v) { return v == null ? null : (Math.round(v * 10) / 10) + '%'; }

    m.appendChild(C.table(['Group', 'ELA SGP', 'Math SGP'],
      data.growthSchool.map(function (r) { return [r.g, num(r.ela), num(r.math)]; }),
      'student growth, Alderwood 2024–25'));

    m.appendChild(C.table(['Group', 'ELA SGP', 'Math SGP'],
      data.growthDistrict.map(function (r) { return [r.g, num(r.ela), num(r.math)]; }),
      'student growth, Edmonds School District 2024–25'));

    m.appendChild(C.table(['Group', 'ELA L3+', 'Math L3+', 'Science L3+'],
      data.prof.race.concat(data.prof.gender, data.prof.prog).map(function (r) {
        return [r.g, pctS(r.ela), pctS(r.math), pctS(r.sci)];
      }), 'proficiency (Level 3 or 4), 2024–25'));

    m.appendChild(C.table(['Group'].concat(data.wsifYears, ['Change']),
      data.wsif.map(function (r) {
        var d = window.AMSScales.delta(r.v[0], r.v[2]);
        return [r.g,
                r.v[0] == null ? null : r.v[0].toFixed(2),
                r.v[1] == null ? null : r.v[1].toFixed(2),
                r.v[2] == null ? null : r.v[2].toFixed(2),
                d == null ? null : (d.value > 0 ? '+' : '') + d.value.toFixed(2)];
      }), 'WSIF final score'));

    m.appendChild(C.table(['Group', 'Regular attendance'],
      data.att.all.concat(data.att.gender, data.att.race, data.att.prog)
        .map(function (r) { return [r.g, pctS(r.v)]; }),
      'attendance, 2024–25'));

    ['ela', 'math'].forEach(function (subject) {
      m.appendChild(C.table(
        ['Group', 'Assessed'].concat(data.iLabels),
        data.iready[subject].map(function (r) {
          return [r.g, r.n].concat(r.v.map(function (v) { return v == null ? null : v + '%'; }));
        }),
        'i-Ready ' + (subject === 'ela' ? 'reading' : 'math') + ', Spring 2026'));
    });

    m.appendChild(C.table(['Group', 'S2 24–25', 'S2 25–26', 'Change'],
      data.fnc.prog.concat(data.fnc.race).map(function (r) {
        if (r.a == null) return [r.g, null, null, null];
        var d = r.b - r.a;
        return [r.g, r.a + '%', r.b + '%', (d > 0 ? '+' : '') + d + ' pts'];
      }), 'F / No-Credit grades'));

    m.appendChild(C.table(['Group', 'Teacher relationships', 'Sense of belonging'],
      [['All students', data.survey.overall.rel + '%', data.survey.overall.belong + '%']]
        .concat(data.survey.rows.map(function (r) {
          return [r.g, r.rel == null ? null : r.rel + '%',
                       r.belong == null ? null : r.belong + '%'];
        })),
      'student survey, Spring 2026'));
  };

  Array.prototype.forEach.call(mounts, function (mount) {
    var id = mount.getAttribute('data-chart');
    if (!render[id]) { return; }
    render[id](mount);
  });
})();
