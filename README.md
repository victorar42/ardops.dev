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
