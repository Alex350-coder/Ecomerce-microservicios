# Evidencia de seguridad F4 — Matrices A1–A12 y B1–B8

Fuente de los casos: `Planning_files/security/15-SECURITY-TESTING.md`.
Objetivo: demostrar con tests ejecutados y verdes que cada caso de la matriz está
cubierto en el slice vertical F4 (auth + user). Cada fila indica el test que lo
prueba y el comando que lo ejecuta. Reporte de TDD, no sustituto de los tests.

## Matriz A — Autenticación (A1–A12)

| # | Qué se garantiza | Test que lo cubre | Tipo | Resultado | Comando |
|---|------------------|-------------------|------|-----------|---------|
| A1 | `POST /auth/login` devuelve 200, `{accessToken, user}` y la refresh cookie es `HttpOnly; SameSite=Lax` (Secure solo prod) | `auth.controller.spec.ts` → *"returns tokens and sets the refresh cookie"* / *"marks the refresh cookie as HttpOnly and SameSite=Lax"* | unit (controller) | PASS | `npm test` en auth-service |
| A2 | Tras 5 intentos fallidos la cuenta se bloquea (`UnauthorizedException` genérica) | `auth.service.spec.ts` → *"rejects login while account is locked"* / *"increments login attempts until lockout"* | unit (service) | PASS | `npm test` en auth-service |
| A3 | Tras expirar el lockout se permite login y se resetean `loginAttempts`/`lockedUntil` | `auth.service.spec.ts` → *"allows login after the lockout window has expired (A3)"* | unit (service) | PASS | `npm test` en auth-service |
| A4 | Access token vencido → 401 en el edge (disparador del refresh silencioso) | `jwt-edge.middleware.spec.ts` → *"rechaza access token vencido con 401 (A4)"* | unit (middleware) | PASS | `npm test -- jwt-edge.middleware.spec.ts` en gateway |
| A5 | Refresh con rotación: `accessToken` nuevo + nueva cookie; **reuso de un refresh revocado → 401 y se revoca la familia** | `auth.service.spec.ts` → *"rotates the refresh token…"*, *"rejects a reused refresh token and revokes the family"* | unit (service) | PASS | `npm test` en auth-service |
| A6 | `POST /auth/logout` revoca el refresh activo y limpia la cookie | `auth.service.spec.ts` → *"revokes the refresh token on logout"*; `auth.controller.spec.ts` → *"clears the refresh cookie"* | unit (service+controller) | PASS | `npm test` en auth-service |
| A7 | JWT firmado con un secret distinto → 401 | `jwt-edge.middleware.spec.ts` → *"rechaza JWT firmado con otro secret con 401 (A7)"* | unit (middleware) | PASS | `npm test -- jwt-edge.middleware.spec.ts` en gateway |
| A8 | JWT con `alg: none` o payload alterado → 401 (no se acepta unsigned) | `jwt-edge.middleware.spec.ts` → *"rechaza JWT con alg none / payload alterado con 401 (A8)"* | unit (middleware) | PASS | `npm test -- jwt-edge.middleware.spec.ts` en gateway |
| A9 | `POST /auth/forgot-password` devuelve respuesta uniforme (no enumera emails) | `auth.service.spec.ts` → *"returns a generic message…"* / *"does not reveal whether the email exists"* | unit (service) | PASS | `npm test` en auth-service |
| A10 | Reset token expirado o reutilizado → 400/410, se revoca, no se cambia la contraseña | `auth.service.spec.ts` → *"rejects reset with an expired or invalid token"* / *"revokes the token after use"* | unit (service) | PASS | `npm test` en auth-service |
| A11 | `POST /auth/register` devuelve **respuesta uniforme genérica** para email nuevo y existente (sin enumeración; sin `ConflictException` 409) | `auth.service.spec.ts` → *"creates a user with fixed customer role…"* / *"returns a generic message for a duplicate email…"*; `auth.controller.spec.ts` → *"returns a uniform generic message (sin enumeración de emails)"* | unit (service+controller) | PASS | `npm test` en auth-service |
| A12 | Policy de contraseña: `< 8` caracteres → 400 (`RegisterDto`/`ResetPasswordDto`/`ChangePasswordDto` con `MinLength(8)`) | `dto/register.dto.spec.ts` + `reset-password.dto.spec.ts` + `change-password.dto.spec.ts` | unit (DTO) | PASS | `npm test` en auth-service |

