# Progress

Estado real por fase del plan `Planning_files/04-ROADMAP.md`. Única fuente de estado de fases.

**Regla de veracidad:** una fase es DONE solo cuando cumple todos sus criterios de aceptación y los gates de calidad/seguridad de la fase (ver `security/18-QUALITY-GATES.md`).

## Estado por fase

| Fase | Descripción | Estado |
|------|-------------|--------|
| F0 | Higiene repo | DONE (2026-08-13) |
| F1 | Plataforma (docker compose + 7 shells + health + CI) | DONE (2026-08-13) |
| F2 | Gateway (único entry point :8000) | DONE (2026-08-14) |
| F3 | Base frontend (api client, contextos, TS progresivo, rutas) | DONE (2026-08-14) |
| F4 | Auth + user (slice vertical autenticación completo) | DONE (2026-08-14) |
| F5 | Catálogo (product-service + catálogo real) | DONE (2026-08-16) |
| F6 | Inventario (stock/reserva/commit/release) | DONE (2026-08-18) |
| F7 | Carrito (cart-service + carrito + merge) | DONE (2026-08-18) |
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

## Fase 2 — Gateway (único entry point :8000)

- [x] Gateway NestJS en `:8000` con proxy por prefijo a los 7 servicios (auth, users, products, cart, orders, inventory, payments)
- [x] Rutas gestionadas por el gateway: `GET /health` y `GET /health/ready` (agregado de upstreams ok/down)
- [x] Seguridad de borde: Helmet, CORS estricto solo `http://localhost:5173`, rate-limit global (100/60s) + auth (10/60s) con `@nestjs/throttler`
- [x] Verificación JWT de borde (401 salvo rutas públicas) e inyección `X-User-Id`/`X-User-Role` anti-spoofing
- [x] Middleware `X-Request-Id` (reuso/propagación/echo) + logging HTTP
- [x] Errores estándar `{statusCode, message, error, requestId}` sin leaks (AUTH_INVALID_TOKEN, ROUTE_NOT_FOUND, BAD_GATEWAY, GATEWAY_TIMEOUT, PAYLOAD_TOO_LARGE)
- [x] Puerto host del gateway en compose: `8000:8000` (antes `8001`); smoke actualizado
- [x] auth-service sin CORS propio (solo accesible vía gateway); servicios internos sin puertos publicados
- [x] Tests: 18 unit + 11 e2e (proxy, CORS, JWT edge, correlación, health, 404 estándar)
- [x] Docs: `docs/ROUTES.md` (mapa de rutas), `docs/ENV.md` (variables nuevas del gateway)

**Criterios de aceptación (verificados 2026-08-14):**

- `docker compose up -d` levanta el stack; smoke `SMOKE OK (9/9)` (gateway :8000, 7 servicios por exec, frontend :5173)
- `GET /health` lista los 7 upstreams (todos `ok`)
- `POST /auth/login` se reenvía al auth-service por el gateway (la respuesta depende del estado real del auth-service, sin tabla `users` sin migración)
- Ruta protegida sin token → `401 AUTH_INVALID_TOKEN` (formato estándar con `requestId`)
- Cabeceras de correlación presentes (echo de `X-Request-Id`)
- `check-all.ps1`: lint=0 errores, typecheck, build y tests OK en los 8 paquetes (incluye gateway)
- `npm audit`: 0 vulnerabilidades en gateway
- `docker compose config` válido; sin secretos en git

**Notas F2:** la tabla `auth_db.users` aún no existe (las migraciones de auth-service son parte de F4), por lo que `POST /auth/login` devuelve 500/502 del auth-service hasta entonces — el enrutado del gateway es correcto. Product-service aún no expone `GET /products` (fase F5), por lo que `/products` responde 404 del upstream, no del gateway.

## Fase 3 — Base de arquitectura del frontend

- [x] Capa de datos única: `src/api/client.ts` (apiClient) + `src/api/auth.ts` (token holder en memoria)
  - `API_BASE_URL` desde `VITE_API_URL` (default `http://localhost:8000` = gateway); **0 URLs hardcodeadas en páginas/componentes**
  - `Authorization: Bearer` (token en memoria) + `X-Request-Id` (uuid) + `ApiError` estándar `{statusCode, message, code, requestId, details}`
  - 401 → refresh automático con un retry; sin recursión en `/auth/refresh`; el refresh exitoso actualiza el token vía `setAccessToken`
