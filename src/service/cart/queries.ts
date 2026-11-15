import { ApiResponse, CartItem } from "@/types";

const inFlightCartGet = new Map<string, Promise<ApiResponse<CartItem[]>>>();

/**
 * Fetch user cart from `GET /api/cart` (DB for logged-in user, or validate guest IDs)
 */
export async function fetchCartApi(
  guestIds?: Array<string | number>
): Promise<ApiResponse<CartItem[]>> {
  const sp = new URLSearchParams();
  if (guestIds && guestIds.length > 0) {
    sp.set("ids", guestIds.map(String).join(","));
  }
  const url = sp.toString() ? `/api/cart?${sp.toString()}` : "/api/cart";

  const existing = inFlightCartGet.get(url);
  if (existing) {
    return existing;
  }

  const promise = fetch(url, {
    method: "GET",
    cache: "no-store",
  })
    .then(async (res) => (await res.json()) as ApiResponse<CartItem[]>)
    .finally(() => {
      inFlightCartGet.delete(url);
    });

  inFlightCartGet.set(url, promise);
  return promise;
}
