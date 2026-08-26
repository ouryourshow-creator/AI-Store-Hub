import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import {
  analyticsVisitsTable,
  db,
  orderItemsTable,
  ordersTable,
  productsTable,
  promoCodesTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetAdminDashboardResponse,
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  ListMyOrdersResponse,
  RecordVisitBody,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const orderStatuses = new Set(["awaiting_payment", "payment_proof_received", "confirmed", "fulfilled", "cancelled"]);
const completedOrderStatuses = new Set(["confirmed", "fulfilled"]);

type ProductRecord = typeof productsTable.$inferSelect;

function mapOrder(
  order: typeof ordersTable.$inferSelect,
  items: Array<typeof orderItemsTable.$inferSelect>,
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    promoCode: order.promoCode,
    paymentMethod: order.paymentMethod,
    status: order.status,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      coverImageUrl: item.coverImageUrl,
      duration: item.duration,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function withItems(orders: Array<typeof ordersTable.$inferSelect>) {
  if (!orders.length) return [];
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map((order) => order.id)));
  const grouped = new Map<number, Array<typeof orderItemsTable.$inferSelect>>();
  for (const item of items) {
    const group = grouped.get(item.orderId) ?? [];
    group.push(item);
    grouped.set(item.orderId, group);
  }
  return orders.map((order) => mapOrder(order, grouped.get(order.id) ?? []));
}

function unitPrice(product: ProductRecord, duration: string, currency: "EGP" | "USD"): number | null {
  const options = product.pricingOptions ?? [];
  const matched = options.find((option) => option.duration === duration);
  if (matched) {
    if (currency === "USD") {
      return matched.salePriceUsd ?? matched.priceUsd ?? null;
    }
    return matched.salePrice ?? matched.price;
  }

  if (product.duration !== duration) return null;
  if (currency === "USD") return product.salePriceUsd != null ? Number(product.salePriceUsd) : product.priceUsd != null ? Number(product.priceUsd) : null;
  return product.salePrice != null ? Number(product.salePrice) : Number(product.price);
}

function authUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

