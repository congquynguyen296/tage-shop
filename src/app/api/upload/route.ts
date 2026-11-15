import { NextRequest, NextResponse } from "next/server";
import { ApiError, requireAdmin } from "@/server/auth/queries";
import { uploadProductImagesOnServer } from "@/server/products/upload";
import { UploadMediaInputSchema } from "@/service/products/schema";

/**
 * POST /api/upload
 * Admin-authenticated endpoint for uploading product images to Cloudinary,
 * organized per product folder (`tage/products/<product-slug>/`) with
 * recognizable filenames (`main-01-...` vs `temp-01-...`).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const rawZone = formData.get("zone");
    const zoneValue =
      typeof rawZone === "string" &&
      (rawZone === "official" || rawZone === "temporary")
        ? rawZone
        : "official";

    const rawProductName = formData.get("productName");
    const productName =
      typeof rawProductName === "string" ? rawProductName.trim() : "";

    const rawStartIndex = formData.get("startIndex");
    const startIndex =
      typeof rawStartIndex === "string" && !Number.isNaN(Number(rawStartIndex))
        ? Math.max(0, Math.floor(Number(rawStartIndex)))
        : 0;

    const rawEntries = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ];

    const files: File[] = rawEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );

    const parsedInput = UploadMediaInputSchema.safeParse({
      zone: zoneValue,
      productName,
      startIndex,
      fileCount: files.length,
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsedInput.error.issues[0]?.message ||
            "Invalid upload request payload",
        },
        { status: 400 }
      );
    }

    const uploaded = await uploadProductImagesOnServer(files, {
      zone: parsedInput.data.zone,
      productName: parsedInput.data.productName,
      startIndex: parsedInput.data.startIndex,
    });

    return NextResponse.json({
      success: true,
      url: uploaded[0]?.url || "",
      data: uploaded,
      message: "Images uploaded successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }

    console.error("[POST /api/upload] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to upload product image",
      },
      { status: 500 }
    );
  }
}
