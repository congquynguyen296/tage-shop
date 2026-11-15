"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductImageZoomModal } from "@/components/product/ProductImageZoomModal";
import { ProductDetailSkeleton } from "@/components/product/ProductSkeleton";
import { SharedProductInfo } from "@/components/product/SharedProductInfo";
import { SharedProductPhotoSheet } from "@/components/product/SharedProductPhotoSheet";
import { useSharedProduct } from "@/hooks/useSharedProduct";

export default function ShareProductPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const {
    product,
    rawProduct,
    curatedImages,
    loading,
    activeImageIndex,
    setActiveImageIndex,
    zoomOpen,
    setZoomOpen,
    handleContactInstagram,
    handleSelectPhotoZoom,
  } = useSharedProduct(code);

  if (loading && !product) {
    return (
      <section className="w-full px-5 sm:px-8 md:px-12 lg:px-14 py-10">
        <ProductDetailSkeleton />
      </section>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <section className="w-full px-5 sm:px-8 md:px-12 lg:px-14 py-10">
      {/* Main Split View: Gallery + Product Details & Instagram Purchase Action */}
      <div className="grid md:grid-cols-[1fr_460px] gap-8 md:gap-12">
        <ProductGallery
          product={product}
          activeIndex={activeImageIndex}
          onSelectIndex={setActiveImageIndex}
          onOpenZoom={() => setZoomOpen(true)}
        />
        <SharedProductInfo
          product={product}
          curatedCount={curatedImages.length}
          onContactInstagram={handleContactInstagram}
        />
      </div>

      {/* Full Curated Photo Sheet */}
      <SharedProductPhotoSheet
        productName={product.name}
        curatedImages={curatedImages}
        rawProduct={rawProduct}
        onSelectPhoto={handleSelectPhotoZoom}
      />

      {/* Lightbox Zoom Modal */}
      <ProductImageZoomModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        product={product}
        activeIndex={activeImageIndex}
      />
    </section>
  );
}
