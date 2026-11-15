import { NextRequest, NextResponse } from "next/server";
import { findRelatedProductsBySlug } from "@/server/products/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const data = await findRelatedProductsBySlug(slug);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/products/[slug]/related] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch related products",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
