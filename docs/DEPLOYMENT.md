# DEPLOYMENT — Despliegue y operaciones

> Guia de despliegue, configuracion y operaciones de ElectroShop.

---

## 1. Arquitectura de despliegue

```
Docker Compose (10 contenedores)
├── mysql           (MySQL 8.4, puerto 33061:3306)
├── gateway         (NestJS, puerto 8000:8000)
├── auth-service    (NestJS, sin puerto publico)
├── user-service    (NestJS, sin puerto publico)
├── product-service (NestJS, sin puerto publico)
├── cart-service    (NestJS, sin puerto publico)
├── order-service   (NestJS, sin puerto publico)
├── inventory-service (NestJS, sin puerto publico)
├── payment-service (NestJS, sin puerto publico)
└── frontend        (nginx, puerto 5173:80)
```

---

## 2. Puertos expuestos

| Servicio | Puerto host | Puerto contenedor | Acceso |
|----------|-------------|-------------------|--------|
| MySQL | 33061 | 3306 | Solo host (desarrollo) |
| Gateway (API) | 8000 | 8000 | Host + frontend (proxy nginx) |
| Frontend | 5173 | 80 (nginx) | Host |

Los 7 servicios core no publican puertos al host. Solo se acceden via el gateway.

---

## 3. Variables de entorno

### Raiz (.env)

Todas las variables estan en `.env.example` en la raiz del repo.

| Variable | Obligatoria | Descripcion |
|----------|-------------|-------------|
| MYSQL_ROOT_PASSWORD | si | Password root de MySQL |
| AUTH_DB_PASSWORD | si | Password de auth_user |
| USER_DB_PASSWORD | si | Password de user_user |
| PRODUCT_DB_PASSWORD | si | Password de product_user |
| CART_DB_PASSWORD | si | Password de cart_user |
| ORDER_DB_PASSWORD | si | Password de order_user |
| INVENTORY_DB_PASSWORD | si | Password de inventory_user |
| PAYMENT_DB_PASSWORD | si | Password de payment_user |
| JWT_SECRET | si | Secreto de firma JWT (minimo 32 chars) |

### Servicios core

Cada servicio tiene su propio `.env.example`. Variables comunes:

| Variable | Descripcion |
|----------|-------------|
| PORT | Puerto del servicio (ej. 3001) |
| DB_HOST | Host de MySQL (default: mysql en compose) |
| DB_PORT | Puerto de MySQL (default: 3306) |
| DB_USERNAME | Usuario MySQL |
| DB_PASSWORD | Password MySQL |
| DB_DATABASE | Nombre del schema |
| JWT_SECRET | Secreto JWT (debe coincidir entre servicios) |
| DB_SYNCHRONIZE | "false" en prod, "true" solo dev local |
| DB_MIGRATIONS_RUN | "true" para ejecutar migraciones al arrancar |

---

## 4. Migraciones

- Cada servicio usa TypeORM migraciones manuales (ADR-014).
- En Docker: `DB_MIGRATIONS_RUN=true` ejecuta las migraciones al arrancar.
- En dev local: `DB_SYNCHRONIZE=true` para desarrollo rapido (sin migraciones manuales).
- Migraciones en: `core-services/<svc>/src/migrations/`.

---

## 5. Seeds

### Usuarios (auth-service)

```bash
cd core-services/auth-service
npm run seed
```

Crea usuarios por defecto (configurables via env):
- admin@electroshop.com / Admin123! (rol: admin)
- demo@electroshop.com / Demo123! (rol: user)

Variables:
- SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
- SEED_DEMO_EMAIL, SEED_DEMO_PASSWORD

### Productos (product-service)

```bash
cd core-services/product-service
npm run seed
```

Crea 6 categorias y 12 productos (fotos Unsplash, descuentos activos).

---

## 6. CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

### Jobs

| Job | Descripcion | Bloqueante |
|-----|-------------|------------|
| quality | lint + typecheck + build + test por paquete (matrix) | Si |
| audit | npm audit --omit=dev --audit-level=high por paquete | Si |
| secrets | gitleaks secret scan | Si |
| security-tests | Suite de seguridad (35 tests en auth-service) | Si |
| trivy | Trivy filesystem scan (CRITICAL+HIGH = fail) | Si |
| smoke | docker compose up + health check 9 servicios | Si |
| e2e | Playwright critical flow (register→login→catalog→cart→checkout→order) | Si |

### Puertas de calidad (PR gates)

- Lint: 0 errores
- Typecheck: 0 errores
- Build: compila
- Tests: 100% verdes
- Cobertura: >= 70% (criticos >= 75%)
- npm audit: 0 vulnerabilidades high/critical
- Secrets scan: 0 hallazgos

---

## 7. Smoke tests

### Local

```bash
powershell -File scripts/smoke.ps1
# SMOKE OK (9/9)
```

### CI

```bash
bash scripts/smoke-ci.sh
```

Verifica `/health` en los 9 servicios (gateway + 7 core + frontend).

### Verificacion completa

```bash
powershell -File scripts/check-all.ps1
# lint + typecheck + build + test de los 8 paquetes + frontend
```

---

## 8. Health checks

- `GET /health` (liveness): 200 si el servicio arranco.
- `GET /health/ready` (readiness): verifica conexion a BD.
- Gateway: `GET /health` agrega estado de todos los upstreams (ok/down).

---

## 9. Seguridad de despliegue

- `.env` nunca se commitea (en .gitignore).
- `.env.example` contiene placeholders (no secretos reales).
- MySQL: usuario por schema, privilegios minimos, sin cross-schema.
- Servicios core: no publican puertos al host.
- Docker: imagenes multi-stage, non-root user en produccion.
- Dependencias: `npm audit` como gate en CI.
- Secrets: gitleaks + trivy en CI.

---

## 10. Troubleshooting

### MySQL no arranca

- Verificar que `MYSQL_ROOT_PASSWORD` este definido en `.env`.
- Verificar que el volumen `mysql_data` no este corrupto: `docker compose down -v && docker compose up -d`.

### Servicio no pasa healthcheck

- Verificar logs: `docker compose logs <servicio>`.
- Verificar variables de entorno en `.env`.
- Verificar que MySQL esta healthy: `docker compose ps mysql`.

### Gateway no conecta a servicios

- Verificar que los servicios core estan healthy.
- Verificar variables `*_SERVICE_URL` en compose.
- Verificar red interna: `docker network inspect ecomerce-microservicios_internal`.
