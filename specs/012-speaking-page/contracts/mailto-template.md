# Contract: Mailto template del CTA principal

> Define el `href` exacto del CTA "Invitame a tu evento" en
> `speaking/index.html`. Cumple RFC 6068. Validable por
> URL-decode.

## Constantes

| Clave | Valor |
|-------|-------|
| `to` | `contacto@ardops.dev` |
| `subjectPrefix` | `Invitación a speaking: [evento]` |
| `bodyOpening` | `Hola Victor,` |
| `bodyClosing` | `Gracias.` |

## Lista cerrada de campos del body (en orden)

1. `Evento: `
2. `Fecha: `
3. `Audiencia: `
4. `Duración: `
5. `Tema propuesto: `
6. `Modalidad (presencial/remoto): `
7. `Compensación: `
8. `Contexto adicional: `

## Body decodificado canónico

```
Hola Victor,

Evento: 
Fecha: 
Audiencia: 
Duración: 
Tema propuesto: 
Modalidad (presencial/remoto): 
Compensación: 
Contexto adicional: 

Gracias.
```

(8 líneas de campos, separadas por `\n`. Línea en blanco entre el
saludo y los campos, y otra entre los campos y el cierre.)

## `href` final (encodeado)

Recomendado generarlo a mano (es estable, no cambia con el tiempo).
Decodificable con `decodeURIComponent` para verificar.

```
mailto:contacto@ardops.dev?subject=Invitaci%C3%B3n%20a%20speaking%3A%20%5Bevento%5D&body=Hola%20Victor%2C%0A%0AEvento%3A%20%0AFecha%3A%20%0AAudiencia%3A%20%0ADuraci%C3%B3n%3A%20%0ATema%20propuesto%3A%20%0AModalidad%20(presencial%2Fremoto)%3A%20%0ACompensaci%C3%B3n%3A%20%0AContexto%20adicional%3A%20%0A%0AGracias.
```

## Reglas de encoding (RFC 6068)

- Espacio: `%20` (no `+`).
- Newline: `%0A` (no `%0D%0A`; mailto usa LF).
- `:` en valores: `%3A` (en `subject` y body).
- `,`: `%2C`.
- `/`: `%2F`.
- Caracteres no-ASCII: secuencias UTF-8 percent-encoded
  (`ó` → `%C3%B3`, `ú` → `%C3%BA`, `ñ` → `%C3%B1`).
- `[` y `]`: `%5B`, `%5D` (en `[evento]`).
- `(` y `)` en `Modalidad (presencial/remoto)`: válidos sin encode
  según RFC 6068, pero algunos clientes los re-codifican; ambas
  formas son aceptables.

## Validación

1. **Visual**: abrir el `href` en Gmail web (configurado como handler
   de mailto) y en Apple Mail. Confirmar que:
   - Para: `contacto@ardops.dev`
   - Asunto: `Invitación a speaking: [evento]`
   - Cuerpo: las 8 etiquetas en orden, una por línea, con
     `Hola Victor,` arriba y `Gracias.` abajo.

2. **Programática (one-liner)**:
   ```bash
   node -e '
     const href = require("fs").readFileSync("speaking/index.html","utf8")
       .match(/href="(mailto:[^"]+)"/)[1];
     const u = new URL(href);
     const sp = u.searchParams;
     const subject = sp.get("subject");
     const body = sp.get("body");
     const fields = ["Evento:","Fecha:","Audiencia:","Duración:","Tema propuesto:","Modalidad (presencial/remoto):","Compensación:","Contexto adicional:"];
     console.assert(u.protocol === "mailto:", "scheme");
     console.assert(u.pathname === "contacto@ardops.dev", "to");
     console.assert(subject.startsWith("Invitación a speaking:"), "subject");
     fields.forEach(f => console.assert(body.includes(f), "missing: " + f));
     console.log("mailto contract OK");
   '
   ```

## Texto alternativo visible (FR-010)

El CTA va seguido (mismo bloque visual) de un párrafo:

```html
<p class="speaking-cta-fallback">
  ¿Tu cliente de correo no abre? Escribime directamente a
  <a href="mailto:contacto@ardops.dev">contacto@ardops.dev</a>.
</p>
```

Este párrafo cumple FR-010: la dirección aparece como texto visible
y seleccionable, no solo dentro del `href` del CTA.
