"use client";

import { useState } from "react";
import Link from "next/link";
import {
  money,
  INSTAGRAM_DM_URL,
  INSTAGRAM_HANDLE,
  generateInstagramOrderMessage,
} from "@/config/utils";
import { toast } from "@/service/ui/store";
import { useCart } from "@/hooks/useCart";

export function CartSummary() {
  const {
    items,
    subtotal,
    discountAmount,
    discountedSubtotal,
    standardShipping,
    amountLeftForFreeShipping,
    couponCode,
    applyCoupon,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyCoupon(promoInput);
    setPromoMsg(res.message);
  };

  const handleCheckoutInstagram = () => {
    if (!items.length) return;

    const message = generateInstagramOrderMessage({
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
      couponCode: couponCode || undefined,
      shippingFee: standardShipping,
      total: discountedSubtotal + standardShipping,
    });

    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
      setCopied(true);
      toast.success("Order summary copied to clipboard");
      setTimeout(() => setCopied(false), 6000);
    }

    window.open(INSTAGRAM_DM_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <aside className="card p-6 self-start text-sm">
      <h2 className="text-xs tracking-[0.25em] uppercase mb-5">Order summary</h2>
      {amountLeftForFreeShipping > 0 ? (
        <p className="mute text-xs mb-4">
          Add {money(amountLeftForFreeShipping)} more for free shipping.
        </p>
      ) : (
        <p className="text-xs mb-4">You’ve unlocked free shipping.</p>
      )}

      {/* Promo Code Input */}
      <div className="mb-5 pb-4 border-b line">
        <div className="flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="Promo code (e.g. TAGE10)"
            className="flex-1 bg-transparent border line px-3 py-2 text-xs outline-none uppercase"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="px-3 py-2 border line text-[11px] tracking-[0.15em] uppercase hover:bg-[color:var(--accent)] hover:text-white transition-colors"
          >
            Apply
          </button>
        </div>
        {promoMsg && <p className="text-xs mute mt-1.5">{promoMsg}</p>}
      </div>

      <div className="flex justify-between py-1">
        <span>Subtotal</span>
        <span>{money(subtotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between py-1 text-emerald-700">
          <span>Discount ({couponCode})</span>
          <span>−{money(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between py-1">
        <span>Shipping</span>
        <span>{standardShipping ? money(standardShipping) : "Free"}</span>
      </div>
      <div className="flex justify-between py-3 mt-2 border-t line text-base">
        <span>Total</span>
        <span>{money(discountedSubtotal + standardShipping)}</span>
      </div>

      {/* MVP Instagram Direct Checkout */}
      <button
        type="button"
        onClick={handleCheckoutInstagram}
        className="btn w-full block mt-3 text-center"
      >
        Quick Order via Instagram
      </button>

      {copied && (
        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 mt-2 text-center">
          ✓ Order summary copied to clipboard! Paste &amp; send it to {INSTAGRAM_HANDLE} on Instagram.
        </p>
      )}

      <Link
        href="/checkout"
        className="block text-center text-xs tracking-wider uppercase border border-[color:var(--fg)] py-3.5 mt-2 hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)] transition-colors"
      >
        Include Delivery Address & Order →
      </Link>

      <Link
        href="/shop"
        className="block text-center text-xs tracking-wider uppercase mute py-3 mt-1 hover:text-[color:var(--fg)] transition-colors"
      >
        Continue shopping →
      </Link>
    </aside>
  );
}

