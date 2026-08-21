# Seguridad — ElectroShop (F10: Endurecimiento de seguridad)

> Documento de referencia de seguridad del proyecto. Resume los controles implementados,
> la evidencia de verificación y las reglas aplicadas. Fuente normativa:
> `Planning_files/security/01-RULES.md`. Evidencia por fase: `SECURITY-F4.md` (auth/user)
> y este documento para F10.

---

## 1. Controles transversales (estado F10)

| Control | Implementación | Alcance |
|---------|----------------|---------|
| `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })` | Global en todos los servicios y gateway | 8/8 servicios |
| DTOs con límites (`@MaxLength`, `@MinLength`, `@IsUUID`, `@IsEmail`, `@Max`) | Completados en F10 | 24 DTOs / 7 servicios |
| `@ArrayMaxSize` en arrays anidados | Añadido en F10 (items, images, features) | cart, order, inventory, payment, product |
| `JwtAuthGuard` + `RolesGuard` reales | Por servicio, roles `user`/`admin` | Todos los endpoints protegidos |
| `HttpExceptionFilter` con `requestId` | Formato `{ statusCode, message, error, requestId }`, sin stack traces | 8/8 servicios |
| Helmet + CSP explícita | Gateway con CSP estricta; servicios internos con Helmet default | 8/8 servicios |
| Body size limit (`express.json({ limit: '1mb' })`) | Añadido en F10 | 7 servicios backend |
| Rate limiting (`ThrottlerGuard`) | Gateway (borde) | Global |
| CORS restringido | Solo gateway, orígenes de `CORS_ORIGIN` | Gateway |
| X-Request-Id propagado | Middleware en gateway + filtro en servicios | Transversal |
| Secrets via `.env` | `.env.example` sin valores reales; compose exige variables | Raíz + 8 servicios |
| MySQL mínimo privilegio | Un usuario por schema, sin cross-schema ni GRANT | 7 schemas |

## 2. Endurecimiento aplicado en F10

### 2.1 DTOs — correcciones críticas

| Servicio | Corrección |
|----------|-----------|
| cart-service | `price` con `@IsNumber({maxDecimalPlaces:2}) @Min(0.01) @Max(999999.99)`; `productName` con `@MaxLength(200)`; merge: `quantity` con `@IsInt @Min(1) @Max(100)`, `guestId` como `@IsUUID`, `items` con `@ArrayMaxSize(50)` |
| order-service | **Bug sistémico corregido**: `@Min/@Max` numéricos sobre strings sustituidos por `@MinLength/@MaxLength` en todo el bloque de dirección (7 campos); `email` ahora `@IsEmail`; `price` acotado; `shippingMethod`/`idempotencyKey` acotados; `items` con `@ArrayMaxSize(50)` |
| payment-service | `amount` con `@Max(99999999.99)` y `maxDecimalPlaces`; `unitPrice` mínimo `0.01`; `idempotencyKey` como `@IsUUID`; `items` con `@ArrayMaxSize(50)` |
| inventory-service | `reason` con `@IsString @MaxLength(500)`; `reservationId` como `@IsUUID`; `quantity` de commit/release con `@Max(100)`; arrays con `@ArrayMaxSize(50)` |
| product-service | `price` con `@Max(999999.99)`; `images`/`features` con `@ArrayMaxSize(10/20)`; `page` con `@Max(10000)` |
| auth-service | Emails con `@MaxLength(254)`; `token` de reset con `@MaxLength(512)`; `currentPassword` con `@MaxLength(72)` |
| user-service | Email de perfil con `@MaxLength(254)` |

### 2.2 Transporte y headers

- **Gateway**: Helmet con CSP explícita (`default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`), `frameguard deny`.
- **Servicios internos** (defense-in-depth): Helmet instalado y activado en los 7
  servicios backend.
- **Body size limit**: `express.json({ limit: '1mb' })` en los 7 servicios backend
  (el gateway delega el parsing al proxy con `BODY_LIMIT=100kb`).
- **Frontend (nginx)**: headers añadidos — `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `X-XSS-Protection`, `Referrer-Policy`, CSP (`script-src 'self'`, `connect-src 'self'
  http://localhost:8000`).

## 3. Suite de security tests

Ubicación: `core-services/auth-service/test/security/` (patrón `*.security-spec.ts`).
Comando: `npm run test:security` (config `test/jest-security.json`).

| Suite | Casos cubiertos | Resultado |
|-------|-----------------|-----------|
| `dto-validation.security-spec.ts` | C1 (whitelist), C2 (formato), C6 (DoS por longitud), R1.2/R1.6 (policy password), límites de token | PASS (35 tests totales) |
| `validation-pipe.security-spec.ts` | C1 (strip/reject), C4 (SQLi rechazado por validación), transform | PASS |
| `guards.security-spec.ts` | B1 (sin user → false), B2/B4 (escalada → false), B3 (admin ok) | PASS |
| `error-handling.security-spec.ts` | E5 (sin stack, con requestId, sin leak de internals) | PASS |

Cobertura de matriz (`15-SECURITY-TESTING.md`): C1, C2, C4, C5, C6, B1–B4, E5.
Los casos E1/E2 (rate-limit), D1–D7 (negocio) y E2E completos requieren stack Docker
levantado y se ejecutan en integración (ver `docs/SETUP.md`).

## 4. Verificación de gates F10

Ejecutados el 2026-08-20:

| Gate | Estado | Evidencia |
|------|--------|-----------|
| ValidationPipe whitelist+transform+forbidNonWhitelisted en TODOS | ✅ PASS | 8/8 `main.ts` |
| DTOs con `@MaxLength`/`@IsUUID` completos | ✅ PASS | §2.1, typecheck OK en 8/8 |
| Filtro global con `requestId` | ✅ PASS | 8/8 filtros + tests E5 |
| Body size limits | ✅ PASS | `express.json({limit:'1mb'})` en 7 servicios |
| Helmet en servicios directos | ✅ PASS | helmet en 8/8 package.json + `app.use(helmet())` |
| Migraciones + usuario MySQL mínimo | ✅ PASS | `docker/mysql/init/01-create-schemas.sh`, `DB_SYNCHRONIZE=false` |
| CSP frontend | ✅ PASS | nginx.conf con CSP + gateway CSP explícita |
| Logging redactado | ✅ PASS | grep sin `console.log(password|token|secret...)` en src |
| `npm audit` sin high/critical | ✅ PASS | 0 vulnerabilidades en 8/8 servicios |
| Security tests suite | ✅ PASS | 35/35 tests (`npm run test:security`) |

## 5. Deuda conocida / siguientes pasos

- **DAST opcional** (OWASP ZAP) sobre gateway: pendiente, no bloqueante.
- **Trivy image scan**: planificado para F12 (contenedores).
- **Gitleaks en CI**: verificar workflow activo (regla R9.3).
- **Rate limiting específico** en login/register/pagos más agresivo que el global
  (R5.3): el Throttler global está en gateway; afinar tiers por ruta en F11+.
- **Redacción de logs estructurada (pino)** con masking centralizado: F12 (R10.3).
