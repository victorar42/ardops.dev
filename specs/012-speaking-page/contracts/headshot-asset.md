# Contract: Headshot asset

> Define el archivo binario del headshot servido en
> `/assets/img/speaking/headshot.jpg`. Validado por
> `tests/headshot-size.sh` y por inspección manual.

## Especificación

| Campo | Valor / restricción |
|-------|---------------------|
| Path canónico | `assets/img/speaking/headshot.jpg` |
| URL pública | `https://ardops.dev/assets/img/speaking/headshot.jpg` |
| Formato | JPEG progresivo (`Progressive, 4 components, 8-bit`) |
| Dimensiones mínimas | 1200 × 1200 px |
| Dimensiones recomendadas | 1500 × 1500 px |
| Aspect ratio | 1:1 (cuadrada) |
| Color profile | sRGB |
| Peso máximo | 256 000 bytes (≈ 250 KB binarios) |
| Peso target | ≤ 220 KB |
| Nombre de descarga | `ardon-headshot.jpg` (declarado en
  `<a download="ardon-headshot.jpg">`) |
| Alt text de uso | "Retrato de Victor Josue Ardón Rojas, fondo
  neutro, mirada al frente" (≥ 30 chars, descriptivo, no genérico) |

## Render en HTML

```html
<figure class="speaking-headshot">
  <img src="/assets/img/speaking/headshot.jpg"
       alt="Retrato de Victor Josue Ardón Rojas, fondo neutro, mirada al frente"
       width="320" height="320"
       loading="lazy" decoding="async">
  <figcaption>
    <a href="/assets/img/speaking/headshot.jpg"
       download="ardon-headshot.jpg">
      Descargar headshot HD (≈ 220 KB · 1500×1500 JPG)
    </a>
  </figcaption>
</figure>
```

- `width`/`height` declarados → CLS = 0.
- `loading="lazy"` + `decoding="async"` → no compite con LCP (la
  imagen vive bajo el fold dentro de su propia sección).
- `download="ardon-headshot.jpg"` → nombre estable; futuras
  organizadoras que lo guarden no terminan con duplicados al
  re-descargar.

## Cómo regenerar / actualizar

1. Tomar la foto fuente en ≥ 1500 × 1500 px, sRGB.
2. Comprimir a JPG progresivo. Opciones equivalentes:
   - GUI: TinyJPG (https://tinyjpg.com), Squoosh
     (<https://squoosh.app>) — ambos local-first, sin upload a
     terceros si se usa Squoosh PWA.
   - CLI: `cjpeg -progressive -quality 82 -outfile headshot.jpg input.png`
     (libjpeg-turbo) o `magick input.png -interlace JPEG -quality 82 headshot.jpg`.
3. Verificar peso: `wc -c assets/img/speaking/headshot.jpg` debe dar
   ≤ 256000.
4. Verificar dimensiones (macOS): `sips -g pixelWidth -g pixelHeight assets/img/speaking/headshot.jpg`.
5. Correr `bash tests/headshot-size.sh`.
6. Commit y push.

## Variantes opcionales (out of scope para esta spec)

Si más adelante se quieren ofrecer variantes (cuadrada / horizontal /
B&N), commitear archivos adicionales bajo el mismo directorio:

- `assets/img/speaking/headshot-horizontal.jpg`
- `assets/img/speaking/headshot-bw.jpg`

Cada variante debe cumplir las mismas restricciones de peso y formato
y aparecer con su propio enlace `<a download>` en la sección headshot.
La gate `tests/headshot-size.sh` se extiende fácilmente con un loop.

## Gate `tests/headshot-size.sh`

Comportamiento esperado (ver research R-6):

```
✓ headshot-size gate: assets/img/speaking/headshot.jpg (218421 bytes, 1500x1500)
```

Falla si:

- El archivo no existe.
- `file` no detecta `JPEG image data`.
- `wc -c` reporta > 256000.
- Si `sips` está disponible y reporta dimensiones < 1200×1200.

## Privacidad

La foto NO debe contener:

- Metadatos EXIF de geolocalización (strip con `exiftool -gps:all= -overwrite_original headshot.jpg` o equivalente).
- Datos personales en EXIF (autor real, modelo de cámara serial, etc.):
  permitidos pero recomendado limpiarlos con
  `exiftool -all= -tagsfromfile @ -ColorSpaceTags -overwrite_original headshot.jpg`.

(El strip de EXIF es opcional pero recomendado por constitución VIII;
no es bloqueante de la spec.)
