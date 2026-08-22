# Plan — ElectroShop (E-Commerce Microservices)

> Resumen del master plan de desarrollo. Documento fuente: `Planning_files/04-ROADMAP.md`.

---

## Vision

Convertir el proyecto de e-commerce existente en una aplicacion de portfolio funcional,
segura, mantenible, testeable y preparada para produccion — todo sin dinero real ni
pasarelas de pago.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, Vite 7, TypeScript 5, React Router 7, TanStack Query |
| Backend | NestJS 11, TypeORM 0.3, MySQL 8.4, Passport JWT |
| Infra | Docker Compose (10 contenedores), GitHub Actions CI |
| Testing | Jest (backend), Vitest + RTL (frontend), Playwright (E2E) |
| Seguridad | bcryptjs, JWT access/refresh, Helmet, rate-limit |

## Topologia

```
Frontend :5173 → Gateway :8000 → auth :3002 | user :3001 | product :3003
                                   cart :3004 | order :3005 | inventory :3006
                                   payment :3007 → MySQL (1 instancia, N schemas)
```

## Fases completadas

| Fase | Nombre | Estado |
|------|--------|--------|
| F0 | Higiene repo | DONE |
| F1 | Plataforma (docker, MySQL, shells, CI) | DONE |
| F2 | API Gateway | DONE |
| F3 | Base frontend | DONE |
| F4 | Auth + user (slice vertical) | DONE |
| F5 | Catálogo (product-service) | DONE |
| F6 | Inventario (stock/reserva/commit/release) | DONE |
| F7 | Carrito (cart-service) | DONE |
| F8 | Order + payment + checkout | DONE |
| F9 | UX + admin | DONE |
| F10 | Seguridad (hardening) | DONE |
| F11 | Testing + CI enforcement | DONE |
| F12 | Observabilidad + resiliencia | DONE |
| F13 | Docs + portfolio | DONE |

## Entregables del master plan

| # | Entregable | Documento |
|---|-----------|-----------|
| 1 | Estado actual | `Planning_files/01-CURRENT-STATE.md` |
| 2 | Problemas críticos | `Planning_files/02-GAP-ANALYSIS.md` |
| 3 | Gap analysis | `Planning_files/02-GAP-ANALYSIS.md` |
| 4 | Arquitectura objetivo | `Planning_files/03-TARGET-ARCHITECTURE.md` |
| 5 | Decisiones arquitectónicas | `Planning_files/03-TARGET-ARCHITECTURE.md` (ADRs) |
| 6 | Roadmap por fases | `Planning_files/04-ROADMAP.md` |
| 7 | Dependencias | `Planning_files/04-ROADMAP.md` |
| 8 | Riesgos | `Planning_files/04-ROADMAP.md` |
| 9 | Quality gates | `Planning_files/05-QUALITY-GATES-METRICS.md` |
| 10 | Métricas | `Planning_files/05-QUALITY-GATES-METRICS.md` |
| 11 | Estructura de documentación | `Planning_files/06-STRATEGIES.md` |
| 12 | Estrategia de testing | `Planning_files/06-STRATEGIES.md` |
| 13 | Estrategia de seguridad | `Planning_files/06-STRATEGIES.md` |
| 14 | Definición de DONE | `Planning_files/07-DEFINITION-OF-DONE.md` |

## Documentación del proyecto

```
Ecomerce-microservicios/
├── docs/
│   ├── ARCHITECTURE.md      ← Arquitectura + diagramas + ADRs
│   ├── ROUTES.md            ← Mapa de rutas del gateway
│   ├── SETUP.md             ← Puesta en marcha
│   ├── ENV.md               ← Variables de entorno
│   ├── API-AUTH.md          ← Auth + User endpoints
│   ├── API-PRODUCTS.md      ← Catalogo endpoints
│   ├── API-CART.md          ← Carrito endpoints
│   ├── API-ORDERS.md        ← Order endpoints + saga
│   ├── API-PAYMENTS.md      ← Payment endpoints
│   ├── API-INVENTORY.md     ← Inventory endpoints
│   ├── PAYMENT-SIMULATION.md← Reglas del simulador
│   ├── SECURITY.md          ← Estrategia de seguridad
│   ├── TESTING.md           ← Estrategia de testing
│   ├── UI-GUIDE.md          ← Design tokens + componentes
│   └── DEPLOYMENT.md        ← Despliegue + CI/CD
├── Progress.md              ← Estado por fase
├── Plan.md                  ← Este documento
└── Tasks.md                 ← Desglose de tareas por fase
```

## Criterio de cierre

El proyecto se declara DONE cuando:

1. Todos los checkboxes de `Planning_files/07-DEFINITION-OF-DONE.md` estan marcados.
2. Progress.md refleja las 14 fases como DONE con evidencia.
3. Una persona ajena levanta el sistema y ejecuta: register → buy (simulated payment) → view order, sin preguntas.
