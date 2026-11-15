# AI Agent Guidelines & Context

---

## 🚨 MANDATORY REQUIREMENTS BEFORE CODING

Before making any changes, you **MUST READ** the documentation files in the `docs/` directory:

1. [**`docs/AGENT_RULES.md`**](./docs/AGENT_RULES.md) — 7 Strictly Prohibited Rules & task completion checklist.
2. [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) — 4-layer decoupled architecture of the project.
3. [**`docs/CONVENTIONS.md`**](./docs/CONVENTIONS.md) — Naming conventions for files, components, hooks, and TypeScript strictness rules.

---

## 🧭 Quick Directory Map
- **Storefront UI (Customer)**: `src/app/(shop)/`
- **Admin Studio UI**: `src/app/admin/` (Guarded by `src/middleware.ts`)
- **Business Service & API Layer**: `src/service/<module>/` (`queries.ts`, `actions.ts`, `schema.ts`, `store.ts`, `mock.ts`)
- **Reusable UI Components**: `src/components/ui/`
- **Domain Components**: `src/components/product/`, `src/components/layout/`, `src/components/cart/`
- **Type Definitions**: `src/types/index.ts`
