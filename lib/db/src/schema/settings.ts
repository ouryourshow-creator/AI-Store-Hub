import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Simple key/value store for admin-editable configuration that must not
// require a code deploy to change (e.g. the Binance USD fallback exchange rate).
export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
