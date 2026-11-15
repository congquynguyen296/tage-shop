"use client";

/**
 * Reusable Skeleton UI for a single ProductCard (`aspect-[3/4]` image + meta lines)
 */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div
        className="w-full bg-neutral-200/70 border border-neutral-200/60"
        style={{ aspectRatio: "3/4" }}
      />
      <div className="pt-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-2.5 w-16 bg-neutral-200/70" />
          <div className="h-2.5 w-10 bg-neutral-200/70" />
        </div>
        <div className="h-3.5 w-3/4 bg-neutral-200/80" />
        <div className="h-3.5 w-1/3 bg-neutral-200/70" />
      </div>
    </div>
  );
}

/**
 * Reusable Grid Skeleton for `/shop` catalog
 */
export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 sm:gap-x-8 md:gap-x-10 lg:gap-x-12 gap-y-12 sm:gap-y-16 md:gap-y-20">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Reusable Horizontal Carousel Skeleton for Related & Recently Viewed Products
 */
export function ProductCarouselSkeleton({
  title,
  count = 4,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="mt-24">
      <div className="flex items-end justify-between mb-8">
        <h2 className="serif text-2xl md:text-3xl">{title}</h2>
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-full bg-neutral-200/60 animate-pulse" />
          <div className="w-11 h-11 rounded-full bg-neutral-200/60 animate-pulse" />
        </div>
      </div>

      <div className="no-sb flex gap-6 sm:gap-8 overflow-x-hidden pb-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="cw shrink-0">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Reusable Full Product Detail Skeleton for `/product/[slug]` and `/share/[code]`
 */
export function ProductDetailSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="grid md:grid-cols-[1fr_460px] gap-8 md:gap-12">
        {/* Left: Product Gallery Skeleton */}
        <div className="grid md:grid-cols-[80px_1fr] gap-4">
          <div className="flex md:flex-col gap-3 order-2 md:order-1">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="w-16 md:w-full shrink-0 bg-neutral-200/70 border border-neutral-200/60"
                style={{ aspectRatio: "3/4" }}
              />
            ))}
          </div>
          <div
            className="w-full order-1 md:order-2 bg-neutral-200/70 border border-neutral-200/60"
            style={{ aspectRatio: "4/5" }}
          />
        </div>

        {/* Right: Product Info Skeleton */}
        <div className="space-y-6 pt-1">
          <div className="space-y-3">
            <div className="h-3 w-28 bg-neutral-200/70" />
            <div className="h-9 w-4/5 bg-neutral-200/80" />
            <div className="h-6 w-24 bg-neutral-200/75" />
          </div>

          <div className="pt-4 border-t line space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-neutral-200/70" />
              <div className="h-3 w-12 bg-neutral-200/70" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-neutral-200/70" />
              <div className="h-3 w-20 bg-neutral-200/70" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-neutral-200/70" />
              <div className="h-3 w-28 bg-neutral-200/70" />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="h-12 w-full bg-neutral-200/80" />
            <div className="h-12 w-full bg-neutral-200/60" />
          </div>

          <div className="pt-6 border-t line space-y-4">
            <div className="h-4 w-1/2 bg-neutral-200/70" />
            <div className="h-3 w-full bg-neutral-200/60" />
            <div className="h-3 w-5/6 bg-neutral-200/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Search Results Row Skeleton for `SearchOverlay`
 */
export function SearchProductRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y line animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 py-3 px-2">
          <div
            className="w-14 shrink-0 bg-neutral-200/70"
            style={{ aspectRatio: "3/4" }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 bg-neutral-200/80" />
            <div className="h-2.5 w-24 bg-neutral-200/60" />
          </div>
          <div className="h-3.5 w-14 bg-neutral-200/75" />
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable Cart Page Skeleton while cart hydration or `/api/cart` sync is in progress
 */
export function CartPageSkeleton() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 py-12 animate-pulse">
      <div className="h-10 w-32 bg-neutral-200/80 mb-8" />
      <div className="grid lg:grid-cols-[1fr_380px] gap-12">
        <div className="border-t line divide-y line">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="py-6 flex gap-5">
              <div
                className="w-24 sm:w-28 shrink-0 bg-neutral-200/70"
                style={{ aspectRatio: "3/4" }}
              />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 w-2/3 bg-neutral-200/80" />
                <div className="h-3 w-1/3 bg-neutral-200/60" />
                <div className="h-4 w-20 bg-neutral-200/70 mt-4" />
              </div>
            </div>
          ))}
        </div>

        <aside className="card p-6 border line space-y-4 self-start">
          <div className="h-3.5 w-32 bg-neutral-200/80 mb-4" />
          <div className="h-9 w-full bg-neutral-200/60" />
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-neutral-200/70" />
              <div className="h-3 w-16 bg-neutral-200/70" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-neutral-200/70" />
              <div className="h-3 w-14 bg-neutral-200/70" />
            </div>
          </div>
          <div className="h-11 w-full bg-neutral-200/80 mt-4" />
          <div className="h-11 w-full bg-neutral-200/60" />
        </aside>
      </div>
    </section>
  );
}

/**
 * Reusable Admin Products Table Skeleton rows while `GET /api/admin/products` is loading
 */
export function AdminProductsTableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="animate-pulse">
          <td className="p-4 flex items-center gap-3">
            <div className="w-12 h-14 shrink-0 bg-neutral-200/70 border line" />
            <div className="space-y-2">
              <div className="h-3.5 w-40 bg-neutral-200/80" />
              <div className="h-2.5 w-24 bg-neutral-200/60" />
            </div>
          </td>
          <td className="p-4">
            <div className="h-5 w-20 bg-neutral-200/70" />
          </td>
          <td className="p-4 space-y-1.5">
            <div className="h-3.5 w-14 bg-neutral-200/80" />
            <div className="h-2.5 w-16 bg-neutral-200/60" />
          </td>
          <td className="p-4">
            <div className="h-5 w-28 bg-neutral-200/70" />
          </td>
          <td className="p-4">
            <div className="h-3.5 w-20 bg-neutral-200/70" />
          </td>
          <td className="p-4 text-right">
            <div className="h-7 w-7 bg-neutral-200/70 inline-block" />
          </td>
        </tr>
      ))}
    </>
  );
}
