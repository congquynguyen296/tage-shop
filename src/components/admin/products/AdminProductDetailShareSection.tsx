"use client";

import { useRef } from "react";
import Link from "next/link";
import { handleProductImageError } from "@/config/utils";
import { UploadMediaZone } from "@/service/products/schema";

interface AdminProductDetailShareSectionProps {
  officialImages: string[];
  tempImages: string[];
  selectedShareImages: string[];
  savedShareCode?: string;
  shareUrl: string;
  copiedShare: boolean;
  shareErrorMsg: string;
  isSavingShare: boolean;
  isUploadingTemp: boolean;
  newQuickTempUrl: string;
  onChangeQuickTempUrl: (val: string) => void;
  onAddQuickTempUrl: () => void;
  onToggleShareImage: (url: string) => void;
  onSelectAllShareImages: () => void;
  onClearShareImages: () => void;
  onUploadTempFiles: (files: File[]) => Promise<void>;
  onCopyShareUrl: (url: string) => Promise<void>;
  onSaveAndCopyShareLink: () => Promise<void>;
}

export function AdminProductDetailShareSection({
  officialImages,
  tempImages,
  selectedShareImages,
  savedShareCode,
  shareUrl,
  copiedShare,
  shareErrorMsg,
  isSavingShare,
  isUploadingTemp,
  newQuickTempUrl,
  onChangeQuickTempUrl,
  onAddQuickTempUrl,
  onToggleShareImage,
  onSelectAllShareImages,
  onClearShareImages,
  onUploadTempFiles,
  onCopyShareUrl,
  onSaveAndCopyShareLink,
}: AdminProductDetailShareSectionProps) {
  const shareTempInputRef = useRef<HTMLInputElement | null>(null);

  const handleShareTempFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = "";
    await onUploadTempFiles(files);
  };

  return (
    <div className="card p-6 border line bg-white space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b line">
        <div>
          <h2 className="text-xs tracking-widest uppercase font-semibold">
            Share Studio · Curated Customer Link
          </h2>
          <p className="mute text-xs mt-0.5">
            Select which Official and Temporary photos appear on this
            product&apos;s private customer showcase link (
            <span className="font-mono">/share/[code]</span>).
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={onSelectAllShareImages}
            className="px-2.5 py-1 border line hover:border-black uppercase tracking-wider"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClearShareImages}
            className="px-2.5 py-1 border line hover:border-black uppercase tracking-wider mute hover:text-black"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Active Share URL Bar */}
      {shareUrl && savedShareCode && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-neutral-50 p-3 border line">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
            className="flex-1 min-w-0 bg-white border line px-3 py-2 text-xs font-mono outline-none select-all"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopyShareUrl(shareUrl)}
              className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider hover:opacity-85 shrink-0"
            >
              {copiedShare ? "✓ Copied" : "Copy Link"}
            </button>
            <Link
              href={`/share/${savedShareCode}`}
              target="_blank"
              className="px-3.5 py-2 border line bg-white hover:border-black text-xs uppercase tracking-wider shrink-0"
            >
              Open ↗
            </Link>
          </div>
        </div>
      )}

      {/* Web Photos Selection (Checkmark Badge ✓, No Thick Border) */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider mute">
          Web Photos ({officialImages.length}) · Selected:{" "}
          {
            officialImages.filter((u) => selectedShareImages.includes(u)).length
          }
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5">
          {officialImages.map((url, idx) => {
            const isSelected = selectedShareImages.includes(url);
            return (
              <button
                key={`share-off-${idx}-${url}`}
                type="button"
                onClick={() => onToggleShareImage(url)}
                className={`relative aspect-[3/4] border border-neutral-200/80 overflow-hidden transition-all group ${
                  isSelected
                    ? "opacity-100"
                    : "opacity-55 hover:opacity-90"
                }`}
              >
                <img
                  src={url}
                  alt={`Web ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleProductImageError}
                />
                <span
                  className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    isSelected
                      ? "bg-black text-white"
                      : "bg-white/80 text-transparent border border-neutral-300 group-hover:border-neutral-500"
                  }`}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temp Photos Selection (Checkmark Badge ✓, No Thick Border) */}
      <div className="space-y-2.5 pt-3 border-t line">
        <div className="text-[11px] uppercase tracking-wider mute">
          Temp Photos ({tempImages.length}) · Selected:{" "}
          {tempImages.filter((u) => selectedShareImages.includes(u)).length}
        </div>

        {tempImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5">
            {tempImages.map((url, idx) => {
              const isSelected = selectedShareImages.includes(url);
              return (
                <button
                  key={`share-tmp-${idx}-${url}`}
                  type="button"
                  onClick={() => onToggleShareImage(url)}
                  className={`relative aspect-[3/4] border border-neutral-200/80 overflow-hidden transition-all group ${
                    isSelected
                      ? "opacity-100"
                      : "opacity-55 hover:opacity-90"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Temp ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleProductImageError}
                  />
                  <span
                    className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm ${
                      isSelected
                        ? "bg-black text-white"
                        : "bg-white/80 text-transparent border border-neutral-300 group-hover:border-neutral-500"
                    }`}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Upload Temp Photos inside Share Studio */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl pt-1">
          <input
            ref={shareTempInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={handleShareTempFilesChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploadingTemp}
            onClick={() => shareTempInputRef.current?.click()}
            className="px-3 py-1.5 bg-black text-white text-[11px] uppercase tracking-wider hover:opacity-85 disabled:opacity-50 shrink-0"
          >
            {isUploadingTemp ? "Uploading..." : "+ Upload Temp Photos"}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={newQuickTempUrl}
              onChange={(e) => onChangeQuickTempUrl(e.target.value)}
              placeholder="Or paste temp image URL..."
              className="flex-1 min-w-0 bg-neutral-50 border line px-3 py-1.5 text-xs outline-none focus:border-black"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddQuickTempUrl();
                }
              }}
            />
            <button
              type="button"
              onClick={onAddQuickTempUrl}
              className="px-3 py-1.5 border line bg-white hover:border-black text-[11px] uppercase tracking-wider shrink-0"
            >
              + Add URL
            </button>
          </div>
        </div>
      </div>

      {shareErrorMsg && <p className="text-xs text-red-600">{shareErrorMsg}</p>}

      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t line">
        <span className="text-xs mute">
          {selectedShareImages.length} of{" "}
          {officialImages.length + tempImages.length} photos selected for
          customer share link
        </span>
        <button
          type="button"
          disabled={isSavingShare}
          onClick={onSaveAndCopyShareLink}
          className="btn text-xs py-2.5 px-6 disabled:opacity-60"
        >
          {isSavingShare
            ? "Saving..."
            : copiedShare
            ? "✓ Share Link Copied"
            : savedShareCode
            ? "Update & Copy Share Link"
            : "Create & Copy Share Link"}
        </button>
      </div>
    </div>
  );
}
