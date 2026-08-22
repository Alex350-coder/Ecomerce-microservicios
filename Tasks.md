# Tasks — Desglose de tareas por fase

> Checklist operativo por fase. Documento fuente: `Planning_files/04-ROADMAP.md`.

---

## F0 — Higiene del repositorio

- [x] Eliminar carpetas anidadas duplicadas
- [x] Eliminar package.json obsoleto de auth-service
- [x] Consolidar a npm (eliminar yarn.lock)
- [x] .gitignore + .editorconfig + .prettierrc globales
- [x] ESLint + Prettier unificados
- [x] index.html con titulo/meta
- [x] README esqueleto + Progress.md

## F1 — Plataforma base

- [x] docker-compose.yml (MySQL + 8 servicios + frontend)
- [x] Dockerfiles multi-stage por servicio
- [x] Esqueletos NestJS con health checks
- [x] MySQL: 7 schemas + 7 usuarios privilegios minimos
- [x] Configuracion por entorno (.env.example)
- [x] CI GitHub Actions esqueleto
- [x] docs/SETUP.md + docs/ENV.md

## F2 — API Gateway

- [x] Gateway NestJS :8000 con proxy por prefijo
- [x] CORS estricto (solo :5173)
- [x] Rate-limit global + auth
- [x] Verificacion JWT en borde
- [x] Inyeccion X-User-Id/X-User-Role
- [x] Middleware X-Request-Id + logging
- [x] Errores estandar sin leaks
- [x] Tests unit + e2e
- [x] docs/ROUTES.md

## F3 — Base frontend

- [x] API client centralizado (apiClient)
- [x] AuthContext (sesion en memoria)
- [x] CartContext (local, puente hasta F7)
- [x] TanStack Query configurado
- [x] Migracion TS progresiva
- [x] Rutas nuevas (/products/:id, /cart, /orders, /forgot-password)
- [x] Consolidacion CSS
- [x] Tests Vitest
- [x] docs/FRONTEND.md

## F4 — Auth + User (slice vertical)

- [x] Migraciones auth_db (users, refresh_tokens)
- [x] auth-service completo (register, login, refresh, logout, forgot, reset)
- [x] user-service (perfil, direcciones, internal/users)
- [x] Guards JWT + Roles reales
- [x] Cookie httpOnly para refresh
- [x] Frontend: Login, Register, Account conectados
- [x] Matrices de seguridad A1-A12/B1-B8
- [x] docs/API-AUTH.md + docs/SECURITY-F4.md

## F5 — Catalogo

- [x] product-service completo (CRUD admin, listado publico)
- [x] Seed: 6 categorias + 12 productos
- [x] Frontend: Products, ProductDetail, Home con API real
- [x] Busqueda + filtros + paginacion
- [x] docs/API-PRODUCTS.md

## F6 — Inventario

- [x] inventory-service (GET, PATCH admin, reserve, commit, release)
- [x] Reserva transaccional con pessimistic_write lock
- [x] Stock nunca negativo
- [x] docs/API-INVENTORY.md

## F7 — Carrito

- [x] cart-service (CRUD items, merge guest→user, checkout lock)
- [x] Frontend: CartContext real, Cart, CartDropdown
- [x] Validacion de stock contra inventory-service
- [x] docs/API-CART.md

## F8 — Order + Payment + Checkout

- [x] order-service (saga orquestada, estados, compensacion)
- [x] payment-service (simulacion determinista)
- [x] Checkout real en frontend
- [x] Historial de pedidos
- [x] docs/API-ORDERS.md + docs/API-PAYMENTS.md + docs/PAYMENT-SIMULATION.md

## F9 — UX + Admin

- [x] Migracion TSX completa
- [x] Identidad visual ElectroShop
- [x] Admin dashboard + CRUD
- [x] Componentes UI reutilizables

## F10 — Seguridad

- [x] ValidationPipe whitelist en todos los servicios
- [x] DTOs completos con @MaxLength/@IsUUID
- [x] Helmet + CSP
- [x] Security tests (35 tests)
- [x] npm audit clean
- [x] docs/SECURITY.md

## F11 — Testing + CI

- [x] Coverage thresholds en todos los paquetes
- [x] Security tests en CI
- [x] Trivy fs scan en CI
- [x] E2E Playwright (critical flow)
- [x] docs/TESTING.md

## F12 — Observabilidad

- [x] Logging estructurado JSON
- [x] X-Request-Id propagado
- [x] Health + health/ready
- [x] Retry con backoff
- [x] Idempotency verification
- [x] docs/SECURITY-F12.md

## F13 — Docs + Portfolio

- [x] README completo
- [x] docs/ARCHITECTURE.md (diagramas + ADRs)
- [x] docs/API-INVENTORY.md
- [x] docs/API-PAYMENTS.md
- [x] docs/API-ORDERS.md
- [x] docs/PAYMENT-SIMULATION.md
- [x] docs/UI-GUIDE.md
- [x] docs/DEPLOYMENT.md
- [x] Plan.md + Tasks.md
- [x] docs/DEMO.md
- [x] Progress.md actualizado