- [x] `AuthContext` (login/logout/refresh, token solo en memoria, **sin localStorage**, refresh-on-boot + registro del refresh handler)
- [x] `CartContext` (estado local con persistencia en `localStorage` como puente provisional hasta F7)
- [x] TanStack Query instalado y configurado (`QueryClientProvider` en `main.tsx`)
- [x] Rutas lower-case + nuevas: `/products/:id`, `/cart`, `/orders`, `/forgot-password` (estado vacío/provisional) + redirect `*` → `/`
- [x] Footer HTML válido (sin `<a>` anidado en `<Link>`); Header con `useAuth` (sin localStorage) y buscador funcional (provisional local → `/products?q=`)
- [x] Login/Register/Account/forgot/reset conectados vía `apiClient` (sin `fetch` directo ni URLs de puertos)
- [x] Migración TS: `Button/Input/Card/Navbar/MainLayout/AuthLayout` → TSX tipados; eliminados los 6 `.d.ts` de parche (`pages.d.ts`, `pages/index.d.ts`, `types/*.d.ts`); build TS real con `allowJs`
- [x] CSS consolidado: tokens solo en `variables.css`, `globals.css` sin `:root` duplicado, `index.css` sin defaults de Vite
- [x] Tests Vitest + Testing Library + jsdom (3 archivos, 25 tests); `check-all.ps1` con `HasTest=$true` para frontend
- [x] Docs: `docs/FRONTEND.md` + nota de cierre F3 y nota heredada F4 en `04-ROADMAP.md`

**Criterios de aceptación (verificados 2026-08-14):**

- `npm run build` OK con TS real (incluye `tsc -b`) sin `.d.ts` de parche en archivos migrados
- `npm run lint` 0 errores; `npm test` 25/25 (3 archivos); coverage 94.9 % statements / 96.2 % lines / 85.4 % branches (gate ≥ 80 %)
- `check-all.ps1 -SkipBuild`: OK en los 8 paquetes (incluye test del frontend con `--no-file-parallelism`)
- Métrica TS: 60.5 % de archivos en `.ts`/`.tsx` (objetivo ≥ 60 %)
- 0 URLs de API hardcodeadas y 0 `fetch(` directos fuera de `src/api/` (grep en `src`); 0 secrets (`sk-`, `api_key`, `JWT_SECRET`) en el bundle de `dist`
- Páginas `/cart`, `/orders`, `/forgot-password` renderizan (estado vacío, provisional); Footer HTML válido
- 12 commits de F3 en `master` (≥ 10): RED/GREEN apiClient, AuthContext, CartContext + feat providers/rutas + refactor TS + refactor CSS + docs + ci

**Validación "login persiste sesión tras refresh":** el login real devuelve 500/502 hasta F4 (tabla `users` sin migrar). Se valida con unit tests de `AuthContext` sobre `apiClient` mockeado (refresh-on-boot restaura sesión, handler registrado/limpio). Ver nota en FASE 4 del roadmap.

**Deuda documentada (pasa a F4):** páginas no migradas aún (Home, Products, Checkout, Account, Login, Register, FastLinks, Privacy) siguen en `.jsx` y tipan vía `allowJs` — la migración total a TSX es parte de F4/F9; `Account.tsx` usa `window.location.href="/login"` para logout (puede migrar a `navigate` de react-router); CartContext sigue siendo local (conexión real a cart-service en F7).

## Fase 4 — Auth + user (slice vertical de autenticación)

- [x] Migraciones TypeORM a mano en auth y user (sin MySQL local: `migrationsRun` lee `DB_MIGRATIONS_RUN='true'`) + seed admin/demo + `JWT_SECRET` a user-service en compose
- [x] auth-service: registro/login con refresh cookie httpOnly rotativo, logout con revocación, `GET /auth/me`, guards JWT/Roles, DTOs con password ≥8, reset token hasheado (69→70 tests, cobertura 81 % ≥ 75 %)
- [x] user-service: perfil/direcciones con guards + ownership (`assertOwnershipOrAdmin` → 404) + `POST /internal/users` (cobertura 91 % ≥ 70 %)
- [x] Gateway F4: `/auth/refresh` y `/auth/logout` públicos en el edge (cookie httpOnly) + rate-limit 10/60s en auth-proxy; verificado que el proxy reenvía `cookie` y `set-cookie`
- [x] Frontend alineado: rutas auth correctas (`/auth/register`, `/auth/:id/verify-email`) y password mínimo 8 (Register/Account/Login); 25 tests Vitest PASS
- [x] Matrices de seguridad A1–A12/B1–B8 cubiertas y con evidencia (`docs/SECURITY-F4.md`); A11 = respuesta uniforme en register (sin enumeración de emails)
- [x] Docs: `docs/SECURITY-F4.md`, `docs/ROUTES.md` actualizado (rutas públicas y rate-limit auth)

**Criterios de aceptación (verificados 2026-08-14):**

