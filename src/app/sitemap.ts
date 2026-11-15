import { MetadataRoute } from "next";
import { prisma } from "@/server/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/cart",
    "/checkout",
    "/account",
    "/auth/login",
    "/auth/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const items: Array<{ slug: string; updatedAt: Date }> =
      await prisma.item.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
      });

    const productRoutes: MetadataRoute.Sitemap = items.map(
      (p: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
