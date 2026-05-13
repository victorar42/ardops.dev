# Contract — JSON-LD `WebPage` for `/now/`

**Feature**: spec 013 · **Audience**: implementor +
`tests/jsonld-validate.sh`.

Bloque único `<script type="application/ld+json">` dentro de `<head>`.

## Forma canónica

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://ardops.dev/now/#webpage",
  "url": "https://ardops.dev/now/",
  "name": "Now — qué estoy haciendo este mes",
  "description": "<copia idéntica a meta description (50-160 chars)>",
  "inLanguage": "es",
  "dateModified": "YYYY-MM-DD",
  "isPartOf": { "@id": "https://ardops.dev/#website" },
  "about": { "@id": "https://ardops.dev/#person" },
  "mainEntityOfPage": { "@id": "https://ardops.dev/now/#webpage" }
}
```

## Reglas

1. **`@context`**: literal `"https://schema.org"`.
2. **`@type`**: literal `"WebPage"`. NO `Article`, NO `ProfilePage`.
3. **`@id`**: literal `"https://ardops.dev/now/#webpage"`. URI
   canónica, fragment `#webpage` para distinguir del `WebSite`.
4. **`url`**: literal `"https://ardops.dev/now/"` (con trailing slash).
5. **`name`**: en español, igual al `<title>` sin el sufijo
   `· ardops.dev`.
6. **`description`**: misma string exacta que `<meta name="description">`.
7. **`inLanguage`**: literal `"es"`.
8. **`dateModified`**: ISO 8601 (YYYY-MM-DD). MUST coincidir
   bit-a-bit con el `datetime` del `<time>` del banner.
9. **`isPartOf`**: referencia al `WebSite` canónico
   (`@id="https://ardops.dev/#website"`), definido en spec 011.
10. **`about`**: referencia al `Person` canónico
    (`@id="https://ardops.dev/#person"`), definido en spec 011.
11. **`mainEntityOfPage`**: self-reference al propio `@id`.

## Antipatrones (prohibido)

- Repetir el objeto `Person` inline en lugar de referenciar por `@id`.
- Usar `@type: "Article"` (no es publicación con autoría y headline).
- Omitir `dateModified` (rompe FR-07 y desincroniza con banner).
- Poner `dateModified` con hora (`YYYY-MM-DDTHH:MM:SSZ`) — la
  granularidad del feature es diaria. El gate de freshness no requiere
  más resolución y simplifica el contrato banner ↔ JSON-LD.

## Validación

- `bash tests/jsonld-validate.sh` debe pasar incluyendo `now/index.html`
  en `STATIC_PAGES` (`scripts/check-jsonld.js`).
- El validador comprueba:
  - JSON parsea sin errores.
  - `@context`, `@type`, `url` presentes.
  - Si hay `dateModified`, está en formato ISO válido.
- Adicionalmente, el implementor debe verificar manualmente con
  [Schema.org Validator](https://validator.schema.org/) tras el deploy.
