# Phase 1 — Data Model: Reescritura de Bio Personal

**Feature**: 004-personal-bio-rewrite
**Date**: 2026-04-28

Esta feature no introduce datos persistentes ni esquemas dinámicos. Las "entidades" son **strings de contenido** versionados directamente en el HTML servido. Este documento las modela para que las tasks puedan referirse a ellas sin ambigüedad.

---

## Entidades

### `HeroBio`

Párrafo descriptivo del hero, debajo del `<h1>` y del rol.

| Campo | Tipo | Restricción |
|---|---|---|
| `text` | string (Unicode) | 40 ≤ words ≤ 90 (FR-003); ideal 54–66 (R-005) |
| `voice` | enum | `first-person` (única opción válida, R-001) |
| `mentions.role` | bool | DEBE ser `true` (FR-003 implícita en spec) |
| `mentions.sector` | bool | DEBE ser `true` (banca / financiero, FR-004) |
| `mentions.tech-list` | bool | DEBE ser `false` (FR-003) |
| `selector` | string | `index.html` → `section.hero p.hero-desc` |

**Reemplaza**: contenido actual de `p.hero-desc` (línea ~152 de `index.html`, ~110 palabras, tono CV).

### `AboutBlock`

Bloque "Sobre mí" en `#about > .about-grid > .about-text`.

| Campo | Tipo | Restricción |
|---|---|---|
| `paragraphs` | array<string> | 2 ≤ length ≤ 3 |
| `mentions.human` | bool | DEBE ser `true` (FR-004 — familia o fútbol) |
| `mentions.professional` | bool | DEBE ser `true` (FR-004 — DevOps/DevSecOps/banca) |
| `formatting` | enum | `prose` (única; sin bullets, FR-004) |
| `selector` | string | `index.html` → `section#about .about-text > p` (excluye `p.about-stack`) |

**Reemplaza**: los dos `<p>` actuales (líneas ~246–247 de `index.html`).

### `AboutStack`

Línea decorativa con stack técnico. **No es bio**; se mantiene por identidad visual (R-011).

| Campo | Tipo | Restricción |
|---|---|---|
| `text` | string | tokens separados por ` · ` (espacio + punto medio + espacio) |
| `selector` | string | `index.html` → `section#about p.about-stack` |
| `editable_in_this_spec` | bool | `false` — fuera del alcance editorial; queda intacto |

### `MetaDescription`

Atributo `<meta name="description">` en el `<head>`.

| Campo | Tipo | Restricción |
|---|---|---|
| `text` | string | length ≤ 160 chars (FR-010) |
| `keywords_required` | array<string> | DEBE incluir al menos uno de: `DevOps`, `DevSecOps`, `banca`, `Costa Rica` (R-009) |
| `voice_aligned` | bool | DEBE ser `true` — refleja la voz de `HeroBio` |
| `selector` | string | `index.html` → `head > meta[name="description"]` |

### `OGDescription`

Atributo `<meta property="og:description">` en el `<head>`.

| Campo | Tipo | Restricción |
|---|---|---|
| `text` | string | length ≤ 160 chars; **idéntica** a `MetaDescription.text` (R-009) |
| `selector` | string | `index.html` → `head > meta[property="og:description"]` |

---

## Invariantes

- **I-1**: `HeroBio.text` y `AboutBlock.paragraphs[*]` están en español neutro con ≤ 1 toque tico (R-012).
- **I-2**: El nombre legal completo "Victor Josue Ardón Rojas" aparece **exactamente una vez** en `index.html` (en el `h1`), por R-007.
- **I-3**: Cero ocurrencias de los patrones `[Tu Nombre]`, `\bTODO\b`, `\bFIXME\b`, `\bXXX\b` en archivos servidos (FR-006, R-003, R-004).
- **I-4**: `MetaDescription.text === OGDescription.text` (R-009 — single source of truth para snippets).
- **I-5**: Ningún campo `text` contiene caracteres invisibles (ZWSP U+200B, ZWNJ U+200C, BOM U+FEFF). Verificación: `grep -PnH '[\x{200B}\x{200C}\x{FEFF}]'` retorna 0 hits.
- **I-6**: La codificación de los archivos modificados es UTF-8 sin BOM; tildes y diacríticos se escriben con sus code points directos (R-008).
- **I-7**: El stack chip (`AboutStack`) permanece sin modificaciones en esta spec; cualquier ajuste futuro requiere nueva spec.

---

## State diagram (transición de contenido)

```
┌─────────────────────────────────────────────────────────────────┐
│ Estado pre-PR                                                    │
│ ─ HeroBio.text = ~110 palabras, tono CV (estado actual)          │
│ ─ AboutBlock.paragraphs[*] = tono "creo pipelines …"            │
│ ─ MetaDescription = no auditada                                  │
│ ─ Placeholders = "[Tu Nombre]" en docs/04-content-spec.md (no    │
│   servido) + cero confirmados en archivos servidos               │
└────────────────────────────────┬────────────────────────────────┘
                                 │  /speckit.implement (T0xx)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Estado post-PR                                                   │
│ ─ HeroBio.text = 54–66 palabras, primera persona, dato humano    │
│ ─ AboutBlock = 2–3 párrafos cálidos + AboutStack intacto         │
│ ─ MetaDescription = OGDescription = ≤ 160 chars, voz alineada    │
│ ─ Gate `no-placeholders.sh` ejecutándose en CI ⇒ 0 hallazgos     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validaciones

| Validación | Cómo |
|---|---|
| Longitud HeroBio | `node -e "const w=require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\s+/).filter(Boolean).length;process.exit(w<40||w>90?1:0)" < bio.txt` |
| Primera persona | manual + opcional regex `/(soy |me dedico|trabajo)/i` debe matchear |
| Sin enumeración tech en hero | regex `/(·.*·.*·)/` sobre `HeroBio.text` debe NO matchear |
| Mención humana en about | regex `/(papá|hijos?|chicos?|chica|fútbol|familia)/i` matchea ≥ 1 vez |
| Mención profesional en about | regex `/(DevOps|DevSecOps|banca|financiero)/i` matchea ≥ 1 vez |
| Meta length | `awk -v RS='' '{ if (length>160) exit 1 }'` |
| Equivalencia meta = og | `diff <(grep description) <(grep og:description)` semánticamente |
| Placeholders | `bash tests/no-placeholders.sh` exit 0 |
| HTML válido | `npx html-validate index.html …` exit 0 |
| Accesibilidad | `node tests/a11y.js` reporta 0 violaciones |

---

## Out of scope

- Foto/avatar del autor (spec posterior).
- Cambios en `assets/css/home.css` (layout existente soporta el copy nuevo, R-005).
- Reestructuración del componente about (grid, stat cards, etc.).
- Internacionalización a inglés.
- Reescritura de bios en redes sociales (LinkedIn, GitHub, Twitter).
