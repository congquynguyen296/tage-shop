import "server-only";
import { prisma } from "@/server/db/client";
import {
  mapPrismaItemToProduct,
  PrismaItemWithRelations,
} from "@/server/db/mappers";
import {
  SaveProductShareInput,
  UpsertProductInput,
} from "@/service/products/schema";
import { slugify } from "@/config/utils";
import { Product } from "@/types";

export interface AdminActor {
  id: string;
  email: string;
}

/**
 * Create a new product and record an AuditLog entry
 */
export async function createAdminProductInDb(
  input: UpsertProductInput,
  actor: AdminActor
): Promise<Product> {
  const categorySlug = slugify(input.category);
  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: { name: input.category },
    create: {
      name: input.category,
      slug: categorySlug,
      sortOrder: 1,
      isActive: true,
    },
  });

  const timestamp = Date.now().toString().slice(-6);
  const sku = `TG-${input.category.slice(0, 3).toUpperCase()}-${timestamp}`;
  const slug = `${slugify(input.name)}-${timestamp}`;

  const allImages = [
    ...(input.images || ["/images/products/p1-01.jpg"]).map(
      (url: string, idx: number) => ({
        url,
        storageKey: `local-${sku}-${idx}`,
        sortOrder: idx,
        isTemporary: false,
      })
    ),
    ...(input.temporaryImages || []).map((url: string, idx: number) => ({
      url,
      storageKey: `temp-${sku}-${idx}`,
      sortOrder: 100 + idx,
      isTemporary: true,
    })),
  ];

  const newItem: PrismaItemWithRelations = await prisma.item.create({
    data: {
      sku,
      slug,
      title: input.name,
      description: input.description || input.name,
      categoryId: category.id,
      color: input.color || "Standard",
      sizeLabel: input.sizes.join(", "),
      priceMinor: Math.round(input.price * 100),
      originalPriceMinor: input.originalPrice
        ? Math.round(input.originalPrice * 100)
        : null,
      costMinor: input.costPrice ? Math.round(input.costPrice * 100) : null,
      currency: "USD",
      status: input.isSoldOut ? "SOLD" : "AVAILABLE",
      isNew: input.isNew ?? true,
      comboId: input.comboId || null,
      comboTitle: input.comboTitle || null,
      createdById: actor.id,
      images: {
        create: allImages,
      },
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action: "CREATE_PRODUCT",
      entityType: "Item",
      entityId: newItem.id,
      after: {
        title: newItem.title,
        sku: newItem.sku,
        priceMinor: newItem.priceMinor,
        category: category.name,
      },
    },
  });

  return mapPrismaItemToProduct(newItem);
}

/**
 * Update product details/images and record an AuditLog entry
 */
export async function updateAdminProductInDb(
  productId: string,
  rawInput: Partial<UpsertProductInput>,
  actor: AdminActor
): Promise<Product | null> {
  const existing = await prisma.item.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
    include: { category: true, images: true },
  });

  if (!existing) return null;
  const targetId = existing.id;

  let categoryId = existing.categoryId;
  if (rawInput.category && rawInput.category !== existing.category?.name) {
    const catSlug = slugify(rawInput.category);
    const cat = await prisma.category.upsert({
      where: { slug: catSlug },
      update: { name: rawInput.category },
      create: {
        name: rawInput.category,
        slug: catSlug,
        sortOrder: 1,
        isActive: true,
      },
    });
    categoryId = cat.id;
  }

  if (rawInput.images || rawInput.temporaryImages) {
    const nextOfficial =
      rawInput.images ||
      existing.images
        .filter((i: { isTemporary: boolean; url: string }) => !i.isTemporary)
        .map((i: { url: string }) => i.url);
    const nextTemp =
      rawInput.temporaryImages ||
      existing.images
        .filter((i: { isTemporary: boolean; url: string }) => i.isTemporary)
        .map((i: { url: string }) => i.url);

    const rebuiltImages = [
      ...nextOfficial.map((url: string, idx: number) => ({
        url,
        storageKey: `local-${existing.sku}-${idx}`,
        sortOrder: idx,
        isTemporary: false,
      })),
      ...nextTemp.map((url: string, idx: number) => ({
        url,
        storageKey: `temp-${existing.sku}-${idx}`,
        sortOrder: 100 + idx,
        isTemporary: true,
      })),
    ];

    await prisma.itemImage.deleteMany({ where: { itemId: targetId } });
    if (rebuiltImages.length > 0) {
      await prisma.itemImage.createMany({
        data: rebuiltImages.map((img) => ({
          ...img,
          itemId: targetId,
        })),
      });
    }
  }

  const updated: PrismaItemWithRelations = await prisma.item.update({
    where: { id: targetId },
    data: {
      title: rawInput.name || existing.title,
      color: rawInput.color || existing.color,
      priceMinor: rawInput.price
        ? Math.round(rawInput.price * 100)
        : existing.priceMinor,
      originalPriceMinor:
        rawInput.originalPrice !== undefined
          ? rawInput.originalPrice
            ? Math.round(rawInput.originalPrice * 100)
            : null
          : existing.originalPriceMinor,
      costMinor:
        rawInput.costPrice !== undefined
          ? rawInput.costPrice
            ? Math.round(rawInput.costPrice * 100)
            : null
          : existing.costMinor,
      categoryId,
      status:
        rawInput.isSoldOut !== undefined
          ? rawInput.isSoldOut
            ? "SOLD"
            : "AVAILABLE"
          : existing.status,
      isNew: rawInput.isNew !== undefined ? rawInput.isNew : existing.isNew,
      comboId:
        rawInput.comboId !== undefined
          ? rawInput.comboId || null
          : existing.comboId,
      comboTitle:
        rawInput.comboTitle !== undefined
          ? rawInput.comboTitle || null
          : existing.comboTitle,
      sizeLabel: rawInput.sizes
        ? rawInput.sizes.join(", ")
        : existing.sizeLabel,
      description: rawInput.description || existing.description,
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action: "UPDATE_PRODUCT",
      entityType: "Item",
      entityId: targetId,
      after: {
        title: updated.title,
        priceMinor: updated.priceMinor,
        costMinor: updated.costMinor,
        status: updated.status,
      },
    },
  });

  return mapPrismaItemToProduct(updated);
}

