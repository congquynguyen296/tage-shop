"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function NewsletterSection() {
  const pathname = usePathname();
  const [mail, setMail] = useState("");
  const [done, setDone] = useState(false);

  // Hide on Home (which has its own split newsletter block), Cart, Checkout, and Share pages
  if (
    pathname === "/" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/share")
  ) {
    return null;
  }

  return (
    <section className="border-t line">
      <div className="max-w-xl mx-auto px-5 py-14 md:py-20 text-center rv in">
        <div className="text-[11px] tracking-[0.3em] uppercase mute mb-3">
          Stay Connected
        </div>
        <h2 className="serif text-3xl md:text-4xl mb-3">Stay in the TAGE Edit</h2>
        <p className="mute text-sm mb-8">
          New deliveries, seasonal editorials and 10% off your first purchase.
        </p>
        {done ? (
          <p className="text-sm">Thank you — you’re on the TAGE list.</p>
        ) : (
          <div className="flex border-b border-current">
            <input
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="flex-1 min-w-0 bg-transparent py-3 outline-none text-sm placeholder:text-[color:var(--mute)]"
            />
            <button
              onClick={() => mail.includes("@") && setDone(true)}
              className="text-xs tracking-[0.25em] uppercase px-2"
            >
              Subscribe →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
