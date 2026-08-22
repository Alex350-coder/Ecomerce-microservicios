# API — Inventory (F6)

Referencia de endpoints de inventory-service. Todos los ejemplos pasan por el
gateway (`http://localhost:8000`), unico punto de entrada.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/inventory/:productId` | Bearer (via gateway) | Stock de un producto |
| `GET` | `/inventory?ids=...` | Bearer (via gateway) | Stock por lote (IDs separados por coma) |
| `PATCH` | `/inventory/:productId` | Bearer (admin) | Ajustar stock total |
| `POST` | `/inventory/reserve` | Bearer (via gateway) | Reservar stock (bulk, transaccional) |
| `POST` | `/inventory/commit` | Bearer (via gateway) | Confirmar reserva (descuenta stock) |
| `POST` | `/inventory/release` | Bearer (via gateway) | Liberar reserva (restaura stock) |

## GET /inventory/:productId

```json
{
  "productId": "uuid",
  "quantity": 50,
  "reserved": 3,
  "available": 47
}
```

`available = quantity - reserved`. 404 si el producto no tiene registro de inventario.

## GET /inventory?ids=uuid1,uuid2

Devuelve un array de items de inventario para los productos solicitados.
Productos sin registro se excluyen del resultado (no genera error).

## PATCH /inventory/:productId (admin)

Body:

```json
{
  "productId": "uuid",
  "quantity": 100,
  "reason": "Restock inicial"
}
```

- quantity: 0-100000, entero.
- reason: opcional, max 500 chars.
- Crea el registro si no existe; incrementa version.
- Solo rol admin.

## POST /inventory/reserve

Body:

```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid2", "quantity": 1 }
  ],
  "reservationId": "uuid-opcional"
}
```

Reglas:
- items: max 50. Cada item: quantity 1-100.
- reservationId: opcional (si se omite, se genera uno nuevo).
- Transaccion con lock pessimistic_write por fila.
- Si un item no tiene stock suficiente, ese item se marca available: false pero la reserva se crea.

Respuesta:

```json
{
  "reservationId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2, "available": true },
    { "productId": "uuid2", "quantity": 1, "available": false }
  ]
}
```

## POST /inventory/commit

Body:

```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ],
  "reservationId": "uuid"
}
```

Descuenta quantity de stock fisico y reduce reserved por el mismo monto.

## POST /inventory/release

Misma estructura que commit. Restaura el stock reservado sin descontar de quantity.

## Estados de stock

```
quantity    = stock fisico total
reserved    = stock bloqueado por reservas activas
available   = quantity - reserved (nunca negativo)
```

Las operaciones de reserva/commit/release son transaccionales y no permiten stock negativo.
