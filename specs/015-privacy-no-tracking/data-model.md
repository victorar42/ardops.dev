# Data Model — Privacy policy + no-tracking enforcement (spec 015)

Esta spec no introduce datos persistentes. Las "entidades" son artefactos
estáticos (archivos y procesos). Cada uno se describe con campos,
validaciones e invariantes.

---

## PrivacyPage

**Descripción**: documento HTML público en `privacy/index.html` que
declara la política de no-tracking.

**Campos**:

| Campo | Tipo | Origen | Notas |
|---|---|---|---|
| `path` | string | constante | `privacy/index.html` |
| `route` | string | constante | `/privacy/` |
| `lang` | string | atributo `<html lang>` | `es` |
| `title` | string | `<title>` | "Privacidad — ardops.dev" |
| `description` | string | `<meta name="description">` | ≤ 160 chars |
| `canonical` | URL | `<link rel="canonical">` | `https://ardops.dev/privacy/` |
| `lastModified` | ISO date | `<time datetime="YYYY-MM-DD">` | fecha del último cambio relevante |
| `sections` | array<Section> | `<main>` contiene 5 `<section>` | ver invariantes |
| `wordCount` | int | calculado del cuerpo | 200–300 |
| `footerLink` | bool | enlace en `<footer>` | `true` |

**`Section`**:

| Campo | Tipo | Validación |
|---|---|---|
| `id` | string | slug único en la página |
| `heading` | string | `<h2>` (no saltos de jerarquía) |
| `bodyParagraphs` | array<string> | uno o más `<p>` |

**Invariantes**:

- `sections.length == 5` con headings en este orden:
  1. "Qué este sitio NO hace"
  2. "Qué pasa con los logs de acceso"
  3. "Información que recibo por `mailto:`"
  4. "Cambios a esta política"
  5. "Contacto"
- Exactamente un `<h1>`.
- `lastModified` ≤ fecha de hoy y posterior a 2026-01-01.
- Cero `<script>` salvo el bloque JSON-LD opcional.
- Cero `<iframe>`, `<embed>`, `<object>`.
- Cero `<a target="_blank">` sin `rel="noopener noreferrer"`.
- Cero ocurrencias de patrones en `tests/tracker-domains.txt`.
- Cero `document.cookie`.
- CSP idéntica al resto del sitio (spec 009).

---

## TrackerPatternList

**Descripción**: archivo plano `tests/tracker-domains.txt` con un patrón
ERE por línea.

**Campos**:

| Campo | Tipo | Validación |
|---|---|---|
| `path` | string | `tests/tracker-domains.txt` |
| `encoding` | string | UTF-8, LF |
| `lines` | array<Line> | non-empty |

**`Line`**:

| Campo | Tipo | Validación |
|---|---|---|
| `raw` | string | una línea del archivo |
| `kind` | enum | `comment` (`^#`), `blank` (`^\s*$`), `pattern` (resto) |
| `pattern` | string \| null | si `kind == pattern`, el contenido tal cual |

**Invariantes**:

- `lines.filter(kind == pattern).length ≥ 24` (al menos los 24 patrones
  listados en FR-06; pueden agregarse más).
- Cada patrón es un ERE válido (`grep -E` no debe fallar al parsearlo).
- No hay patrones duplicados.
- El archivo termina con newline.

---

## ServedFileSet

**Descripción**: conjunto computado de archivos sobre los que corren los
gates.

**Campos**:

| Campo | Tipo | Definición |
|---|---|---|
| `roots` | array<path> | `.` (raíz del repo) |
| `includeExts` | array<string> | depende del gate (ver R-3) |
| `excludeDirs` | array<path> | `.git`, `node_modules`, `.specify`, `specs`, `docs`, `backlog`, `.reference`, `tests`, `legacy`, `scripts`, `.github` |
| `files` | array<path> | resultado de `find . -type f -name "*.ext" -not -path …` |

**Invariantes**:

- `files` no contiene rutas que comiencen con cualquier `excludeDirs`.
- `files.length > 0` (si fuera 0 el gate retorna exit 2 — I/O error).

---

## GateRun

**Descripción**: una ejecución de un gate.

**Campos**:

| Campo | Tipo | Notas |
|---|---|---|
| `gate` | enum | `no-trackers`, `no-cookies` |
| `filesScanned` | int | `ServedFileSet.files.length` |
| `patternsLoaded` | int \| null | solo para `no-trackers` |
| `violations` | array<Violation> | puede estar vacío |
| `exitCode` | int | `0` ok / `1` violation / `2` I/O |

**`Violation`**:

| Campo | Tipo |
|---|---|
| `file` | path |
| `line` | int |
| `matchedPattern` | string |
| `snippet` | string (línea del archivo, truncada a 200 chars) |

**Invariantes**:

- `exitCode == 0 ⇔ violations.length == 0` y no hubo error I/O.
- `exitCode == 1 ⇔ violations.length > 0`.
- `exitCode == 2 ⇔` lista no legible o `find` falló.
- Cada `violation` se imprime una sola vez a stdout.

---

## ConstitutionPrincipleXII

**Descripción**: nuevo bloque en `.specify/memory/constitution.md`.

**Campos**:

| Campo | Tipo | Validación |
|---|---|---|
| `number` | int | `12` (romano `XII`) |
| `title` | string | "Privacy by Default" |
| `body` | string | ≤ 120 palabras |
| `version` | string | bump v1.2.0 → v1.3.0 |
| `syncImpactReport` | string | HTML comment al final del archivo |

**Invariantes**:

- No renumera los Principios I–XI.
- Cuerpo cubre: declaración (cero trackers/cookies/3p scripts),
  proceso de excepción (spec + `/privacy/`), gates que automatizan
  enforcement.
- `sync-impact-report` documenta versión origen, versión destino, driver
  (spec 015) y la naturaleza aditiva del cambio.
