# Information Architecture

## Mapa del sitio
/                           → Landing principal
├── /blog/                  → Listado de posts
│   └── /blog/{slug}/       → Post individual
├── /talks/                 → Listado de charlas
│   └── /talks/{slug}/      → Página de charla individual
├── /about/                 → Sobre mí (extendido)
├── /contact/               → Formulario y canales de contacto
└── /404.html               → Página de error

## Convenciones de URLs
- Siempre con trailing slash (`/blog/` no `/blog`)
- Siempre lowercase
- Slugs en kebab-case (`/blog/devsecops-spec-driven/`)
- Sin extensión `.html` visible
- Sin parámetros de query en URLs canónicas

## Navegación principal
- Inicio | Blog | Charlas | Sobre mí | Contacto

## Navegación secundaria (footer)
- GitHub | LinkedIn | RSS | Email | Aviso de privacidad

## Breadcrumbs
- Activos en /blog/{slug}/ y /talks/{slug}/
- No activos en páginas de primer nivel