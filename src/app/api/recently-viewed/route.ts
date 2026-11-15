import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/queries";
import {
  findGuestRecentlyViewedInDb,
  findUserRecentlyViewedInDb,
} from "@/server/products/queries";
import { recordUserRecentlyViewedInDb } from "@/server/products/actions";

const TrackRecentlyViewedSchema = z.object({
  itemId: z.string().optional(),
  syncIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("exclude") || undefined;

    if (session?.user?.id) {
      const data = await findUserRecentlyViewedInDb(session.user.id, excludeId);
      return NextResponse.json({
        success: true,
        data,
        source: "database",
        timestamp: new Date().toISOString(),
      });
    }

    const idsParam = searchParams.get("ids");
    const idList = idsParam
      ? idsParam
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => Boolean(s) && s !== excludeId)
          .slice(0, 8)
      : [];

    const data = await findGuestRecentlyViewedInDb(idList);

    return NextResponse.json({
      success: true,
      data,
      source: "local",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/recently-viewed] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Failed to load recently viewed products",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "local",
        message: "Guest user — stored in localStorage",
        timestamp: new Date().toISOString(),
      });
    }

    const parsed = TrackRecentlyViewedSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request payload",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const keysToRecord: string[] = [];
    if (parsed.data.syncIds && parsed.data.syncIds.length > 0) {
      keysToRecord.push(...parsed.data.syncIds.slice(0, 8).reverse());
    }
    if (parsed.data.itemId) {
      keysToRecord.push(parsed.data.itemId);
    }

    await recordUserRecentlyViewedInDb(session.user.id, keysToRecord);

    return NextResponse.json({
      success: true,
      source: "database",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/recently-viewed] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to record recently viewed item",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
