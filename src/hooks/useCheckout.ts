"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/service/auth/store";
import { useOrderStore } from "@/service/orders/store";
import { CheckoutFormInput, CheckoutFormSchema } from "@/service/orders/schema";
import { Order } from "@/types";
import {
  generateInstagramOrderMessage,
  getSafeProductImage,
  INSTAGRAM_DM_URL,
  shipFee,
} from "@/config/utils";

export function useCheckout() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discountAmount,
    discountedSubtotal,
    discountRate,
    couponCode,
    clearCart,
  } = useCart();

  const user = useAuthStore((s) => s.user);
  const addOrder = useOrderStore((s) => s.addOrder);

  const [form, setForm] = useState<CheckoutFormInput>({
    email: "",
    first: "",
    last: "",
    phone: "",
    addr: "",
    city: "",
    zip: "",
    country: "Vietnam",
    deliveryMethod: "std",
    paymentMethod: "online",
    card: "",
    exp: "",
    cvc: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Prefill from logged-in user & default address if available
  useEffect(() => {
    if (user) {
      const defAddr = user.addresses?.[0];
      setForm((prev) => ({
        ...prev,
        email: prev.email || user.email,
        first: prev.first || defAddr?.firstName || user.name,
        last: prev.last || defAddr?.lastName || "",
        phone: prev.phone || defAddr?.phone || "",
        addr: prev.addr || defAddr?.addressLine || "",
        city: prev.city || defAddr?.city || "",
        zip: prev.zip || defAddr?.postalCode || "",
        country: defAddr?.country || prev.country,
      }));
    }
  }, [user]);

  const shippingFee = shipFee(discountedSubtotal, form.deliveryMethod);
  const total = discountedSubtotal + shippingFee;

  const updateField = <K extends keyof CheckoutFormInput>(
    key: K,
    val: CheckoutFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePlaceOrder = async () => {
    const parsed = CheckoutFormSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = String(issue.path[0] || "form");
        if (!fieldErrors[pathKey]) {
          fieldErrors[pathKey] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const orderNumber = `TG-${Math.floor(100000 + Math.random() * 900000)}`;
      const fullAddress = [
        parsed.data.addr,
        parsed.data.city,
        parsed.data.zip,
        parsed.data.country,
      ]
        .filter(Boolean)
        .join(", ");

      const message = generateInstagramOrderMessage({
        orderNumber,
        items: items.map((i) => ({
          id: i.product.id,
          slug: i.product.slug,
          name: i.product.name,
          size: i.size,
          quantity: 1,
          price: i.product.price,
        })),
        subtotal,
        discountAmount,
        couponCode: couponCode || (discountRate > 0 ? "TAGE10" : undefined),
        shippingFee,
        total,
        customerName: `${parsed.data.first} ${parsed.data.last}`.trim(),
        customerPhone: parsed.data.phone,
        customerEmail: parsed.data.email,
        shippingAddress: fullAddress,
      });

      const createdOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customerEmail: parsed.data.email,
        customerName: `${parsed.data.first} ${parsed.data.last}`.trim(),
        shippingAddress: {
          id: `addr-${Date.now()}`,
          firstName: parsed.data.first,
          lastName: parsed.data.last,
          phone: parsed.data.phone || "",
          addressLine: parsed.data.addr,
          city: parsed.data.city,
          postalCode: parsed.data.zip || "",
          country: parsed.data.country,
        },
        deliveryMethod: parsed.data.deliveryMethod,
        paymentMethod: parsed.data.paymentMethod,
        status: "PENDING_PAYMENT",
        items: items.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          productSlug: c.product.slug,
          image: getSafeProductImage(c.product),
          color: c.product.color,
          size: c.size,
          price: c.product.price,
          qty: 1,
        })),
        subtotal,
        shippingFee,
        discount: discountAmount,
        total,
        createdAt: new Date().toISOString(),
      };

      addOrder(createdOrder, message);

      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message).catch(() => {});
      }

      window.open(INSTAGRAM_DM_URL, "_blank", "noopener,noreferrer");

      clearCart();
      router.push(`/checkout/success?order=${orderNumber}`);
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Failed to prepare order",
      });
      setSubmitting(false);
    }
  };

  return {
    form,
    errors,
    submitting,
    items,
    subtotal,
    discountAmount,
    discountedSubtotal,
    shippingFee,
    total,
    updateField,
    handlePlaceOrder,
  };
}

export type UseCheckoutReturn = ReturnType<typeof useCheckout>;
