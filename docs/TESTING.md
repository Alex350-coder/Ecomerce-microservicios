# Testing Strategy

> ElectroShop testing strategy: frameworks, coverage thresholds, CI gates, and conventions.

---

## 1. Frameworks by Layer

| Layer | Framework | Runner | Config |
|-------|-----------|--------|--------|
| Backend unit/integration | Jest + Supertest | `npm test` | `jest` in package.json |
| Backend security | Jest (security config) | `npm run test:security` | `test/jest-security.json` |
| Frontend unit | Vitest + React Testing Library | `npm test` | `vitest.config.ts` |
| E2E | Playwright (Chromium) | `npx playwright test` | `e2e/playwright.config.ts` |
| Lint | ESLint (flat config) | `npm run lint` | `eslint.config.*` |
| Type check | TypeScript | `npm run typecheck` (`tsc --noEmit`) | `tsconfig.json` |

## 2. Coverage Thresholds

### Backend (Jest — statements/lines/functions/branches)

| Service | Target | Type |
|---------|--------|------|
| auth-service | 75% / 70% branches | Critical |
| order-service | 75% / 70% branches | Critical |
| payment-service | 75% / 70% branches | Critical |
| inventory-service | 75% / 70% branches | Critical |
| user-service | 70% / 65% branches | Normal |
| product-service | 70% / 65% branches | Normal |
| cart-service | 70% / 65% branches | Normal |
| gateway | 70% / 65% branches | Normal |

**Coverage scope:** business logic files only. Excluded from coverage: `main.ts`, `data-source.ts`, `migrations/`, `seed/` (bootstrap/infrastructure code).

### Frontend (Vitest — scope: api/context/hooks)

| Metric | Target |
|--------|--------|
| Statements | 60% |
| Lines | 60% |
| Functions | 60% |
| Branches | 55% |

**Scope:** `src/api/**/*.ts`, `src/context/**/*.tsx`, `src/hooks/**/*.ts`. Pages and UI components are not yet included (future iteration).

## 3. CI Gates (per PR)

All gates must pass for merge:

| Gate | Check | Blocking |
|------|-------|----------|
| Lint | `npm run lint` — 0 errors | Yes |
| Typecheck | `npm run typecheck` — 0 errors | Yes |
| Build | `npm run build` — compiles | Yes |
| Unit tests | `npm test` — all green | Yes |
| Coverage | Thresholds enforced via `npm run test:cov` | Yes |
| Security suite | `npm run test:security` (auth-service) | Yes |
| npm audit | `npm audit --omit=dev --audit-level=high` — 0 high/critical | Yes |
| Secrets scan | Gitleaks — 0 findings | Yes |
| Trivy fs | CRITICAL severity — 0 findings | Yes |
| E2E critical | Playwright register→login→catalog→cart→checkout→order | Yes (F11+) |
| Smoke | docker compose up + /health 200 on all services | Yes |

## 4. Security Test Catalog (from 15-SECURITY-TESTING.md)

| Category | Coverage | Services |
|----------|----------|----------|
| A. Auth & Session (A1–A12) | auth-service security suite (35 tests) | auth |
| B. Authorization (B1–B8) | RolesGuard specs in all services | all |
| C. Input Validation (C1–C6) | DTO validation + whitelist in all services | all |
| D. Business Rules (D1–D7) | inventory service (reserve/commit/release) | inventory, order |
| E. Network/Limits (E1–E6) | Gateway rate-limit, Helmet, CORS | gateway |
| F. Frontend (F1–F4) | E2E tests + RTL tests | frontend |
| G. Supply Chain (G1–G3) | npm audit + gitleaks + trivy in CI | CI |

## 5. Running Tests Locally

```bash
# Backend (any service)
cd core-services/<service>
npm test           # unit tests
npm run test:cov   # with coverage
npm run test:security  # security suite (auth-service only)

# Frontend
cd frontend
npm test           # vitest run
npm run test:coverage  # with coverage

# E2E (requires docker compose up)
cd e2e
npm test           # playwright test
npx playwright test --headed  # visual mode
```

## 6. Flakiness Management

- E2E tests: retries=2 in CI, workers=1, action timeout 10s
- DB isolation: each test run uses fresh compose stack (CI: `docker compose down -v` after)
- Product seeding: `npm run seed` in product-service container before e2e

## 7. Known Gaps & Future Work

- **Frontend component tests:** pages and UI components not yet tested (coverage measured only for api/context/hooks layer). Recommend adding RTL tests for critical components in future iteration.
- **Integration tests with DB:** current unit tests mock the repository layer. Full integration tests against MySQL (via testcontainers or docker compose) are a future enhancement.
- **DAST (OWASP ZAP):** optional, not blocking. Can be added as a non-blocking CI job.
- **Branch protection:** requires manual GitHub repo settings (CI required + 1 approval). Documented here but cannot be automated via code.