function makeOrderNumber(): string {
  return `KTP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getHeader(req: Request, names: string[]): string | null {
  for (const name of names) {
    const value = req.get(name);
    if (value && /^[A-Za-z]{2}$/.test(value.trim())) return value.trim().toUpperCase();
  }
  return null;
}

async function detectCountry(req: Request): Promise<string> {
  const headerCountry = getHeader(req, [
    "x-replit-user-country",
    "x-replit-geo-country",
    "cf-ipcountry",
    "x-vercel-ip-country",
  ]);
  if (headerCountry) return headerCountry;

  const ip = req.ip ?? "";
  if (!/^(?!(10|127|172\.(1[6-9]|2\d|3[0-1])|192\.168)\.)\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return "UNKNOWN";
  }
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country/`, { signal: AbortSignal.timeout(1200) });
    const country = (await response.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(country) ? country : "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

router.post("/orders", async (req, res): Promise<void> => {
  const customerId = authUserId(req);
  if (!customerId) {
    res.status(401).json({ error: "Sign in is required before placing an order" });
    return;
  }

  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid order input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const productIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await db
    .select()
    .from(productsTable)
    .where(and(inArray(productsTable.id, productIds), eq(productsTable.published, true)));
  const productsById = new Map(products.map((product) => [product.id, product]));

  const calculatedItems = data.items.map((requested) => {
    const product = productsById.get(requested.productId);
    const price = product ? unitPrice(product, requested.duration, data.currency) : null;
    if (!product || price == null) return null;
    return {
      product,
      duration: requested.duration,
      quantity: requested.quantity,
      unitPrice: price,
      lineTotal: price * requested.quantity,
    };
  });

  if (calculatedItems.some((item) => item == null)) {
    res.status(400).json({ error: "One or more selected products or durations are no longer available in this currency" });
    return;
  }

  const validItems = calculatedItems as NonNullable<(typeof calculatedItems)[number]>[];
  const subtotal = validItems.reduce((sum, item) => sum + item.lineTotal, 0);
  let discount = 0;
  let promoCode: string | null = null;

  if (data.promoCode?.trim()) {
    const [promo] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.code, data.promoCode.trim().toUpperCase()))
      .limit(1);
    const eligibleSubtotal = promo?.applicableProductIds?.length
      ? validItems.filter((item) => promo.applicableProductIds!.includes(item.product.id)).reduce((sum, item) => sum + item.lineTotal, 0)
      : subtotal;
    const applies = promo?.active && eligibleSubtotal > 0;
    if (promo && applies) {
      discount = Math.round(eligibleSubtotal * promo.percentage) / 100;
      promoCode = promo.code;
    }
  }

  const total = Math.max(0, subtotal - discount);
  const created = await db.transaction(async (tx) => {
    const [order] = await tx.insert(ordersTable).values({
      orderNumber: makeOrderNumber(),
      customerId,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerPhone: data.customerPhone.trim(),
      idempotencyKey: data.idempotencyKey,
      currency: data.currency,
      subtotal: String(subtotal),
      discount: String(discount),
      total: String(total),
      promoCode,
      paymentMethod: data.paymentMethod ?? null,
    }).onConflictDoNothing({
      target: [ordersTable.customerId, ordersTable.idempotencyKey],
    }).returning();

    if (!order) {
      const [existing] = await tx.select().from(ordersTable).where(and(
        eq(ordersTable.customerId, customerId),
        eq(ordersTable.idempotencyKey, data.idempotencyKey),
      )).limit(1);
      if (!existing) throw new Error("Order idempotency conflict could not be resolved");
      const existingItems = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, existing.id));
      return mapOrder(existing, existingItems);
    }

    const items = await tx.insert(orderItemsTable).values(validItems.map((item) => ({
      orderId: order.id,
      productId: item.product.id,
      productName: item.product.name,
      coverImageUrl: item.product.coverImageUrl,
      duration: item.duration,
      unitPrice: String(item.unitPrice),
      quantity: item.quantity,
      lineTotal: String(item.lineTotal),
    }))).returning();

    return mapOrder(order, items);
  });

  res.status(201).json(CreateOrderResponse.parse(created));
});

