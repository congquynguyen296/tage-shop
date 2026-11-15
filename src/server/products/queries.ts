import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  mapPrismaItemToProduct,
  PrismaItemImageRecord,
  PrismaItemWithRelations,
  PrismaRecentlyViewedWithRelations,
} from "@/server/db/mappers";
import { ProductFilterInput } from "@/service/products/schema";
import { ComboPiece, PaginatedResponse, Product, ProductCategory } from "@/types";
import { DEFAULT_PRODUCT_IMAGE } from "@/config/utils";

function mapSiblingToComboPiece(piece: PrismaItemWithRelations): ComboPiece {
  const officialImg =
    piece.images.find((i: PrismaItemImageRecord) => !i.isTemporary)?.url ||
    piece.images[0]?.url ||
    DEFAULT_PRODUCT_IMAGE;
  return {
    id: piece.id,
    slug: piece.slug,
    name: piece.title,
    category: (piece.category?.name || "Outerwear") as ProductCategory,
    price: Math.round(piece.priceMinor / 100),
    originalPrice: piece.originalPriceMinor
      ? Math.round(piece.originalPriceMinor / 100)
      : undefined,
    image: officialImg,
    isSoldOut: piece.status === "SOLD",
    size: piece.sizeLabel || "OS",
  };
}

/**
 * Fetch specific products by an array of IDs or slugs
 */
