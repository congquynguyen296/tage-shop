"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import { useCart } from "@/hooks/useCart";
import { useAuthSync } from "@/hooks/useAuthSync";

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, toastMessage } = useCart();
  const { user } = useAuthSync();

  const announcement =
    "TAGE FW26 DELIVERY 5: LIVE NOW — USE CODE TAGE10 FOR 10% OFF YOUR FIRST PURCHASE";

  // Dedicated minimal Cart & Checkout Header (logo on left, Continue Shopping on right)
  const isMinimalLayout =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname?.startsWith("/checkout");

  // Scroll parallax CSS variable (--sy) + IntersectionObserver for .rv elements
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const style = document.documentElement.style;
        style.setProperty("--sy", String(Math.min(y, 900)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );

    const scan = () => {
      document.querySelectorAll(".rv:not(.in)").forEach((el) => {
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  if (isMinimalLayout) {
    return (
      <header
        className="sticky top-0 z-30 border-b line"
        style={{
          background: "var(--bg)",
          paddingTop: "env(safe-area-inset-top,0px)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" aria-label="TAGE Home" className="flex items-center">
            <img
              src="/logo/tage_logo.png"
              alt="TAGE"
              className="h-12 md:h-16 w-auto object-contain py-1"
            />
          </Link>
          <Link
            href="/shop"
            className="text-xs tracking-[0.2em] uppercase mute hover:text-[color:var(--fg)] transition-colors"
          >
            Continue Shopping →
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Announcement marquee */}
      <div className="w-full card border-b line text-[11px] tracking-[0.25em] py-2 overflow-hidden">
        <div className="marquee">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="px-10 whitespace-nowrap">
              {announcement}
            </span>
          ))}
        </div>
      </div>

      {/* Sticky Header (Full width layout with Logo on left) */}
      <header
        className="sticky top-0 z-30 border-b line"
        style={{
          background: "var(--bg)",
          paddingTop: "env(safe-area-inset-top,0px)",
        }}
      >
        <div className="w-full px-5 sm:px-8 md:px-12 lg:px-14 h-16 md:h-20 flex items-center justify-between">
          {/* Logo on the Left */}
          <Link
            href="/"
            className="flex items-center"
            aria-label="TAGE Home"
          >
            <img
              src="/logo/tage_logo.png"
              alt="TAGE"
              className="h-12 md:h-16 w-auto object-contain py-1"
            />
          </Link>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1 sm:gap-2 -mr-2.5">
            {(user?.role === "admin" || user?.role === "ADMIN") && (
              <Link
                className="ul text-[11px] px-2.5 py-1 bg-[color:var(--accent)] text-white tracking-widest uppercase mr-2 hidden sm:inline-block"
                href="/admin"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hic"
            >
              {Icons.search}
            </button>
            <Link
              href="/account"
              aria-label={user ? `Account: ${user.name}` : "Account"}
              className="hic"
            >
              {Icons.user}
              {user && <span className="dot" />}
            </Link>
            <Link
              id="header-cart-icon"
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="hic relative"
            >
              {Icons.bag}
              {count > 0 && (
                <span key={count} className="badge">
                  {count}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="md:hidden hic ml-1"
            >
              {Icons.menu}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

