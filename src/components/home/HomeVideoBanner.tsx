"use client";

import { useEffect, useRef } from "react";

export function HomeVideoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  return (
    <section className="relative w-full h-[60vh] min-h-[420px] md:h-[75vh] overflow-hidden border-t line bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/home-poster.jpg"
        className="w-full h-full object-cover object-center"
      >
        <source src="/videos/home.mp4" type="video/mp4" />
        <source src="/videos/home.mov" type="video/mp4" />
        <source src="/videos/home.mov" type="video/quicktime" />
        Your browser does not support the video tag.
      </video>
    </section>
  );
}

