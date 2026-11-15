import { ApiResponse, Product } from "@/types";
import { ADMIN_PRODUCT_PATCH_MODES, API_ROUTES } from "@/config/routes";
import {
  SaveProductShareInput,
  SaveProductShareSchema,
  UploadedMediaItem,
  UploadedMediaItemSchema,
  UploadMediaInputSchema,
  UploadMediaZone,
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

  inFlightAdminProductsPromise = fetch(API_ROUTES.ADMIN.PRODUCTS, {
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
  const res = await fetch(API_ROUTES.ADMIN.PRODUCTS, {
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
  const res = await fetch(API_ROUTES.ADMIN.PRODUCTS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: ADMIN_PRODUCT_PATCH_MODES.UPDATE,
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
  const res = await fetch(API_ROUTES.ADMIN.PRODUCTS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: ADMIN_PRODUCT_PATCH_MODES.STOCK,
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
  const res = await fetch(API_ROUTES.ADMIN.deleteProduct(productId), {
    method: "DELETE",
  });

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
  const res = await fetch(API_ROUTES.ADMIN.PRODUCTS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: ADMIN_PRODUCT_PATCH_MODES.SHARE,
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

/**
 * Upload one or multiple product image files to Cloudinary via `POST /api/upload`
 */
export async function uploadProductImagesAction(
  files: File[],
  zone: UploadMediaZone = "official",
  productName: string = "",
  startIndex: number = 0
): Promise<UploadedMediaItem[]> {
  const parsedInput = UploadMediaInputSchema.parse({
    zone,
    productName,
    startIndex,
    fileCount: files.length,
  });

  const formData = new FormData();
  formData.append("zone", parsedInput.zone);
  formData.append("productName", parsedInput.productName || "");
  formData.append("startIndex", String(parsedInput.startIndex || 0));
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(API_ROUTES.UPLOAD.BASE, {
    method: "POST",
    body: formData,
  });

  const json = (await res.json()) as ApiResponse<UploadedMediaItem[]> & {
    error?: string;
    url?: string;
  };

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "Failed to upload images");
  }

  if (Array.isArray(json.data) && json.data.length > 0) {
    return json.data.map((item) => UploadedMediaItemSchema.parse(item));
  }

  if (typeof json.url === "string" && json.url.length > 0) {
    return [
      {
        url: json.url,
        publicId: "uploaded-media",
        provider: json.url.includes("res.cloudinary.com")
          ? "cloudinary"
          : "local",
      },
    ];
  }

  return [];
}
