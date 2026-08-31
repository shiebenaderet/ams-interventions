/* AMS student data — chart primitives.
 *
 * Each function takes rows plus options and returns a detached DOM element for
 * the caller to append. They never read the document and never fetch data, so
 * the same primitive serves any section of data.html.
 *
 * A null value is a suppressed group (N<10). Every primitive renders that as
 * the words "not reported (N<10)" — never a zero-length bar, which would read
 * as a real zero.
 *
 * Ordered scales must also print their value as text: colour is never the only
 * channel carrying meaning.
 */
(function () {
  'use strict';
  var Core = window.AMSCore;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function notReported() {
    return el('span', 'bar-nd', 'not reported (N&lt;10)');
  }

  function pct(v) {
    return v == null ? '—' : (Math.round(v * 10) / 10) + '%';
  }

  /* ---- horizontal bars ------------------------------------------------- */
  function hbars(rows, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      if (r.header) {
        box.appendChild(el('div', 'bar-group-label', Core.escapeHtml(r.header)));
        return;
      }
      var row = el('div', 'bar-row' + (r.total || r.hi ? ' is-total' : ''));
      if (o.labelw) row.style.setProperty('--labelw', o.labelw);
      row.appendChild(el('div', 'bar-lab', Core.escapeHtml(r.g)));

      var track = el('div', 'bar-track');
      if (r.v == null) {
        track.appendChild(notReported());
      } else {
        var w = Math.max(0, Math.min(100, r.v / max * 100));
        var fill = el('div', 'bar-fill');
        fill.style.width = w + '%';
        if (o.colorFn) fill.style.background = o.colorFn(r);
        track.appendChild(fill);

        var val = el('span', 'bar-val', Core.escapeHtml(o.fmt ? o.fmt(r.v) : pct(r.v)));
        val.style.left = w + '%';
        track.appendChild(val);
      }
      if (o.ref != null) {
        var ref = el('div', 'bar-ref');
        ref.style.left = (o.ref / max * 100) + '%';
        track.appendChild(ref);
      }
      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- grouped bars, one line per series ------------------------------- */
  function gbars(rows, series, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      if (r.header) {
        box.appendChild(el('div', 'bar-group-label', Core.escapeHtml(r.header)));
        return;
      }
      var row = el('div', 'gb-row');
      if (o.labelw) row.style.setProperty('--labelw', o.labelw);
      row.appendChild(el('div', 'gb-lab', Core.escapeHtml(r.g)));

      var allNull = series.every(function (s) { return r[s.key] == null; });

      var set = el('div', 'gb-set');
      series.forEach(function (s, i) {
        var line = el('div', 'gb-line');
        if (r[s.key] == null) {
          // A row where every series is suppressed only needs to say so once.
          // A row where only some series are suppressed must mark each one —
          // otherwise a partially-suppressed measure reads as simply absent.
          if (!allNull || i === 0) line.appendChild(notReported());
        } else {
          var w = Math.max(0, Math.min(100, r[s.key] / max * 100));
          var fill = el('div', 'gb-fill');
          fill.style.width = w + '%';
          fill.style.background = s.color;
          line.appendChild(fill);
          var val = el('span', 'gb-val', Core.escapeHtml(pct(r[s.key])));
          val.style.left = w + '%';
          line.appendChild(val);
        }
        set.appendChild(line);
      });
      row.appendChild(set);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- diverging bars centred on zero ---------------------------------- */
  function divbars(rows, opts) {
    var o = opts || {};
    var max = o.max;
    if (max == null) {
      // Nulls contribute 0, not NaN (Math.abs(null) is 0), so this can't come
      // out NaN even for an all-suppressed rows array — but an all-null (or
      // empty) array would compute a max of 0, and dividing by that would
      // still be wrong if this value were ever used. It never is: every row
      // that reaches the width math below has already passed the r.v == null
      // guard. This fallback just keeps `max` a sane, finite number regardless.
      var widest = Math.max.apply(null, rows.map(function (r) {
        return r.v == null ? 0 : Math.abs(r.v);
      }).concat([0]));
      max = widest > 0 ? widest * 1.15 : 1;
    }
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var row = el('div', 'div-row');
      row.style.setProperty('--labelw', o.labelw || '210px');
      row.appendChild(el('div', 'div-lab', Core.escapeHtml(r.g)));

      var track = el('div', 'div-track');
      track.appendChild(el('div', 'div-axis'));

      if (r.v == null) {
        track.appendChild(notReported());
      } else {
        var w = Math.abs(r.v) / max * 50;
        var fill = el('div', 'div-fill');
        fill.style.width = w + '%';
        fill.style.background = r.v >= 0 ? (o.posColor || 'var(--navy)') : (o.negColor || 'var(--warm)');
        if (r.v >= 0) fill.style.left = '50%'; else fill.style.right = '50%';
        track.appendChild(fill);

        var val = el('div', 'div-val', Core.escapeHtml(
          o.fmt ? o.fmt(r.v) : ((r.v > 0 ? '+' : '') + r.v.toFixed(1))));
        if (r.v >= 0) { val.style.left = (50 + w) + '%'; val.style.paddingLeft = '.5rem'; }
        else { val.style.right = (50 + w) + '%'; val.style.paddingRight = '.5rem'; }
        track.appendChild(val);
      }

      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- diverging stack, split at the on-grade boundary ----------------- */
  function divstack(rows, opts) {
    var o = opts || {};
    var S = window.AMSScales;

    // Every row shares one axis position, so the widest on-grade share and the
    // widest below-grade share together define the drawing width. A row whose
    // placement() comes back null (malformed v) is suppressed and must not
    // widen or narrow that shared axis.
    var maxOn = 0, maxBelow = 0;
    rows.forEach(function (r) {
      var p = S.placement(r.v);
      if (!p) return;
      if (p.onGrade > maxOn) maxOn = p.onGrade;
      if (p.below > maxBelow) maxBelow = p.below;
    });
    var span = maxOn + maxBelow;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var p = S.placement(r.v);
      var row = el('div', 'stack-row');
      row.style.setProperty('--labelw', o.labelw || '250px');
      row.appendChild(el('div', 'stack-lab', Core.escapeHtml(r.g)));

      if (!p) {
        var ndOuter = el('div', 'stack-outer');
        ndOuter.appendChild(notReported());
        row.appendChild(ndOuter);
        box.appendChild(row);
        return;
      }

      var outer = el('div', 'stack-outer');
      var stack = el('div', 'stack');
      stack.style.marginLeft = ((maxOn - p.onGrade) / span * 100) + '%';
      stack.style.width = (p.total / span * 100) + '%';

      r.v.forEach(function (value, i) {
        if (!value) return;
        var seg = el('div', 'stack-seg');
        seg.style.flex = value + ' 0 0';
        seg.style.background = S.scaleStep(i);
        // opts.labels carries the caller's step labels (e.g. data.iLabels).
        // A primitive never reaches for page-specific globals, so degrade
        // gracefully — omit the title — when the caller doesn't pass them.
        if (o.labels && o.labels[i] != null) {
          seg.setAttribute('title', r.g + ' — ' + o.labels[i] + ': ' + value + '%');
        }
        stack.appendChild(seg);
      });
      outer.appendChild(stack);

      var axis = el('div', 'stack-axis');
      axis.style.left = (maxOn / span * 100) + '%';
      outer.appendChild(axis);

      // On-grade share to the left of the axis, worst-case share to the right.
      var left = el('div', 'stack-end', p.onGrade + '%');
      left.style.right = (100 - (maxOn - p.onGrade) / span * 100) + '%';
      left.style.paddingRight = '.45rem';
      outer.appendChild(left);

      var right = el('div', 'stack-end stack-end--worst', r.v[4] + '%');
      right.style.left = ((maxOn + p.below) / span * 100) + '%';
      right.style.paddingLeft = '.45rem';
      outer.appendChild(right);

      row.appendChild(outer);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- dumbbell: two points on one track ------------------------------- */
  function dumbbell(rows, opts) {
    var o = opts || {};
    var max = o.max || 100;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var row = el('div', 'db-row');
      row.style.setProperty('--labelw', o.labelw || '210px');
      row.appendChild(el('div', 'db-lab-text', Core.escapeHtml(r.g)));

      var track = el('div', 'db-track');
      if (r.a == null || r.b == null) {
        track.appendChild(notReported());
        row.appendChild(track);
        box.appendChild(row);
        return;
      }

      var xa = r.a / max * 100, xb = r.b / max * 100;
      var moved = r.b > r.a ? ' is-worse' : (r.b < r.a ? ' is-better' : '');
      var line = el('div', 'db-line' + (o.neutral ? '' : moved));
      line.style.left = Math.min(xa, xb) + '%';
      line.style.width = Math.abs(xb - xa) + '%';
      track.appendChild(line);

      var d1 = el('div', 'db-dot');
      d1.style.left = xa + '%';
      d1.style.background = o.aColor || 'var(--line)';
      var d2 = el('div', 'db-dot');
      d2.style.left = xb + '%';
      d2.style.background = o.bColor || 'var(--navy)';
      track.appendChild(d1);
      track.appendChild(d2);

      var val = el('div', 'db-val', o.fmt
        ? o.fmt(r.a, r.b)
        : Core.escapeHtml(r.a + (o.unit || '') + ' → ') + '<b>' +
          Core.escapeHtml(r.b + (o.unit || '')) + '</b>');
      val.style.left = Math.max(xa, xb) + '%';
      track.appendChild(val);

      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  /* ---- small multiples on one shared scale ----------------------------- */
  function sparkgrid(rows, opts) {
    var o = opts || {};
    var S = window.AMSScales;
    var lo = o.lo == null ? 0 : o.lo;
    var hi = o.hi == null ? 10 : o.hi;
    var labels = o.labels || [];
    var W = 100, H = 52;
    var grid = el('div', 'spark-grid');

    rows.forEach(function (r) {
      var panel = el('div', 'spark');
      panel.appendChild(el('h4', null, Core.escapeHtml(r.g)));

      // A row whose v array is missing or contains a null is a suppressed
      // group (N<10). It must render as words, never as a partial or
      // zero-length line — and it must never crash the rest of the grid.
      var vOk = Array.isArray(r.v) && r.v.length > 1 &&
        r.v.every(function (v) { return v != null; });
      if (!vOk) {
        panel.appendChild(notReported());
        grid.appendChild(panel);
        return;
      }

      var d = S.delta(r.v[0], r.v[r.v.length - 1], o.tolerance || 0);
      var mark = d.direction === 'flat' ? '→' : (d.direction === 'up' ? '▲' : '▼');
      panel.appendChild(el('div', 'spark-delta is-' + d.direction,
        mark + ' ' + (d.value > 0 ? '+' : '') + d.value.toFixed(2) + ' since ' +
        Core.escapeHtml(labels[0] || 'start')));

      var sx = function (i) { return 6 + i * (W - 12) / (r.v.length - 1); };
      var sy = function (v) { return H - 6 - (v - lo) / (hi - lo) * (H - 12); };

      var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
      (o.gridlines || []).forEach(function (v) {
        g += '<line x1="0" x2="' + W + '" y1="' + sy(v) + '" y2="' + sy(v) +
             '" stroke="var(--line-2)" stroke-width=".8" vector-effect="non-scaling-stroke"/>';
      });
      g += '<polyline points="' + r.v.map(function (v, i) { return sx(i) + ',' + sy(v); }).join(' ') +
           '" fill="none" stroke="var(--navy)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
      r.v.forEach(function (v, i) {
        var last = i === r.v.length - 1;
        g += '<circle cx="' + sx(i) + '" cy="' + sy(v) + '" r="' + (last ? 3.2 : 2.2) +
             '" fill="' + (last ? 'var(--navy)' : 'var(--faint)') +
             '" stroke="var(--cream)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
      });
      g += '</svg>';

      var svg = el('div', null, g);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', r.g + ': ' +
        labels.map(function (l, i) { return l + ' ' + r.v[i].toFixed(2); }).join(', '));
      panel.appendChild(svg);

      var xs = el('div', 'spark-x');
      labels.forEach(function (l) { xs.appendChild(el('span', null, Core.escapeHtml(l))); });
      panel.appendChild(xs);
      panel.appendChild(el('div', 'spark-now', r.v[r.v.length - 1].toFixed(2)));
      grid.appendChild(panel);
    });
    return grid;
  }

  /* ---- labelled scatter ------------------------------------------------ */
  function scatter(o) {
    var W = o.w || 720, H = o.h || 420;
    var mL = 58, mR = 26, mT = 18, mB = 52;
    var px = function (v) { return mL + (v - o.x0) / (o.x1 - o.x0) * (W - mL - mR); };
    var py = function (v) { return H - mB - (v - o.y0) / (o.y1 - o.y0) * (H - mT - mB); };

    // A point with no x or y has nowhere on the plane that means "withheld" —
    // (0,0) would be a lie about a student group, not a suppression marker.
    // Refuse to plot it, but don't let it vanish silently: name it in the
    // aria-label so the omission is discoverable. Visible prose is the
    // caller's job.
    var isNum = function (v) { return typeof v === 'number' && isFinite(v); };
    var points = o.points || [];
    var valid = [], skipped = [];
    points.forEach(function (p) {
      if (isNum(p.x) && isNum(p.y)) valid.push(p); else skipped.push(p.g);
    });

    var aria = o.aria || '';
    if (skipped.length) {
      aria += ' Not shown because figures were suppressed: ' + skipped.join(', ') + '.';
    }

    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
            Core.escapeHtml(aria) + '">';

    (o.yTicks || []).forEach(function (v) {
      g += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + py(v) + '" y2="' + py(v) + '" stroke="var(--line-2)"/>';
      g += '<text x="' + (mL - 9) + '" y="' + (py(v) + 4) + '" text-anchor="end" font-size="10.5" fill="var(--faint)" font-variant-numeric="tabular-nums">' + Core.escapeHtml(v + (o.ySuffix || '')) + '</text>';
    });
    (o.xTicks || []).forEach(function (v) {
      g += '<line y1="' + mT + '" y2="' + (H - mB) + '" x1="' + px(v) + '" x2="' + px(v) + '" stroke="var(--line-2)"/>';
      g += '<text y="' + (H - mB + 16) + '" x="' + px(v) + '" text-anchor="middle" font-size="10.5" fill="var(--faint)" font-variant-numeric="tabular-nums">' + Core.escapeHtml(v + (o.xSuffix || '')) + '</text>';
    });

    if (o.refX != null) g += '<line x1="' + px(o.refX) + '" x2="' + px(o.refX) + '" y1="' + mT + '" y2="' + (H - mB) + '" stroke="var(--faint)" stroke-dasharray="4 4"/>';
    if (o.refY != null) g += '<line y1="' + py(o.refY) + '" y2="' + py(o.refY) + '" x1="' + mL + '" x2="' + (W - mR) + '" stroke="var(--faint)" stroke-dasharray="4 4"/>';

    (o.quadrants || []).forEach(function (q) {
      var east = q.at === 'ne' || q.at === 'se';
      var top = q.at === 'ne' || q.at === 'nw';
      g += '<text class="sc-quad" x="' + (east ? W - mR - 6 : mL + 6) + '" y="' + (top ? mT + 14 : H - mB - 8) +
           '" text-anchor="' + (east ? 'end' : 'start') + '">' + Core.escapeHtml(q.text) + '</text>';
    });

    g += '<text class="sc-axis" x="' + ((mL + W - mR) / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + Core.escapeHtml(o.xLabel) + '</text>';
    g += '<text class="sc-axis" transform="translate(14,' + ((mT + H - mB) / 2) + ') rotate(-90)" text-anchor="middle">' + Core.escapeHtml(o.yLabel) + '</text>';

    valid.forEach(function (p) {
      var X = px(p.x), Y = py(p.y);
      g += '<circle cx="' + X + '" cy="' + Y + '" r="6.5" fill="' + Core.escapeHtml(p.color || 'var(--navy)') +
           '" stroke="var(--cream)" stroke-width="2"/>';
      var lx = X + 12, ly = Y + 4, anchor = 'start';
      if (p.lp === 'l') { lx = X - 12; anchor = 'end'; }
      else if (p.lp === 't') { lx = X; ly = Y - 13; anchor = 'middle'; }
      else if (p.lp === 'b') { lx = X; ly = Y + 21; anchor = 'middle'; }
      g += '<text class="sc-point-label' + (p.ref ? ' is-ref' : '') + '" x="' + lx + '" y="' + ly +
           '" text-anchor="' + anchor + '">' + Core.escapeHtml(p.g) + '</text>';
    });

    g += '</svg>';
    return el('div', 'scatter-wrap', g);
  }

  /* ---- data table: the charts' text alternative ------------------------ */
  function table(cols, rows, caption) {
    var id = 'table-' + caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var d = el('details', 'data-table');
    d.appendChild(el('summary', null, 'Data table — ' + Core.escapeHtml(caption)));

    var html = '<table><caption class="sr-only">' + Core.escapeHtml(caption) +
               '</caption><thead><tr>';
    cols.forEach(function (c) { html += '<th scope="col">' + Core.escapeHtml(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>';
      r.forEach(function (v, i) {
        var cell = v == null
          ? '<span class="bar-nd">not reported</span>'
          : Core.escapeHtml(String(v));
        html += i === 0 ? '<th scope="row">' + cell + '</th>' : '<td>' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    var scroll = el('div', 'data-table-scroll', html);
    // The id lives on this inner wrapper, not on <details> itself: a fragment
    // link that targets the <details> element directly does not trigger the
    // browser's native "open the closed ancestor <details>" behaviour, because
    // that algorithm only acts on ancestors of the target — and the <details>
    // is never itself hidden, so it's never an ancestor that needs revealing.
    // Targeting a descendant (this wrapper) makes <details> an ancestor of the
    // target, so it gets force-opened, which is the whole point of the link.
    scroll.id = id;
    d.appendChild(scroll);
    return d;
  }

  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars,
    divstack: divstack,
    dumbbell: dumbbell,
    sparkgrid: sparkgrid,
    scatter: scatter,
    table: table
  };
})();
