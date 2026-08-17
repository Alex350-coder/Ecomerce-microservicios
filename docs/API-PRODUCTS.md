# API — Catálogo de productos (F5)

Referencia de endpoints del catálogo. Todos los ejemplos pasan por el gateway
(`http://localhost:8000`), único punto de entrada. Las lecturas son públicas;
las escrituras requieren `Bearer` con rol `admin`.

## Productos (`product-service`, prefijo `/products`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/products` | pública | Listado con filtros, orden y paginación |
| `GET` | `/products/:id` | pública | Detalle de un producto (UUID) |
| `POST` | `/products` | Bearer (admin) | Crea un producto |
| `PATCH` | `/products/:id` | Bearer (admin) | Actualiza un producto |
| `DELETE` | `/products/:id` | Bearer (admin) | Soft-delete (`204`, sin body) |

## Categorías (`product-service`, prefijo `/categories`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/categories` | pública | Listado de categorías activas (array plano) |
| `POST` | `/categories` | Bearer (admin) | Crea una categoría |
| `PATCH` | `/categories/:id` | Bearer (admin) | Actualiza una categoría |
| `DELETE` | `/categories/:id` | Bearer (admin) | Soft-delete (`204`) |

## `GET /products`

Solo devuelve productos activos (`isActive = true`).

| Query | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `search` | string (≤100) | — | Búsqueda por nombre/slug/descripción |
| `categoryId` | UUID | — | Filtro por categoría |
| `sort` | enum | `name` | `name`, `price-asc`, `price-desc`, `rating`, `newest` |
| `isFeatured` | boolean | — | `true` filtra solo destacados |
| `page` | int (≥1) | `1` | Página (offset) |
| `limit` | int (1–100) | `12` | Tamaño de página |

Respuesta `200` (envelope paginado):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 14 Pro",
      "slug": "iphone-14-pro",
      "description": "...",
      "price": 1000.09,
      "originalPrice": 1099,
      "discountPercent": 9,
      "images": ["https://...jpg"],
      "features": ["6.1\" Super Retina XDR", "Chip A16 Bionic"],
      "category": { "id": "uuid", "name": "Smartphones", "slug": "smartphones" },
      "rating": "4.8",
      "reviewCount": 24,
      "isNew": true,
      "isFeatured": true,
      "isActive": true,
      "createdAt": "2026-08-16T10:00:00.000Z",
      "updatedAt": "2026-08-16T10:00:00.000Z"
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 12, "totalPages": 1 }
}
```

Notas de `price`/`originalPrice`:

- El `price` es el **precio efectivo**: si hay descuento activo (0 < `discountPercent` ≤ 100
  y dentro de la ventana `validFrom`–`validTo`), es el precio ya rebajado y
  `originalPrice` devuelve el precio base. Sin descuento activo, `originalPrice` es `null`.
- `rating` viaja como string desde MySQL (`decimal`) — el frontend debe convertirlo a número.

## `GET /products/:id`

Respuesta `200` con el mismo `ProductDto`. `404` con `{ statusCode, message }`
si el UUID no existe o el producto está inactivo. UUID inválido → `400`.

## `GET /categories`

Respuesta `200` — **array plano**, no envelope:

```json
[
  { "id": "uuid", "name": "Smartphones", "slug": "smartphones", "isActive": true, "createdAt": "...", "updatedAt": "..." }
]
```

## Errores

Formato estándar del gateway (ver `ROUTES.md`): `{ statusCode, message, error?, requestId? }`.
Validación fallida → `400` con `message` descriptivo y `errors` de class-validator.

## Frontend

Tipos y cliente en `frontend/src/api/products.ts` (`fetchProducts`, `fetchProduct`,
`fetchCategories`, `formatPrice`, `PRODUCT_SORTS`); hook `useDebounce` en
`frontend/src/hooks/useDebounce.ts`. `formatPrice` formatea con `$` y hasta 2 decimales.
