# ardops.dev

Sitio personal en [ardops.dev](https://ardops.dev).

## Estructura

```
ardops.dev/
├── .github/         # CI/CD, plantillas y guías para Copilot
├── docs/            # Specs (producto, IA, diseño, seguridad, performance, a11y, SEO, deploy)
├── src/             # HTML/CSS/JS del sitio
├── public/          # Assets estáticos (imágenes, fonts, favicon)
├── tests/           # Validaciones automatizadas
├── legacy/          # Versión anterior (solo referencia, no editar)
├── .gitignore
├── README.md
└── CNAME            # Dominio personalizado para GitHub Pages
```

## Desarrollo

Por ahora el sitio es estático. Abrir `src/index.html` en el navegador o servir la carpeta con cualquier servidor estático.

## Documentación

Ver `docs/` — specs numeradas del 01 al 09.

## Despliegue

GitHub Pages con dominio personalizado vía `CNAME`. Detalles en [docs/09-deployment-spec.md](docs/09-deployment-spec.md).

## Liberación post-charla — Techno Week 8.0

La sección Techno Week 8.0 está actualmente en estado **`teaser`** (badge "Próximamente", sin enlaces a slides ni repositorio demo). El estado se controla mediante bloques HTML delimitados por marcadores de comentario `<!-- TALK-STATE:teaser START/END -->`.

**Para liberar el contenido tras la charla** (a partir del 18 de mayo de 2026):

1. Editar [index.html](index.html) sección `<section id="talk">` — reemplazar el bloque entre los marcadores `<!-- TALK-STATE:teaser ... -->` por el snippet de [specs/002-techno-week-coming-soon/contracts/published-block.html](specs/002-techno-week-coming-soon/contracts/published-block.html), sustituyendo `{{REPO_URL}}` y `{{SLIDES_URL}}` por las URLs reales.
2. Editar [talks/index.html](talks/index.html) aplicando el mismo swap (recordar `h2.talk-title`, no `h3`).
3. Restaurar (opcional) el CTA secundario del hero en [index.html](index.html) para apuntar al repositorio público de la charla, en lugar de `#pipeline`.
4. Verificar gates: `bash tests/forbidden-urls.sh` debe retornar `OK: estado published. forbidden-urls gate en modo skip.`
5. Si una URL no está disponible al liberar, **eliminar el `<a>` correspondiente** en lugar de dejarlo con `href=""` o `href="#"`.

> **No** reescribir historia git para esta liberación. El sitio es público y reescribir historia no aporta seguridad. Ver [research.md R-006](specs/002-techno-week-coming-soon/research.md).

Runbook completo paso a paso (con diffs ejecutables): [specs/002-techno-week-coming-soon/quickstart.md](specs/002-techno-week-coming-soon/quickstart.md) §2.

## Entrevistas (spec 003)

La sección [`/interviews/`](https://ardops.dev/interviews/) es un blog estático
de entrevistas a profesionales del sector tecnológico. El contenido fuente vive
en `content/interviews/` (Markdown + frontmatter YAML); el HTML servido y el
`index.json` que alimenta la búsqueda client-side se generan en CI con
`scripts/build-interviews.js` y se publican vía el workflow de Pages.

- **Publicar una entrevista**: ver runbook editorial completo en
  [content/interviews/README.md](content/interviews/README.md) y
  [specs/003-interviews-section/quickstart.md](specs/003-interviews-section/quickstart.md) §A.
- **Modificar el generador**: runbook dev en
  [specs/003-interviews-section/quickstart.md](specs/003-interviews-section/quickstart.md) §B.
- **Build local**: `npm run build:interviews` (emite a `interviews/`, gitignored).
- **Gates en CI**: `interviews-strict-build`, `interviews-xss`, `interviews-size`,
  más la cobertura habitual de `html-validate` y `a11y` extendida a las nuevas URLs.

> Cero dependencias de terceros en runtime. `gray-matter`, `marked`, `dompurify`
> y `jsdom` se usan solo en build time.


