# ENV — Variables de entorno

Inventario de variables por paquete y por capa. Todos los secretos viven en
`.env` (raíz) o en el `.env` local de cada paquete; **nunca se commitean**
(`security/08-SECRETS-MANAGEMENT.md`).

## Root (docker-compose)

`.env.example` en la raíz del repo. Usadas por `docker-compose.yml`.

| Variable                  | Obligatoria | Descripción                          |
|---------------------------|-------------|--------------------------------------|
| `MYSQL_ROOT_PASSWORD`     | sí          | Password root de MySQL               |
| `AUTH_DB_PASSWORD`        | sí          | Password de `auth_user`              |
| `USER_DB_PASSWORD`        | sí          | Password de `user_user`              |
| `PRODUCT_DB_PASSWORD`     | sí          | Password de `product_user`           |
| `CART_DB_PASSWORD`        | sí          | Password de `cart_user`              |
| `ORDER_DB_PASSWORD`       | sí          | Password de `order_user`             |
| `INVENTORY_DB_PASSWORD`   | sí          | Password de `inventory_user`         |
| `PAYMENT_DB_PASSWORD`     | sí          | Password de `payment_user`           |
| `JWT_SECRET`              | sí          | Secreto de firma JWT (≥32 chars)     |

Los usuarios y schemas se crean en `docker/mysql/init/01-create-schemas.sh`
(usuario → un único schema, privilegios mínimos).

## Servicios core (NestJS)

Cada `core-services/<svc>/.env.example` define su `.env` local. Variables comunes
(todas obligatorias salvo las marcadas):

| Variable         | Descripción                                             |
|------------------|---------------------------------------------------------|
| `NODE_ENV`       | `development` / `test` / `production`                   |
| `PORT`           | Puerto del servicio (3001–3007, 8000 gateway)           |
| `DB_HOST`        | Host MySQL (`mysql` en compose, `localhost` en local)   |
| `DB_PORT`        | Puerto MySQL (3306)                                     |
| `DB_USERNAME`    | Usuario por servicio (`user_user`, etc.)                |
| `DB_PASSWORD`    | Password del usuario (`<set-me>`)                       |
| `DB_DATABASE`    | Schema por servicio (`user_db`, etc.)                   |
| `DB_SYNCHRONIZE` | `true` solo en desarrollo local; **siempre `false` en prod** |
| `CORS_ORIGIN`    | (solo gateway) `http://localhost:5173`                  |

### auth-service (adicional)

| Variable          | Descripción                       |
|-------------------|-----------------------------------|
| `JWT_SECRET`      | Secreto de firma JWT              |
| `JWT_EXPIRES_IN`  | Expiración del token (ej. `1h`)   |

## Frontend

Por ahora no usa variables de runtime (build estático servido por nginx). El
endpoint `/api/*` se resuelve vía proxy de `frontend/nginx.conf` hacia
`http://gateway:8000`.

## Reglas

1. `.env` → gitignored. Solo se commitea `.env.example` con placeholders `<set-me>`.
2. `DB_SYNCHRONIZE=true` solo es efectivo si `NODE_ENV !== 'production'`
   (validación en cada `app.module.ts`). En producción las migraciones se
   ejecutan vía CLI (`src/data-source.ts` + `src/migrations/`).
3. `JWT_SECRET` y las passwords se validan al arrancar (Joi fail-fast).
