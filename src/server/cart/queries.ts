import "server-only";
import { prisma } from "@/server/db/client";
import {
  mapPrismaItemToProduct,
  PrismaCartItemWithRelations,
  PrismaItemWithRelations,
} from "@/server/db/mappers";
import { CartItem } from "@/types";

export function toClientCartItem(item: PrismaItemWithRelations): CartItem {
  const product = mapPrismaItemToProduct(item);
  const size = product.sizes?.[0] || product.variants?.[0]?.size || "One Size";
  return {
    key: `${product.id}-${size}`,
    product,
    size,
    color: product.color || "Standard",
    qty: 1, // 1-of-1 unique archive piece
  };
}

/**
 * Fetch authenticated user's cart items and automatically prune items that are no longer AVAILABLE
 */
export async function findUserCartItemsInDb(
  userId: string
): Promise<CartItem[]> {
  const dbCartItems: PrismaCartItemWithRelations[] =
    await prisma.cartItem.findMany({
      where: { userId },
      include: {
        item: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

  const unavailableIds = dbCartItems
    .filter(
      (ci: PrismaCartItemWithRelations) => ci.item.status !== "AVAILABLE"
    )
    .map((ci: PrismaCartItemWithRelations) => ci.id);

  if (unavailableIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { id: { in: unavailableIds } },
    });
  }

  return dbCartItems
    .filter(
      (ci: PrismaCartItemWithRelations) => ci.item.status === "AVAILABLE"
    )
    .map((ci: PrismaCartItemWithRelations) => toClientCartItem(ci.item));
}

/**
 * Validate guest localStorage cart item IDs/slugs against live DB availability
 */
export async function findGuestCartItemsInDb(
  keys: string[]
): Promise<CartItem[]> {
  if (keys.length === 0) return [];

  const dbItems: PrismaItemWithRelations[] = await prisma.item.findMany({
    where: {
      status: "AVAILABLE",
      OR: [{ id: { in: keys } }, { slug: { in: keys } }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  return dbItems.map((item: PrismaItemWithRelations) =>
    toClientCartItem(item)
  );
}
