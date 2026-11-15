import { NextRequest, NextResponse } from "next/server";
import { ProductFilterSchema } from "@/service/products/schema";
import {
  findProductsByIdsOrSlugs,
  queryShopCatalogProducts,
} from "@/server/products/queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional: fetch specific items by comma-separated IDs or slugs
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const idList = idsParam
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const items = await findProductsByIdsOrSlugs(idList);
      return NextResponse.json({
        success: true,
        data: {
          items,
          total: items.length,
          page: 1,
          pageSize: items.length,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const sizesParam = searchParams.get("sizes");
    const sizes = sizesParam
      ? sizesParam
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const params = ProductFilterSchema.parse({
      category: searchParams.get("category") || undefined,
      sizes,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      sort:
        (searchParams.get("sort") as "new" | "lo" | "hi" | null) || "new",
      q: searchParams.get("q") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : 9,
    });

    const data = await queryShopCatalogProducts(params);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch products",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
