import "server-only";
import { prisma } from "@/server/db/client";
import {
  PrismaCartItemWithRelations,
  PrismaItemWithRelations,
} from "@/server/db/mappers";
import { CartItem } from "@/types";
import { toClientCartItem } from "./queries";

/**
 * Sync guest cart items into PostgreSQL `cart_items` upon login and return merged cart
 */
export async function syncGuestCartToUserInDb(
  userId: string,
  keys: string[]
): Promise<CartItem[]> {
  const cleanKeys = keys.filter(Boolean);
  if (cleanKeys.length > 0) {
    const availableItems: Array<{ id: string }> = await prisma.item.findMany({
      where: {
        status: "AVAILABLE",
        OR: [{ id: { in: cleanKeys } }, { slug: { in: cleanKeys } }],
      },
      select: { id: true },
    });

    if (availableItems.length > 0) {
      await prisma.cartItem.createMany({
        data: availableItems.map((item: { id: string }) => ({
          userId,
          itemId: item.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  const updatedCart: PrismaCartItemWithRelations[] =
    await prisma.cartItem.findMany({
      where: { userId, item: { status: "AVAILABLE" } },
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

  return updatedCart.map((ci: PrismaCartItemWithRelations) =>
    toClientCartItem(ci.item)
  );
}

/**
 * Add a single 1-of-1 piece to cart (persisting to DB if userId is provided)
 */
export async function addSingleItemToCartInDb(
  itemKey: string,
  userId?: string
): Promise<CartItem | null> {
  const item: PrismaItemWithRelations | null = await prisma.item.findFirst({
    where: {
      OR: [{ id: itemKey }, { slug: itemKey }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!item || item.status !== "AVAILABLE") {
    return null;
  }

  if (userId) {
    await prisma.cartItem.upsert({
      where: {
        userId_itemId: {
          userId,
          itemId: item.id,
        },
      },
      update: {},
      create: {
        userId,
        itemId: item.id,
      },
    });
  }

  return toClientCartItem(item);
}

/**
 * Remove a specific item or clear all items from a user's persistent cart
 */
export async function removeUserCartItemInDb(
  userId: string,
  options: { clearAll?: boolean; itemKey?: string | null }
): Promise<void> {
  if (options.clearAll) {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
    return;
  }

  if (options.itemKey) {
    const targetItem: { id: string } | null = await prisma.item.findFirst({
      where: {
        OR: [{ id: options.itemKey }, { slug: options.itemKey }],
      },
      select: { id: true },
    });

    if (targetItem) {
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          itemId: targetItem.id,
        },
      });
    }
  }
}
