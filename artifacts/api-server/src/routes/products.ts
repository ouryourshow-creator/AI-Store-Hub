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

// GET /products — public
router.get("/products", async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.createdAt);

  const mapped = products.map((p) => ({
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(ListProductsResponse.parse(mapped));
});

// POST /products — admin only
router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid product input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, price, duration, coverImageUrl } = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      name,
      description: description ?? null,
      price: String(price),
      duration,
      coverImageUrl: coverImageUrl ?? null,
    })
    .returning();

  res.status(201).json(
    CreateProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
    })
  );
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

  res.json(
    GetProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
    })
  );
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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.duration !== undefined) updateData.duration = parsed.data.duration;
  if (parsed.data.coverImageUrl !== undefined) updateData.coverImageUrl = parsed.data.coverImageUrl;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(
    UpdateProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
    })
  );
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
