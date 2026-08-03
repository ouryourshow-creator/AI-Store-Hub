import {
  pgTable,
  text,
  serial,
  timestamp,
  numeric,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  // Basic info
  name: text("name").notNull(),
  category: text("category"),
  brand: text("brand"),
  coverImageUrl: text("cover_image_url"),
  // Pricing
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  pricingOptions: jsonb("pricing_options").$type<Array<{ duration: string; price: number; salePrice?: number | null }>>(),
  // Subscription
  duration: text("duration").notNull(),
  deliveryTime: text("delivery_time"),
  activationType: text("activation_type"),
  onCustomerAccount: boolean("on_customer_account").default(false),
  invitationLink: text("invitation_link"),
  licenseKey: text("license_key"),
  sharedAccount: boolean("shared_account").default(false),
  // Description
  description: text("description"),
  features: text("features").array(),
  warrantyDuration: text("warranty_duration"),
  // Customer info
  customerInfoRequired: text("customer_info_required").array(),
  // Post-purchase
  afterPurchaseInstructions: text("after_purchase_instructions"),
  // Meta
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
