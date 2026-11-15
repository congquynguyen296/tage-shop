import { ApiResponse, CartItem } from "@/types";

let inFlightSyncPromise: Promise<ApiResponse<CartItem[]>> | null = null;
const inFlightAddByKey = new Map<string, Promise<ApiResponse<CartItem>>>();

/**
 * Add a 1-of-1 piece to `POST /api/cart` (deduplicated per item key while in-flight)
 */
export async function addToCartApi(
  itemIdOrSlug: string | number
): Promise<ApiResponse<CartItem>> {
  const key = String(itemIdOrSlug);
  const existing = inFlightAddByKey.get(key);
  if (existing) {
    return existing;
  }

  const promise = fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId: key }),
  })
    .then(async (res) => (await res.json()) as ApiResponse<CartItem>)
    .finally(() => {
      inFlightAddByKey.delete(key);
    });

  inFlightAddByKey.set(key, promise);
  return promise;
}

/**
 * Remove a piece from `DELETE /api/cart`
 */
export async function removeFromCartApi(
  itemIdOrSlug: string | number
): Promise<void> {
  await fetch(`/api/cart?itemId=${encodeURIComponent(String(itemIdOrSlug))}`, {
    method: "DELETE",
  });
}

/**
 * Clear all items in `DELETE /api/cart`
 */
export async function clearCartApi(): Promise<void> {
  await fetch("/api/cart?clearAll=true", {
    method: "DELETE",
  });
}

/**
 * Syncs guest localStorage cart items into PostgreSQL `cart_items` upon login.
 * Deduplicated while in-flight so concurrent calls share a single HTTP request.
 */
export async function syncCartWithBackend(
  items: CartItem[]
): Promise<ApiResponse<CartItem[]>> {
  if (inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  const syncItemIds = items.map(
    (i) => i.product.slug || String(i.product.id)
  );

  inFlightSyncPromise = fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncItemIds }),
  })
    .then(async (res) => (await res.json()) as ApiResponse<CartItem[]>)
    .finally(() => {
      inFlightSyncPromise = null;
    });

  return inFlightSyncPromise;
}