- `JwtAuthGuard` real protege `/auth/me` y rutas de user-service; access JWT 15 min + refresh cookie httpOnly rotativa + logout con revocación (ADR-008); password ≥8 (R1.6)
- Tests A1–A12/B1–B8 pasan (bloqueante) — ver tabla en `docs/SECURITY-F4.md`
- `check-all.ps1`: lint 0 errores, typecheck, build y tests OK en auth-service, user-service, gateway y frontend
- Sin `console.log` de tokens ni secretos en código; `.env` gitignored, `.env.example` con placeholders
- Cobertura: auth-service 81.09 % stmts / 80.94 % lines (umbral 75 %), user-service 91.46 % lines (umbral 70 %), frontend 25/25 (umbral 80 %)
- 10 commits de F4 en `master` (`98466`→`a5488`, incl. RED/GREEN por servicio, migraciones, gateway, frontend, matriz A/B y docs; véase `docs/SECURITY-F4.md` para el mapeo de evidencia)

**Deuda documentada (pasa a fases siguientes):** B5 (IDOR órdenes) y B8 (carrito ajeno) son de F7/F8; el envío real de email está simulado (no hay SMTP); la migración real a MySQL requiere el stack Docker levantado (las migraciones están escritas a mano y el seed necesita la DB).

## Fase 5 — Catálogo (product-service + catálogo real)

- [x] product-service: `GET /products` (filtros `search`/`categoryId`/`sort`/`isFeatured`, paginación `page`/`limit` con envelope `{data, meta}`), `GET/POST/PATCH/DELETE /products(/​:id)` y `GET /categories` + CRUD admin; solo productos activos; `price` efectivo con descuentos por ventana `validFrom`–`validTo`
- [x] Gateway: prefijo `/categories` → product-service + `GET /products*` y `GET /categories*` públicos en el edge JWT; tests de rutas
- [x] Seed TypeORM `npm run seed` (`src/seed/seed-products.ts`): 6 categorías + 12 productos (fotos Unsplash, descuentos activos, ratings, features, destacados/novedades); idempotente por slug
- [x] Frontend catálogo real: `src/api/products.ts` (fetchProducts/fetchProduct/fetchCategories/formatPrice/PRODUCT_SORTS) + `src/hooks/useDebounce.ts`; páginas `Products.tsx` (búsqueda debounce 400ms, filtro categoría/sort, paginación, add-to-cart), `ProductDetail.tsx` real (galería, features, precio con descuento, add-to-cart) y `Home.tsx` (destacados); `Spinner` reusable; **borrados `Products.jsx` y `Home.jsx`** (resolución Vite `.jsx` > `.tsx`)
- [x] Tests Vitest RED→GREEN api layer + hook (38 tests, coverage 96.82 % lines ≥ 80)
- [x] Docs: `docs/API-PRODUCTS.md` (nueva) + `docs/ROUTES.md` actualizado (`/categories` y rutas públicas)
- [x] Verificación runtime Docker (stack completo): migrationsRun fix, gateway rebuild + query fix, seed ejecutado, 3 DBs migradas, endpoints live vía `:8000`

**Criterios de aceptación (verificados 2026-08-16):**

- `check-all.ps1`: lint 0 errores, typecheck, build y tests OK en los 8 paquetes (product-service 64/64, gateway, frontend 38/38)
- Cobertura product-service: 87.63 % lines ≥ 70 % (métrica documentada en `docs/SECURITY-F4.md`, línea 45); frontend 96.82 % lines ≥ 80 %
- `GET /categories` y `GET /products*` públicos en el gateway (verificado en `jwt-edge.middleware.ts` y `routes.ts`)
- Frontend sin `.jsx` de catálogo; build TS real OK (`tsc -b && vite build`)
- Stack Docker completo verificado: `product_db` (12 products, 6 categories + seed), `user_db` (addresses, user_profiles), `auth_db` (users, refresh_tokens); `GET /categories`, `GET /products`, `GET /products?isFeatured=true&sort=rating&limit=3`, `GET /products?categoryId=<uuid>`, `GET /products?page=2&limit=5` → 200 con datos correctos; frontend `:5173` sirve bundle con las páginas nuevas

**Deuda documentada (resuelta en esta sesión de verificación):**

1. **Gateway: query-string routing bug** — `req.originalUrl.split('/')[1]` incluía el query string (`products?isFeatured=true`), rompiendo todas las rutas con filtros. Fix en `proxy.service.ts:65`: `split('?')[0].split('/')[1]`. Test de regresión añadido.
2. **`migrationsRun` boolean coercion** — Joi coerce `"true"` → boolean `true`, pero la app comparaba `=== 'true'` (string). Las migraciones NUNCA corrían en ningún servicio (DB vacía). Fix en `app.module.ts` de product/user/auth: `[true, 'true'].includes(configService.get(...) ?? false)`.
3. **auth-service: Babel 8/lockfile conflict** — `@babel/preset-env@^8.0.2` exige `@babel/core@^8`, pero `babel-jest` instala core@7. Pin a `^7.27.1` + regen lockfile. `npm ci` ahora pasa.

