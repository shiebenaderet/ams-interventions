(function () {
  'use strict';
  var data = window.AMS, Core = window.AMSCore;
  if (!data || !Core) return;

  var root = document.body.getAttribute('data-root') || '';
  var open = false, results = [], active = 0, lastFocus = null;

  var el = document.createElement('div');
  el.className = 'ams-palette';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Search interventions');
  el.hidden = true;
  el.innerHTML =
    '<div class="ams-palette__box">' +
      '<input type="text" class="ams-palette__input" id="amsQ" autocomplete="off" ' +
             'placeholder="Search interventions…" aria-label="Search interventions" ' +
             'role="combobox" aria-autocomplete="list" ' +
             'aria-controls="amsResults" aria-expanded="false">' +
      '<div class="ams-palette__results" id="amsResults" role="listbox"></div>' +
      '<p class="sr-only" id="amsStatus" role="status" aria-live="polite"></p>' +
      '<p class="ams-palette__hint"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p>' +
    '</div>';
  document.body.appendChild(el);

  var input = el.querySelector('#amsQ');
  var list = el.querySelector('#amsResults');

  function render() {
    if (!results.length) {
      list.innerHTML = input.value.trim()
        ? '<p class="ams-palette__empty">No matches.</p>'
        : '<p class="ams-palette__empty">Type to search all 26 interventions.</p>';
      input.removeAttribute('aria-activedescendant');
      return;
    }
    list.innerHTML = results.map(function (r, i) {
      var sel = i === active ? ' is-active' : '';
      var idAttr = ' id="ams-opt-' + i + '" tabindex="-1"';
      if (r.kind === 'dept') {
        return '<a class="ams-palette__item' + sel + '"' + idAttr + ' role="option" aria-selected="' +
               (i === active) + '" href="' + root + 'departments.html">' +
               '<span class="ams-palette__t">' + Core.escapeHtml(r.name) + '</span>' +
               '<span class="ams-palette__s">Department</span></a>';
      }
      return '<a class="ams-palette__item' + sel + '"' + idAttr + ' role="option" aria-selected="' +
             (i === active) + '" href="' + root + r.iv.url + '">' +
             '<span class="ams-palette__t">' + (r.iv.icon ? Core.escapeHtml(r.iv.icon) + ' ' : '') + Core.escapeHtml(r.iv.name) + '</span>' +
             '<span class="tier-chip t' + r.iv.tier + '">Tier ' + r.iv.tier + '</span></a>';
    }).join('');
    input.setAttribute('aria-activedescendant', 'ams-opt-' + active);
  }

  function update() {
    var found = Core.searchAll(data, input.value);
    results = found.interventions.map(function (iv) { return { kind: 'iv', iv: iv }; })
      .concat(found.departments.map(function (n) { return { kind: 'dept', name: n }; }));
    active = 0;
    input.setAttribute('aria-expanded', results.length ? 'true' : 'false');
    render();
    // Screen readers get a count; the visual list alone announces nothing.
    var status = document.getElementById('amsStatus');
    if (status) {
      status.textContent = !input.value.trim() ? ''
        : results.length === 0 ? 'No matches.'
        : results.length + (results.length === 1 ? ' result.' : ' results.');
    }
  }

  function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    el.hidden = false;
    input.value = '';
    update();
    input.focus();
  }

  function hide() {
    if (!open) return;
    open = false;
    el.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); open ? hide() : show(); return;
    }
    if (e.key === '/' && !open && !typing) { e.preventDefault(); show(); return; }
    if (!open) return;

    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'Tab') {
      // Trap focus: the input is the only focusable element in the palette,
      // so Tab and Shift+Tab both simply keep focus there.
      e.preventDefault(); input.focus(); return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault(); active = Math.max(active - 1, 0); render(); return;
    }
    if (e.key === 'Enter' && results.length) {
      e.preventDefault();
      var link = list.querySelectorAll('.ams-palette__item')[active];
      if (link) window.location.href = link.getAttribute('href');
    }
  });

  input.addEventListener('input', update);
  el.addEventListener('click', function (e) { if (e.target === el) hide(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ams-search]') : null;
    if (t) { e.preventDefault(); show(); }
  });
})();
