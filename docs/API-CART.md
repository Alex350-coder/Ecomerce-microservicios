# API — Carrito (F7)

Referencia de endpoints del carrito. Todos los ejemplos pasan por el gateway
(`http://localhost:8000`), único punto de entrada. Todos los endpoints requieren
`Bearer` token (usuario autenticado). El carrito es **propiedad del usuario**;
el `userId` se extrae del JWT, nunca del body ni de la URL.

## Endpoints (`cart-service`, prefijo `/cart`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/cart` | Bearer | Obtiene el carrito activo del usuario |
| `POST` | `/cart/items` | Bearer | Agrega un producto al carrito |
| `PATCH` | `/cart/items/:itemId` | Bearer | Actualiza la cantidad de un item |
| `DELETE` | `/cart/items/:itemId` | Bearer | Elimina un item del carrito |
| `DELETE` | `/cart` | Bearer | Vacía el carrito completo |
| `POST` | `/cart/merge` | Bearer | Fusiona carrito de invitado al loguearse |
| `POST` | `/cart/checkout-lock` | Bearer | Bloquea el carrito durante checkout |
| `POST` | `/cart/checkout-unlock` | Bearer | Libera el carrito tras checkout |

---

## `GET /cart`

Devuelve el carrito activo del usuario. Si no existe, lo crea vacío.

Respuesta `200`:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "iPhone 14 Pro",
      "price": 1000.00,
      "quantity": 2,
      "lineTotal": 2000.00
    }
  ],
  "totalItems": 2,
  "subtotal": 2000.00,
  "checkoutInProgress": false
}
```

---

## `POST /cart/items`

Agrega un producto al carrito. Si el producto ya existe, incrementa la cantidad.
Valida stock contra inventory-service antes de confirmar.

Body:

```json
{
  "productId": "uuid",
  "productName": "iPhone 14 Pro",
  "price": 1000.00,
  "quantity": 1
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `productId` | UUID | sí | UUID v4 |
| `productName` | string | sí | No vacío |
| `price` | number | sí | — (referencia, no autoridad) |
| `quantity` | int | no | 1–100 (default: 1) |

Respuesta `200`: carrito formateado (mismo shape que `GET /cart`).

Errores:
- `400` — Stock insuficiente
- `422` — Validación fallida (DTO inválido)

---

## `PATCH /cart/items/:itemId`

Actualiza la cantidad de un item existente. Valida stock contra inventory-service.

Body:

```json
{
  "quantity": 5
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `quantity` | int | sí | 1–100 |

Respuesta `200`: carrito formateado.

Errores:
- `404` — Item no encontrado en el carrito del usuario
- `400` — Stock insuficiente

---

## `DELETE /cart/items/:itemId`

Elimina un item del carrito.

Respuesta `200`: carrito formateado (sin el item eliminado).

Errores:
- `404` — Item no encontrado

---

## `DELETE /cart`

Vacía todos los items del carrito.

Respuesta `204` — Sin body.

---

## `POST /cart/merge`

Fusiona los items de un carrito de invitado (localStorage) al carrito del usuario
autenticado. Se usa al hacer login con items en el carrito local.

- Si un producto existe en ambos carritos, las cantidades se suman.
- Si la suma excede el stock disponible, se caps a la cantidad máxima disponible.
- Si un producto del invitado no tiene stock, se omite.

Body:

```json
{
  "items": [
    {
      "productId": "uuid",
      "productName": "iPhone 14 Pro",
      "price": 1000.00,
      "quantity": 2
    }
  ],
  "guestId": "optional-guest-identifier"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `items` | array | sí | Items del carrito invitado |
| `items[].productId` | UUID | sí | UUID del producto |
| `items[].productName` | string | sí | Nombre del producto |
| `items[].price` | number | sí | Precio de referencia |
| `items[].quantity` | int | sí | Cantidad (≥1) |
| `guestId` | string | no | Identificador del invitado |

Respuesta `200`: carrito formateado con items fusionados.

---

## `POST /cart/checkout-lock`

Bloquea el carrito para impedir modificaciones durante el proceso de checkout.
Si el carrito ya está bloqueado, retorna `400`.

Respuesta `200`:

```json
{
  "success": true
}
```

Errores:
- `400` — El carrito ya está en proceso de checkout

---

## `POST /cart/checkout-unlock`

Libera el bloqueo del carrito (tras checkout completado o cancelado).

Respuesta `200`:

```json
{
  "success": true
}
```

---

## Seguridad

| Regla | Implementación |
|-------|---------------|
| Ownership | `userId` extraído del JWT via `@CurrentUser()`, nunca del body/URL |
| IDOR protection | Carrito se busca por `userId`, items por `itemId` dentro del carrito |
| Stock validation | Cada add/update valida contra inventory-service |
| Price authority | Precios en carrito son referencia; order-service (F8) lee precios de product-service |
| Checkout lock | `checkoutInProgress` previene mutaciones durante checkout |
| Input validation | DTOs con `class-validator` + `whitelist: true` + `forbidNonWhitelisted: true` |
| Error leaking | `HttpExceptionFilter` oculta stack traces en 5xx |

## Database

| Tabla | Columnas clave | Constraints |
|-------|---------------|-------------|
| `carts` | `id` (UUID PK), `user_id` (unique), `guest_id`, `checkout_in_progress` | `uq_carts_user` |
| `cart_items` | `id` (UUID PK), `cart_id` (FK CASCADE), `product_id`, `product_name`, `price`, `quantity` | `uq_cart_items_cart_product` |
