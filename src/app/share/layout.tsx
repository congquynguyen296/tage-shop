import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { STOREFRONT_LOCKED } from "@/config/routes";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header: Logo only (no announcement marquee, no search/user/cart icons) */}
      <header
        className="sticky top-0 z-30 border-b line"
        style={{
          background: "var(--bg)",
          paddingTop: "env(safe-area-inset-top,0px)",
        }}
      >
        <div className="w-full px-5 sm:px-8 md:px-12 lg:px-14 h-16 md:h-20 flex items-center justify-center">
          {STOREFRONT_LOCKED ? (
            <div className="flex items-center select-none" aria-label="TAGE">
              <img
                src="/logo/tage_logo.png"
                alt="TAGE"
                className="h-12 md:h-16 w-auto object-contain py-1"
              />
            </div>
          ) : (
            <Link href="/" aria-label="TAGE Home" className="flex items-center">
              <img
                src="/logo/tage_logo.png"
                alt="TAGE"
                className="h-12 md:h-16 w-auto object-contain py-1"
              />
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 page">{children}</main>

      {/* Clean Footer without the "Stay Connected / Stay in the TAGE Edit" section */}
      <Footer />
    </div>
  );
}
