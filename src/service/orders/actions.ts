import { shipFee } from "@/config/utils";
import { ApiResponse, CartItem, Order, OrderStatus } from "@/types";
import { CheckoutFormInput, CheckoutFormSchema } from "./schema";

/**
 * Validates checkout form with Zod and builds local reference order before Instagram DM redirect
 */
export async function submitOrderAction(
  rawForm: CheckoutFormInput,
  cartItems: CartItem[],
  discountRate: number = 0,
  onOrderCreated?: (order: Order) => void
): Promise<ApiResponse<Order>> {
  const form = CheckoutFormSchema.parse(rawForm);

  if (!cartItems.length) {
    throw new Error("Your cart is empty");
  }

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.qty,
    0
  );
  const discount = Math.round(subtotal * discountRate);
  const fee = shipFee(subtotal - discount, form.deliveryMethod);
  const total = subtotal - discount + fee;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: `TG-${Math.floor(100000 + Math.random() * 900000)}`,
    customerEmail: form.email,
    customerName: `${form.first} ${form.last}`.trim(),
    shippingAddress: {
      id: `addr-${Date.now()}`,
      firstName: form.first,
      lastName: form.last,
      phone: form.phone || "",
      addressLine: form.addr,
      city: form.city,
      postalCode: form.zip,
      country: form.country,
    },
    deliveryMethod: form.deliveryMethod,
    paymentMethod: form.paymentMethod,
    status: form.paymentMethod === "online" ? "PAID" : "PENDING_PAYMENT",
    items: cartItems.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      productSlug: i.product.slug,
      image: i.product.images[0],
      color: i.color,
      size: i.size,
      price: i.product.price,
      qty: i.qty,
    })),
    subtotal,
    shippingFee: fee,
    discount,
    total,
    createdAt: new Date().toISOString(),
  };

  onOrderCreated?.(newOrder);

  return {
    success: true,
    data: newOrder,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Updates order status from Admin dashboard
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  onUpdated?: () => void
): Promise<ApiResponse<{ orderId: string; status: OrderStatus }>> {
  onUpdated?.();
  return {
    success: true,
    data: { orderId, status },
    timestamp: new Date().toISOString(),
  };
}
