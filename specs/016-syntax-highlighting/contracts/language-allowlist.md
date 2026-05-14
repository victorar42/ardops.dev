# Contract: Language allowlist

**Feature**: 016-syntax-highlighting

Lista cerrada de 21 lenguajes soportados para syntax highlighting.

---

## La lista

| # | Markdown tag | Shiki grammar ID | Notas |
|---|---|---|---|
| 1 | `bash` | `bash` | Shell scripts. |
| 2 | `sh` | `sh` (alias de `bash`) | POSIX shell. |
| 3 | `javascript` | `javascript` | También acepta `js` como alias en input Markdown. |
| 4 | `typescript` | `typescript` | También `ts` como alias. |
| 5 | `json` | `json` | |
| 6 | `yaml` | `yaml` | También `yml`. |
| 7 | `dockerfile` | `dockerfile` | |
| 8 | `hcl` | `hcl` | Terraform/HCL. También acepta `terraform`. |
| 9 | `python` | `python` | También `py`. |
| 10 | `go` | `go` | |
| 11 | `rust` | `rust` | También `rs`. |
| 12 | `sql` | `sql` | |
| 13 | `diff` | `diff` | |
| 14 | `html` | `html` | |
| 15 | `css` | `css` | |
| 16 | `markdown` | `markdown` | También `md`. |
| 17 | `ini` | `ini` | |
| 18 | `toml` | `toml` | |
| 19 | `makefile` | `makefile` | También `make`. |
| 20 | `groovy` | `groovy` | Jenkins pipelines. |
| 21 | `nginx` | `nginx` | |

---

## Aliases permitidos en input Markdown

El builder normaliza alias → canonical antes de consultar la
allowlist:

```js
const ALIAS_MAP = {
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
  terraform: 'hcl',
  tf: 'hcl',
  py: 'python',
  rs: 'rust',
  md: 'markdown',
  make: 'makefile',
};
```

## Casos NO soportados (fallback)

- `bicep`, `pulumi`, `cobol`, `php`, `ruby`, `kotlin`, `swift`,
  `csharp`, `java`, `c`, `cpp`, `lua`, `nix`, etc. → fallback a
  render mono actual + warning non-fatal.
- Lenguajes con typos (`bashh`, `js5`) → fallback + warning.

## Cambios futuros

Agregar un lenguaje a la allowlist requiere:
1. Verificar que Shiki lo soporta nativamente.
2. Actualizar este contrato.
3. Actualizar `scripts/lib/shiki-highlight.js`.
4. NO regenerar `syntax.css` (el mismo CSS sirve para todos los
   lenguajes; los colores son por tipo de token, no por lenguaje).
5. PR menor; no requiere bump constitucional.
