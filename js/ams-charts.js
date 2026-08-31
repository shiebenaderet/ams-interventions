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

  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars,
    divstack: divstack,
    dumbbell: dumbbell
  };
})();
