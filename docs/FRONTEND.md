# FRONTEND — Arquitectura y convenciones

Estado: **FASE 3 — Base de arquitectura del frontend** (implementada).
Cobertura de tests: 25 tests (3 archivos), líneas ~94.9 %.

## Stack

- **Vite + React 18 + TypeScript** (migración TS progresiva, objetivo ≥ 60 % al cierre de cada fase).
- **React Router** (`createBrowserRouter`): rutas lower-case, redirect `*` → `/`.
- **TanStack Query** (`QueryClientProvider` en `main.tsx`, `retry: 1`, `refetchOnWindowFocus: false`).
- **Vitest + Testing Library + jsdom** para tests unit/integration.
- Sin `any` en archivos `.ts`/`.tsx` (TS estricto). `.jsx` pendientes de migración tipan vía `allowJs`.

## Estructura de carpetas

```
src/
├── api/          # apiClient, capa de datos, token holder
├── components/   # UI (Button, Card, Input, CartIcon, CartDropdown) y layout (Header, Footer, Navbar)
├── context/      # AuthContext, CartContext
├── pages/        # una carpeta/archivo por ruta
├── templates/    # MainLayout, AuthLayout
├── types/        # tipos compartidos
├── styles/       # variables.css (tokens), globals.css, ui/*, layout/*, templates/*
├── App.tsx       # router + layouts
└── main.tsx      # providers (Query, Auth, Cart) + mount
```

## Capa de datos (`src/api/`)

### `client.ts` — `apiClient`

- URL base: `import.meta.env.VITE_API_URL ?? 'http://localhost:8000'` (gateway). **Nunca URLs hardcodeadas en páginas o componentes.**
- Añade `Authorization: Bearer <token>` (token en memoria) y `X-Request-Id` (uuid, correlación).
- Errores: `ApiError { statusCode, message, code?, requestId?, details? }` con mensaje seguro para el usuario (sin stack ni detalles internos).
- 401 → intenta `refresh()` una vez y reintenta la petición original. No refresca en `/auth/refresh` (evita recursión). El refresh exitoso actualiza el token en memoria vía `setAccessToken`.
- Respuestas no-2xx y errores de red se normalizan a `ApiError` (sin exponer `error.message` crudo del servidor).

### `auth.ts` — token holder

- `setAccessToken`, `getAccessToken`, `setRefreshHandler` — sesión **en memoria**; **nada de tokens en `localStorage`** (XSS). El handler de refresh lo registra `AuthContext`.

## Contextos

### `AuthContext` (`src/context/AuthContext.tsx`)

- Estado: `user` (provisional hasta F4), `isAuthenticated`, `isLoading`.
- `login(credentials)` → `apiClient POST /auth/login`; `logout()` → `POST /auth/logout` + limpieza local.
- `refresh()` en boot: restaura sesión sin re-login. `useEffect` registra el refresh handler en el token holder y lo limpia en unmount.
- Hook de consumo: `useAuth()` (exportado con permiso explícito para `react-refresh/only-export-components`).

### `CartContext` (`src/context/CartContext.tsx`)

- Puente provisional hasta F7 (cart-service). Estado local + persistencia en `localStorage` (`cart-items`).
- API: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`.
- Hook de consumo: `useCart()`.

## Rutas (`App.tsx`)

| Ruta               | Página                     | Estado en F3 |
|--------------------|----------------------------|--------------|
| `/`                | Home                       | provisional  |
| `/products`        | Products                   | provisional  |
| `/products/:id`    | ProductDetail              | provisional  |
| `/cart`            | Cart                       | provisional  |
| `/orders`          | Orders                     | provisional  |
| `/login`           | Login (apiClient)          | provisional  |
| `/register`        | Register (apiClient)       | provisional  |
| `/account`         | Account (apiClient)        | provisional  |
| `/forgot-password` | ForgotPassword             | provisional  |
| `/return-request`  | ReturnRequest              | provisional  |
| `*`                | redirect → `/`             | —            |

Convención: rutas **lower-case**, kebab-case para multi-palabra.

## Manejo de errores (convención)

1. Servicio/página: llama a `apiClient`, captura `ApiError`, muestra `error.message` (ya seguro) o un mensaje genérico.
2. Nunca loguear ni mostrar tokens, contraseñas o datos de tarjeta.
3. Errores 401/403 → sesión caducada: `AuthContext` hace logout + redirect a `/login`.
4. Helper `getErrorMessage` (en `src/pages/auth/utils`) normaliza `unknown` → mensaje seguro.

## Commits / convenciones

- Gates por fase: `npm run build` (TS estricto), `npm run lint` (eslint), `npm test` (Vitest), `npm run test:coverage` (threshold 80 %).
- Migración TS progresiva: un archivo JSX → TSX por paso, build intermedio, y **eliminar el `.d.ts` de parche** del archivo migrado.
- CSS: tokens de tema solo en `styles/variables.css`; `globals.css` = reset + base; por paquete `styles/<pkg>/*.css`; `index.css` solo raíces de Vite (fuente, antialiasing).
