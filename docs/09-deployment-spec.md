# Deployment Specification

## Estrategia
- Branch `main` = producción (deploy automático)
- Branches `feature/*` = preview (opcional, vía PR comments)
- Squash merge obligatorio

## Pipeline (GitHub Actions)
Stages:
1. Lint (HTML, CSS, JS, MD)
2. Validate specs (todos los .md de /docs deben existir)
3. Security scan (Semgrep, secret scanning)
4. Build (si aplica)
5. Test (Lighthouse CI, link checker, a11y)
6. Deploy a GitHub Pages
7. Smoke test post-deploy (curl checks de páginas críticas)

## Rollback
- Revert del commit en main → redespliegue automático
- Tiempo objetivo de rollback: < 5 minutos

## Monitoreo
- UptimeRobot o equivalente (free tier)
- Alerta a email si el sitio responde != 200 por > 2 min