"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  money,
  INSTAGRAM_DM_URL,
  INSTAGRAM_HANDLE,
  generateInstagramOrderMessage,
} from "@/config/utils";
import { useOrderStore } from "@/service/orders/store";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("order");
  const lastPlacedOrder = useOrderStore((s) => s.lastPlacedOrder);
  const lastInstagramMessage = useOrderStore((s) => s.lastInstagramMessage);
  const orders = useOrderStore((s) => s.orders);
  const [copied, setCopied] = useState(false);

  const matchedOrder =
    orders.find((o) => o.orderNumber === orderNumberParam) || lastPlacedOrder;

  const displayMessage =
    lastInstagramMessage ||
    (matchedOrder
      ? generateInstagramOrderMessage({
          orderNumber: matchedOrder.orderNumber,
          items: matchedOrder.items.map((item) => ({
            slug: item.productSlug,
            name: item.productName,
            size: item.size,
            quantity: item.qty,
            price: item.price,
          })),
          subtotal: matchedOrder.subtotal,
          discountAmount: matchedOrder.discount,
          shippingFee: matchedOrder.shippingFee,
          total: matchedOrder.total,
          customerName: matchedOrder.customerName,
          customerPhone: matchedOrder.shippingAddress.phone,
          customerEmail: matchedOrder.customerEmail,
          shippingAddress: `${matchedOrder.shippingAddress.addressLine}, ${matchedOrder.shippingAddress.city}`,
        })
      : "");

  const handleCopyMessage = async () => {
    if (!displayMessage) return;
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(displayMessage).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  };

  return (
    <section className="max-w-xl mx-auto px-5 py-20 md:py-24">
      <div className="text-center">
        <div className="text-[11px] tracking-[0.3em] uppercase mute mb-3">
          Instagram Direct Concierge
        </div>
        <h1 className="serif text-4xl mb-3">Order Ready to Send</h1>
        {matchedOrder ? (
          <p className="text-sm mute mb-6">
            Reference <span className="text-[color:var(--fg)] font-medium">{matchedOrder.orderNumber}</span> ·{" "}
            <span className="text-[color:var(--fg)] font-medium">{money(matchedOrder.total)}</span>
          </p>
        ) : (
          <p className="text-sm mute mb-6">
            Reference {orderNumberParam || "TG-DIRECT"} is ready.
          </p>
        )}
      </div>

      {/* Step-by-step instructions & message box */}
      <div className="border line bg-[color:var(--card)] p-5 md:p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] tracking-[0.2em] uppercase mute">
            Your Order Message (Copied to Clipboard)
          </span>
          {displayMessage && (
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] tracking-[0.18em] uppercase underline hover:opacity-70 transition-opacity"
            >
              {copied ? "✓ Copied" : "Copy Again"}
            </button>
          )}
        </div>

        {displayMessage && (
          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono bg-[color:var(--bg)] border line p-4 max-h-64 overflow-y-auto select-all">
            {displayMessage}
          </pre>
        )}

        <p className="text-xs mute mt-4 leading-relaxed">
          Paste and send this message to{" "}
          <span className="text-[color:var(--fg)] font-medium">{INSTAGRAM_HANDLE}</span>{" "}
          on Instagram Direct to finalize availability and payment for your 1-of-1 piece(s).
        </p>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCopyMessage}
          className="btn"
        >
          Open Instagram Direct →
        </a>
        <Link
          href="/shop"
          className="border border-current text-xs tracking-[0.25em] uppercase px-7 py-3.5 hover:bg-neutral-100 transition-colors"
        >
          Keep shopping
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-28 text-center text-xs tracking-[0.2em] uppercase mute">
          Loading confirmation...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
