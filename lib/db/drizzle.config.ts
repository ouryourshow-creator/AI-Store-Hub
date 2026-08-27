import { defineConfig } from "drizzle-kit";

// Restores the config referenced by this package's `push` / `push-force`
// scripts (`drizzle-kit push --config ./drizzle.config.ts`). Without this
// file, `drizzle-kit push` cannot run at all — schema changes must go through
// the normal dev-side push flow, not ad-hoc SQL.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
