# SETUP — Puesta en marcha del entorno completo

Guía para levantar el stack completo de ElectroShop (MySQL + 8 servicios + frontend) con Docker Compose, tanto en desarrollo local como en CI.

## Requisitos

- Docker Engine + Docker Compose v2 (o Docker Desktop).
- npm 11 (versión con la que se generan los lockfiles). Los contenedores lo fijan automáticamente.

## Puertos expuestos al host

| Servicio      | Puerto host | Puerto contenedor | Acceso |
|---------------|-------------|-------------------|--------|
| MySQL         | `33061`     | `3306`            | Solo host (mysqld local ocupa 3306) |
| Gateway (API) | `8000`      | `8000`            | Host + frontend (proxy nginx) |
| Frontend      | `5173`      | `80` (nginx)      | Host |

> Los 7 servicios core **no publican puertos al host**.
> Solo se prueban desde dentro de la red (ver smoke test).

## Puesta en marcha

1. Crear `.env` a partir de `.env.example` (ver `docs/ENV.md`):

   ```bash
   cp .env.example .env
   # completar los valores <set-me> con secretos reales
   ```

2. Levantar todo el stack (construye las 9 imágenes la primera vez):

   ```bash
   docker compose up -d --build
   ```

3. Verificar que los 9 contenedores estén `healthy`:

   ```bash
   docker compose ps
   ```

4. Smoke test (gateway y frontend por host, servicios por `exec`):

   ```bash
   # Windows
   powershell -File scripts/smoke.ps1
   # Linux/CI
   bash scripts/smoke-ci.sh
   ```

   Salida esperada: `SMOKE OK (9/9)`.

## Verificación de puertos y endpoints

- Gateway: `http://localhost:8000/health` → `{"status":"ok",...}`
- Frontend: `http://localhost:5173/` (SPA; `/api/*` se proxya al gateway)
- MySQL: `33061` con los usuarios por servicio (schemas creados por `docker/mysql/init/01-create-schemas.sh`).

## Comandos útiles

```bash
docker compose up -d        # levantar
docker compose down         # bajar (conserva el volumen mysql_data)
docker compose down -v      # bajar y borrar datos de MySQL
docker compose ps           # estado
docker compose logs -f mysql
docker compose exec -T user-service wget -qO- http://localhost:3001/health
```

## Desarrollo local (sin Docker, por servicio)

Cada paquete es autocontenido (NestJS + TypeORM):

```bash
cd core-services/user-service
npm install
npm run start:dev   # lint + typecheck + build + start
```

Para conectarse a una MySQL local (no la del compose), usar el `.env` de cada
servicio (ver `docs/ENV.md`). En desarrollo se permite `DB_SYNCHRONIZE=true`
solo si `NODE_ENV != production`; en producción siempre `false`.

## Notas de plataforma

- **Lockfiles:** se generan con npm 11 en Linux. Los Dockerfiles y el CI fijan
  `npm@11.2.0` para evitar incompatibilidades de formato de `package-lock.json`.
- **Windows:** tras regenerar lockfiles en Linux, los `node_modules` locales
  quedan con binarios Linux; reinstalar con `npm ci`/`npm install` para dev local.
- **`internal: true`:** NO se usa en la red del compose porque bloquea la
  publicación de puertos (gateway/frontend/mysql). El aislamiento se logra no
  publicando puertos de los servicios internos.
