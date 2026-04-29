/* ardops.dev — interviews search & filter (spec 003)
 * Vanilla ES2020. Zero third-party deps. CSP-safe (script-src 'self').
 * Loaded via <script defer src="/assets/js/interviews.js"></script>
 * on /interviews/index.html.
 *
 * Data source: /interviews/index.json (see contracts/index-json-schema.md).
 */
(function () {
  'use strict';

  const ENDPOINT = '/interviews/index.json';
  const DEBOUNCE_MS = 80;
  const TOP_TAGS = 20;

  /**
   * Locate DOM nodes. Bail out gracefully if the page is not the listing.
   */
  const listEl = document.getElementById('interviews-list');
  const inputEl = document.getElementById('interviews-search-input');
  const tagsEl = document.getElementById('interviews-tag-filter');
  const countEl = document.getElementById('interviews-count');
  const emptyEl = document.getElementById('interviews-empty');
  const clearBtn = document.getElementById('interviews-clear-btn');

  if (!listEl || !inputEl || !tagsEl || !countEl) {
    return;
  }

  /** @type {Array<object>} */
  let interviews = [];
  /** @type {Set<string>} */
  const activeTags = new Set();
  let query = '';

  // ── Utilities ──────────────────────────────────────

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateHuman(iso) {
    if (!iso) return '';
    const [y, mo, d] = iso.split('-').map(Number);
    if (!y || !mo || !d) return iso;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    try {
      return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(dt);
    } catch (_e) {
      return iso;
    }
  }

  function initialsOf(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '··';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function debounce(fn, ms) {
    let id = 0;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  // ── Matching ───────────────────────────────────────

  function buildHaystack(item) {
    return normalize(
      [
        item.title,
        item.interviewee && item.interviewee.name,
        item.interviewee && item.interviewee.role,
        item.interviewee && item.interviewee.company,
        item.summary,
        (item.tags || []).join(' '),
      ].join(' ')
    );
  }

  function matches(item, q, tagSet) {
    if (q.length > 0) {
      const haystack = item._haystack || (item._haystack = buildHaystack(item));
      if (!haystack.includes(q)) return false;
    }
    if (tagSet.size > 0) {
      const itemTags = item.tags || [];
      let hit = false;
      for (const t of itemTags) {
        if (tagSet.has(t)) {
          hit = true;
          break;
        }
      }
      if (!hit) return false;
    }
    return true;
  }

  // ── Render ─────────────────────────────────────────

  function avatarMarkup(it) {
    const name = it.interviewee && it.interviewee.name;
    const image = it.interviewee && it.interviewee.image;
    if (image) {
      return (
        '<img class="interview-card-avatar" src="/interviews/' +
        escapeHtml(image) +
        '" alt="Foto de ' +
        escapeHtml(name) +
        '" width="56" height="56" loading="lazy" decoding="async">'
      );
    }
    const initials = escapeHtml(initialsOf(name));
    return (
      '<svg class="interview-card-avatar" role="img" aria-label="Avatar de ' +
      escapeHtml(name) +
      '" viewBox="0 0 64 64" width="56" height="56">' +
      '<circle cx="32" cy="32" r="32" fill="rgba(34,211,238,0.15)"/>' +
      '<text x="32" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" font-weight="600" fill="#22d3ee">' +
      initials +
      '</text></svg>'
    );
  }

  function renderCards(items) {
    if (items.length === 0) {
      listEl.innerHTML = '';
      listEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    listEl.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    const html = items
      .map((it) => {
        const tags = (it.tags || [])
          .map((t) => '<li>#' + escapeHtml(t) + '</li>')
          .join('');
        return (
          '<li class="interview-card">' +
          '<a class="interview-card-link" href="/interviews/' +
          escapeHtml(it.slug) +
          '.html">' +
          avatarMarkup(it) +
          '<div class="interview-card-content">' +
          '<h2 class="interview-card-title">' +
          escapeHtml(it.title) +
          '</h2>' +
          '<p class="interview-card-author">' +
          escapeHtml(it.interviewee.name) +
          ' · ' +
          escapeHtml(it.interviewee.role) +
          ' · ' +
          escapeHtml(it.interviewee.company) +
          '</p>' +
          '<p class="interview-card-summary">' +
          escapeHtml(it.summary) +
          '</p>' +
          '<p class="interview-card-meta">' +
          '<time datetime="' +
          escapeHtml(it.date) +
          '">' +
          escapeHtml(formatDateHuman(it.date)) +
          '</time>' +
          '<span aria-hidden="true"> · </span>' +
          '<span>' +
          (it.readingTime | 0) +
          ' min</span>' +
          '</p>' +
          '<ul class="interview-card-tags">' +
          tags +
          '</ul>' +
          '</div>' +
          '</a>' +
          '</li>'
        );
      })
      .join('');
    listEl.innerHTML = html;
  }

  function renderCount(n) {
    if (!countEl) return;
    if (n === 1) countEl.textContent = '1 entrevista';
    else countEl.textContent = n + ' entrevistas';
  }

  function renderTagChips() {
    const counts = new Map();
    for (const it of interviews) {
      for (const t of it.tags || []) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .slice(0, TOP_TAGS);

    tagsEl.innerHTML = sorted
      .map(
        ([tag, count]) =>
          '<button type="button" aria-pressed="false" data-tag="' +
          escapeHtml(tag) +
          '">#' +
          escapeHtml(tag) +
          ' <span class="visually-hidden">(' +
          count +
          ' entrevista' +
          (count === 1 ? '' : 's') +
          ')</span></button>'
      )
      .join('');
  }

  function syncChipState() {
    const buttons = tagsEl.querySelectorAll('button[data-tag]');
    buttons.forEach((btn) => {
      const tag = btn.getAttribute('data-tag');
      btn.setAttribute('aria-pressed', activeTags.has(tag) ? 'true' : 'false');
    });
  }

  function syncClearVisibility() {
    if (!clearBtn) return;
    clearBtn.hidden = query.length === 0 && activeTags.size === 0;
  }

  function syncURL() {
    try {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      const tagList = Array.from(activeTags);
      if (tagList.length > 0) url.searchParams.set('tag', tagList.join(','));
      else url.searchParams.delete('tag');
      window.history.replaceState({}, '', url.toString());
    } catch (_e) {
      /* no-op */
    }
  }

  function applyFilters() {
    const q = normalize(query);
    const filtered = interviews.filter((it) => matches(it, q, activeTags));
    renderCards(filtered);
    renderCount(filtered.length);
    syncClearVisibility();
    syncURL();
  }

  // ── Event handlers ─────────────────────────────────

  function onInput(ev) {
    query = (ev.target.value || '').trim();
    applyFiltersDebounced();
  }

  function onChipClick(ev) {
    const btn = ev.target.closest('button[data-tag]');
    if (!btn) return;
    const tag = btn.getAttribute('data-tag');
    if (!tag) return;
    if (activeTags.has(tag)) activeTags.delete(tag);
    else activeTags.add(tag);
    syncChipState();
    applyFilters();
  }

  function onClearClick() {
    query = '';
    if (inputEl) inputEl.value = '';
    activeTags.clear();
    syncChipState();
    applyFilters();
    if (inputEl) inputEl.focus();
  }

  const applyFiltersDebounced = debounce(applyFilters, DEBOUNCE_MS);

  // ── Initial state from URL ─────────────────────────

  function readInitialState() {
    try {
      const params = new URL(window.location.href).searchParams;
      const q = params.get('q');
      if (q) {
        query = q.trim();
        if (inputEl) inputEl.value = query;
      }
      const tagParam = params.get('tag');
      if (tagParam) {
        for (const t of tagParam.split(',').map((s) => s.trim()).filter(Boolean)) {
          activeTags.add(t);
        }
      }
    } catch (_e) {
      /* no-op */
    }
  }

  // ── Boot ───────────────────────────────────────────

  function showLoadError(message) {
    listEl.innerHTML = '';
    listEl.hidden = true;
    if (emptyEl) {
      emptyEl.textContent = message;
      emptyEl.hidden = false;
    }
    if (countEl) countEl.textContent = '';
  }

  fetch(ENDPOINT, { credentials: 'omit', cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then((data) => {
      if (!data || data.version !== 1 || !Array.isArray(data.interviews)) {
        throw new Error('unexpected index.json shape');
      }
      interviews = data.interviews.slice().sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)
      );
      readInitialState();
      renderTagChips();
      syncChipState();
      applyFilters();

      inputEl.addEventListener('input', onInput);
      tagsEl.addEventListener('click', onChipClick);
      if (clearBtn) clearBtn.addEventListener('click', onClearClick);
    })
    .catch((err) => {
      showLoadError(
        'No pudimos cargar las entrevistas en este momento. Intentá recargar la página.'
      );
      // eslint-disable-next-line no-console
      console.error('[interviews] failed to load index:', err);
    });
})();
