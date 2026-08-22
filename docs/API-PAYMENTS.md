# API — Payments (F8)

Referencia de endpoints de payment-service. Todos los ejemplos pasan por el
gateway (`http://localhost:8000`). **Pago 100% simulado — sin dinero real.**

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/payments/intents` | Bearer (via gateway) | Crear intent de pago (procesa automaticamente) |
| `GET` | `/payments/:id` | Bearer (via gateway) | Consultar intent por ID |
| `GET` | `/payments/order/:orderId` | Bearer (via gateway) | Consultar intent por orden |

## POST /payments/intents

Headers: `Idempotency-Key: uuid` (opcional, si no se provee se genera uno).

Body:

```json
{
  "orderId": "uuid-orden",
  "amount": 49.99,
  "method": "credit_card",
  "items": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 24.99 }
  ],
  "idempotencyKey": "uuid-opcional"
}
```

- amount: 0.01 - 99999999.99, max 2 decimales.
- method: `credit_card` | `paypal` | `bank_transfer`.
- items: max 50. Cada item: quantity 1-100, unitPrice 0.01-999999.99.
- Solo un intent por orden (409 si ya existe uno).
- Procesamiento sincrono: el intent se crea y se procesa inmediatamente.

Respuesta:

```json
{
  "id": "uuid-intent",
  "orderId": "uuid-orden",
  "amount": 49.99,
  "method": "credit_card",
  "status": "approved",
  "failureReason": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:01Z"
}
```

## Estados de pago

```
pending → processing → approved | failed
                   ↘ cancelled
```

- pending: intent creado, sin procesar.
- processing: en proceso de simulacion.
- approved: pago aprobado por regla determinista.
- failed: pago rechazado.
- cancelled: pago cancelado (solo si no esta aprobado).

## Regla de simulacion (determinista)

El resultado del pago es determinista basado en la clave de idempotencia:

```typescript
deterministicRule(idempotencyKey: string): boolean {
  const firstCharCode = idempotencyKey.charCodeAt(0);
  return firstCharCode % 10 === 0;
}
```

Si el primer caracter ASCII de la clave % 10 === 0, el pago se aprueba. En caso contrario, falla.

## GET /payments/:id

Devuelve el intent de pago por su ID. 404 si no existe.

## GET /payments/order/:orderId

Devuelve el intent de pago asociado a una orden. 404 si no existe.
