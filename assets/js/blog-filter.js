// blog-filter.js — progressive enhancement for /blog/.
// CSP: script-src 'self'. No deps. ES2022 module.
(() => {
  const root = document.querySelector('.blog-index');
  if (!root) return;

  const dataEl = root.querySelector('#blog-index');
  if (!dataEl) return;
  let posts;
  try {
    posts = JSON.parse(dataEl.textContent || '[]');
  } catch {
    return;
  }
  if (!Array.isArray(posts) || posts.length === 0) return;

  // Reveal search input now that JS is alive
  const searchWrap = root.querySelector('.blog-search');
  const searchInput = root.querySelector('#blog-search-input');
  if (searchWrap) searchWrap.hidden = false;

  const cards = Array.from(root.querySelectorAll('[data-card]'));
  const radios = Array.from(
    root.querySelectorAll('input[name="blog-tag"]'),
  );
  const output = root.querySelector('.blog-results-count');
  const empty = root.querySelector('.blog-empty');
  const clearBtn = root.querySelector('.blog-clear-filters');

  const norm = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const idx = new Map();
  for (const p of posts) {
    idx.set(p.slug, {
      title: norm(p.title),
      summary: norm(p.summary),
      tags: (p.tags || []).map(norm),
    });
  }

  const state = { tag: '', q: '' };

  const matches = (slug) => {
    const e = idx.get(slug);
    if (!e) return false;
    if (state.tag && !e.tags.includes(state.tag)) return false;
    if (state.q) {
      const q = norm(state.q);
      if (
        !e.title.includes(q) &&
        !e.summary.includes(q) &&
        !e.tags.some((t) => t.includes(q))
      ) {
        return false;
      }
    }
    return true;
  };

  const apply = () => {
    let visible = 0;
    for (const card of cards) {
      const slug = card.dataset.slug;
      const ok = matches(slug);
      // When tag filter is non-empty, CSS :has() may already hide; we
      // still toggle `hidden` so search works correctly together.
      card.hidden = !ok;
      if (ok) visible++;
    }
    if (output) {
      output.textContent = state.q || state.tag
        ? `${visible} resultado${visible === 1 ? '' : 's'}`
        : '';
    }
    if (empty) empty.hidden = visible > 0;
    if (clearBtn) clearBtn.hidden = !(state.tag || state.q);
  };

  // Tag radio changes
  for (const r of radios) {
    r.addEventListener('change', () => {
      state.tag = r.value || '';
      apply();
    });
  }

  // Search input with 60ms debounce
  let t = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.q = searchInput.value.trim();
        apply();
      }, 60);
    });
  }

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.tag = '';
      state.q = '';
      const all = root.querySelector('#blog-tag-all');
      if (all) all.checked = true;
      if (searchInput) searchInput.value = '';
      apply();
    });
  }

  // Honor ?tag= deep-link
  const params = new URLSearchParams(location.search);
  const initial = params.get('tag');
  if (initial) {
    const r = root.querySelector(`#blog-tag-${CSS.escape(initial)}`);
    if (r) {
      r.checked = true;
      state.tag = initial;
    }
  }
  apply();
})();
