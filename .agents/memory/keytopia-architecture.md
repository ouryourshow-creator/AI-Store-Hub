---
name: Keytopia Architecture
description: Key decisions and constraints for the Keytopia digital subscriptions storefront.
---

## Stack
- Web frontend: React + Vite at artifact `artifacts/keytopia` (preview path `/`)
- API: Express at artifact `artifacts/api-server` (port 8080, proxied via `/api`)
- DB: Replit PostgreSQL via Drizzle ORM (`lib/db`)
- Generated API hooks: `lib/api-client-react` (customFetch has `credentials: "include"` globally)
- Zod schemas: `lib/api-zod`

## Key decisions

### i18n
- Arabic is the primary/default language; English is the toggle.
- LanguageContext in `artifacts/keytopia/src/contexts/LanguageContext.tsx` persists choice in localStorage.
- RTL: `document.documentElement.dir` is set to `rtl`/`ltr` on lang change.
- Arabic fonts: Alexandria (display), IBM Plex Sans Arabic (body) — activated via `[dir="rtl"]` CSS selector in `index.css`.
- All translation strings in `artifacts/keytopia/src/i18n/translations.ts`.

### Admin auth
- PIN stored as `ADMIN_PIN` secret (not env var).
- Session-based: `POST /api/admin/login` sets `req.session.isAdmin = true`.
- Sessions stored in Postgres (`user_sessions` table via `connect-pg-simple`, auto-created).
- Login rate-limited: 5 failed attempts per 15 min per IP via `express-rate-limit`.
- All catalog mutations (POST/PUT/DELETE /api/products) require `requireAdmin` middleware.

### DB migration
- `artifacts/api-server` dev script runs `pnpm --filter @workspace/db push-force` before build.
- This ensures the schema is applied on every startup (idempotent).

### WhatsApp checkout
- Purely client-side: formats `wa.me/201229327902?text=...` URL, no backend.
- Number is hardcoded (also in `WHATSAPP_NUMBER` env var for reference).

### CORS
- Restricted to `CORS_ORIGIN` env var (comma-separated) or falls back to `REPLIT_DEV_DOMAIN`.
- `credentials: true` is enabled for session cookies.

### Price storage
- `price` is a `numeric` column in Postgres, stored as string, converted to `Number()` in route handlers before sending JSON.

### Zod version note
- Workspace uses Zod v3. Use `z.number()` not `z.number().int()` for IDs (zod.int() is v4 only).
