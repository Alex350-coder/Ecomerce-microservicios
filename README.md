# ElectroShop — E-Commerce Microservices

Tienda online de electrodomesticos y electronica construida con arquitectura de microservicios.
Proyecto de portfolio que demuestra diseño de APIs, seguridad, testing y operaciones en un stack moderno.

**Stack:** React 19 + Vite 7 + TypeScript · NestJS 11 + TypeORM + MySQL 8.4 · Docker Compose + GitHub Actions CI

---

## Arquitectura

```
Frontend :5173 → Gateway :8000 → auth :3002 | user :3001 | product :3003
                                   cart :3004 | order :3005 | inventory :3006
                                   payment :3007 → MySQL (1 instancia, N schemas)
```

- **Gateway:** unico punto de entrada (8000), JWT edge, CORS, rate-limit, proxy a servicios core.
- **Servicios core:** 7 microservicios NestJS, sin puertos publicados al host.
- **MySQL:** un schema y un usuario por servicio, privilegios minimos.
- **Frontend:** React SPA servida con nginx, proxy `/api/*` → gateway.

## Stack tecnologico

| Capa | Tecnologias |
|------|-------------|
| Frontend | React 19, Vite 7, TypeScript 5, React Router 7, TanStack Query, Vitest |
| Backend | NestJS 11, TypeORM 0.3, MySQL 8.4, Passport JWT, Joi validation |
| Infra | Docker Compose (10 contenedores), multi-stage Dockerfiles, nginx |
| Testing | Jest (backend), Vitest + RTL (frontend), Playwright (E2E) |
| CI/CD | GitHub Actions: lint, typecheck, build, test, security, smoke, e2e |
| Seguridad | bcryptjs, JWT access/refresh httpOnly, Helmet, rate-limit, RBAC |

## Puesta en marcha

```bash
cp .env.example .env          # completar variables (ver docs/ENV.md)
docker compose up -d --build  # levantar 10 contenedores
docker compose ps             # verificar: 9 servicios healthy
```

- Frontend: http://localhost:5173
- Gateway: http://localhost:8000/health
- MySQL: localhost:33061

### Smoke test

```bash
powershell -File scripts/smoke.ps1   # SMOKE OK (9/9)
```

### Verificacion completa

```bash
powershell -File scripts/check-all.ps1   # lint + typecheck + build + test
```

### Seeds

```bash
cd core-services/auth-service && npm run seed   # admin + demo users
cd core-services/product-service && npm run seed # 6 categorias + 12 productos
```

**Credenciales demo:**
- demo@electroshop.com / Demo123! (user)
- admin@electroshop.com / Admin123! (admin)

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

| Job | Descripcion | Bloqueante |
|-----|-------------|------------|
| quality | lint + typecheck + build + test por paquete (matrix) | Si |
| audit | npm audit --omit=dev --audit-level=high | Si |
| secrets | gitleaks secret scan | Si |
| security-tests | 35 tests de seguridad en auth-service | Si |
| trivy | Trivy filesystem scan (CRITICAL+HIGH = fail) | Si |
| smoke | docker compose up + health check 9 servicios | Si |
| e2e | Playwright critical flow (register→login→cart→checkout) | Si |

## Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend | :5173 |
| Gateway (API) | :8000 |
| MySQL | :33061 |

Los servicios core (auth, user, product, cart, order, inventory, payment) no publican puertos al host.

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Arquitectura, diagramas, ADRs, contratos |
| `docs/ROUTES.md` | Mapa completo de rutas del gateway |
| `docs/SETUP.md` | Puesta en marcha detallada |
| `docs/ENV.md` | Variables de entorno |
| `docs/API-AUTH.md` | Endpoints de autenticacion y usuarios |
| `docs/API-PRODUCTS.md` | Endpoints de catalogo |
| `docs/API-CART.md` | Endpoints de carrito |
| `docs/API-ORDERS.md` | Endpoints de pedidos + saga |
| `docs/API-PAYMENTS.md` | Endpoints de pagos (simulados) |
| `docs/API-INVENTORY.md` | Endpoints de inventario |
| `docs/PAYMENT-SIMULATION.md` | Reglas del simulador de pagos |
| `docs/SECURITY.md` | Estrategia de seguridad |
| `docs/TESTING.md` | Estrategia de testing |
| `docs/UI-GUIDE.md` | Design tokens y componentes |
| `docs/DEPLOYMENT.md` | Despliegue y CI/CD |
| `docs/DEMO.md` | Guia de demostracion para portafolio |
| `Plan.md` | Resumen del master plan |
| `Tasks.md` | Desglose de tareas por fase |
| `Progress.md` | Estado de cada fase con evidencia |

## Pago simulado

> **Este proyecto NO procesa dinero real.** No hay integracion con Stripe, PayPal, ni bancos.
> El simulador usa una regla determinista para demostrar saga, compensacion e idempotencia.
> Ver `docs/PAYMENT-SIMULATION.md` para detalles.

## Criterio de cierre

El proyecto se declara DONE cuando:

1. Todos los checkboxes de `Planning_files/07-DEFINITION-OF-DONE.md` estan marcados.
2. Progress.md refleja las 14 fases como DONE con evidencia.
3. Una persona ajena levanta el sistema y ejecuta: register → buy (simulated payment) → view order, sin preguntas.
