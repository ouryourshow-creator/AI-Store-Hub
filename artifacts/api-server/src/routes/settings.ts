import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { GetEgpUsdRateResponse, SetEgpUsdRateBody, SetEgpUsdRateResponse } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

// Binance Pay always settles in USD. When a product has no admin-set USD price,
// checkout approximates its USD value from the EGP price using this rate. It is
// stored in the settings table so admins can update it without a code deploy.
const EGP_USD_RATE_KEY = "egp_usd_rate";
const DEFAULT_EGP_USD_RATE = 52;

// GET /settings/egp-usd-rate — public
router.get("/settings/egp-usd-rate", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, EGP_USD_RATE_KEY));

  const rate = row ? Number(row.value) : DEFAULT_EGP_USD_RATE;
  const updatedAt = row ? row.updatedAt.toISOString() : new Date(0).toISOString();

  res.json(GetEgpUsdRateResponse.parse({ rate, updatedAt }));
});

// PUT /admin/settings/egp-usd-rate — admin only
router.put("/admin/settings/egp-usd-rate", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SetEgpUsdRateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(settingsTable)
    .values({ key: EGP_USD_RATE_KEY, value: String(parsed.data.rate), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value: String(parsed.data.rate), updatedAt: new Date() },
    })
    .returning();

  res.json(SetEgpUsdRateResponse.parse({ rate: Number(row.value), updatedAt: row.updatedAt.toISOString() }));
});

export default router;
