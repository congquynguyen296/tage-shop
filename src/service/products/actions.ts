import { ApiResponse, Product } from "@/types";
import {
  SaveProductShareInput,
  SaveProductShareSchema,
  UpsertProductInput,
  UpsertProductSchema,
} from "./schema";

let inFlightAdminProductsPromise: Promise<Product[]> | null = null;

/**
 * Fetch all products from `/api/admin/products` for Admin Studio.
 * Deduplicated while in-flight so concurrent callers (e.g. AdminLayout + useAdminProducts)
 * share a single network request.
 */
export async function getAdminProductsAction(): Promise<Product[]> {
  if (inFlightAdminProductsPromise) {
    return inFlightAdminProductsPromise;
  }

  inFlightAdminProductsPromise = fetch("/api/admin/products", {
    method: "GET",
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch admin products");
      }
      const json = (await res.json()) as ApiResponse<Product[]>;
      return json.data || [];
    })
    .finally(() => {
      inFlightAdminProductsPromise = null;
    });

  return inFlightAdminProductsPromise;
}

/**
 * Create a new product via `POST /api/admin/products`
 */
export async function createAdminProductAction(
  rawInput: UpsertProductInput
): Promise<Product> {
  const input = UpsertProductSchema.parse(rawInput);
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to create product");
  }

  const json = (await res.json()) as ApiResponse<Product>;
  return json.data;
}

/**
 * Update product details via `PATCH /api/admin/products`
 */
export async function updateAdminProductAction(
  productId: string | number,
  rawInput: Partial<UpsertProductInput>
): Promise<Product | null> {
  const res = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "update",
      productId: String(productId),
      input: rawInput,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update product");
  }

  const json = (await res.json()) as ApiResponse<Product | null>;
  return json.data;
}

/**
 * Update variant stock / availability via `PATCH /api/admin/products`
 */
export async function updateAdminStockAction(
  productId: string | number,
  stock: number
): Promise<{ success: boolean; stock: number }> {
  const res = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "stock",
      productId: String(productId),
      stock,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update stock");
  }

  return { success: true, stock };
}

/**
 * Delete a product via `DELETE /api/admin/products?id=...`
 */
export async function deleteAdminProductAction(
  productId: string | number
): Promise<{ success: boolean }> {
  const res = await fetch(
    `/api/admin/products?id=${encodeURIComponent(String(productId))}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete product");
  }

  return { success: true };
}

/**
 * Save or update a persistent curated Share Link via `PATCH /api/admin/products`
 */
export async function saveProductShareLinkAction(
  rawInput: SaveProductShareInput
): Promise<{
  shareCode: string;
  sharedImages: string[];
  product: Product | null;
}> {
  const input = SaveProductShareSchema.parse(rawInput);
  const res = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "share",
      productId: input.productId,
      selectedImages: input.selectedImages,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save share link");
  }

  const json = (await res.json()) as ApiResponse<{
    shareCode: string;
    sharedImages: string[];
    product: Product | null;
  }>;
  return json.data;
}
