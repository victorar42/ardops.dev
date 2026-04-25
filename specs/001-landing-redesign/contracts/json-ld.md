# JSON-LD Contract

**Applies to**: `index.html`.

## Required script

Un único `<script type="application/ld+json">` antes del `</head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://ardops.dev/#person",
      "name": "Victor Josue Ardón Rojas",
      "alternateName": "ardops",
      "url": "https://ardops.dev/",
      "jobTitle": "DevOps Engineer",
      "description": "DevOps Engineer especializado en DevSecOps, GitHub Actions y seguridad para banca.",
      "sameAs": [
        "https://github.com/victorar42",
        "https://www.linkedin.com/in/victorar42/"
      ]
    },
    {
      "@type": "Event",
      "name": "Techno Week 8.0 — Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca",
      "startDate": "2026-05-18",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Banco de Costa Rica",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "CR"
        }
      },
      "performer": { "@id": "https://ardops.dev/#person" },
      "url": "https://ardops.dev/#talk"
    }
  ]
}
</script>
```

## Assertions

- J1. JSON parseable sin errores.
- J2. Un único bloque `application/ld+json` por página.
- J3. `Person.url` y `siteUrl` coinciden.
- J4. `Event.performer.@id` referencia el `Person.@id` declarado en el mismo grafo.
- J5. `Event.startDate` en formato ISO 8601 válido.
- J6. `sameAs` solo incluye perfiles existentes y verificados.

## Verification

- [validator.schema.org](https://validator.schema.org/) sin errores.
- [Google Rich Results Test](https://search.google.com/test/rich-results) acepta el `Person`.
