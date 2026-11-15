import { NextRequest, NextResponse } from "next/server";
import { findProductDetailBySlug } from "@/server/products/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await findProductDetailBySlug(slug);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Product not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/products/[slug]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to fetch product",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
