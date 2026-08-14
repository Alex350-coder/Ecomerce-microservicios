# ROUTES — Mapa de rutas del API Gateway

El gateway (`:8000`) es el **único punto de entrada** de la API. Reenvía por
prefijo a los servicios internos (que no publican puertos al host) y aplica
seguridad de borde: CORS estricto, rate-limit, `X-Request-Id`, verificación JWT
y formato de error estándar.

## Tabla de enrutamiento

| Prefijo      | Upstream            | Servicio       |
|--------------|---------------------|----------------|
| `/auth`      | `AUTH_SERVICE_URL`  | auth-service   |
| `/users`     | `USER_SERVICE_URL`  | user-service   |
| `/products`  | `PRODUCT_SERVICE_URL` | product-service |
| `/cart`      | `CART_SERVICE_URL`  | cart-service   |
| `/orders`    | `ORDER_SERVICE_URL` | order-service  |
| `/inventory` | `INVENTORY_SERVICE_URL` | inventory-service |
| `/payments`  | `PAYMENT_SERVICE_URL` | payment-service |

El prefijo **no se elimina**: `/auth/login` se reenvía como `/auth/login` al
auth-service (sus controladores ya usan `@Controller('auth')`).

## Rutas gestionadas por el propio gateway

| Método | Ruta            | Descripción                                              |
|--------|-----------------|----------------------------------------------------------|
| `GET`  | `/health`       | Estado del gateway + lista de upstreams (ok/down)         |
| `GET`  | `/health/ready` | Readiness: estado de dependencias (upstreams)            |

Cualquier otro prefijo no mapeado devuelve `404 ROUTE_NOT_FOUND`.

## Seguridad de borde

- **CORS**: solo `http://localhost:5173` (configurable vía `CORS_ORIGIN`).
- **Rate-limit**: global 100 req/TTL (60s) + ruteo auth 10 req/60s
  (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`).
- **JWT (edge)**: verificación previa al proxy. Rutas públicas no requieren
  token: `GET /health`, `GET /health/ready`, `POST /auth/login`,
  `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`,
  `GET /products*`.
- **Cabeceras de identidad**: el gateway inyecta `X-User-Id` (sub) y
  `X-User-Role` (role) al upstream y **siempre** descarta las enviadas por el
  cliente (anti-spoofing).
- **Correlación**: `X-Request-Id` entrante se reutiliza o se genera; se
  propaga al upstream y se devuelve en la respuesta.
- **Errores estándar**: formato `{ statusCode, message, error, requestId }`
  con códigos `AUTH_INVALID_TOKEN`, `ROUTE_NOT_FOUND`, `BAD_GATEWAY`,
  `GATEWAY_TIMEOUT`, `PAYLOAD_TOO_LARGE`. Sin stack traces ni secretos.

## Cambios de comportamiento en F2

- El gateway se publica en el host como `localhost:8000` (antes `8001`).
- El auth-service ya **no** habilita CORS propio: el CORS lo gestiona solo el
  gateway (los servicios internos no son accesibles desde el navegador).
- Los servicios internos no publican puertos al host (ya era así en F1); el
  smoke test los verifica dentro de su contenedor.
