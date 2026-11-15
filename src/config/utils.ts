export const SITE_NAME = "TAGE";
export const FREE_SHIPPING_THRESHOLD = 999999;
export const STANDARD_SHIPPING_FEE = 35;
export const EXPRESS_SHIPPING_FEE = 35;

export function money(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function shipFee(subtotal: number, method: "std" | "exp" = "std"): number {
  return STANDARD_SHIPPING_FEE;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Utility delay helper
 */
export function delay(ms: number = 2000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DEFAULT_PRODUCT_IMAGE = "/images/products/p1-01.jpg";

export const INSTAGRAM_SHOP_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
  "https://www.instagram.com/tage.fromthepast/";
export const INSTAGRAM_DM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_DM_URL ||
  "https://ig.me/m/tage.fromthepast";
export const INSTAGRAM_HANDLE = "@tage.fromthepast";

export function generateInstagramProductShareMessage(options: {
  name: string;
  slug: string;
  size?: string;
  color?: string;
  price: number;
  shareUrl?: string;
}): string {
  const { name, slug, size, color, price, shareUrl } = options;
  let msg = `Hi TAGE! I just viewed the private archive showcase and would like to purchase this 1-of-1 piece:\n\n`;
  msg += `• Piece: ${name}${size ? ` (Size: ${size})` : ""}${
    color ? ` — ${color}` : ""
  }\n`;
  msg += `• Ref: [${slug}]\n`;
  msg += `• Price: ${money(price)}\n`;
  if (shareUrl) {
    msg += `• Showcase Link: ${shareUrl}\n`;
  }
  msg += `\nPlease let me know if this piece is still available and share the payment details. Thank you!`;
  return msg;
}

export interface OrderItemSummary {
  id?: number | string;
  slug?: string;
  name: string;
  size?: string;
  quantity: number;
  price: number;
}

export function generateInstagramOrderMessage(options: {
  orderNumber?: string;
  items: OrderItemSummary[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  shippingFee: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
}): string {
  const {
    orderNumber,
    items,
    subtotal,
    discountAmount = 0,
    couponCode,
    shippingFee,
    total,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
  } = options;

  let msg = `Hi TAGE Studio! I would like to order the following 1-of-1 piece(s)${
    orderNumber ? ` [Ref: ${orderNumber}]` : ""
  }:\n\n`;

  items.forEach((item, idx) => {
    const pieceRef = item.slug ? ` [${item.slug}]` : "";
    msg += `${idx + 1}. ${item.name}${
      item.size ? ` (Size: ${item.size})` : ""
    }${pieceRef} — ${money(item.price * item.quantity)}\n`;
  });

  msg += `\nSubtotal: ${money(subtotal)}`;
  if (discountAmount > 0) {
    msg += `\nDiscount${couponCode ? ` (${couponCode})` : ""}: -${money(
      discountAmount
    )}`;
  }
  msg += `\nShipping: ${shippingFee === 0 ? "Free" : money(shippingFee)}`;
  msg += `\nTotal: ${money(total)}\n`;

  if (customerName || customerPhone || customerEmail || shippingAddress) {
    msg += `\n— Delivery Information —`;
    if (customerName) msg += `\nRecipient: ${customerName}`;
    if (customerPhone) msg += `\nPhone: ${customerPhone}`;
    if (customerEmail) msg += `\nEmail: ${customerEmail}`;
    if (shippingAddress) msg += `\nAddress: ${shippingAddress}`;
    msg += `\n`;
  }

  msg += `\nPlease confirm piece availability and payment details. Thank you!`;
  return msg;
}

/**
 * Returns a valid, safe image path for any product.
 * Handles missing images, undefined values, legacy /asset/ prefixes, and fallbacks.
 */
export function getSafeProductImage(
  product?: { images?: string[]; id?: number | string } | null,
  index: number = 0
): string {
  if (!product) return DEFAULT_PRODUCT_IMAGE;
  const raw = product.images?.[index] || product.images?.[0];
  if (typeof raw === "string" && raw.trim().length > 0) {
    const cleaned = raw.replace(/^\/?asset\/images\//, "/images/");
    if (cleaned.startsWith("/images/")) {
      return cleaned;
    }
  }
  return DEFAULT_PRODUCT_IMAGE;
}

