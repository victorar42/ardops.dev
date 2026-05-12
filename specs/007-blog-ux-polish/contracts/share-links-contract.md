# Contract: Share Links del post

Cada post individual incluye en su footer tres enlaces estáticos. Se generan en build-time con el título y URL canónica del post URL-encodeados con `encodeURIComponent`.

## HTML emitido

```html
<aside class="post-share" aria-label="Compartir este post">
  <p class="post-share-label">¿Te sirvió? Compartilo:</p>
  <ul class="post-share-links" role="list">
    <li>
      <a class="post-share-link"
         href="mailto:?subject=<TITLE_ENC>&body=<URL_ENC>"
         rel="noopener">Mail</a>
    </li>
    <li>
      <a class="post-share-link"
         href="https://www.linkedin.com/sharing/share-offsite/?url=<URL_ENC>"
         target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </li>
    <li>
      <a class="post-share-link"
         href="https://x.com/intent/post?text=<TITLE_ENC>&url=<URL_ENC>"
         target="_blank" rel="noopener noreferrer">X</a>
    </li>
  </ul>
</aside>
```

## Reglas de construcción

- **URL canónica**: `https://ardops.dev/blog/<slug>.html`.
- **Título**: `post.title` tal cual del frontmatter (sin sanitizar HTML, ya es texto plano por contrato 006).
- `encodeURIComponent(title)` y `encodeURIComponent(url)`.
- `mailto`: NO `target="_blank"` (apertura nativa del cliente mail).
- `LinkedIn` y `X`: `target="_blank" rel="noopener noreferrer"` (mismas reglas que cualquier link externo del sitio).
- Sin recursos de terceros cargados (cero `<script>` o `<img>` de redes sociales).
- Sin tracking parameters (`utm_*` etc.).

## Determinismo

Idéntico título y slug ⇒ idénticos hrefs byte-a-byte entre builds.

## Accesibilidad

- `<aside aria-label="Compartir este post">`.
- Cada `<a>` con texto descriptivo (no solo iconos).
- Focus visible.
- Funciona con teclado y screen reader.

## Constitución

- **IV (cero deps JS)**: sin SDKs ni widgets oficiales.
- **V (self-hosted)**: no se cargan recursos third-party; los enlaces son navegacionales.
- **VIII (seguridad)**: `noopener noreferrer` en links externos.
