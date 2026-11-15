"use client";

import { Product } from "@/types";

interface SharedProductPhotoSheetProps {
  productName: string;
  curatedImages: string[];
  rawProduct: Product | null;
  onSelectPhoto: (index: number) => void;
}

export function SharedProductPhotoSheet({
  productName,
  curatedImages,
  rawProduct,
  onSelectPhoto,
}: SharedProductPhotoSheetProps) {
  if (curatedImages.length <= 1) return null;

  return (
    <section className="mt-20 pt-14 border-t line">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] tracking-[0.28em] uppercase mute mb-1.5">
            Detailed Visual Inspection
          </div>
          <h2 className="serif text-2xl md:text-3xl">
            Selected Archive Angles ({curatedImages.length})
          </h2>
        </div>
        <p className="text-xs mute">
          Tap any photograph to inspect in full-screen high resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {curatedImages.map((imgUrl, idx) => {
          const isTempPhoto =
            rawProduct?.temporaryImages?.includes(imgUrl) &&
            !rawProduct?.images?.includes(imgUrl);

          return (
            <button
              key={`${idx}-${imgUrl}`}
              type="button"
              onClick={() => onSelectPhoto(idx)}
              className="group relative aspect-[3/4] card border line overflow-hidden text-left"
            >
              <img
                src={imgUrl}
                alt={`${productName} — View ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/images/products/p1-01.jpg";
                }}
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-black/75 text-white text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 font-mono">
                  Angle {String(idx + 1).padStart(2, "0")}
                </span>
                {isTempPhoto && (
                  <span className="bg-white/90 text-black text-[9px] tracking-[0.18em] uppercase px-2 py-1 font-medium">
                    Raw Archive Shot
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
