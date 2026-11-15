"use client";

import Link from "next/link";

export function HomeNavStrip() {
  return (
    <nav
      aria-label="Home Navigation"
      className="w-full border-y line bg-[color:var(--bg)] px-5 sm:px-8 md:px-12 lg:px-14 py-5 md:py-6 flex items-center justify-start gap-5 sm:gap-7 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-medium"
    >
      <Link href="/shop" className="ul transition-colors hover:text-black">
        Shop
      </Link>
      <Link
        href="/shop?category=New%20Arrivals"
        className="ul transition-colors hover:text-black"
      >
        New Arrivals
      </Link>
      <Link href="/#about" className="ul transition-colors hover:text-black">
        About
      </Link>
    </nav>
  );
}
