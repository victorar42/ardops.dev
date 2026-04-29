# Contract — `tests/no-placeholders.sh` (normativo)

**Feature**: 004-personal-bio-rewrite
**Status**: Normative
**Type**: CI gate (bash + grep, 0 dependencias adicionales)

Define el contrato del nuevo gate de higiene de contenido. La implementación literal vive en `tests/no-placeholders.sh`; este archivo describe **qué debe verificar y bajo qué condiciones falla**.

---

## 1. Objetivo

Asegurar que ningún archivo **servido al visitante** del sitio público contiene placeholders sin resolver tipo `[Tu Nombre]`, `TODO`, `FIXME`, ni `XXX`.

## 2. Patrones (regex extendida POSIX)

| ID | Patrón | Comentario |
|---|---|---|
| P-1 | `\[Tu Nombre\]` | Literal histórico del placeholder original |
| P-2 | `\bTODO\b` | Marcador de pendientes |
| P-3 | `\bFIXME\b` | Marcador de bugs conocidos |
| P-4 | `\bXXX\b` | Marcador genérico de "revisar" |

Patrones combinados en una sola invocación de `grep -nE`.

## 3. Archivos cubiertos (whitelist)

```
index.html
404.html
blog/index.html
talks/index.html
sitemap.xml
robots.txt
public/favicon/site.webmanifest
interviews/index.html       # solo si existe (no falla si ausente)
interviews/*.html           # solo si existen (no falla si ausentes)
```

## 4. Archivos explícitamente excluidos

`docs/`, `specs/`, `tests/`, `scripts/`, `.specify/`, `.github/`, `assets/`, `content/`, `legacy/`, `node_modules/`, `package.json`, `package-lock.json`, `README.md`.

**Racional**: los `TODO` legítimos en código fuente y notas técnicas no deben hacer fallar el gate. La spec misma puede contener literalmente `[Tu Nombre]` como objeto de discusión.

## 5. Comportamiento

- **Exit 0**: cero matches en archivos cubiertos.
- **Exit 1**: ≥ 1 match en cualquier archivo cubierto. STDOUT debe imprimir `archivo:línea: contenido` para cada match (formato `grep -nH`).
- **Exit ≠ 0,1 (ej. 2)**: error inesperado de I/O o regex; el script imprime mensaje en STDERR.

## 6. Output esperado en éxito

```
OK: 0 placeholders found across 7 served files (patterns: [Tu Nombre], TODO, FIXME, XXX)
```

(El número de archivos puede variar si `interviews/*.html` están presentes en el checkout. El mensaje DEBE incluir el conteo de patrones y la lista de patrones inspeccionados para debugging.)

## 7. Output esperado en falla

```
FAIL: placeholder hit in served file
index.html:42:    <p>Hola, soy [Tu Nombre]</p>
index.html:97:    <!-- TODO: agregar foto -->
exit 1
```

## 8. Falsos positivos esperados (y cómo manejarlos)

| Caso | Mitigación |
|---|---|
| `TODO` literal aparece dentro de `<script type="application/ld+json">` (poco probable) | Rechazar — si quedó allí es un bug; arreglar el JSON-LD |
| `XXX` aparece como redacción intencional (anonimización) | Renombrar a `***` o reescribir; `XXX` es palabra reservada del gate |
| `FIXME` aparece dentro de un comentario HTML legítimo en `legacy/` | Excluido por whitelist (legacy no se cubre) |

Si surge un falso positivo legítimo no contemplado, abrir issue y degradar el patrón a opcional o ajustar la whitelist; no relajar el patrón.

## 9. Integración en CI

Job dedicado en `.github/workflows/ci.yml`:

```yaml
no-placeholders:
  name: No placeholders gate (spec 004)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run no-placeholders gate
      run: bash tests/no-placeholders.sh
```

- **Sin `setup-node`**: el gate es bash puro.
- **Sin dependencias**: `grep` está en cualquier runner ubuntu-latest.
- **Tiempo objetivo**: < 1 segundo end-to-end.
- **Posición**: paralelo al resto de gates; no bloquea ni es bloqueado por nadie.

## 10. Tests del propio gate (manuales)

Antes de merge, el autor verifica:

1. **Caso verde** (estado post-implementación, sin placeholders): `bash tests/no-placeholders.sh` → exit 0, mensaje OK.
2. **Caso rojo** (introducir `TODO` temporal en `404.html`): `bash tests/no-placeholders.sh` → exit 1, hit reportado con archivo:línea. Quitar el TODO de prueba antes de commit.
3. **Caso ausente** (eliminar temporalmente `interviews/index.html`): el gate no falla por ausencia (cumple §3 "solo si existe").

## 11. No-objetivos

- El gate **no** detecta placeholders semánticos sutiles ("Lorem ipsum", "[NOMBRE]", "{{TODO}}", etc.). El alcance es estricto: solo los 4 patrones del §2.
- El gate **no** sustituye a la revisión humana del PR; es una salvaguarda mecánica complementaria.
- El gate **no** corre lighthouse, html-validate, ni a11y; esos tienen sus propios jobs.
