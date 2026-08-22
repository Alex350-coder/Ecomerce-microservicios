# ARCHITECTURE — ElectroShop (E-Commerce Microservices)

> Documento de referencia arquitectónica. Fuente normativa: `Planning_files/03-TARGET-ARCHITECTURE.md`.

---

## 1. Visión general

ElectroShop es una tienda online de electrodomésticos construida con **7 microservicios NestJS** + **1 API Gateway** + **1 frontend React SPA**, todos comunicándose vía HTTP síncrono dentro de una red Docker interna.

```
                    ┌──────────────────────────────────────┐
                    │          FRONTEND (SPA) :5173         │
                    │   React 19 · Vite · TypeScript        │
                    │   AuthContext · CartContext · RQ       │
                    └─────────────────┬────────────────────┘
                                      │ http://localhost:8000
                                      ▼
                    ┌──────────────────────────────────────┐
                    │         API GATEWAY (NestJS) :8000    │
                    │  CORS · rate-limit · JWT · logging    │
                    └─┬──────┬──────┬──────┬──────┬────────┘
                      │      │      │      │      │
               ┌──────┘  ┌───┘  ┌───┘  ┌───┘  ┌───┐
               ▼         ▼      ▼      ▼      ▼
          ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
          │ auth    │ │ user │ │product│ │ cart │ │order │ │invent│ │pay   │
          │ :3002   │ │:3001 │ │ :3003 │ │:3004 │ │:3005 │ │:3006 │ │:3007 │
          └────┬────┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
               │         │        │        │        │        │        │
           auth_db    user_db  product_db cart_db order_db inventory_db payment_db
                        MySQL (1 instancia, N schemas)
```

---

## 2. Contrato de puertos

| Componente | Puerto host | Puerto interno | Acceso |
|------------|-------------|----------------|--------|
| Frontend (nginx) | 5173 | 80 | Host |
| API Gateway | 8000 | 8000 | Host + servicios internos |
| MySQL | 33061 | 3306 | Solo host |
| auth-service | — | 3002 | Solo red interna |
| user-service | — | 3001 | Solo red interna |
| product-service | — | 3003 | Solo red interna |
| cart-service | — | 3004 | Solo red interna |
| order-service | — | 3005 | Solo red interna |
| inventory-service | — | 3006 | Solo red interna |
| payment-service | — | 3007 | Solo red interna |

> Los 7 servicios core no publican puertos al host. Solo se acceden via el gateway.

---

## 3. Ownership de datos

| Dato | Dueño | Schema |
|------|-------|--------|
| Credenciales, rol, verificación, bloqueo, refresh tokens | auth-service | auth_db |
| Perfil extendido, direcciones | user-service | user_db |
| Catálogo, precios, categorías | product-service | product_db |
| Stock y reservas | inventory-service | inventory_db |
| Carrito y ítems | cart-service | cart_db |
| Pedidos e historial | order-service | order_db |
| Intents de pago simulados | payment-service | payment_db |

**Regla de oro:** ningún servicio escribe en el schema de otro. La única excepción documentada es la creación interna de perfil al registrar (auth → `POST /internal/users`), que es tolerante a fallo.

---

## 4. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 7, TypeScript 5, React Router 7, TanStack Query, Context API |
| Backend | NestJS 11, TypeORM 0.3, MySQL 8.4, Passport JWT, class-validator |
| Infra | Docker Compose (10 contenedores), GitHub Actions CI |
| Testing | Jest (backend), Vitest + RTL (frontend), Playwright (E2E) |
| Seguridad | bcryptjs (salt 12), JWT access/refresh, Helmet, rate-limit, CORS estricto |
| Pagos | Simulación determinista (sin dinero real) |

---

## 5. Flujo de compra (saga orquestada)

El order-service orquesta el proceso completo de compra:

```
1. Frontend → POST /orders (JWT, items, address, idempotencyKey)
2. order-service calcula totales (subtotal + shipping + 8% tax)
3. order-service → POST /inventory/reserve (bulk, transaccional)
4. order-service crea Order (PENDING) con snapshot de items
5. order-service → POST /payments/intents → pending → processing → approved|failed
6. approved → commit stock + Order → PAID + limpiar carrito
7. failed → release stock (compensación) + Order → FAILED
```

