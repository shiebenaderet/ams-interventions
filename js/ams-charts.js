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

      var set = el('div', 'gb-set');
      series.forEach(function (s, i) {
        var line = el('div', 'gb-line');
        if (r[s.key] == null) {
          // Say it once per row, not once per series.
          if (i === 0) line.appendChild(notReported());
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
    var max = o.max || Math.max.apply(null, rows.map(function (r) { return Math.abs(r.v); })) * 1.15;
    var box = el('div', 'bars');

    rows.forEach(function (r) {
      var row = el('div', 'div-row');
      row.style.setProperty('--labelw', o.labelw || '210px');
      row.appendChild(el('div', 'div-lab', Core.escapeHtml(r.g)));

      var track = el('div', 'div-track');
      track.appendChild(el('div', 'div-axis'));

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

      row.appendChild(track);
      box.appendChild(row);
    });
    return box;
  }

  window.AMSCharts = {
    hbars: hbars,
    gbars: gbars,
    divbars: divbars
  };
})();
