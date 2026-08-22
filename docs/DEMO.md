# DEMO — Guia de demostracion para portafolio

> Guiado paso a paso para demostrar ElectroShop a reclutadores, entrevistadores
> o en cualquier demo de portafolio.

---

## Requisitos previos

- Docker Desktop corriendo
- Navegador Chrome/Firefox actualizado
- 4 GB de RAM libre

---

## 1. Levantar el sistema

```bash
cd Ecomerce-microservicios
docker compose up -d
```

Tiempo de arranque: ~45 segundos. Verificar con `docker compose ps` — los 9 servicios deben mostrar "healthy".

Abrir: http://localhost:5173

---

## 2. Demostracion guiada (10 minutos)

### Paso 1 — Navegacion publica (1 min)

- Abrir http://localhost:5173
- Mostrar la landing page con productos destacados
- Navegar a /products
- Usar la busqueda: escribir "laptop" → resultados filtrados
- Mostrar filtros por precio y ordenamiento
- Abrir un producto → pagina de detalle con imagen, precio, stock
- **Punto clave:** la informacion viene de API real, no mock

### Paso 2 — Registro (1 min)

- Clic en "Crear cuenta"
- Llenar: nombre, email, password
- Enviar → se registra en auth-service → JWT se guarda en httpOnly cookie
- Redirigir a /account
- **Punto clave:** autenticacion real, hash bcrypt, refresh token

### Paso 3 — Compra completa (2 min)

- Navegar a /products
- Clic "Agregar al carrito" en 2 productos diferentes
- Abrir el carrito (icono en header) → mostrar items, cantidades, totales
- Clic "Ir al checkout"
- Llenar direccion de envio
- Seleccionar metodo de envio
- Proceder al pago
- La pantalla mostrara el resultado de la simulacion:
  - Si aprueba → pedido confirmado, redirige a /orders/:id
  - Si falla → se muestra error, stock liberado
- **Punto clave:** saga orquestada, compensacion, simulacion determinista

### Paso 4 — Historial de pedidos (1 min)

- Navegar a /orders
- Mostrar el pedido reciente con su estado
- Clic en el pedido → detalle completo
- **Punto clave:** pedidos persistentes, estados, fechas

### Paso 5 — Admin (1 min)

- Cerrar sesion
- Login con admin@electroshop.com / Admin123!
- Navegar a /admin
- Mostrar dashboard basico con metricas
- CRUD de productos: crear uno nuevo
- **Punto clave:** roles, admin panel, CRUD funcional

### Paso 6 — Seguridad (1 min)

- Mostrar en la consola del navegador que no hay tokens en localStorage
- Mostrar headers X-Request-Id en Network tab
- Intentar acceder a /admin sin rol admin → 403
- **Punto clave:** JWT httpOnly, request tracing, RBAC

### Paso 7 — Arquitectura (1 min)

- Mostrar `docker compose ps` → 10 contenedores corriendo
- Explicar la topologia: Gateway → 7 servicios → MySQL
- Mostrar `/health` → estado de todos los servicios
- **Punto clave:** microservicios reales, health checks, desacoplamiento

### Paso 8 — Testing (1 min)

- Abrir terminal
- Ejecutar `npm test` en un servicio
- Mostrar cobertura > 80%
- Ejecutar `npm run lint` → 0 errores
- **Punto clave:** testing real, CI enforcement, calidad

### Paso 9 — CI/CD (1 min)

- Mostrar el workflow de GitHub Actions en .github/workflows/ci.yml
- Explicar las 7 jobs: quality, audit, secrets, security-tests, trivy, smoke, e2e
- Si hay deploy demo, mostrarlo
- **Punto clave:** pipeline completo, seguridad en CI

---

## 3. Preguntas frecuentes del entrevistador

### "Cuanto dinero procesa el sistema?"

Ninguno. El pago es 100% simulado. No hay integracion con Stripe, PayPal, ni
bancos. El simulador usa una regla determinista para demostrar la arquitectura
de saga y compensacion.

### "Por que microservicios si es un proyecto personal?"

Para demostrar conocimiento de arquitectura distribuida: comunicacion HTTP,
sagas orquestadas, compensacion, idempotencia, y patrones de resiliencia.
En produccion, los microservicios escalan independientemente y permiten
despliegues y equipos separados.

### "Que pasaria si un servicio cae?"

El sistema tiene health checks, retry con backoff exponencial, y compensacion
automatica. Si inventory-service no responde, la saga falla y el pedido se
cancela. Si MySQL cae, todos los servicios reportan unhealthy.

### "Por que no usaste GraphQL?"

REST es suficiente para este dominio (6 entidades principales). GraphQL agrega
complejidad innecesaria cuando el modelo de datos es estable. En un proyecto
real, GraphQL seria util si hay muchos clientes con necesidades de datos diferentes.

### "Como escalarias esto en produccion?"

- Kubernetes en vez de Docker Compose
- MySQL con replicas de lectura
- Redis para cache de catalogo
- Rate limiting por usuario en vez de global
- Prometheus + Grafana para metricas
- Sentry para error tracking

---

## 4. Archivos clave para la demo

| Archivo | Que muestra |
|---------|-------------|
| `docs/ARCHITECTURE.md` | Arquitectura completa + diagramas |
| `docs/ROUTES.md` | Mapa de rutas de la API |
| `docs/API-AUTH.md` | Endpoints de autenticacion |
| `docs/PAYMENT-SIMULATION.md` | Reglas del simulador |
| `docs/DEPLOYMENT.md` | CI/CD y despliegue |
| `docs/UI-GUIDE.md` | Design tokens y componentes |
| `Progress.md` | Estado de cada fase |
| `docs/TESTING.md` | Estrategia de testing |
| `docs/SECURITY.md` | Matrices de seguridad |

---

## 5. Tiempo total de demostracion

| Paso | Tiempo |
|------|--------|
| 1. Navegacion publica | 1 min |
| 2. Registro | 1 min |
| 3. Compra completa | 2 min |
| 4. Historial pedidos | 1 min |
| 5. Admin | 1 min |
| 6. Seguridad | 1 min |
| 7. Arquitectura | 1 min |
| 8. Testing | 1 min |
| 9. CI/CD | 1 min |
| **Total** | **~10 min** |

---

## 6. Tips para la demo

- **Preparar el entorno:** levantar Docker antes de la entrevista.
- **Usar datos reales:** el seed crea productos y usuarios automaticamente.
- **Mostrar errores controlados:** el pago simulado a veces falla, es intencional.
- **Narrar la arquitectura:** explicar el porque de cada decision tecnica.
- **Enfocar en seguridad:** demostrar que no hay secretos en el codigo fuente.
- **Terminar con testing:** es el diferenciador mas fuerte en portafolios.
