import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const cashbackTransactionsTable = pgTable("cashback_transactions", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("credit"),
  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
}, (table) => ({
  orderTypeUnique: unique("cashback_transactions_order_type_unique").on(table.orderId, table.type),
}));

export type CashbackTransaction = typeof cashbackTransactionsTable.$inferSelect;