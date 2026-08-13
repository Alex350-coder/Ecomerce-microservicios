# ElectroShop — E-Commerce de Microservicios

Tienda online de electrodomésticos y electrónica construida con una arquitectura de microservicios.

## Estructura

```
.
├── core-services/
│   ├── auth-service/      # Autenticación y usuarios (NestJS, TypeORM, MySQL)
│   └── user-service/      # Usuarios (esqueleto — placeholder)
├── frontend/              # Aplicación React + Vite + TypeScript
└── .gitignore             # Config global (editors, env, build)
```

## Stack

- **Backend:** NestJS 11, TypeORM, MySQL, JWT (bcrypt, passport-jwt)
- **Frontend:** React 19, Vite 7, TypeScript, React Router 7
- **Gestor de paquetes:** npm (lockfiles únicos por paquete)

## Cómo ejecutar

> Placeholder — instrucciones completas en Fase 1 (Docker) y Fase 12 (README definitivo).

- **Frontend:** `cd frontend && npm install && npm run dev`
- **Auth service:** `cd core-services/auth-service && npm install && npm run start:dev`
- **Build de verificación:** `npm run build` en `frontend/` y `core-services/auth-service/`

## Documentación

El plan de desarrollo y los criterios de calidad/seguridad viven en `Planning_files/` (roadmap por fase, arquitectura objetivo, gaps, Definition of Done y suite de seguridad).
