/* ardops.dev — main.js (vanilla ES2022, ≤2KB, defer) */
(() => {
  'use strict';

  // Fill <span data-year> with current year (footer copyright).
  const setYear = () => {
    const y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = y;
    });
  };

  // Improve skip-link UX: ensure focus moves to <main> on activation.
  const wireSkipLink = () => {
    const link = document.querySelector('.skip-link');
    const target = document.getElementById('main');
    if (!link || !target) return;
    link.addEventListener('click', () => {
      // Make <main> programmatically focusable then focus it.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: false });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setYear(); wireSkipLink(); });
  } else {
    setYear();
    wireSkipLink();
  }
})();