/**
 * Update product stock/availability status and record an AuditLog entry
 */
export async function updateAdminProductStockInDb(
  productId: string,
  stock: number,
  actor: AdminActor
): Promise<{ stock: number }> {
  const item = await prisma.item.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (item) {
    const newStatus = stock > 0 ? "AVAILABLE" : "SOLD";
    await prisma.item.update({
      where: { id: item.id },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "UPDATE_STOCK",
        entityType: "Item",
        entityId: item.id,
        before: { status: item.status },
        after: { status: newStatus, stock },
      },
    });
  }

  return { stock };
}

/**
 * Save or update persistent share link (`shareCode` + `sharedImages`) with AuditLog
 */
export async function saveAdminProductShareLinkInDb(
  input: SaveProductShareInput,
  actor: AdminActor
): Promise<{
  shareCode: string;
  sharedImages: string[];
  product: Product | null;
}> {
  const key = String(input.productId);

  const existing: PrismaItemWithRelations | null =
    await prisma.item.findFirst({
      where: {
        OR: [{ id: key }, { slug: key }],
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

  if (!existing) {
    const fallbackCode = `piece-${key}-${Date.now().toString(36).slice(-4)}`;
    return {
      shareCode: fallbackCode,
      sharedImages: input.selectedImages,
      product: null,
    };
  }

  const shareCode =
    existing.shareCode ||
    `${existing.slug}-${Math.random().toString(36).substring(2, 6)}`;

  const updated: PrismaItemWithRelations = await prisma.item.update({
    where: { id: existing.id },
    data: {
      shareCode,
      sharedImages: input.selectedImages,
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action: "SAVE_SHARE_LINK",
      entityType: "Item",
      entityId: existing.id,
      after: {
        shareCode,
        sharedImagesCount: input.selectedImages.length,
      },
    },
  });

  return {
    shareCode,
    sharedImages: input.selectedImages,
    product: mapPrismaItemToProduct(updated),
  };
}

/**
 * Delete a product by ID and record an AuditLog entry
 */
export async function deleteAdminProductInDb(
  productId: string,
  actor: AdminActor
): Promise<void> {
  const item = await prisma.item.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (item) {
    await prisma.item.delete({
      where: { id: item.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "DELETE_PRODUCT",
        entityType: "Item",
        entityId: item.id,
        before: { title: item.title, sku: item.sku },
      },
    });
  }
}

/**
 * Upsert viewed items for an authenticated user and keep at most 12 latest entries
 */
export async function recordUserRecentlyViewedInDb(
  userId: string,
  keysToRecord: string[]
): Promise<void> {
  if (keysToRecord.length === 0) return;

  const matchedItems: Array<{ id: string; slug: string }> =
    await prisma.item.findMany({
      where: {
        OR: [{ id: { in: keysToRecord } }, { slug: { in: keysToRecord } }],
      },
      select: { id: true, slug: true },
    });

  for (const key of keysToRecord) {
    const found = matchedItems.find(
      (m: { id: string; slug: string }) => m.id === key || m.slug === key
    );
    if (found) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId: found.id,
          },
        },
        update: {
          viewedAt: new Date(),
        },
        create: {
          userId,
          itemId: found.id,
          viewedAt: new Date(),
        },
      });
    }
  }

  // Keep at most 12 latest recently viewed items per user
  const allUserViewed: Array<{ id: string }> =
    await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      select: { id: true },
    });

  if (allUserViewed.length > 12) {
    const staleIds = allUserViewed.slice(12).map((r: { id: string }) => r.id);
    await prisma.recentlyViewed.deleteMany({
      where: { id: { in: staleIds } },
    });
  }
}