router.get("/orders/me", async (req, res): Promise<void> => {
  const customerId = authUserId(req);
  if (!customerId) {
    res.status(401).json({ error: "Sign in is required" });
    return;
  }
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.customerId, customerId))
    .orderBy(desc(ordersTable.createdAt));
  res.json(ListMyOrdersResponse.parse(await withItems(orders)));
});

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const query = ListAdminOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search, status } = query.data;
  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(
      ilike(ordersTable.orderNumber, term),
      ilike(ordersTable.customerName, term),
      ilike(ordersTable.customerEmail, term),
      ilike(ordersTable.customerPhone, term),
    ));
  }
  const orders = await db.select().from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));
  res.json(ListAdminOrdersResponse.parse(await withItems(orders)));
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success || !orderStatuses.has(body.data.status)) {
    res.status(400).json({ error: "Invalid order status update" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(ordersTable)
      .where(eq(ordersTable.id, params.data.id))
      .for("update");
    if (!current) return null;

    const shouldCountAsSold = completedOrderStatuses.has(body.data.status) && !current.countedAsSold;
    const [order] = await tx.update(ordersTable)
      .set({ status: body.data.status, countedAsSold: current.countedAsSold || shouldCountAsSold })
      .where(eq(ordersTable.id, current.id))
      .returning();
    const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

    if (shouldCountAsSold) {
      for (const item of items) {
        await tx.update(productsTable)
          .set({ soldCount: sql`${productsTable.soldCount} + ${item.quantity}` })
          .where(eq(productsTable.id, item.productId));
      }
    }
    return { order, items };
  });
  if (!result) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(UpdateOrderStatusResponse.parse(mapOrder(result.order, result.items)));
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  const [orderTotals] = await db.select({
    count: sql<number>`count(*)`,
    sales: sql<number>`coalesce(sum(case when ${ordersTable.status} in ('confirmed', 'fulfilled') and ${ordersTable.currency} = 'EGP' then ${ordersTable.total} else 0 end), 0)`,
    salesUsd: sql<number>`coalesce(sum(case when ${ordersTable.status} in ('confirmed', 'fulfilled') and ${ordersTable.currency} = 'USD' then ${ordersTable.total} else 0 end), 0)`,
  }).from(ordersTable);
  const [visitTotals] = await db.select({ count: sql<number>`count(*)` }).from(analyticsVisitsTable);
  const countries = await db.select({
    country: analyticsVisitsTable.countryCode,
    visits: sql<number>`count(*)`,
  }).from(analyticsVisitsTable).groupBy(analyticsVisitsTable.countryCode).orderBy(desc(sql`count(*)`)).limit(8);
  const products = await db.select({
    productId: productsTable.id,
    productName: productsTable.name,
    sold: productsTable.soldCount,
    views: sql<number>`coalesce(count(${analyticsVisitsTable.id}), 0)`,
  }).from(productsTable)
    .leftJoin(analyticsVisitsTable, eq(analyticsVisitsTable.productId, productsTable.id))
    .groupBy(productsTable.id)
    .orderBy(desc(sql`coalesce(count(${analyticsVisitsTable.id}), 0)`))
    .limit(8);
  const visitsByDate = await db.select({
    date: sql<string>`to_char(${analyticsVisitsTable.createdAt}::date, 'YYYY-MM-DD')`,
    visits: sql<number>`count(*)`,
  }).from(analyticsVisitsTable).where(gte(analyticsVisitsTable.createdAt, since))
    .groupBy(sql`${analyticsVisitsTable.createdAt}::date`);
  const ordersByDate = await db.select({
    date: sql<string>`to_char(${ordersTable.createdAt}::date, 'YYYY-MM-DD')`,
    orders: sql<number>`count(*)`,
    sales: sql<number>`coalesce(sum(case when ${ordersTable.status} in ('confirmed', 'fulfilled') and ${ordersTable.currency} = 'EGP' then ${ordersTable.total} else 0 end), 0)`,
  }).from(ordersTable).where(gte(ordersTable.createdAt, since))
    .groupBy(sql`${ordersTable.createdAt}::date`);
  const visitMap = new Map(visitsByDate.map((row) => [row.date, Number(row.visits)]));
  const orderMap = new Map(ordersByDate.map((row) => [row.date, { orders: Number(row.orders), sales: Number(row.sales) }]));
  const dates = new Set([...visitMap.keys(), ...orderMap.keys()]);
  const trends = [...dates].sort().map((date) => ({
    date,
    visits: visitMap.get(date) ?? 0,
    orders: orderMap.get(date)?.orders ?? 0,
    sales: orderMap.get(date)?.sales ?? 0,
  }));
  res.json(GetAdminDashboardResponse.parse({
    totalSales: Number(orderTotals.sales),
    totalSalesUsd: Number(orderTotals.salesUsd),
    totalOrders: Number(orderTotals.count),
    totalVisits: Number(visitTotals.count),
    countries: countries.map((item) => ({ country: item.country === "UNKNOWN" ? "Unknown" : item.country, visits: Number(item.visits) })),
    popularProducts: products.map((item) => ({ productId: item.productId, productName: item.productName, views: Number(item.views), sold: item.sold })),
    trends,
  }));
});

router.post("/analytics/visit", async (req, res): Promise<void> => {
  const parsed = RecordVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const visitorId = data.visitorId?.slice(0, 96) || `anon-${Math.random().toString(36).slice(2)}`;
  const countryCode = await detectCountry(req);
  await db.insert(analyticsVisitsTable).values({
    visitorId,
    path: data.path.slice(0, 300),
    productId: data.productId ?? null,
    countryCode,
  });
  res.json({ country: countryCode, currency: countryCode === "EG" ? "EGP" : "USD" });
});

export default router;