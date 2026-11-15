"use client";

import { use } from "react";
import Link from "next/link";
import { Crumbs } from "@/components/ui/Crumbs";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductImageZoomModal } from "@/components/product/ProductImageZoomModal";
import { ProductDetailSkeleton } from "@/components/product/ProductSkeleton";
import { useProductDetail } from "@/hooks/useProductDetail";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const {
    product,
    loading,
    relatedProducts,
    loadingRelated,
    recentlyViewedProducts,
    loadingRecentlyViewed,
    imgIdx,
    setImgIdx,
    isZoomOpen,
    setIsZoomOpen,
  } = useProductDetail(slug);

  if (loading && !product) {
    return (
      <section className="w-full px-5 sm:px-8 md:px-12 lg:px-14 py-10">
        <div className="h-3.5 w-44 bg-neutral-200/70 animate-pulse mb-6" />
        <ProductDetailSkeleton />
      </section>
    );
  }

  if (!product) {
    return (
      <div className="py-32 text-center">
        <p className="mute text-sm mb-6">Product not found.</p>
        <Link href="/shop" className="btn">
          Back to shop
        </Link>
      </div>
    );
  }

  // Structured Data JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "TAGE",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: product.isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <section className="w-full px-5 sm:px-8 md:px-12 lg:px-14 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Crumbs items={[["Home", "/"], ["Shop", "/shop"], [product.name]]} />

      <div className="grid md:grid-cols-[1fr_460px] gap-8 md:gap-12 mt-6">
        <ProductGallery
          product={product}
          activeIndex={imgIdx}
          onSelectIndex={setImgIdx}
          onOpenZoom={() => setIsZoomOpen(true)}
        />
        <ProductInfo product={product} activeImageIndex={imgIdx} />
      </div>

      {/* Minimalist Image Zoom Modal */}
      <ProductImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        product={product}
        activeIndex={imgIdx}
      />

      {/* Related Products Carousel (fetched via /api/products/[slug]/related) */}
      <ProductCarousel
        title="You may also like"
        items={relatedProducts}
        loading={loadingRelated}
      />

      {/* Recently Viewed Carousel (DB for logged-in user, localStorage for Guest) */}
      <ProductCarousel
        title="Recently viewed"
        items={recentlyViewedProducts}
        loading={loadingRecentlyViewed}
      />
    </section>
  );
}
