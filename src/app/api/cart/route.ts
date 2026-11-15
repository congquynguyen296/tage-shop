import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/queries";
import {
  findGuestCartItemsInDb,
  findUserCartItemsInDb,
} from "@/server/cart/queries";
import {
  addSingleItemToCartInDb,
  removeUserCartItemInDb,
  syncGuestCartToUserInDb,
} from "@/server/cart/actions";

const PostCartSchema = z.object({
  itemId: z.string().optional(),
  syncItemIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);

    if (session?.user?.id) {
      const data = await findUserCartItemsInDb(session.user.id);
      return NextResponse.json({
        success: true,
        data,
        source: "database",
        timestamp: new Date().toISOString(),
      });
    }

    const idsParam = searchParams.get("ids");
    const keys = idsParam
      ? idsParam
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const data = await findGuestCartItemsInDb(keys);

    return NextResponse.json({
      success: true,
      data,
      source: "local",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/cart] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Failed to load cart",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = PostCartSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid cart payload",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.user?.id;

    // Mode A: Sync guest cart items upon login
    if (parsed.data.syncItemIds && userId) {
      const data = await syncGuestCartToUserInDb(
        userId,
        parsed.data.syncItemIds
      );
      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    // Mode B: Add single 1-of-1 piece to cart
    const itemKey = parsed.data.itemId;
    if (!itemKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const cartItem = await addSingleItemToCartInDb(itemKey, userId);
    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "This archive piece is already sold out",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cartItem,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/cart] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item to cart",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (userId) {
      const { searchParams } = new URL(req.url);
      await removeUserCartItemInDb(userId, {
        clearAll: searchParams.get("clearAll") === "true",
        itemKey: searchParams.get("itemId"),
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DELETE /api/cart] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove item from cart",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
