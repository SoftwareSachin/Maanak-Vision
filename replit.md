# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## App: Maanak Vision

Industrial QC mobile app (Expo/React Native) for BIS 2026 compliance.

### Mobile App (`artifacts/maanak-vision`)
- Expo SDK 54, Expo Router (file-based navigation), React Query
- 4 tabs: Inspect, Train, Vault, Settings
- Full safe area handling: `useSafeAreaInsets()` on all screens and tab bar
- Tab bar accounts for Android system navigation bar via `insets.bottom`
- AsyncStorage for local persistence with seed data on first install

### Backend (`artifacts/api-server`)
API runs on PORT=8080. All routes prefixed with `/api`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/healthz` | GET | Health check |
| `/api/products` | GET, POST | List / create trained products |
| `/api/products/:id` | GET, DELETE | Get / delete product |
| `/api/products/:id/activate` | PUT | Set product as active standard |
| `/api/batches` | GET, POST | List / start inspection batch |
| `/api/batches/:id` | GET | Get batch with inspections |
| `/api/batches/:id/close` | POST | Close batch, issue BIS certificate |
| `/api/batches/:id/inspections` | GET | Get inspections for a batch |
| `/api/inspections` | GET, POST | List (with filters) / record inspection |
| `/api/inspections/:id` | GET | Get single inspection |
| `/api/inspections/stats/summary` | GET | Aggregate pass/fail/warning stats |

### Database (`lib/db`)
Drizzle ORM schema with three tables: `products`, `batches`, `inspections`. Requires `DATABASE_URL` env var.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
