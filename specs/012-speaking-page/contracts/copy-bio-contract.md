# Contract: assets/js/copy-bio.js

> Módulo opcional vanilla. Cargado con `defer` desde
> `speaking/index.html`. Cero dependencias. ≤ 1 KB minificado.

## Responsabilidad

Permitir que el visitante copie al portapapeles el texto plano de
una bio con un solo click, dando feedback accesible. Si la API no
está disponible, no rompe la página: el `<details>` nativo sigue
exponiendo el texto seleccionable.

## API DOM esperada

El módulo busca, dentro del `<main>`, **cualquier** elemento con
atributo `data-copy-target`. Este atributo contiene el `id` del
elemento cuyo texto se copia.

```html
<button type="button"
        data-copy-target="bio-medium-text"
        data-copy-status="bio-medium-status">
  Copiar bio media
</button>
<span id="bio-medium-status" data-copy-status-target aria-live="polite"></span>
```

| Atributo | Quién lo lleva | Significado |
|----------|----------------|-------------|
| `data-copy-target` | el botón | id del nodo cuyo texto se copia |
| `data-copy-status` | el botón | id del nodo donde se imprime el feedback |
| `data-copy-status-target` | el `<span>` de status | marca el nodo como destino del feedback (sanity) |
| `aria-live="polite"` | el `<span>` de status | el lector de pantalla anuncia los cambios sin interrumpir |

## Comportamiento

1. **En `DOMContentLoaded`**: registra **un solo** listener `click`
   delegado en `document.querySelector('main')` (o `document` si no
   hay `<main>`).
2. **Filtra**: si `event.target.closest('[data-copy-target]')` no
   matchea, retorna sin hacer nada.
3. **Resuelve targets**:
   - `targetId = button.getAttribute('data-copy-target')`
   - `statusId = button.getAttribute('data-copy-status')`
   - `targetEl = document.getElementById(targetId)`
   - `statusEl = document.getElementById(statusId)`
   - Si `targetEl` no existe, retorna sin hacer nada.
4. **Extrae texto plano**: `text = targetEl.innerText.trim()`.
   `innerText` (no `textContent`) preserva los saltos de párrafo
   visibles que el usuario espera al pegar.
5. **Verifica capacidad**:
   - Si `navigator.clipboard?.writeText` no es función → ir al paso
     **fallback**.
6. **Copia**:
   ```js
   navigator.clipboard.writeText(text)
     .then(() => setStatus(statusEl, 'Copiado ✓'))
     .catch(() => setStatus(statusEl, 'No se pudo copiar — selección manual abajo ↓'));
   ```
7. **Feedback** (`setStatus`):
   - Asigna `statusEl.textContent = msg`.
   - Tras 2000 ms, `statusEl.textContent = ''`.
   - Si `statusEl` no existe, no falla (gracefully no-op).
8. **Fallback** (cuando la API no existe):
   - `setStatus(statusEl, 'Copia no disponible — usá la selección manual')`.
   - El `<details>` ya estaba expandido (`open` tras click en
     `<summary>`), el usuario selecciona con el mouse.

## Restricciones

- **CSP**: cero `eval`, cero `new Function`, cero string-listeners,
  cero `innerHTML`. Solo `addEventListener`, `getAttribute`,
  `getElementById`, `innerText`/`textContent`,
  `navigator.clipboard.writeText`. Pasa `tests/csp-no-unsafe-inline.sh`.
- **Sin handlers inline en HTML**: cero `onclick="…"`. La página NUNCA
  renderiza atributos `on*`.
- **Sin globals**: el módulo se ejecuta en una IIFE (`(function(){…})();`)
  o en strict mode top-level; cero exports al `window`.
- **Sin polyfills**: si el browser no tiene `navigator.clipboard`, el
  fallback degrada graciosamente.
- **Tamaño**: ≤ 1 KB minificado. El código de referencia (≤ 60 LOC sin
  minificar) cumple sobradamente.

## Pseudocódigo de referencia

```js
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
```

## Tests / verificación

- **Unit-ish (manual)**: cargar `/speaking/`, click en cada uno de
  los 3 botones, pegar en otro tab, verificar match con el texto
  visible.
- **Fallback**: deshabilitar JS en DevTools, recargar, confirmar que
  el contenido sigue visible y seleccionable manualmente.
- **CSP**: `bash tests/csp-no-unsafe-inline.sh` pasa.
- **html-validate**: el HTML que usa este módulo no tiene atributos
  `on*`.
