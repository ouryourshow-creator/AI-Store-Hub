import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import {
  cashbackTransactionsTable,
  db,
  ordersTable,
} from "@workspace/db";
import {
  ApproveCashbackParams,
  ApproveCashbackResponse,
  GetMyCashbackResponse,
  ListPendingCashbackResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const CASHBACK_CURRENCIES = ["EGP", "USD"] as const;

function authUserId(req: Request): string | null {
  return getAuth(req)?.userId ?? null;
}

function orderNumberValue(orderNumber: string | null | undefined): string | number | null {
  if (!orderNumber) return null;
  return /^\d+$/.test(orderNumber) ? Number(orderNumber) : orderNumber;
}

function mapTransaction(
  transaction: typeof cashbackTransactionsTable.$inferSelect,
  orderNumber?: string | null,
) {
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    orderNumber: orderNumberValue(orderNumber),
    type: transaction.type,
    status: transaction.status,
    currency: transaction.currency,
    amount: Number(transaction.amount),
    createdAt: transaction.createdAt.toISOString(),
    approvedAt: transaction.approvedAt?.toISOString() ?? null,
  };
}

function buildBalances(
  transactions: Array<typeof cashbackTransactionsTable.$inferSelect>,
) {
  return CASHBACK_CURRENCIES.map((currency) => {
    let pending = 0;
    let available = 0;
    for (const transaction of transactions) {
      if (transaction.currency !== currency) continue;
      const amount = Number(transaction.amount);
      if (transaction.type === "credit" && transaction.status === "pending") pending += amount;
      if (transaction.type === "credit" && transaction.status === "available") available += amount;
      if (transaction.type === "debit" && transaction.status === "redeemed") available -= amount;
    }
    return {
      currency,
      pending: Math.round(pending * 100) / 100,
      available: Math.max(0, Math.round(available * 100) / 100),
    };
  });
}

router.get("/cashback/me", async (req, res): Promise<void> => {
  const customerId = authUserId(req);
  if (!customerId) {
    res.status(401).json({ error: "Sign in is required" });
    return;
  }

  const rows = await db
    .select({ transaction: cashbackTransactionsTable, orderNumber: ordersTable.orderNumber })
    .from(cashbackTransactionsTable)
    .leftJoin(ordersTable, eq(ordersTable.id, cashbackTransactionsTable.orderId))
    .where(eq(cashbackTransactionsTable.customerId, customerId))
    .orderBy(desc(cashbackTransactionsTable.createdAt));
  const transactions = rows.map((row) => mapTransaction(row.transaction, row.orderNumber));
  res.json(GetMyCashbackResponse.parse({
    balances: buildBalances(rows.map((row) => row.transaction)),
    transactions,
  }));
});

router.get("/admin/cashback/pending", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      transaction: cashbackTransactionsTable,
      orderNumber: ordersTable.orderNumber,
      customerName: ordersTable.customerName,
      customerEmail: ordersTable.customerEmail,
    })
    .from(cashbackTransactionsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, cashbackTransactionsTable.orderId))
    .where(and(
      eq(cashbackTransactionsTable.type, "credit"),
      eq(cashbackTransactionsTable.status, "pending"),
    ))
    .orderBy(desc(cashbackTransactionsTable.createdAt));

  res.json(ListPendingCashbackResponse.parse(rows.map((row) => ({
    ...mapTransaction(row.transaction, row.orderNumber),
    customerName: row.customerName,
    customerEmail: row.customerEmail,
  }))));
});

router.post("/admin/cashback/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const params = ApproveCashbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid cashback transaction" });
    return;
  }

  const approved = await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select()
      .from(cashbackTransactionsTable)
      .where(eq(cashbackTransactionsTable.id, params.data.id))
      .limit(1);
    if (!candidate) return null;

    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, candidate.orderId))
      .for("update");
    if (!order || !["confirmed", "fulfilled"].includes(order.status)) return null;

    const [current] = await tx
      .select()
      .from(cashbackTransactionsTable)
      .where(and(
        eq(cashbackTransactionsTable.id, params.data.id),
        eq(cashbackTransactionsTable.type, "credit"),
        eq(cashbackTransactionsTable.status, "pending"),
      ))
      .for("update");
    if (!current) return null;

    const [transaction] = await tx
      .update(cashbackTransactionsTable)
      .set({ status: "available", approvedAt: new Date() })
      .where(eq(cashbackTransactionsTable.id, current.id))
      .returning();
    return {
      ...mapTransaction(transaction, order.orderNumber),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
    };
  });

  if (!approved) {
    res.status(404).json({ error: "Pending cashback transaction not found" });
    return;
  }
  res.json(ApproveCashbackResponse.parse(approved));
});

export default router;