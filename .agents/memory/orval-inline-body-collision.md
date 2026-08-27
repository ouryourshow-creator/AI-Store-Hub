---
name: Orval codegen inline body collision
description: Why adding an inline (non-$ref) request body schema to openapi.yaml can break lib/api-zod's typecheck, and how to fix it.
---

This repo's `lib/api-spec/openapi.yaml` feeds orval (`pnpm --filter @workspace/api-spec run codegen`), which generates both `lib/api-zod` (zod validators) and `lib/api-client-react` (React Query hooks). Every other request/response body in the spec is defined as a named `components/schemas/*` entry and referenced via `$ref` — this convention isn't just style, it's load-bearing.

If a request body is written inline under a path operation instead of `$ref`'d to a named schema, orval's zod generator names the emitted zod const after the operationId (e.g. `AdjustUserCashbackBody`), and orval's separate TypeScript-types generator *also* emits a same-named type declaration in `lib/api-zod/src/generated/types/`. Both are re-exported via `export *` from the package's barrel `index.ts`, and `tsc --build` reports it as an ambiguous-export error, failing `pnpm run typecheck:libs` (and therefore `pnpm -w run typecheck:libs`, part of the codegen script itself).

**Why:** named `$ref`'d schemas don't hit this path — orval only generates the zod body as an operation-named const, and the type file uses the ref'd component name, so there's no name overlap. Inline bodies have no separate component name to fall back on, so both generators pick the same operation-derived name.

**How to apply:** always define request/response body schemas as named entries under `components/schemas` in `lib/api-spec/openapi.yaml` and reference them with `$ref`, even for a single-use, admin-only endpoint. If `pnpm --filter @workspace/api-spec run codegen` fails with `TS2308 ... has already exported a member named 'X'`, look for an inline body/response schema for the operation that produced type `X` and extract it into a named component.
