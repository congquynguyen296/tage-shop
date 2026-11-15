"use client";

import { useRef, useState } from "react";
import { handleProductImageError } from "@/config/utils";

interface ProductImageUploadZoneProps {
  title: string;
  description: string;
  badgePrefix?: string;
  images: string[];
  isUploading: boolean;
  error?: string;
  uploadError?: string;
  onUploadFiles: (files: File[]) => Promise<void> | void;
  onAddUrl: (url: string) => void;
  onRemoveImage: (index: number) => void;
  onSetPrimaryImage?: (index: number) => void;
}

export function ProductImageUploadZone({
  title,
  description,
  badgePrefix = "#",
  images,
  isUploading,
  error,
  uploadError,
  onUploadFiles,
  onAddUrl,
  onRemoveImage,
  onSetPrimaryImage,
}: ProductImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLocalUploading, setIsLocalUploading] = useState(false);

  const activeUploading = isUploading || isLocalUploading;

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    e.target.value = "";
    setIsLocalUploading(true);
    try {
      await onUploadFiles(filesArray);
    } finally {
      setIsLocalUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (activeUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (droppedFiles.length > 0) {
      setIsLocalUploading(true);
      try {
        await onUploadFiles(droppedFiles);
      } finally {
        setIsLocalUploading(false);
      }
    }
  };

  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    onAddUrl(trimmed);
    setManualUrl("");
  };

  return (
    <div className="p-4 border line bg-neutral-50/60 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase">
            {title}
          </span>
          <p className="mute text-[11px]">{description}</p>
        </div>
        <span className="text-xs font-mono mute">{images.length} photos</span>
      </div>

      {/* Drag & Drop + File Picker Upload Box (Cloudinary) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!activeUploading) {
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !activeUploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`border border-dashed transition-colors p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer select-none ${
          isDragging
            ? "border-black bg-neutral-100"
            : "border-neutral-300 hover:border-black"
        } ${activeUploading ? "opacity-70 cursor-wait" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border line bg-neutral-50 flex items-center justify-center shrink-0">
            {activeUploading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <div className="text-xs font-medium uppercase tracking-wider">
              {activeUploading
                ? "Uploading to Cloudinary..."
                : "Upload Photos (Cloudinary)"}
            </div>
            <div className="text-[11px] mute">
              Click to browse or drag & drop multiple images (JPG, PNG, WEBP · Max
              10MB)
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={activeUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-3.5 py-2 bg-black text-white text-[11px] tracking-wider uppercase hover:opacity-85 disabled:opacity-50 shrink-0"
        >
          {activeUploading ? "Uploading..." : "+ Select Files"}
        </button>
      </div>

      {/* Optional Manual URL Input */}
      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="Or paste image URL (e.g. https://res.cloudinary.com/...)"
          className="flex-1 min-w-0 bg-white border line px-3 py-2 text-xs outline-none focus:border-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddManualUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddManualUrl}
          className="px-3.5 sm:px-4 py-2 border line bg-white hover:border-black text-xs tracking-wider uppercase shrink-0"
        >
          Add URL
        </button>
      </div>

      {/* Thumbnails Grid */}
      {(images.length > 0 || activeUploading) && (
        <div className="flex flex-wrap gap-3 pt-1">
          {images.map((url, idx) => {
            const isCloudinary = url.includes("res.cloudinary.com");
            return (
              <div
                key={`${url}-${idx}`}
                className="relative w-20 h-24 border line bg-white overflow-hidden group shrink-0"
              >
                <img
                  src={url}
                  alt={`Uploaded ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleProductImageError}
                />

                {/* Index Badge */}
                <span className="absolute top-1 left-1 bg-black/75 text-white text-[9px] px-1 font-mono">
                  {badgePrefix}
                  {idx + 1}
                </span>

                {/* Cloud Indicator */}
                {isCloudinary && (
                  <span className="absolute bottom-1 left-1 bg-emerald-700/85 text-white text-[8px] px-1 font-mono uppercase tracking-wider">
                    Cloud
                  </span>
                )}

                {/* Set as Primary (#1) button on hover */}
                {onSetPrimaryImage && idx > 0 && (
                  <button
                    type="button"
                    onClick={() => onSetPrimaryImage(idx)}
                    className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] px-1 py-0.5 font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Set as primary cover photo"
                  >
                    Set #1
                  </button>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove this image"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {activeUploading && (
            <div className="w-20 h-24 border line bg-neutral-200/70 animate-pulse flex items-center justify-center shrink-0">
              <span className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
