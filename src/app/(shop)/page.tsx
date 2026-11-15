"use client";

import { HeroCarousel } from "@/components/product/HeroCarousel";
import { HomeNavStrip } from "@/components/home/HomeNavStrip";
import { HomeEditorialTile } from "@/components/home/HomeEditorialTile";
import { HomeVideoBanner } from "@/components/home/HomeVideoBanner";
import { HomeStoreInfoSection } from "@/components/home/HomeStoreInfoSection";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col">
      {/* Hero Header Carousel */}
      <HeroCarousel />

      {/* Primary Navigation Row: SHOP · NEW ARRIVALS · ABOUT */}
      <HomeNavStrip />

      {/* SECTION 1: Fullscreen Split (TOP & BOTTOM) */}
      <section className="relative w-full min-h-[90vh] md:h-screen grid grid-cols-1 md:grid-cols-2 border-t line">
        <HomeEditorialTile
          href="/shop?category=Top"
          image="/images/home/home-top.jpg"
          alt="TOP Collection"
          subtitle="Collection · Tops"
          title="The Top Edit"
          description="Tees, Raglan & Longsleeve Shirt"
          ctaText="Explore Tops"
        />
        <HomeEditorialTile
          href="/shop?category=Bottom"
          image="/images/home/home-bottom.jpg"
          alt="BOTTOM Collection"
          subtitle="Collection · Bottoms"
          title="The Bottom Edit"
          description="Levi’s Jeans, Work Pants & Shorts"
          ctaText="Explore Bottoms"
          borderLeft
        />
      </section>

      {/* SECTION 2: Split 2 (OUTERWEAR & NEW ARRIVALS) */}
      <section className="relative w-full min-h-[75vh] md:h-[85vh] grid grid-cols-1 md:grid-cols-2 border-t line">
        <HomeEditorialTile
          href="/shop?category=Outerwear"
          image="/images/home/home-outerwear.webp"
          alt="OUTERWEAR Collection"
          subtitle="Structured Layering"
          title="Outerwear"
          description="Sweatshirt, Hoodie & Denim Jacket"
          ctaText="Explore Outerwear"
        />
        <HomeEditorialTile
          href="/shop?category=New%20Arrivals"
          image="/images/home/home-newarrival.jpg"
          alt="NEW ARRIVALS"
          subtitle="Just Added"
          title="New Arrivals"
          description="Our latest release"
          ctaText="View Now"
          borderLeft
        />
      </section>

      {/* SECTION 3: Editorial Video Area */}
      <HomeVideoBanner />

      {/* SECTION 4: Split Section (Stay Connected & Store Information) */}
      <HomeStoreInfoSection />
    </div>
  );
}
