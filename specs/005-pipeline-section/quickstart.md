# Quickstart — Mantener la sección Pipeline

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Data Model**: [data-model.md](data-model.md)

Guía rápida para el autor humano (Victor) sobre cómo agregar, editar o quitar items del pipeline.

---

## TL;DR

1. Editar `content/pipeline.json`.
2. Correr `node scripts/build-pipeline.js`.
3. Verificar el diff de `index.html`.
4. Commit + push (ambos archivos en el mismo commit).

---

## Agregar un nuevo item

1. Abrir `content/pipeline.json`.
2. Añadir un objeto al array `items` con la forma:
   ```json
   {
     "id": "interview-jose-alvarez",
     "type": "interview",
     "title": "Conversación con José Álvarez (Pernix)",
     "stage": "in-progress",
     "estimated": "Mayo 2026",
     "description": "Charla sobre liderazgo técnico y scaling de equipos en banca regional.",
     "link": "/interviews/teaser-jose-alvarez/"
   }
   ```
3. Validar localmente:
   ```bash
   node scripts/build-pipeline.js
   bash tests/pipeline-schema.sh   # opcional, valida que las fixtures negativas siguen rechazándose
   npx html-validate index.html
   ```
4. Commit:
   ```bash
   git add content/pipeline.json index.html
   git commit -m "pipeline: add interview-jose-alvarez (in-progress)"
   ```

## Cambiar el stage de un item

1. Editar el campo `stage` del item correspondiente en `content/pipeline.json`.
2. `node scripts/build-pipeline.js`.
3. Verificar que el item ahora aparece en el grupo correcto del `index.html`.
4. Commit ambos archivos.

## Quitar un item (porque ya se publicó)

1. Eliminar el objeto correspondiente del array `items`.
2. `node scripts/build-pipeline.js`.
3. Verificar que el item desaparece del `index.html`.
4. Commit. La pieza ya publicada vive en su lugar definitivo (`interviews/`, `blog/`, `talks/`).

## Vaciar la sección (caso temporal "pausar")

`content/pipeline.json`:
```json
{ "items": [] }
```

`node scripts/build-pipeline.js` → la sección renderiza el empty state cálido. La sección sigue existiendo en el landing.

---

## Anatomía de un item

| Campo | Obligatorio | Ejemplo | Notas |
|---|---|---|---|
| `id` | sí | `lab-spectral-banking` | Slug único e inmutable. |
| `type` | sí | `lab` | Uno de: `interview`, `lab`, `talk`, `post`, `other`. |
| `title` | sí | `Lab: Spectral con reglas custom para APIs bancarias` | 1..120 chars. |
| `stage` | sí | `backlog` | Uno de: `coming-soon`, `review`, `in-progress`, `backlog`. |
| `estimated` | opcional | `2026-Q3` o `Pronto` | Texto libre legible. Si lo omitís, no aparece la línea. |
| `description` | sí | `Hands-on para escribir reglas Spectral alineadas a SUGEF.` | 10..280 chars. |
| `link` | opcional | `/interviews/teaser/` o `https://github.com/...` | HTTPS absoluta o ruta interna `/...`. |

---

## Cadencia de revisión recomendada

- **Mensual**: revisar todo `pipeline.json`. Para cada item, preguntarse:
  - ¿Sigue siendo realista que esto salga?
  - ¿El stage refleja el trabajo real, o es optimista?
  - ¿Lleva más de 6 meses sin progresar? Considerar moverlo de vuelta a `backlog` o eliminarlo.
- **Al publicar**: cuando una pieza salga (entrevista, lab, charla), removerla del pipeline en el mismo PR que publica el contenido final.
- **Honestidad antes que optimismo**: un pipeline con 2 items reales en `coming-soon` vale más que uno con 8 items inflados en `in-progress`.

---

## ¿Por qué dos archivos cambian a la vez?

- `content/pipeline.json` es la fuente de verdad.
- `index.html` contiene el HTML pre-renderizado para que el sitio sea 100% estático y servir cero JS adicional (constitución VII).
- El script `scripts/build-pipeline.js` es idempotente: convierte JSON a HTML siempre igual.
- La gate `pipeline-build-check` en CI verifica que ambos archivos estén en sync. Si te olvidaste de correr el build localmente, CI te lo dice.

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| CI falla con `pipeline-build: index.html is out of sync` | Editaste `pipeline.json` pero no corriste el build local | `node scripts/build-pipeline.js` y commit el `index.html` resultante. |
| CI falla con `pipeline-build: <id>: invalid stage 'X'` | Typo en el campo `stage` | Verificá que sea exactamente uno de los 4 valores permitidos. |
| CI falla con `pipeline-build: <id>: invalid link` | URL en `link` no es HTTPS absoluta ni ruta interna `/...` | Corregí o quitá el campo `link`. |
| CI falla con `pipeline-build: duplicate id` | Dos items con mismo `id` | Renombrá uno (recordá que `id` es slug-style único). |
| `npx html-validate index.html` falla tras el build | Probablemente es un escape mal hecho en `description` | Reportá como bug del script — no debería ocurrir si el JSON es válido. |
