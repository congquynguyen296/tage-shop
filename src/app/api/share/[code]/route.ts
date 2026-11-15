import { NextRequest, NextResponse } from "next/server";
import { findSharedProductByCode } from "@/server/products/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const data = await findSharedProductByCode(code);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Shared product link not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/share/[code]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load shared product",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
