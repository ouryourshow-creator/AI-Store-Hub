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

### Admin auth (Clerk)
- Auth is Replit-managed Clerk (provisioned via `setupClerkWhitelabelAuth()`).
- `clerkMiddleware` from `@clerk/express` is mounted in `app.ts` after body parsers, before routes.
- Clerk proxy middleware (`clerkProxyMiddleware`) mounted before body parsers at `/api/__clerk`.
- `requireAdmin` in `artifacts/api-server/src/middlewares/requireAdmin.ts` uses `getAuth(req)` + Clerk user lookup to enforce the `ADMIN_EMAILS` whitelist.
- `ADMIN_EMAILS` env var: comma-separated list of allowed admin emails. If empty, any authenticated user is admin (initial setup mode).
- `clerkClient` from `@clerk/express` is a direct object (not a function) — use `clerkClient.users.getUser(userId)` directly.
- Frontend: `App.tsx` wraps everything in `<ClerkProvider>` with `publishableKeyFromHost` from `@clerk/react/internal`.
- Sign-in page at `/sign-in/*?` — uses `forceRedirectUrl` (NOT `afterSignInUrl`) on `<SignIn>` component to send admin to `/admin` post-login.
- Admin page uses `useUser()` + `useClerk()` hooks; redirects to `/sign-in` if unauthenticated.
- PIN-based login (`ADMIN_PIN`, `POST /admin/login`, `POST /admin/logout`, `req.session.isAdmin`) fully removed.
- Session middleware kept in `app.ts` (legacy, harmless).

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

### Tailwind / Clerk CSS
- Tailwind v4 (`@tailwindcss/vite` plugin).
- `vite.config.ts` uses `tailwindcss({ optimize: false })` — required to prevent Clerk theme CSS from breaking in prod builds.
- `index.css` declares `@layer theme, base, clerk, components, utilities;` BEFORE `@import 'tailwindcss'` and includes `@import '@clerk/themes/shadcn.css'`.
