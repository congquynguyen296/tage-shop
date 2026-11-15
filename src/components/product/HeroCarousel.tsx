"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HERO_SLIDES } from "@/config/catalog";
import { HeroSlide } from "@/types";

export interface HeroCarouselProps {
  slides?: HeroSlide[];
}

export function HeroCarousel({ slides = HERO_SLIDES }: HeroCarouselProps = {}) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (hovered || total === 0) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(id);
  }, [hovered, index, total]);

  const go = (next: number) => {
    if (total === 0) return;
    setIndex((next + total) % total);
  };

  if (total === 0) return null;

  return (
    <section
      className="relative w-full h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] min-h-[580px] overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: "transform 1.1s cubic-bezier(.77,0,.18,1)",
          }}
        >
          {slides.map((slide, k) => (
            <div key={slide.id} className="relative w-full shrink-0 h-full overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  transform: `scale(${index === k ? 1.05 : 1})`,
                  transition: "transform 7s ease-out",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-5 md:right-14 bottom-6 md:bottom-10 flex items-center gap-4 text-white drop-shadow-md text-xs tracking-[0.2em] z-10">
        <div className="flex gap-2">
          {slides.map((s, k) => (
            <button
              key={s.id}
              onClick={() => go(k)}
              aria-label={`Slide ${k + 1}`}
              className="relative h-[18px] w-10 flex items-center"
            >
              <span
                className="block w-full h-[2px] relative overflow-hidden bg-white/40"
              >
                {k === index && (
                  <span
                    key={`${index}-${hovered}`}
                    className="absolute inset-y-0 left-0 bg-white"
                    style={
                      hovered
                        ? { width: "100%" }
                        : { animation: "fill 5.5s linear forwards" }
                    }
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

