/*
 * assets/js/copy-bio.js — spec 012
 *
 * Módulo opcional vanilla. Permite copiar al portapapeles el texto
 * plano de una bio. Si navigator.clipboard no está disponible,
 * degrada gracefully: el <details> nativo sigue exponiendo el texto.
 *
 * Contrato: specs/012-speaking-page/contracts/copy-bio-contract.md
 *
 * Restricciones:
 *   - cero deps, cero globals, cero eval, cero innerHTML.
 *   - listener delegado en <main>.
 *   - cumple CSP (script-src 'self', sin unsafe-inline).
 */
(function () {
  'use strict';

  function setStatus(el, msg) {
    if (!el) return;
    el.textContent = msg;
    setTimeout(function () { el.textContent = ''; }, 2000);
  }

  function onClick(event) {
    var btn = event.target.closest('[data-copy-target]');
    if (!btn) return;
    var targetEl = document.getElementById(btn.getAttribute('data-copy-target'));
    var statusEl = document.getElementById(btn.getAttribute('data-copy-status'));
    if (!targetEl) return;
    var text = (targetEl.innerText || targetEl.textContent || '').trim();
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      setStatus(statusEl, 'Copia no disponible — usá la selección manual');
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () { setStatus(statusEl, 'Copiado ✓'); },
      function () { setStatus(statusEl, 'No se pudo copiar — selección manual abajo ↓'); }
    );
  }

  function init() {
    var root = document.querySelector('main') || document;
    root.addEventListener('click', onClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
