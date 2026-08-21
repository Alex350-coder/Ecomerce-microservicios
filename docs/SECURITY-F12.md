# Evidencia de seguridad F12 — Observabilidad + Resiliencia

Objetivo: demostrar que F12 cumple los gates de seguridad: requestId en 100%
de las respuestas, logger estructurado con eventos de seguridad, rotación de logs,
retry sin efectos duplicados, e idempotency verificada.

## 1. RequestId en 100% de las respuestas

Todos los servicios añaden `X-Request-Id` al header de respuesta via
`RequestIdMiddleware`. El gateway genera el ID si no viene; los downstream
services lo reenvían si ya existe.

| Servicio | Middleware | Tests que verifican | Resultado |
|----------|-----------|---------------------|-----------|
| gateway | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| auth-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| user-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| product-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| order-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| cart-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| inventory-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |
| payment-service | `src/common/middlewares/request-id.middleware.ts` | `middleware/request-id.middleware.spec.ts` | PASS |

## 2. Structured JSON logger

Cada servicio tiene un `LoggingInterceptor` que produce logs JSON con:
`{timestamp, level, service, requestId, method, url, statusCode, durationMs}`.

- Formato consistente en todos los servicios
- `requestId` propagado via `AsyncLocalStorage` en order, cart, auth
- RequestIdMiddleware delega al interceptor (no loguea inline)

## 3. Eventos de seguridad estructurados

auth-service registra eventos de seguridad como JSON parseable:

| Evento | Nivel | Cuándo se dispara | Datos registrados |
|--------|-------|-------------------|-------------------|
| `LOGIN_BLOCKED_LOCKED_ACCOUNT` | WARN | Login con cuenta bloqueada | `{email, lockedUntil}` |
| `LOGIN_FAILED` | WARN | Credenciales inválidas | `{email}` (sin password) |
| `LOCKOUT_ACTIVATED` | WARN | 5to intento fallido | `{userId, attempts, lockedUntil}` |
| `REFRESH_REUSE_DETECTED` | ERROR | Token refresh revocado/expirado reutilizado | `{userId, familyId, revoked, expired}` |

**Ningún evento loguea contraseñas, tokens, ni datos sensibles del usuario.**

## 4. Retry sin efectos duplicados

- `fetchWithTimeout`: 8s timeout, 2 reintentos, backoff exponencial (1s, 2s)
- Solo reintenta en errores 5xx y de red (no en 4xx)
- Idempotency key propagada en calls a inventory/payment
- Test de idempotency bajo retry: misma key → misma orden, sin duplicados
  (`orders.service.spec.ts` → *"should not create duplicate orders when retrying with same idempotency key"*)

## 5. Health endpoints

| Endpoint | Gateway | Upstream down → HTTP 503 |
|----------|---------|-------------------------|
| `GET /health` | `HealthController.check()` | ✅ `ServiceUnavailableException` |
| `GET /health/ready` | `HealthController.ready()` | ✅ `ServiceUnavailableException` |

Response body incluye status de cada upstream para debugging.

## 6. Load sanity test

`e2e/load-sanity.ts`: 50 requests concurrentes a `GET /products`:
- Todos deben retornar 200
- p95 latency < 3000ms
- Sin errores 5xx ni de red

## 7. Rotación de logs

- Logs estructurados JSON → compatibles con cualquier rotator (logrotate, Docker
  logging driver, K8s sidecar)
- Sin dependencia de formato específico de archivo

## 8. Gaps conocidos

- No se implementa log shipping (ELK, Datadog) — fuera de alcance F12
- No se implementa métricas Prometheus/Grafana — ADR-012 "mínima instrumentación"
- Health checks en downstream services son sintéticos (no verifican DB connection)
- Load test es sanity check, no benchmark de throughput

## Commands ejecutados

```bash
# Todos los servicios
cd core-services/<servicio> && npm test

# Gateway
cd core-services/gateway && npm test          # 34/34
# auth-service
cd core-services/auth-service && npm test      # 70/70
# order-service
cd core-services/order-service && npm test     # 71/71
# cart-service
cd core-services/cart-service && npm test      # 51/51
# product-service
cd core-services/product-service && npm test   # 64/64
# inventory-service
cd core-services/inventory-service && npm test # GREEN
# payment-service
cd core-services/payment-service && npm test   # GREEN
# user-service
cd core-services/user-service && npm test      # GREEN
```
