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

export const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22800%22%20viewBox%3D%220%200%20600%20800%22%3E%3Crect%20width%3D%22600%22%20height%3D%22800%22%20fill%3D%22%23ebebeb%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2248%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23888888%22%20font-family%3D%22serif%22%20font-size%3D%2224%22%20letter-spacing%3D%226%22%3ETAGE%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2253%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22monospace%22%20font-size%3D%2211%22%20letter-spacing%3D%222%22%3ENO%20IMAGE%3C%2Ftext%3E%3C%2Fsvg%3E";

let imageErrorNotifier: ((msg: string) => void) | null = null;
let lastImageErrorToastAt = 0;

export function registerImageErrorNotifier(fn: (msg: string) => void): void {
  imageErrorNotifier = fn;
}

/**
 * Safely handles broken/404 product images without ever causing an infinite request loop,
 * and triggers a throttled toast notification.
 */
export function handleProductImageError(e: {
  currentTarget: HTMLImageElement;
}): void {
  const img = e.currentTarget;
  if (!img) return;

  // Prevent infinite onError loop
  img.onerror = null;
  if (img.dataset.fallbackApplied === "true") {
    return;
  }
  const failedSrc = img.getAttribute("src") || "";
  img.dataset.fallbackApplied = "true";
  img.src = DEFAULT_PRODUCT_IMAGE;

  const now = Date.now();
  if (imageErrorNotifier && now - lastImageErrorToastAt > 2500) {
    lastImageErrorToastAt = now;
    const shortName = failedSrc.split("/").pop() || "image";
    imageErrorNotifier(`Image not found: ${shortName}`);
  }
}

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
  if (
    typeof raw === "string" &&
    raw.trim().length > 0 &&
    raw.trim() !== "/images/products/p1-01.jpg"
  ) {
    const cleaned = raw.trim().replace(/^\/?asset\/images\//, "/images/");
    if (
      cleaned.startsWith("/images/") ||
      cleaned.startsWith("https://") ||
      cleaned.startsWith("http://") ||
      cleaned.startsWith("data:image/") ||
      cleaned.startsWith("blob:")
    ) {
      return cleaned;
    }
  }
  return DEFAULT_PRODUCT_IMAGE;
}

