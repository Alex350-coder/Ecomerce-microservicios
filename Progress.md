# Progress

Estado real por fase del plan `Planning_files/04-ROADMAP.md`. Única fuente de estado de fases.

**Regla de veracidad:** una fase es DONE solo cuando cumple todos sus criterios de aceptación y los gates de calidad/seguridad de la fase (ver `security/18-QUALITY-GATES.md`).

## Estado por fase

| Fase | Descripción | Estado |
|------|-------------|--------|
| F0 | Higiene del repositorio y tooling | En curso |
| F1 | Plataforma base (Docker, MySQL, shells, CI esqueleto) | Pendiente |
| F2 | Gateway API | Pendiente |
| F3 | Base frontend | Pendiente |
| F4 | Microservicio Auth (producción) | Pendiente |
| F5 | Microservicio Users | Pendiente |
| F6 | Microservicio Products | Pendiente |
| F7 | Microservicio Cart | Pendiente |
| F8 | Microservicio Orders | Pendiente |
| F9 | UI/UX avanzada | Pendiente |
| F10 | Microservicio Payments | Pendiente |
| F11 | Microservicio Inventory | Pendiente |
| F12 | Documentación final | Pendiente |
| F13 | QA final y cierre | Pendiente |

## Fase 0 — Higiene del repositorio y tooling

- [x] Aplanar carpetas anidadas (`auth-service/auth-service`, `frontend/frontend`, `user-service/user-service`)
- [x] Eliminar `package.json` obsoleto de auth-service (Mongoose)
- [x] Consolidar a npm (eliminar `yarn.lock`)
- [x] `.gitignore` global + `.editorconfig` + `.prettierrc` (raíz)
- [x] ESLint + Prettier unificados (auth-service y frontend)
- [x] `index.html` con título/meta de ElectroShop
- [x] README raíz esqueleto + este `Progress.md`

**Criterios de aceptación (verificación pendiente):** `git status` limpio; `npm install` + `npm run build` en frontend; auth-service compila; sin `yarn.lock`; sin carpetas anidadas; sin `package.json` obsoleto.
