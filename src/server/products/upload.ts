import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { slugify } from "@/config/utils";
import { ApiError } from "@/server/auth/queries";
import {
  UploadedMediaItem,
  UploadMediaZone,
} from "@/service/products/schema";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

interface CloudinaryCredentials {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  baseFolder: string;
}

interface CloudinaryApiSuccessResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface CloudinaryApiErrorResponse {
  error?: {
    message?: string;
  };
}

export interface ServerUploadOptions {
  zone?: UploadMediaZone;
  productName?: string;
  startIndex?: number;
}

/**
 * Resolve Cloudinary configuration from `.env` (`CLOUDINARY_*` or `CLOUDINARY_URL`)
 */
function resolveCloudinaryConfig(): CloudinaryCredentials | null {
  const baseFolder = (process.env.CLOUDINARY_FOLDER || "tage/products").replace(
    /\/+$/,
    ""
  );
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || undefined;

  const envUrl = process.env.CLOUDINARY_URL?.trim();
  if (envUrl && envUrl.startsWith("cloudinary://")) {
    try {
      const parsed = new URL(envUrl);
      const cloudName = parsed.hostname;
      const apiKey = decodeURIComponent(parsed.username);
      const apiSecret = decodeURIComponent(parsed.password);
      if (cloudName && apiKey && apiSecret) {
        return {
          cloudName,
          apiKey,
          apiSecret,
          uploadPreset,
          baseFolder,
        };
      }
    } catch {
      // Fall through to individual env vars
    }
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || undefined;
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || undefined;

  if (!cloudName) {
    return null;
  }

  if ((apiKey && apiSecret) || uploadPreset) {
    return {
      cloudName,
      apiKey,
      apiSecret,
      uploadPreset,
      baseFolder,
    };
  }

  return null;
}

/**
 * Generate SHA-1 signature required by Cloudinary Signed Upload API
 */
function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string
): string {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

/**
 * Validate a single image File before uploading
 */
function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new ApiError(
      400,
      `Unsupported image format "${file.type || file.name}". Allowed: JPG, PNG, WEBP, AVIF, GIF.`,
      "INVALID_FILE_TYPE"
    );
  }

  if (file.size <= 0) {
    throw new ApiError(400, `File "${file.name}" is empty.`, "EMPTY_FILE");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(
      400,
      `File "${file.name}" exceeds the 10MB maximum size limit.`,
      "FILE_TOO_LARGE"
    );
  }
}

/**
 * Build recognizable per-product folder and image identifier:
 * - Folder: `<baseFolder>/<product-slug>` (e.g., `tage/products/vintage-leather-trench`)
 * - File publicId:
 *   - Zone 1 (Official Web): `main-01-<6char>`, `main-02-<6char>`
 *   - Zone 2 (Temporary / Archive): `temp-01-<6char>`, `temp-02-<6char>`
 */
function buildProductMediaNaming(
  productName: string | undefined,
  zone: UploadMediaZone,
  orderNumber: number
): { productFolderSlug: string; fileIdentifier: string } {
  const cleanedSlug = productName ? slugify(productName).slice(0, 60) : "";
  const productFolderSlug = cleanedSlug || "unassigned-product";
  const prefix = zone === "temporary" ? "temp" : "main";
  const paddedIndex = String(Math.max(1, orderNumber)).padStart(2, "0");
  const shortHash = crypto.randomBytes(3).toString("hex");
  const fileIdentifier = `${prefix}-${paddedIndex}-${shortHash}`;

  return { productFolderSlug, fileIdentifier };
}

/**
 * Upload a single validated File to Cloudinary (or local `public/images/uploads/<product-slug>` fallback in dev)
 */
async function uploadSingleFile(
  file: File,
  zone: UploadMediaZone,
  productName: string | undefined,
  orderNumber: number
): Promise<UploadedMediaItem> {
  validateImageFile(file);

  const config = resolveCloudinaryConfig();
  const { productFolderSlug, fileIdentifier } = buildProductMediaNaming(
    productName,
    zone,
    orderNumber
  );

  if (config) {
    const targetFolder = `${config.baseFolder}/${productFolderSlug}`;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      config.cloudName
    )}/image/upload`;

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file);
    cloudinaryForm.append("folder", targetFolder);
    cloudinaryForm.append("public_id", fileIdentifier);

    if (config.apiKey && config.apiSecret) {
      const paramsToSign: Record<string, string> = {
        folder: targetFolder,
        public_id: fileIdentifier,
        timestamp,
      };
      if (config.uploadPreset) {
        paramsToSign.upload_preset = config.uploadPreset;
        cloudinaryForm.append("upload_preset", config.uploadPreset);
      }
      const signature = signCloudinaryParams(paramsToSign, config.apiSecret);
      cloudinaryForm.append("api_key", config.apiKey);
      cloudinaryForm.append("timestamp", timestamp);
      cloudinaryForm.append("signature", signature);
    } else if (config.uploadPreset) {
      cloudinaryForm.append("upload_preset", config.uploadPreset);
    }

    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: cloudinaryForm,
    });

    if (!response.ok) {
      const errBody = (await response
        .json()
        .catch(() => ({}))) as CloudinaryApiErrorResponse;
      const errMsg =
        errBody.error?.message ||
        `Cloudinary upload failed with HTTP ${response.status}`;
      throw new ApiError(502, errMsg, "CLOUDINARY_UPLOAD_FAILED");
    }

    const result = (await response.json()) as CloudinaryApiSuccessResponse;
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: "cloudinary",
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  // Fallback for local development when Cloudinary credentials are not yet set in .env
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extFromName = path.extname(file.name).toLowerCase() || ".jpg";
  const fileName = `${fileIdentifier}${extFromName}`;

  const relativeDir = path.join("images", "uploads", productFolderSlug);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });

  const absoluteFilePath = path.join(absoluteDir, fileName);
  await fs.writeFile(absoluteFilePath, buffer);

  const publicUrl = `/images/uploads/${productFolderSlug}/${fileName}`;
  return {
    url: publicUrl,
    publicId: `tage/products/${productFolderSlug}/${fileIdentifier}`,
    provider: "local",
    bytes: file.size,
  };
}

/**
 * Upload one or multiple product image files for Admin Studio,
 * organized into a per-product folder (`tage/products/<product-slug>/`)
 * with recognizable filenames (`main-01-...` vs `temp-01-...`).
 */
export async function uploadProductImagesOnServer(
  files: File[],
  options: ServerUploadOptions = {}
): Promise<UploadedMediaItem[]> {
  const zone = options.zone || "official";
  const productName = options.productName;
  const startIndex = options.startIndex || 0;

  if (!files || files.length === 0) {
    throw new ApiError(400, "No image files provided for upload", "NO_FILES");
  }

  if (files.length > 12) {
    throw new ApiError(
      400,
      "Maximum 12 images can be uploaded at once",
      "TOO_MANY_FILES"
    );
  }

  const uploadedItems = await Promise.all(
    files.map((file, idx) =>
      uploadSingleFile(file, zone, productName, startIndex + idx + 1)
    )
  );

  return uploadedItems;
}

/**
 * Extract Cloudinary `public_id` from a Cloudinary URL for `ItemImage.storageKey`
 */
export function extractImageStorageKey(
  url: string,
  fallbackPrefix: string,
  index: number
): string {
  if (url.includes("res.cloudinary.com/")) {
    const match = url.match(
      /\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i
    );
    if (match && match[1]) {
      return match[1];
    }
  }
  return `${fallbackPrefix}-${index}`;
}