## Matriz B — IDOR / roles / spoofing (B1–B8)

| # | Qué se garantiza | Test que lo cubre | Tipo | Resultado | Comando |
|---|------------------|-------------------|------|-----------|---------|
| B1 | Endpoint protegido sin token → 401 estándar en el edge | `jwt-edge.middleware.spec.ts` → *"rechaza ruta protegida sin token con 401 estándar"*; `jwt-auth.guard.spec.ts` | unit (middleware+guard) | PASS | `npm test` en gateway y auth-service |
| B2 | Endpoint admin con rol `user` → 403 | `roles.guard.spec.ts` (auth-service y user-service) | unit (guard) | PASS | `npm test` en auth-service y user-service |
| B3 | Endpoint admin con rol `admin` → permitido | `roles.guard.spec.ts` | unit (guard) | PASS | `npm test` en auth-service y user-service |
| B4 | `role: 'admin'` enviado en el body de register es ignorado (siempre `customer`) | `auth.service.spec.ts` → *"creates a user with fixed customer role…"* | unit (service) | PASS | `npm test` en auth-service |
| B5 | IDOR sobre órdenes ajenas → 403/404 | No aplicable a F4: order-service es fase F8 | — | — | — |
| B6 | `PATCH /users/:id` de otro usuario (no owner ni admin) → 404 `Recurso no encontrado` | `profiles.service.spec.ts` (user-service) → *"throws NotFoundException when the requester is not owner nor admin"* (via `assertOwnershipOrAdmin` en `profiles/ownership.util.ts`) | unit (service) | PASS | `npm test` en user-service |
| B7 | Spoofing de `X-User-Id`/`X-User-Role` del cliente → ignorado, se inyecta el real del token | `jwt-edge.middleware.spec.ts` → *"ignora X-User-Id/X-User-Role enviados por el cliente"* | unit (middleware) | PASS | `npm test -- jwt-edge.middleware.spec.ts` en gateway |
| B8 | Token de otro usuario accediendo a carrito ajeno → 403/404 | No aplicable a F4: cart-service es fase F7 | — | — | — |

## Resultados de verificación (gates)

Ejecutados el 2026-08-14, todos PASS:

| Paquete | Tests | Coverage | typecheck | build | lint |
|---------|-------|----------|-----------|-------|------|
| auth-service | 70/70 (9 suites) | 81.09 % stmts / 80.94 % lines (umbral 75 %) | OK | OK | 0 errores (warnings preexistentes no bloqueantes) |
| user-service | (GREEN previo, 91.46 % lines) | umbral 70 % | OK | OK | OK |
| gateway | 22/22 (4 suites) | — | OK | OK | 0 errores (12 warnings preexistentes `no-unsafe-argument`) |
| frontend | 25/25 (3 suites Vitest) | umbral 80 % | build TS real OK | OK | 0 errores |

## Ajustes aplicados por la matriz (2026-08-14)

- **A11 (decisión de producto):** `POST /auth/register` ya no lanza `ConflictException`
  (409) ante un email existente. Devuelve la misma respuesta genérica en ambos casos:
  *"Si el email no está registrado, la cuenta ha sido creada correctamente."* El
  frontend (`Register.jsx`) dejó de depender de `data.user.id` y del 409: ahora
  muestra la respuesta uniforme y navega a login.
- **Tests añadidos:** A3 (login tras lockout expirado), A4 (access token vencido → 401),
  A7 (JWT con otro secret → 401), A8 (`alg:none` → 401) en `jwt-edge.middleware.spec.ts`
  y `auth.service.spec.ts`.

## Gaps conocidos

- B5 (órdenes) y B8 (carrito) se cubrirán en F7/F8.
- El flujo real de email (verificación/recuperación) está simulado: no hay SMTP;
  `initiateEmailVerification`/`forgotPassword` solo registran el intento y devuelven
  mensajes uniformes.
- Validación de integración contra MySQL real (migraciones + seed) requiere el stack
  Docker levantado (ver `docs/SETUP.md`); las migraciones están escritas a mano.