export async function findProductsByIdsOrSlugs(
  idList: string[]
): Promise<Product[]> {
  if (idList.length === 0) return [];

  const items: PrismaItemWithRelations[] = await prisma.item.findMany({
    where: {
      OR: [{ id: { in: idList } }, { slug: { in: idList } }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  return items.map((item: PrismaItemWithRelations) =>
    mapPrismaItemToProduct(item)
  );
}

/**
 * Query filtered, sorted, and paginated products for `/shop`
 */
export async function queryShopCatalogProducts(
  params: ProductFilterInput
): Promise<PaginatedResponse<Product>> {
  const where: Prisma.ItemWhereInput = {
    status: { in: ["AVAILABLE", "SOLD"] },
  };

  if (
    params.category &&
    params.category !== "All" &&
    params.category !== "New Arrivals"
  ) {
    const catLower = params.category.toLowerCase();
    if (catLower === "top" || catLower === "tops") {
      where.category = {
        name: {
          in: ["Tees", "Shirts", "Sweatshirt", "Knitwear", "Tops", "Top"],
          mode: "insensitive",
        },
      };
    } else if (catLower === "bottom" || catLower === "bottoms") {
      where.category = {
        name: {
          in: ["Bottoms", "Bottom", "Denim"],
          mode: "insensitive",
        },
      };
    } else if (catLower === "outerwear") {
      where.category = {
        name: {
          in: ["Outerwear", "Leather"],
          mode: "insensitive",
        },
      };
    } else {
      where.category = {
        name: {
          equals: params.category,
          mode: "insensitive",
        },
      };
    }
  } else if (params.category === "New Arrivals") {
    where.isNew = true;
  }

  if (params.sizes && params.sizes.length > 0) {
    where.OR = params.sizes.map((size: string) => ({
      sizeLabel: {
        contains: size,
        mode: "insensitive",
      },
    }));
  }

  if (
    typeof params.minPrice === "number" ||
    typeof params.maxPrice === "number"
  ) {
    where.priceMinor = {
      ...(typeof params.minPrice === "number"
        ? { gte: Math.round(params.minPrice * 100) }
        : {}),
      ...(typeof params.maxPrice === "number"
        ? { lte: Math.round(params.maxPrice * 100) }
        : {}),
    };
  }

  if (params.q && params.q.trim() !== "") {
    const q = params.q.trim();
    const searchCond: Prisma.ItemWhereInput = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { color: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
    where.AND = [searchCond];
  }

  let orderBy: Prisma.ItemOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "lo") {
    orderBy = { priceMinor: "asc" };
  } else if (params.sort === "hi") {
    orderBy = { priceMinor: "desc" };
  }

  const requestedPage = Math.max(1, params.page);

  if (requestedPage === 1) {
    const [total, rawItems] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy,
        skip: 0,
        take: params.pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
    const items = (rawItems as PrismaItemWithRelations[]).map(
      (item: PrismaItemWithRelations) => mapPrismaItemToProduct(item)
    );

    return {
      items,
      total,
      page: 1,
      pageSize: params.pageSize,
      totalPages,
    };
  }

  const total = await prisma.item.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const skip = (safePage - 1) * params.pageSize;

  const rawItems: PrismaItemWithRelations[] = await prisma.item.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy,
    skip,
    take: params.pageSize,
  });

  const items = rawItems.map((item: PrismaItemWithRelations) =>
    mapPrismaItemToProduct(item)
  );

  return {
    items,
    total,
    page: safePage,
    pageSize: params.pageSize,
    totalPages,
  };
}

/**
 * Fetch a single product by slug or ID, including sibling combo pieces
 */
export async function findProductDetailBySlug(
  slug: string
): Promise<Product | null> {
  const item: PrismaItemWithRelations | null = await prisma.item.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!item) return null;

  let comboPieces: ComboPiece[] | undefined;
  if (item.comboId) {
    const siblingItems: PrismaItemWithRelations[] = await prisma.item.findMany({
      where: {
        comboId: item.comboId,
        status: { in: ["AVAILABLE", "SOLD"] },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (siblingItems.length > 0) {
      const isCollectionItem =
        item.category?.name?.toLowerCase() === "collection";
      const filteredSiblings = isCollectionItem
        ? siblingItems.filter((s: PrismaItemWithRelations) => s.id !== item.id)
        : siblingItems;
      comboPieces = filteredSiblings.map(mapSiblingToComboPiece);
    }
  }

  return mapPrismaItemToProduct(item, comboPieces);
}

/**
 * Fetch up to 8 related products prioritizing the same category
 */
export async function findRelatedProductsBySlug(
  slug: string
): Promise<Product[]> {
  const currentItem: { id: string; categoryId: string } | null =
    await prisma.item.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      select: { id: true, categoryId: true },
    });

  if (!currentItem) return [];

  const sameCategoryItems: PrismaItemWithRelations[] =
    await prisma.item.findMany({
      where: {
        id: { not: currentItem.id },
        categoryId: currentItem.categoryId,
        status: { in: ["AVAILABLE", "SOLD"] },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

  let relatedItems: PrismaItemWithRelations[] = [...sameCategoryItems];

  if (relatedItems.length < 8) {
    const excludeIds = [
      currentItem.id,
      ...relatedItems.map((i: PrismaItemWithRelations) => i.id),
    ];
    const extraItems: PrismaItemWithRelations[] = await prisma.item.findMany({
      where: {
        id: { notIn: excludeIds },
        status: { in: ["AVAILABLE", "SOLD"] },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 8 - relatedItems.length,
    });
    relatedItems = [...relatedItems, ...extraItems];
  }

  return relatedItems.map((item: PrismaItemWithRelations) =>
    mapPrismaItemToProduct(item)
  );
}

/**
 * Fetch a product by its persistent `shareCode` (or fallback slug/id) for `/share/[code]`
 */
export async function findSharedProductByCode(
  code: string
): Promise<Product | null> {
  const item: PrismaItemWithRelations | null = await prisma.item.findFirst({
    where: {
      OR: [{ shareCode: code }, { slug: code }, { id: code }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!item) return null;

  let comboPieces: ComboPiece[] | undefined;
  if (item.comboId) {
    const siblingItems: PrismaItemWithRelations[] = await prisma.item.findMany({
      where: {
        comboId: item.comboId,
        id: { not: item.id },
        status: { in: ["AVAILABLE", "SOLD"] },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });
    if (siblingItems.length > 0) {
      comboPieces = siblingItems.map(mapSiblingToComboPiece);
    }
  }

  const product = mapPrismaItemToProduct(item, comboPieces);
  const allAvailableImages = [
    ...product.images,
    ...(product.temporaryImages || []),
  ];
  const effectiveSharedImages =
    product.sharedImages && product.sharedImages.length > 0
      ? product.sharedImages
      : allAvailableImages;

  return {
    ...product,
    shareCode: item.shareCode || code,
    sharedImages: effectiveSharedImages,
  };
}

/**
 * Fetch all products ordered by newest first for Admin Studio
 */
export async function findAllAdminProducts(): Promise<Product[]> {
  const items: PrismaItemWithRelations[] = await prisma.item.findMany({
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item: PrismaItemWithRelations) => {
    let comboPieces: ComboPiece[] | undefined;
    if (item.comboId) {
      const siblings = items.filter(
        (other: PrismaItemWithRelations) =>
          other.comboId === item.comboId && other.id !== item.id
      );
      if (siblings.length > 0) {
        comboPieces = siblings.map(mapSiblingToComboPiece);
      }
    }
    return mapPrismaItemToProduct(item, comboPieces);
  });
}

/**
 * Fetch up to 8 recently viewed products for an authenticated user from PostgreSQL
 */
export async function findUserRecentlyViewedInDb(
  userId: string,
  excludeId?: string
): Promise<Product[]> {
  const records: PrismaRecentlyViewedWithRelations[] =
    await prisma.recentlyViewed.findMany({
      where: {
        userId,
        ...(excludeId
          ? {
              item: {
                id: { not: excludeId },
                slug: { not: excludeId },
              },
            }
          : {}),
      },
      include: {
        item: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 8,
    });

  return records.map((r: PrismaRecentlyViewedWithRelations) =>
    mapPrismaItemToProduct(r.item)
  );
}

/**
 * Hydrate guest localStorage IDs/slugs into ordered Product objects from PostgreSQL
 */
export async function findGuestRecentlyViewedInDb(
  idList: string[]
): Promise<Product[]> {
  if (idList.length === 0) return [];

  const dbItems: PrismaItemWithRelations[] = await prisma.item.findMany({
    where: {
      OR: [{ id: { in: idList } }, { slug: { in: idList } }],
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  const mapped: Product[] = dbItems.map((i: PrismaItemWithRelations) =>
    mapPrismaItemToProduct(i)
  );

  // Preserve exact viewing order from idList
  return idList
    .map((key: string) =>
      mapped.find((p: Product) => String(p.id) === key || p.slug === key)
    )
    .filter((p): p is Product => Boolean(p));
}
