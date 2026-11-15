"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface HomeEditorialTileProps {
  href: string;
  image: string;
  alt: string;
  subtitle: string;
  title: string;
  description: string;
  ctaText: string;
  borderLeft?: boolean;
}

export function HomeEditorialTile({
  href,
  image,
  alt,
  subtitle,
  title,
  description,
  ctaText,
  borderLeft = false,
}: HomeEditorialTileProps) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use IntersectionObserver with a balanced threshold to trigger smooth entrance
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={containerRef}
      href={href}
      className={`group relative w-full h-[50vh] md:h-full overflow-hidden block ${
        borderLeft ? "border-t md:border-t-0 md:border-l line" : ""
      }`}
    >
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors duration-500" />

      {/* Center text container with smooth scroll-triggered entrance animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none select-none">
        {/* Subtitle */}
        <span
          className={`text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/80 font-light mb-2 transition-all duration-700 ease-out ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          {subtitle}
        </span>

        {/* Headline */}
        <h2
          className={`serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-[0.25em] uppercase font-light drop-shadow-sm transition-all duration-700 ease-out ${
            isInView
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
          style={{ transitionDelay: "240ms" }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className={`text-xs sm:text-sm text-white/85 font-light tracking-[0.15em] mt-2.5 max-w-sm transition-all duration-700 ease-out ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "360ms" }}
        >
          {description}
        </p>

        {/* CTA link button */}
        <span
          className={`mt-5 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-white border-b border-white/60 pb-0.5 group-hover:border-white transition-all duration-700 ease-out ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "480ms" }}
        >
          {ctaText} →
        </span>
      </div>
    </Link>
  );
}