**Estados de pedido:** `pending → paid → shipped → delivered` | `pending → failed` | `pending/paid → cancelled`

**Compensación:** fallo de pago libera stock reservado; cancelación coherente con estado.

---

## 6. Contratos transversales

### 6.1 Formato de error estandar

```json
{
  "statusCode": 404,
  "message": "Producto no encontrado",
  "error": "Not Found",
  "requestId": "req_abc123"
}
```

Filtro global por servicio; el gateway lo propaga. Nunca se exponen stack traces fuera de dev.

### 6.2 Idempotencia

Cabecera `Idempotency-Key` en: `POST /orders`, `POST /payments/intents`, `POST /inventory/reserve`. Respuestas cacheadas por clave en DB con `UNIQUE`.

### 6.3 Autenticacion

- Cada servicio valida `Authorization: Bearer <accessToken>` con su propio `JwtAuthGuard` + `RolesGuard`.
- El gateway verifica JWT en borde e inyecta `X-User-Id`/`X-User-Role` (anti-spoofing).
- Access token: 15 min, en memoria de React. Refresh token: cookie httpOnly, rotativo, 30 dias.

### 6.4 Configuracion por entorno

Cada servicio usa `@nestjs/config` con `Joi` fail-fast. `.env.example` en raiz y por servicio. Variables con prefijo `DB_`, `JWT_`, `SERVICE_PORT`.

---

## 7. Seguridad por capa

```
Frontend          → apiClient central (sin URLs hardcodeadas, 401→refresh)
API Gateway       → CORS, Helmet, rate-limit, JWT edge, X-Request-Id
Servicios backend → ValidationPipe whitelist, DTOs estrictos, JwtAuthGuard, RolesGuard
MySQL             → usuario por schema, privilegios minimos, sin cross-schema
```

---

## 8. Decisiones arquitectonicas (ADRs)

| ADR | Decision | Motivo |
|-----|----------|--------|
| 001 | Monorepo unico, estructura plana | Simplicidad para portfolio |
| 002 | npm como gestor unico | Consistencia, lockfiles |
| 003 | NestJS 11 para todos los backends | Uniformidad, DI, guards nativos |
| 004 | 1 MySQL, 1 schema por servicio | Aislamiento logico + infra compartida |
| 005 | auth_db.users + user_db.perfiles | Ownership claro, sin lecturas cruzadas |
| 006 | HTTP sincrono + idempotencia (sin broker) | Simple, depurable, demostrable |
| 007 | API Gateway como unico punto de entrada | CORS en un solo lugar, observabilidad central |
| 008 | Access 15min + refresh rotativo httpOnly | Mitiga XSS, seguridad moderna |
| 009 | Pago simulado determinista | Sin dinero real, demostrable |
| 010 | Imagenes por URL externa (Unsplash) | Sin storage de archivos |
| 011 | React+Vite+TS, migracion TS progresiva | Equilibrio riesgo/calidad |
| 012 | Observabilidad minima (logs, health, correlation) | Suficiente para portfolio |
| 013 | Jest (backend) + Vitest (frontend) + Playwright (E2E) | Ecosistema conocido |
| 014 | Migraciones TypeORM (no synchronize en prod) | Seguridad y reproducibilidad |

> Documentos fuente: `Planning_files/03-TARGET-ARCHITECTURE.md` §6.

---

## 9. Directorio de servicios

```
Ecomerce-microservicios/
├── core-services/
│   ├── auth-service/       # :3002  auth_db
│   ├── user-service/       # :3001  user_db
│   ├── product-service/    # :3003  product_db
│   ├── cart-service/       # :3004  cart_db
│   ├── order-service/      # :3005  order_db
│   ├── inventory-service/  # :3006  inventory_db
│   ├── payment-service/    # :3007  payment_db
│   └── gateway/            # :8000  (sin DB)
├── frontend/               # React SPA (nginx :5173)
├── docker/mysql/init/      # Creacion de schemas y usuarios
├── docs/                   # Documentacion del proyecto
├── e2e/                    # Tests E2E (Playwright)
└── scripts/                # check-all, smoke tests
```
