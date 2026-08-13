# ElectroShop — E-Commerce de Microservicios

Tienda online de electrodomésticos y electrónica construida con una arquitectura de microservicios.

## Arquitectura

```
.
├── core-services/
│   ├── user-service/       # Usuarios      (NestJS, TypeORM, MySQL) :3001
│   ├── auth-service/       # Autenticación (NestJS, TypeORM, MySQL) :3002
│   ├── product-service/    # Catálogo      (NestJS, TypeORM, MySQL) :3003
│   ├── cart-service/       # Carrito       (NestJS, TypeORM, MySQL) :3004
│   ├── order-service/      # Pedidos       (NestJS, TypeORM, MySQL) :3005
│   ├── inventory-service/  # Inventario    (NestJS, TypeORM, MySQL) :3006
│   ├── payment-service/    # Pagos         (NestJS, TypeORM, MySQL) :3007
│   └── gateway/            # API gateway (entry point único)        :8000
├── frontend/               # React 19 + Vite + TS (nginx) :5173 → /api → gateway
├── docker/mysql/init/      # Creación de schemas y usuarios por servicio
├── docs/                   # SETUP.md y ENV.md
└── scripts/                # check-all.ps1, smoke.ps1, smoke-ci.sh
```

- **Red interna:** los servicios core no publican puertos; solo gateway, frontend y MySQL.
- **MySQL:** un schema y un usuario por servicio, privilegios mínimos.

## Stack

- **Backend:** NestJS 11, TypeORM, MySQL 8.4, JWT, validación Joi (fail-fast)
- **Frontend:** React 19, Vite 7, TypeScript, React Router 7, servido con nginx
- **Infra:** Docker Compose (10 contenedores), healthchecks `wget /health`, CI GitHub Actions

## Puesta en marcha

1. `cp .env.example .env` y completar los `<set-me>` (ver `docs/ENV.md`)
2. `docker compose up -d --build`
3. `docker compose ps` → 9 contenedores `healthy`
4. Smoke test: `powershell -File scripts/smoke.ps1` → `SMOKE OK (9/9)`

Accesos: frontend `http://localhost:5173/`, gateway `http://localhost:8001/health`,
MySQL `localhost:33061`. Detalles en `docs/SETUP.md`.

## Verificación de consistencia

```bash
# lint + typecheck + build + test de los 8 paquetes + frontend
powershell -File scripts/check-all.ps1
```

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- `quality`: matrix por paquete (lint + typecheck + build + test). auth-service
  tiene lint/tests no-bloqueantes por deuda preexistente documentada (F4).
- `audit`: `npm audit --omit=dev --audit-level=high` por paquete (bloqueante).
- `secrets`: gitleaks.
- `smoke`: levanta el compose completo y verifica `/health` en los 8 servicios + frontend.

## Documentación

- `docs/SETUP.md` — puesta en marcha, puertos, notas de plataforma
- `docs/ENV.md` — inventario de variables de entorno
- `Progress.md` — estado por fase del roadmap
- `Planning_files/` — plan, arquitectura objetivo, gaps, Definition of Done y suite de seguridad