**Deuda restante:** `rating` viaja como string desde MySQL (`decimal`) y el frontend lo convierte a número; los `.jsx` restantes (Login, Register, Account, Checkout, FastLinks, Privacy) siguen en F9.

## Fase 6 — Inventario (stock con reserva/commit/release)

- [x] Auth module (JWT + guards + roles, mismo patrón que F4/F5)
- [x] Entity `inventory-item.entity.ts`: productId (unique), quantity, reserved, version (optimistic locking)
- [x] DTOs: adjust-stock (admin), reserve-stock, commit-release-stock (con `IsInt`/`Min`)
- [x] Service: getByProductId, getBulk, adjust (admin), reserve (pessimistic_write lock + stock check), commit (descuenta stock), release (restaura reserved)
- [x] Controller: GET /:productId, GET /bulk, PATCH / (admin), POST /reserve, POST /commit, POST /release
- [x] Migration `1700000000007-CreateInventoryItems.ts`
- [x] app.module + env.validation actualizados (JWT_SECRET, DB config)
- [x] Tests: 4/4 PASS, lint clean, build clean

**Criterios de aceptación (verificados 2026-08-18):**

- `npm run build` OK, `npm run lint` 0 errores, `npm run test` 4/4 PASS
- Reserva bloquea stock (`reserved += qty`); commit descuenta (`quantity -= qty, reserved -= qty`); release restaura (`reserved -= qty`)
- Nunca `available < 0` — validación en service con `BadRequestException`
- Ownership: `userId` extraído del JWT, no del body
- Admin guard en ajustes (`PATCH /`)
- `INVENTORY_SERVICE_URL` configurable (default `http://localhost:3006`)

**Deuda documentada:** `docs/API-INVENTORY.md` pendiente (no bloqueante para F7). Tests de concurrencia/stress pendientes para F11.

## Fase 7 — Carrito (cart-service + carrito en frontend)

- [x] Auth module (mismo patrón)
- [x] Entities: `cart.entity.ts` (userId unique, guestId, checkoutInProgress), `cart-item.entity.ts` (Index import fix)
- [x] DTOs: add-cart-item (productId, productName, price, quantity), update-cart-item (quantity 1–100), merge-cart (items + guestId)
- [x] Service: getOrCreateCart, addItem (validates stock contra inventory-service), updateItemQuantity, removeItem, clearCart, mergeGuestCart (sumar cantidades con cap a stock disponible), lockForCheckout, unlockCheckout
- [x] Controller: 8 endpoints — GET /, POST /items, PATCH /items/:itemId, DELETE /items/:itemId, DELETE /, POST /merge, POST /checkout-lock, POST /checkout-unlock
- [x] Migration `1700000000008-CreateCartTables.ts` (carts + cart_items)
- [x] app.module + env.validation actualizados
- [x] Frontend: API client `src/api/cart.ts` (8 functions), CartContext.tsx rewrite (dual-mode: API cuando autenticado + localStorage invitado + merge al login), Cart.tsx, CartDropdown.jsx actualizados
- [x] Tests backend: 39/39 PASS (21 service + 18 controller), lint clean, build clean
- [x] Tests frontend: 57/57 PASS, cobertura 97.5% stmts
- [x] Docs: `docs/API-CART.md` (8 endpoints documentados con schemas)

**Criterios de aceptación (verificados 2026-08-18):**

- Carrito persistente entre sesiones (logueado, vía API)
- Invitado puede agregar items (localStorage) y al loguear se fusiona (merge con cap a stock)
- Cantidad no supera stock (validación contra inventory-service en add/update)
- Subtotal correcto (`price * quantity` por item, sumado)
- Ownership: userId del JWT, items solo del owner
- Checkout lock previene mutaciones durante proceso de pago
- Cobertura backend ≥ 70% (39 tests), frontend ≥ 80% (57 tests, 97.5% stmts)
- `check-all.ps1`: lint 0, build OK, tests PASS en cart-service, inventory-service y frontend

**Deuda documentada:** Checkout.jsx sigue usando carrito hardcoded (será conectado en F8 con order-service).

---

## Fase 8 (próxima) — Order-service + payment-service (simulado) + checkout

**Dependencias completadas:** F5 (catálogo), F6 (inventario), F7 (carrito).

**Alcance:** saga orquestada cart→reserve→order→payment→confirm|compensar; checkout real en frontend; historial de pedidos; pago simulado con estados; idempotencia; compensación en fallo.
