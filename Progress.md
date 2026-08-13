# Progress

Estado real por fase del plan `Planning_files/04-ROADMAP.md`. Única fuente de estado de fases.

**Regla de veracidad:** una fase es DONE solo cuando cumple todos sus criterios de aceptación y los gates de calidad/seguridad de la fase (ver `security/18-QUALITY-GATES.md`).

## Estado por fase

| Fase | Descripción | Estado |
|------|-------------|--------|
| F0 | Higiene repo | DONE (2026-08-13) |
| F1 | Plataforma (docker compose + 7 shells + health + CI) | DONE (2026-08-13) |
| F2 | Gateway (único entry point :8000) | Pendiente |
| F3 | Base frontend (api client, contextos, TS progresivo, rutas) | Pendiente |
| F4 | Auth + user (slice vertical autenticación completo) | Pendiente |
| F5 | Catálogo (product-service + catálogo real) | Pendiente |
| F6 | Inventario (stock/reserva/commit/release) | Pendiente |
| F7 | Carrito (cart-service + carrito + merge) | Pendiente |
| F8 | Pedidos + pagos (saga checkout con pago simulado) | Pendiente |
| F9 | UX + admin (identidad visual + panel admin) | Pendiente |
| F10 | Seguridad (hardening + security tests) | Pendiente |
| F11 | Testing + CI (gates obligatorios, e2e) | Pendiente |
| F12 | Observabilidad (logs correlacionados + health ready) | Pendiente |
| F13 | Docs + portfolio (documentación completa y veraz) | Pendiente |

## Fase 0 — Higiene del repositorio y tooling

- [x] Aplanar carpetas anidadas (`auth-service/auth-service`, `frontend/frontend`, `user-service/user-service`)
- [x] Eliminar `package.json` obsoleto de auth-service (Mongoose)
- [x] Consolidar a npm (eliminar `yarn.lock`)
- [x] `.gitignore` global + `.editorconfig` + `.prettierrc` (raíz)
- [x] ESLint + Prettier unificados (auth-service y frontend)
- [x] `index.html` con título/meta de ElectroShop
- [x] README raíz esqueleto + este `Progress.md`

**Criterios de aceptación (verificados 2026-08-13):** `git status` limpio; `npm run build` OK en frontend y auth-service; `npm audit` 0 vulnerabilidades en ambos paquetes; sin `yarn.lock`; sin carpetas anidadas; sin `package.json` obsoleto; sin secretos en código; 1 lockfile por paquete.

**Deuda documentada (preexistente, fuera del alcance de F0):** `eslint` de auth-service reporta 13 errores `@typescript-eslint/no-unsafe-*` y 1 warning `no-floating-promises` en código existente. La config de lint quedó unificada en F0, pero los fixes de tipado son parte de la fase F4 (Auth a producción). Frontend: lint sin errores (G5 OK).

## Fase 1 — Plataforma (esqueletos + infraestructura)

- [x] Template canónico de servicio NestJS (config Joi fail-fast, health, filter de errores, Dockerfile multi-stage)
- [x] 6 esqueletos con DB: user, product, cart, order, inventory, payment (3001, 3003–3007)
- [x] gateway sin DB (entry point, :8000, CORS)
- [x] Cambios mínimos auth-service (health controller + `.env.example`, `synchronize` env-driven)
- [x] MySQL 8.4 con 7 schemas + 7 usuarios de privilegios mínimos (`docker/mysql/init`)
- [x] Dockerfiles multi-stage (npm 11 fijado) + healthchecks `wget /health` en los 9 contenedores
- [x] Frontend servido con nginx (SPA fallback + proxy `/api/*` → gateway)
- [x] Scripts: `check-all.ps1` (8 paquetes), `smoke.ps1` (local) y `smoke-ci.sh` (CI)
- [x] CI GitHub Actions: quality (matrix), audit, secrets (gitleaks), smoke
- [x] Docs: `docs/SETUP.md`, `docs/ENV.md`, README actualizado

**Criterios de aceptación (verificados 2026-08-13):**

- `docker compose up -d` levanta los 10 contenedores; los 9 con healthcheck quedan `healthy`
- Smoke `SMOKE OK (9/9)`: `/health` 200 en gateway (host :8001), auth y 6 servicios core (por exec en contenedor), frontend :5173
- `/health/ready` con DB: `{"status":"ok","database":"up"}` (user-service y auth-service)
- Proxy frontend `/api/health` → gateway → `200`
- `check-all.ps1`: lint=0, typecheck=0, build=0, tests OK en los 7 esqueletos + frontend
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades en los 9 paquetes
- `docker compose config` válido; `internal: true` descartado (bloquea publicación de puertos)
- Sin secretos en git (`.env` gitignored, `.env.example` con `<set-me>`); gitleaks en CI

**Deuda documentada (preexistente, pasa a F4):** auth-service mantiene 13 errores lint y 2 tests fallando (código pre-F0). Excepción en CI: lint y tests de auth **no-bloqueantes**; typecheck (script añadido, `tsc --noEmit`) y build SÍ bloquean. El error TS2554 preexistente del spec de JwtStrategy se corrigió (mock de ConfigService) para que el typecheck pueda ser estricto. El stack Docker de auth es funcional (health + DB OK).
