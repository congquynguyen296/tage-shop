"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INSTAGRAM_SHOP_URL } from "@/config/utils";

const FOOTER_COLUMNS: Array<[string, Array<[string, string]>]> = [
  [
    "Shop",
    [
      ["Top", "/shop?category=Top"],
      ["Bottom", "/shop?category=Bottom"],
      ["Outerwear", "/shop?category=Outerwear"],
      ["New Arrivals", "/shop?category=New+Arrivals"],
    ],
  ],
  [
    "Client Services",
    [
      ["All Collections", "/shop"],
      ["Shopping Bag", "/cart"],
      ["My Account", "/account"],
      ["About TAGE", "/#about"],
    ],
  ],
  [
    "Connect",
    [
      ["Instagram Direct", INSTAGRAM_SHOP_URL],
      ["Facebook", "https://facebook.com"],
      ["TikTok", "https://tiktok.com"],
    ],
  ],
];

export function Footer() {
  const pathname = usePathname();

  // Hide footer completely on Cart and Checkout pages as requested
  if (
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname?.startsWith("/checkout")
  ) {
    return null;
  }

  return (
    <footer className="border-t line bg-[color:var(--bg)]">
      <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 py-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-block mb-4" aria-label="TAGE Home">
            <img
              src="/logo/tage_logo.png"
              alt="TAGE"
              className="h-16 md:h-20 w-auto object-contain"
            />
          </Link>
          <p className="mute max-w-[260px] leading-relaxed">
            Buying clothes isn't just buying clothes, it's buying happiness.
          </p>
        </div>
        {FOOTER_COLUMNS.map(([heading, links]) => (
          <div key={heading}>
            <div className="text-[11px] tracking-[0.3em] uppercase font-semibold mb-4 text-[color:var(--fg)]">
              {heading}
            </div>
            <ul className="space-y-2.5 mute">
              {links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("http") ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[color:var(--fg)] transition-colors"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-[color:var(--fg)] transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t line">
        <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 py-5 flex flex-wrap justify-between gap-3 text-xs mute">
          <span>© 2026 TAGE. All rights reserved.</span>
          <span>Privacy · Terms · International (USD $)</span>
        </div>
      </div>
    </footer>
  );
}
