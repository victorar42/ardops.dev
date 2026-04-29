# Contract — Copy aprobado (normativo)

**Feature**: 004-personal-bio-rewrite
**Status**: Normative

Este contrato fija el texto exacto que se renderiza en `index.html`. El runbook editorial ([quickstart.md](../quickstart.md) §A) asume estos valores. Cualquier desviación requiere actualizar este contrato y re-evaluar `data-model.md`.

> **Nota sobre el texto final**: las cadenas de abajo son **propuestas normativas** consistentes con todas las decisiones del plan (R-001..R-014) y los FRs de la spec. El autor puede ajustar matices léxicos durante la implementación siempre que **se mantengan todas las invariantes** de [data-model.md](../data-model.md). Cualquier ajuste mayor (longitud, omisión de mención humana, cambio de voz) requiere abrir una nota en este contrato.

---

## 1. `HeroBio.text` (selector: `index.html` → `section.hero p.hero-desc`)

```text
Soy Victor Ardón. Trabajo como DevOps Engineer en Costa Rica, enfocado en
DevSecOps para banca y servicios financieros. Lo que me mueve es una idea
simple: las cosas deberían ir rápido y seguras al mismo tiempo. Me aburren
las tareas repetitivas hechas a mano — prefiero automatizarlas y que la
seguridad viaje dentro del pipeline, no como un trámite al final.
```

- **Conteo**: ~62 palabras (dentro de 54–66, R-005).
- **Voz**: primera persona ("Soy", "Trabajo", "Me aburren", "prefiero").
- **Sin enumeración técnica**: cumple FR-003.
- **Menciones**: rol (DevOps Engineer), sector (banca y servicios financieros), motivación (rápido + seguro).
- **HTML rendering**: párrafo único `<p class="hero-desc">…</p>`. Sin `<br>`, sin nested tags. El guion largo (`—`, U+2014) se escribe como Unicode directo.

---

## 2. `AboutBlock.paragraphs[]` (selector: `index.html` → `section#about .about-text > p`)

Tres `<p>` consecutivos, en este orden:

### Párrafo 1 — quiénes somos profesionalmente

```text
Diseño y opero plataformas DevOps en banca centroamericana. Mi trabajo
diario es convertir políticas de seguridad en código ejecutable y
auditable, para que ningún Pull Request llegue a producción sin pasar
por validaciones automáticas.
```

### Párrafo 2 — qué creo que importa

```text
Creo que la mejor seguridad es la que no se nota: la que vive dentro
del pipeline, se documenta en specs versionadas y no depende de que
alguien recuerde un checklist. Spec-driven, reproducible, sin excusas.
```

### Párrafo 3 — el lado humano (FR-004 + R-006)

```text
Fuera del trabajo soy felizmente casado y papá de tres — dos chicos y
una chica. Y si hay fútbol de por medio, mejor. Si algo de lo que
escribo acá te resuena, escribime: por trabajo, por una charla o solo
para conversar.
```

- **Total**: 3 párrafos (cumple `2 ≤ length ≤ 3`).
- **Mención humana**: explícita en P3 (papá de tres + fútbol).
- **Mención profesional**: explícita en P1 (DevOps + banca centroamericana) y P2 (pipeline, specs).
- **Formato**: prosa pura, sin bullets (cumple FR-004).
- **Invitación al engagement**: P3 cierra con CTA conversacional (cumple RF-5 del brief original / FR-004 spec).

### `AboutStack` (NO se modifica)

```text
GitHub Actions · DevSecOps · OpenAPI · OWASP · IaC · Kubernetes · CI/CD
```

Permanece intacto bajo `<p class="about-stack">`. Ver R-011 e I-7 en data-model.

---

## 3. `MetaDescription.text` (selector: `index.html` → `head > meta[name="description"]`)

```text
Soy Victor Ardón, DevOps Engineer en Costa Rica. Trabajo en DevSecOps para banca: pipelines que llevan seguridad y velocidad en el mismo PR.
```

- **Longitud**: 144 chars (≤ 160, FR-010).
- **Keywords críticas**: DevOps, DevSecOps, banca, Costa Rica (R-009).
- **Voz**: primera persona, alineada con `HeroBio`.

---

## 4. `OGDescription.text` (selector: `index.html` → `head > meta[property="og:description"]`)

```text
Soy Victor Ardón, DevOps Engineer en Costa Rica. Trabajo en DevSecOps para banca: pipelines que llevan seguridad y velocidad en el mismo PR.
```

**Idéntica** a `MetaDescription.text` (I-4).

---

## 5. Encoding

- UTF-8 sin BOM.
- Tildes (`á`, `é`, `í`, `ó`, `ú`, `ñ`) en code points Unicode directos.
- Guion largo `—` (U+2014) directo, no `&mdash;`.
- Cero caracteres invisibles (verificable con `grep -P '[\x{200B}\x{200C}\x{FEFF}]' index.html` → 0 matches).

---

## 6. Trazabilidad spec → contrato

| Requisito spec | Cubierto por |
|---|---|
| FR-001 (h1 = "Victor Josue Ardón Rojas") | Sin cambios; ya presente en `index.html` línea 148 |
| FR-002 (sin `[Tu Nombre]`) | Auditoría US2 + gate (contracts/no-placeholders-gate.md) |
| FR-003 (1ª persona, 40–90 palabras, sin enumeración) | §1 HeroBio (62 palabras) |
| FR-004 (about: profesional + humano en prosa) | §2 AboutBlock |
| FR-005 (nombre completo ≥ 1 vez) | h1 (preexistente) + §1 abre con "Soy Victor Ardón" como firma corta |
| FR-007 (sin info sensible) | Sin direcciones, teléfonos, fechas de nacimiento, nombres de hijos |
| FR-010 (meta ≤ 160 chars) | §3, §4 (144 chars) |
