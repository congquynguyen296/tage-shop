import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/queries";
import {
  SaveProductShareSchema,
  UpsertProductInput,
  UpsertProductSchema,
} from "@/service/products/schema";
import { findAllAdminProducts } from "@/server/products/queries";
import {
  createAdminProductInDb,
  deleteAdminProductInDb,
  saveAdminProductShareLinkInDb,
  updateAdminProductInDb,
  updateAdminProductStockInDb,
} from "@/server/products/actions";

export async function GET() {
  try {
    const data = await findAllAdminProducts();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/admin/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Failed to load admin products",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const input = UpsertProductSchema.parse(await req.json());
    const data = await createAdminProductInDb(input, session.user);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/admin/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create product",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const mode = body.mode as "update" | "stock" | "share";

    if (mode === "share") {
      const input = SaveProductShareSchema.parse(body);
      const data = await saveAdminProductShareLinkInDb(input, session.user);
      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    if (mode === "stock") {
      const data = await updateAdminProductStockInDb(
        String(body.productId),
        Number(body.stock ?? 0),
        session.user
      );
      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await updateAdminProductInDb(
      String(body.productId),
      (body.input || {}) as Partial<UpsertProductInput>,
      session.user
    );

    if (!updated) {
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
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PATCH /api/admin/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update product",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (productId) {
      await deleteAdminProductInDb(productId, session.user);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DELETE /api/admin/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
