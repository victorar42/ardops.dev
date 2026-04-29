# Contract: Forbidden URLs gate

**Feature**: 002-techno-week-coming-soon  
**Date**: 2026-04-28  
**Aplicable mientras**: el flag `TalkPublicationState` esté en `teaser`.

Este contrato define el conjunto de patrones que **NO** deben aparecer en archivos HTML servidos desde GitHub Pages mientras la charla Techno Week 8.0 esté en estado `teaser`. Es la verificación mecánica de [FR-005](../spec.md) y [SC-002](../spec.md).

---

## Archivos bajo el gate

Se escanean los siguientes archivos (todo HTML servido por Pages):

```
index.html
404.html
talks/index.html
blog/index.html
legacy/index.html
```

Se EXCLUYEN del escaneo:

- `specs/**` (no se sirve)
- `.specify/**` (no se sirve)
- `docs/**` (no se sirve, es documentación interna)
- `.reference/**` (referencia visual, no servida)
- `tests/**`
- `README.md`

---

## Patrones prohibidos (regex, case-insensitive)

| ID | Patrón regex | Razón |
|---|---|---|
| FU-1 | `victorar42/techno-week` | URL del repo demo de la charla |
| FU-2 | `github\.com/[^"' ]*techno-?week` | Variantes del repo demo |
| FU-3 | `slides[._-]?techno` | Posibles archivos de slides |
| FU-4 | `techno[-_ ]week.*\.(pdf\|pptx?\|key)` | Slides/recursos descargables |
| FU-5 | `bcr[-_]demo` | Variantes del repo demo (org alterna) |
| FU-6 | `(speakerdeck\|slideshare\|docs\.google\.com/presentation).*ardon` | Hosts comunes de slides ligados al autor |

> Si en el futuro se identifican nuevas URLs sensibles, agregarlas aquí en el mismo PR que las introduzca.

---

## Comportamiento del gate

- El check corre en CI en cada PR y en cada push a `main`.
- Si encuentra **una** sola coincidencia en cualquier archivo bajo escaneo: **falla el job** con exit code != 0 y reporta el archivo + línea.
- Modo "released": cuando el repo cambia el flag a `published` (commit que reemplaza `<!-- TALK-STATE:teaser` por `<!-- TALK-STATE:published`), el gate detecta la transición:
  - Si **todos** los archivos servidos contienen `<!-- TALK-STATE:published` y **ningún** archivo servido contiene `<!-- TALK-STATE:teaser`, el gate pasa a modo "skip" y permite las URLs.
  - Si hay mezcla (algunos surfaces en `teaser`, otros en `published`), **falla** porque indica un PR de liberación incompleto.

---

## Implementación de referencia (bash)

Sugerencia, no normativa. La implementación final puede variar:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCANNED=(index.html 404.html talks/index.html blog/index.html legacy/index.html)
PATTERNS='victorar42/techno-week|github\.com/[^"'"'"' ]*techno-?week|slides[._-]?techno|techno[-_ ]week.*\.(pdf|pptx?|key)|bcr[-_]demo|(speakerdeck|slideshare|docs\.google\.com/presentation).*ardon'

# Detectar estado global
teaser_count=$(grep -lE 'TALK-STATE:teaser START' "${SCANNED[@]}" 2>/dev/null | wc -l | tr -d ' ')
published_count=$(grep -lE 'TALK-STATE:published START' "${SCANNED[@]}" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$teaser_count" -gt 0 && "$published_count" -gt 0 ]]; then
  echo "ERROR: Mezcla de estados teaser/published entre surfaces. Liberar todas o ninguna."
  exit 1
fi

if [[ "$published_count" -gt 0 && "$teaser_count" -eq 0 ]]; then
  echo "OK: estado published. forbidden-urls gate en modo skip."
  exit 0
fi

# Estado teaser → aplicar gate
if grep -InEi "$PATTERNS" "${SCANNED[@]}"; then
  echo "ERROR: URLs prohibidas detectadas en estado teaser. Ver salida arriba."
  exit 1
fi

echo "OK: cero URLs prohibidas en estado teaser."
```

Ubicación sugerida: `tests/forbidden-urls.sh` (a crear en la fase de implementación).

---

## Criterios de aceptación del gate

- AC-FU-1: Con el HTML del estado `teaser`, el script termina con exit code 0 y mensaje `OK: cero URLs prohibidas`.
- AC-FU-2: Si se inserta deliberadamente `<a href="https://github.com/victorar42/techno-week">` en `index.html`, el script termina con exit code != 0 y reporta el archivo + línea.
- AC-FU-3: Tras liberación (todos los surfaces con `<!-- TALK-STATE:published`), el gate pasa en modo skip sin examinar patrones.
