# API — Auth + User (F4)

Referencia de endpoints del slice vertical F4. Todos los ejemplos pasan por el
gateway (`http://localhost:8000`), único punto de entrada.

## Autenticación (`auth-service`, prefijo `/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/register` | pública (rate-limit) | Registro. Respuesta **uniforme** anti-enumeración (no revela si el email existe) |
| `POST` | `/auth/login` | pública (rate-limit) | Login. Devuelve `{accessToken, user}` + refresh cookie httpOnly |
| `POST` | `/auth/refresh` | pública (usa cookie httpOnly) | Rota el refresh token. Devuelve `{accessToken}` + nueva cookie |
| `POST` | `/auth/logout` | pública (usa cookie httpOnly) | Revoca el refresh token y limpia la cookie |
| `GET` | `/auth/me` | Bearer access token | Datos del usuario autenticado |
| `PATCH` | `/auth/:id/password` | Bearer (ownership) | Cambio de contraseña (requiere `currentPassword`, nueva ≥8) |
| `POST` | `/auth/:id/verify-email` | Bearer (ownership) | Inicia/reenvía la verificación de email (simulada) |
| `PATCH` | `/auth/:id/verify-email` | Bearer (ownership) | Confirma la verificación de email (simulada) |
| `PATCH` | `/auth/:id/unlock` | Bearer (admin) | Desbloquea una cuenta bloqueada por intentos fallidos |
| `POST` | `/auth/forgot-password` | pública (rate-limit) | Solicita reset. Respuesta uniforme (no enumera emails) |
| `POST` | `/auth/reset-password` | pública (rate-limit) | Ejecuta el reset con `token` (hasheado en DB) |

### `POST /auth/register`

```json
{
  "email": "ana@example.com",
  "password": "password123",
  "firstName": "Ana",
  "lastName": "Gómez"
}
```

Respuesta `201` (idéntica para email nuevo y existente — sin enumeración):

```json
{
  "message": "Si el email no está registrado, la cuenta ha sido creada correctamente."
}
```

### `POST /auth/login`

```json
{ "email": "ana@example.com", "password": "password123" }
```

Respuesta `200`:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "ana@example.com",
    "firstName": "Ana",
    "lastName": "Gómez",
    "role": "customer",
    "emailVerified": false,
    "isActive": true,
    "lastLogin": "2026-08-14T10:00:00.000Z"
  }
}
```

Set-Cookie (refresh, opaco 30 días):

```
Set-Cookie: refresh_token=<64-char>; Path=/auth; HttpOnly; SameSite=Lax
```

Tras 5 intentos fallidos: `401` genérico y `lockedUntil` (30s por defecto).
Pasado el lockout el login vuelve a funcionar y se resetean los intentos.

### `POST /auth/refresh` (con la cookie)

Respuesta `200`:

```json
{ "accessToken": "<jwt-nuevo>" }
```

Más una nueva refresh cookie (rotación). **Reuso** de un refresh revocado → `401`
y revocación de toda la familia.

### `POST /auth/logout`

Revoca el refresh activo y devuelve `204` + `Set-Cookie: refresh_token=; Max-Age=0`.

### `GET /auth/me` (Bearer)

```json
{
  "id": "uuid",
  "email": "ana@example.com",
  "firstName": "Ana",
  "lastName": "Gómez",
  "role": "customer",
  "emailVerified": false,
  "isActive": true,
  "lastLogin": "2026-08-14T10:00:00.000Z"
}
```

## Usuarios (`user-service`, prefijo `/users`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/users/:id/profile` | Bearer (ownership/admin) | Perfil público + campos de contacto |
| `PATCH` | `/users/:id/profile` | Bearer (ownership/admin) | Actualiza perfil |
| `GET` | `/users/:id/addresses` | Bearer (ownership/admin) | Lista direcciones |
| `POST` | `/users/:id/addresses` | Bearer (ownership/admin) | Crea dirección |
| `PATCH` | `/users/:id/addresses/:addressId` | Bearer (ownership/admin) | Actualiza dirección |
| `DELETE` | `/users/:id/addresses/:addressId` | Bearer (ownership/admin) | Elimina dirección |
| `POST` | `/users/internal/users` | interno (red Docker) | Creación de perfil desde auth-service (best-effort) |

**Ownership:** acceder o modificar el perfil/direcciones de otro usuario (sin ser
admin) devuelve `404 Recurso no encontrado` (`assertOwnershipOrAdmin`). El role
`admin` está permitido; el rol de registro siempre es `customer`.

### `PATCH /users/:id/profile`

```json
{
  "phone": "+34600112233",
  "bio": "Compradora habitual"
}
```

## Errores

Formato estándar del gateway: `{ statusCode, message, error, requestId }`.

| Código | Cuándo |
|--------|--------|
| `401 AUTH_INVALID_TOKEN` | Sin token, token inválido/vencido, o refresh reusado/revocado |
| `400 VALIDATION_ERROR` | DTO inválido (p.ej. password <8) |
| `403 FORBIDDEN` | Autenticado sin el rol requerido |
| `404 NOT_FOUND` | Recurso inexistente o ajeno (ownership) |
| `429 THROTTLED` | Excede rate-limit (login/register/refresh/logout/forgot/reset: 10/min) |

## Flujo de sesión (ADR-008)

1. `login` → `{accessToken}` (15 min, en memoria en el frontend) + refresh cookie httpOnly.
2. `401` en una petición → el frontend llama `refresh` con la cookie → nuevo `{accessToken}` → reintento.
3. `logout` → revoca el refresh y limpia la cookie; el frontend descarta el token de memoria.
