# PAYMENT-SIMULATION — Reglas del simulador de pagos

> ElectroShop NO procesa dinero real. No hay integracion con Stripe, PayPal,
> bancos, ni ninguna pasarela de pago. Este documento documenta la simulacion.

---

## 1. Por que simulacion?

- Portfolio: el proyecto demuestra arquitectura de microservicios, saga, compensacion e idempotencia.
- Seguridad: no hay datos financieros reales en ningun punto del sistema.
- Demostrabilidad: el flujo completo de compra funciona de punta a punta.

---

## 2. Flujo del simulador

```
1. order-service llama a POST /payments/intents
2. payment-service crea el intent con status PENDING
3. payment-service procesa inmediatamente (sincrono):
   a. Cambia status a PROCESSING
   b. Aplica regla deterministica
   c. Si aprobado → APPROVED
   d. Si no → FAILED con razon de fallo
4. order-service recibe el resultado
5. Si APPROVED → commit stock + pedido confirmado
6. Si FAILED → release stock (compensacion)
```

---

## 3. Regla deterministica

```typescript
deterministicRule(idempotencyKey: string): boolean {
  const firstCharCode = idempotencyKey.charCodeAt(0);
  return firstCharCode % 10 === 0;
}
```

- Si el primer caracter ASCII % 10 === 0 → aprobado.
- En caso contrario → fallido.
- Configurable via env (PAYMENT_PROCESSING_MS para delay).

**Para testing:** usar un UUID que inicie con caracter cuyo ASCII % 10 !== 0 para que el pago falle.
Ejemplo: el caracter `0` tiene ASCII 48, 48 % 10 = 8 → aprobado.
El caracter `a` tiene ASCII 97, 97 % 10 = 7 → aprobado.
El caracter `j` tiene ASCII 106, 106 % 10 = 6 → aprobado.
Cualquier UUID estandar que empiece con caracter hexadecimal 0-f sera aprobado
porque 0=48%10=8, 1=49%10=9, 2=50%10=0→aprobado, 3=51%10=1→falla, 4=52%10=2, etc.
Solo falla si el caracter de mayor peso del UUID es '2' o 'b' o 'k' o 'u'.

---

## 4. Datos financieros

No existen datos de tarjeta, CVV, numero de cuenta, ni ningun dato financiero real.
El sistema almacena un metodo de pago simulado (credit_card, paypal, bank_transfer)
y un monto monetario. Los items incluyen quantity y unitPrice para el calculo total.

---

## 5. Limitaciones documentadas

- No hay integracion con pasarelas reales.
- No hay notificaciones webhook.
- No hay reembolsos (solo cancelacion y compensacion de stock).
- El procesamiento es sincrono (sin delay configurable en produccion, solo en tests).
- No hay logging de transacciones financieras (no hay transacciones reales).
