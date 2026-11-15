import "server-only";
import { ComboPiece, Product, ProductCategory } from "@/types";

export interface PrismaItemImageRecord {
  id: string;
  url: string;
  sortOrder: number;
  isTemporary?: boolean;
}

export interface PrismaItemWithRelations {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  priceMinor: number;
  originalPriceMinor?: number | null;
  costMinor?: number | null;
  sizeLabel?: string | null;
  color?: string | null;
  status: string;
  isNew?: boolean;
  comboId?: string | null;
  comboTitle?: string | null;
  shareCode?: string | null;
  sharedImages?: string[];
  createdAt: Date;
  category?: { id: string; name: string } | null;
  images: PrismaItemImageRecord[];
}

export interface PrismaCartItemWithRelations {
  id: string;
  userId: string;
  itemId: string;
  createdAt: Date;
  item: PrismaItemWithRelations;
}

export interface PrismaRecentlyViewedWithRelations {
  id: string;
  userId: string;
  itemId: string;
  viewedAt: Date;
  item: PrismaItemWithRelations;
}

export function mapPrismaItemToProduct(
  item: PrismaItemWithRelations,
  comboItems?: ComboPiece[]
): Product {
  const officialImages = (item.images || [])
    .filter((img) => !img.isTemporary)
    .map((img) => img.url);
  const temporaryImages = (item.images || [])
    .filter((img) => img.isTemporary)
    .map((img) => img.url);

  const images =
    officialImages.length > 0 ? officialImages : ["/images/products/p1-01.jpg"];

  const sizeGroup = item.sizeLabel
    ? item.sizeLabel.split(",").map((s) => s.trim()).filter(Boolean)
    : ["M"];
  const primarySize = sizeGroup[0] || "OS";
  const isSoldOut = item.status === "SOLD";
  const price = Math.round(item.priceMinor / 100);
  const originalPrice = item.originalPriceMinor
    ? Math.round(item.originalPriceMinor / 100)
    : undefined;

  return {
    id: item.id,
    slug: item.slug,
    name: item.title,
    color: item.color || "Standard",
    colorHex: "#111111",
    price,
    originalPrice,
    costPrice: item.costMinor ? Math.round(item.costMinor / 100) : undefined,
    category: (item.category?.name || "Outerwear") as ProductCategory,
    sizes: sizeGroup,
    images,
    temporaryImages,
    shareCode: item.shareCode || undefined,
    sharedImages:
      item.sharedImages && item.sharedImages.length > 0
        ? item.sharedImages
        : undefined,
    isNew: item.isNew ?? true,
    isSale: Boolean(originalPrice && originalPrice > price),
    isSoldOut,
    comboId: item.comboId || undefined,
    comboTitle: item.comboTitle || undefined,
    comboItems,
    description: item.description,
    shippingAndReturns:
      "Flat rate shipping of $35. Returns are accepted only if the item arrives with incorrect measurements compared to the description, or color discrepancies compared to product photos. Return requests must be initiated within 7 days of delivery.",
    variants: [
      {
        id: `var-${item.id}`,
        sku: item.sku,
        size: primarySize,
        color: item.color || "Standard",
        colorHex: "#111111",
        stock: isSoldOut ? 0 : 1,
        price,
      },
    ],
    createdAt: item.createdAt.toISOString(),
  };
}
