# API — Orders (F8)

Referencia de endpoints de order-service. Todos los ejemplos pasan por el
gateway (`http://localhost:8000`). El order-service orquesta la saga de compra.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/orders` | Bearer (via gateway) | Crear pedido (ejecuta saga completa) |
| `GET` | `/orders` | Bearer (via gateway) | Historial de pedidos del usuario |
| `GET` | `/orders/:id` | Bearer (via gateway) | Detalle de un pedido |
| `POST` | `/orders/:id/cancel` | Bearer (via gateway) | Cancelar pedido (si aplica) |
| `GET` | `/admin/orders` | Bearer (admin) | Todos los pedidos |
| `PATCH` | `/admin/orders/:id/status` | Bearer (admin) | Actualizar estado (admin) |

## POST /orders

Headers: `Idempotency-Key: uuid` (opcional).

Body:

```json
{
  "items": [
    { "productId": "uuid", "productName": "Laptop Gaming", "price": 1299.99, "quantity": 1 }
  ],
  "address": {
    "fullName": "Juan Perez",
    "email": "juan@example.com",
    "phone": "555-1234",
    "address": "Av. Principal 123",
    "city": "Lima",
    "postalCode": "15001",
    "country": "Peru"
  },
  "shippingMethod": "express",
  "idempotencyKey": "uuid-opcional"
}
```

- items: max 50. Cada item: productId (UUID), productName (1-200 chars), price (0.01-999999.99), quantity (1-100).
- address: requerido, todos los campos obligatorios.
- shippingMethod: opcional, default `standard`. Opciones: `standard` (5.99), `express` (12.99), `priority` (24.99).
- Idempotency-Key: si se provee y ya existe un pedido con esa clave, devuelve el pedido existente.

### Calculo de totales

- subtotal: suma de (price * quantity) por item.
- shipping: segun shippingMethod (5.99 / 12.99 / 24.99).
- tax: subtotal * 8%.
- total: subtotal + shipping + tax.

### Saga (ejecutada internamente)

1. Reservar stock (inventory-service).
2. Crear intent de pago (payment-service).
3. Si pago aprobado → confirmar stock + pedido PAID.
4. Si pago fallido → liberar stock (compensacion) + pedido FAILED.

Respuesta:

```json
{
  "id": "uuid-orden",
  "userId": "uuid-usuario",
  "status": "paid",
  "items": [
    { "id": "uuid-item", "productId": "uuid", "productName": "Laptop Gaming", "price": 1299.99, "quantity": 1, "lineTotal": 1299.99 }
  ],
  "subtotal": 1299.99,
  "shipping": 12.99,
  "tax": 104.0,
  "total": 1416.98,
  "shippingMethod": "express",
  "addressSnapshot": { ... },
  "paymentIntentId": "uuid-payment",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:01Z"
}
```

## GET /orders

Devuelve todos los pedidos del usuario autenticado, ordenados por fecha de creacion descendente.

## GET /orders/:id

Devuelve un pedido especifico. 404 si no existe o no pertenece al usuario.

## POST /orders/:id/cancel

Body (opcional):

```json
{ "reason": "Ya no lo necesito" }
```

Solo se puede cancelar pedidos en estado `pending`. Si el pedido tiene una reserva de stock,
se ejecuta compensacion (release stock + cancel payment). 400 si el estado no permite cancelacion.

## GET /admin/orders

Solo rol admin. Devuelve todos los pedidos del sistema.

## PATCH /admin/orders/:id/status

Solo rol admin. Body:

```json
{
  "status": "shipped",
  "reason": "Enviado por DHL"
}
```

Estados validos: `pending`, `paid`, `shipped`, `delivered`, `cancelled`, `failed`.

### Transiciones de estado permitidas

```
pending  → paid, failed, cancelled
paid     → shipped, cancelled
shipped  → delivered
delivered → (terminal)
cancelled → (terminal)
failed   → pending (reintento)
```
