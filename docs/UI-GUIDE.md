# UI-GUIDE — Design tokens, componentes y accesibilidad

> Guia de referencia para el frontend de ElectroShop. Fuente de verdad:
> `frontend/src/styles/variables.css`.

---

## 1. Design tokens

### Colores

```css
--primary-color: #6366f1;    /* Indigo — color principal */
--primary-hover: #5b5cf0;
--primary-light: rgba(99, 102, 241, 0.15);
--secondary-color: #64748b;  /* Slate — texto secundario */
--accent-color: #f59e0b;     /* Amber — acentos, ofertas */

--bg-primary: #0f0f23;       /* Fondo principal (dark) */
--bg-secondary: #1a1b2e;     /* Fondo secciones */
--bg-card: #252641;          /* Fondo tarjetas */
--bg-hover: #2d2e50;         /* Hover de elementos */
--bg-overlay: rgba(0, 0, 0, 0.6);

--text-primary: #f8fafc;     /* Texto principal */
--text-secondary: #cbd5e1;   /* Texto secundario */
--text-muted: #94a3b8;       /* Texto deshabilitado/muted */
```

### Estados

```css
--success-color: #10b981;    /* Verde — exito, confirmado */
--warning-color: #f59e0b;    /* Amarillo — advertencia */
--error-color: #ef4444;      /* Rojo — error, eliminado */
--info-color: #3b82f6;       /* Azul — informativo */
```

### Tipografia

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
--text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
--text-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
--text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-xl: clamp(1.1rem, 1rem + 0.5vw, 1.25rem);
--text-2xl: clamp(1.3rem, 1.1rem + 1vw, 1.5rem);
--text-3xl: clamp(1.6rem, 1.3rem + 1.5vw, 2rem);
--text-4xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);

--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Espaciados

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

### Bordes y sombras

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.15);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.25);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.25);
```

### Transiciones

```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;
```

### Z-index

```css
--z-base: 1;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
```

### Breakpoints (referencia)

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Container

```css
--container-max: 1400px;
--container-padding: clamp(1rem, 2vw, 2rem);
```

---

## 2. Componentes UI

| Componente | Archivo | Uso |
|------------|---------|-----|
| Button | `components/Button.tsx` | Botones primarios/secundarios |
| Input | `components/Input.tsx` | Campos de formulario |
| Card | `components/Card.tsx` | Tarjetas de contenido |
| Badge | `components/Badge.tsx` | Etiquetas de estado/rol |
| Select | `components/Select.tsx` | Dropdowns de seleccion |
| Modal | `components/Modal.tsx` | Dialogos modales |
| Tabs | `components/Tabs.tsx` | Navegacion por pestanas |
| Toast | `components/Toast.tsx` | Notificaciones de feedback |
| Skeleton | `components/Skeleton.tsx` | Placeholder de carga |
| Spinner | `components/Spinner.tsx` | Indicador de carga |
| EmptyState | `components/EmptyState.tsx` | Estados vacios |
| ErrorState | `components/ErrorState.tsx` | Estados de error |
| DataTable | `components/DataTable.tsx` | Tablas de datos |

---

## 3. Layouts

| Layout | Archivo | Uso |
|--------|---------|-----|
| MainLayout | `templates/MainLayout.tsx` | Layout principal (Header + Footer + contenido) |
| AuthLayout | `templates/AuthLayout.tsx` | Layout de autenticacion (login/register) |
| AdminLayout | `components/AdminLayout.tsx` | Layout de administracion (sidebar + contenido) |
| ProtectedRoute | `components/ProtectedRoute.tsx` | Guard de rutas autenticadas/rol |

---

## 4. Paginas

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Home | `/` | Hero + productos destacados |
| Products | `/products` | Catalogo con busqueda, filtros, paginacion |
| ProductDetail | `/products/:id` | Detalle de producto |
| Cart | `/cart` | Carrito de compras |
| Checkout | `/checkout` | Checkout multi-step |
| Orders | `/orders` | Historial de pedidos |
| OrderDetail | `/orders/:id` | Detalle de pedido |
| Account | `/account` | Perfil + direcciones |
| Login | `/login` | Inicio de sesion |
| Register | `/register` | Registro |
| ForgotPassword | `/forgot-password` | Recuperacion de contrasena |

---

## 5. Paginas admin

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| AdminDashboard | `/admin` | Metricas basicas |
| AdminProducts | `/admin/products` | CRUD de productos |
| ProductForm | `/admin/products/new` | Crear/editar producto |
| AdminOrders | `/admin/orders` | Gestion de pedidos |
| AdminInventory | `/admin/inventory` | Control de stock |

> Todas las rutas admin requieren rol `admin` ( ProtectedRoute requiredRole="admin").

---

## 6. Convenciones

### Responsive design

- Mobile-first: estilos base para movil, media queries para desktop.
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px).
- Container maximo: 1400px.

### Estados de UI

- Loading: Skeleton para pages/cards, Spinner para botones.
- Empty: EmptyState con ilustracion y CTA.
- Error: ErrorState con boton de reintento.
- Toast: feedback de acciones (exito/error/info).

### Accesibilidad

- Labels en todos los campos de formulario.
- Focus ring visible (`--focus-ring`).
- Contraste suficiente (texto claro sobre fondo oscuro).
- Navegacion por teclado funcional.
- Roles ARIA en componentes interactivos.

### Tokens CSS

- Todos los tokens estan en `variables.css` (unica fuente de verdad).
- `globals.css` usa los tokens para estilos globales.
- Los componentes referencian tokens via `var(--nombre-token)`.
