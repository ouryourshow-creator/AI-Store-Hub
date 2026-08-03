import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  GetProductParams,
  DeleteProductParams,
  ListProductsResponse,
  CreateProductResponse,
  GetProductResponse,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

/** Map a raw DB row to the shape the API returns */
function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

// GET /products — public
router.get("/products", async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.createdAt);

  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

// POST /products — admin only
router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid product input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      name: d.name,
      category: d.category ?? null,
      brand: d.brand ?? null,
      coverImageUrl: d.coverImageUrl ?? null,
      price: String(d.price),
      salePrice: d.salePrice != null ? String(d.salePrice) : null,
      duration: d.duration,
      deliveryTime: d.deliveryTime ?? null,
      activationType: d.activationType ?? null,
      onCustomerAccount: d.onCustomerAccount ?? false,
      invitationLink: d.invitationLink ?? null,
      licenseKey: d.licenseKey ?? null,
      sharedAccount: d.sharedAccount ?? false,
      description: d.description ?? null,
      features: d.features ?? null,
      customerInfoRequired: d.customerInfoRequired ?? null,
      afterPurchaseInstructions: d.afterPurchaseInstructions ?? null,
    })
    .returning();

  res.status(201).json(CreateProductResponse.parse(mapProduct(product)));
});

// GET /products/:id — public
router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

// PUT /products/:id — admin only
router.put("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (d.name !== undefined) updateData.name = d.name;
  if (d.category !== undefined) updateData.category = d.category;
  if (d.brand !== undefined) updateData.brand = d.brand;
  if (d.coverImageUrl !== undefined) updateData.coverImageUrl = d.coverImageUrl;
  if (d.price !== undefined) updateData.price = String(d.price);
  if (d.salePrice !== undefined) updateData.salePrice = d.salePrice != null ? String(d.salePrice) : null;
  if (d.duration !== undefined) updateData.duration = d.duration;
  if (d.deliveryTime !== undefined) updateData.deliveryTime = d.deliveryTime;
  if (d.activationType !== undefined) updateData.activationType = d.activationType;
  if (d.onCustomerAccount !== undefined) updateData.onCustomerAccount = d.onCustomerAccount;
  if (d.invitationLink !== undefined) updateData.invitationLink = d.invitationLink;
  if (d.licenseKey !== undefined) updateData.licenseKey = d.licenseKey;
  if (d.sharedAccount !== undefined) updateData.sharedAccount = d.sharedAccount;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.features !== undefined) updateData.features = d.features;
  if (d.customerInfoRequired !== undefined) updateData.customerInfoRequired = d.customerInfoRequired;
  if (d.afterPurchaseInstructions !== undefined) updateData.afterPurchaseInstructions = d.afterPurchaseInstructions;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

// DELETE /products/:id — admin only
router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
