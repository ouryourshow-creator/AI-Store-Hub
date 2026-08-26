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
- An authenticated customer order is created before opening the WhatsApp payment-proof message; WhatsApp includes the saved booking number.
- Server-side order creation resolves current published products, duration pricing, promo eligibility, and totals. Never trust a browser-supplied total or price.
- Product activation credentials and invitation links are never returned from public catalog APIs.

### Orders, pricing, and analytics
- New orders begin in `awaiting_payment`; dashboard revenue only includes confirmed or fulfilled orders. Product sold counts update once, on the first confirmed/fulfilled transition, not when a booking is created.
- Order requests use a per-checkout idempotency key so retries return the original booking instead of creating multiple payable orders.
- EGP and USD are stored as independent admin-entered prices. If a product lacks USD pricing, storefront display safely falls back to EGP instead of converting rates automatically.
- Anonymous visit analytics retains a country code and a local anonymous visitor identifier; raw IP addresses are not stored.
**Why:** Customer order histories, regional prices, and store analytics must remain auditable without exposing activation secrets or collecting unnecessary personal data.
**How to apply:** Keep booking/order totals server-calculated, use order-item snapshots for historical display, and expose sensitive delivery data only after authenticated fulfilment workflows.

### Production database changes
- Replit Publish applies the development-to-production schema diff for managed PostgreSQL. Do not add production migration scripts, deploy-time schema pushes, or startup DDL.
**Why:** The managed publish flow safely presents schema changes and rename decisions; application-managed production DDL is unsupported.
**How to apply:** Update the Drizzle source schema, verify it in development, then re-publish when production needs the schema change.

### CORS
- Restricted to `CORS_ORIGIN` env var (comma-separated) or falls back to `REPLIT_DEV_DOMAIN`.
- `credentials: true` is enabled for session cookies.

### Price storage
- `price` is a `numeric` column in Postgres, stored as string, converted to `Number()` in route handlers before sending JSON.

### Zod version note
- Workspace uses Zod v3. Use `z.number()` not `z.number().int()` for IDs (zod.int() is v4 only).
- `artifacts/api-server` does NOT have `zod` as a direct dependency — do not import it in API route files. Use plain JS validation instead.

### DB migrations (new tables)
- `drizzle-kit push --force` fails on new tables with no-TTY error. Use a direct SQL migration script run via the tsx binary at `/home/runner/workspace/node_modules/.pnpm/tsx@4.23.1/node_modules/tsx/dist/cli.mjs`.
- Orval codegen binary: `/home/runner/workspace/node_modules/.pnpm/node_modules/.bin/orval --config orval.config.ts` from `lib/api-spec/`.

### Promo codes
- `promo_codes` table in DB; routes in `artifacts/api-server/src/routes/promoCodes.ts`.
- Admin creates codes with percentage + optional product ID list (null = all products).
- Validation endpoint `POST /promo-codes/validate` is public; checks active flag + product scope.
- Admin UI: tab-based layout in `Admin.tsx` (Products | Promo Codes tabs).
- Checkout: promo code input in `CheckoutModal.tsx`; discount reflected in total + WhatsApp message.

### Warranty duration
- `warrantyDuration` text field on products; set in admin modal Description section.
- Shown in the Warranty info card on the product page (replaces the static fallback text when set).

### Tailwind / Clerk CSS
- Tailwind v4 (`@tailwindcss/vite` plugin).
- `vite.config.ts` uses `tailwindcss({ optimize: false })` — required to prevent Clerk theme CSS from breaking in prod builds.
- `index.css` declares `@layer theme, base, clerk, components, utilities;` BEFORE `@import 'tailwindcss'` and includes `@import '@clerk/themes/shadcn.css'`.
