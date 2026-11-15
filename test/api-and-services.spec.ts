import "dotenv/config";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/server/db/client";
import {
  fetchProductsApi,
  fetchProductBySlugApi,
  fetchRelatedProductsApi,
  fetchSharedProductApi,
  fetchRecentlyViewedApi,
  trackRecentlyViewedApi,
  searchProductsApi,
} from "../src/service/products/queries";
import {
  getAdminProductsAction,
  createAdminProductAction,
  updateAdminProductAction,
  updateAdminStockAction,
  saveProductShareLinkAction,
  deleteAdminProductAction,
  uploadProductImagesAction,
} from "../src/service/products/actions";
import { extractImageStorageKey } from "../src/server/products/upload";
import { fetchCartApi } from "../src/service/cart/queries";
import {
  addToCartApi,
  syncCartWithBackend,
  removeFromCartApi,
  clearCartApi,
} from "../src/service/cart/actions";
import {
  queryShopCatalogProducts,
  findProductDetailBySlug,
  findRelatedProductsBySlug,
  findAllAdminProducts,
  findSharedProductByCode,
} from "../src/server/products/queries";

function getAllFiles(dir: string, extFilter = /\.(ts|tsx)$/): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, extFilter));
    } else if (extFilter.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("1. Architecture & Layer Boundary Verification", () => {
  const rootSrc = path.resolve(process.cwd(), "src");

  it("ensures NO direct fetch('/api/...') calls exist in Pages (src/app) or UI Components (src/components)", () => {
    const pageAndComponentFiles = [
      ...getAllFiles(path.join(rootSrc, "app")).filter(
        (f) => !f.includes(path.join("src", "app", "api"))
      ),
      ...getAllFiles(path.join(rootSrc, "components")),
      ...getAllFiles(path.join(rootSrc, "hooks")),
    ];

    for (const file of pageAndComponentFiles) {
      const content = fs
        .readFileSync(file, "utf-8")
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(
        /\bfetch\s*\(/.test(content),
        false,
        `Direct fetch() found in ${path.relative(process.cwd(), file)} — must go through src/service/`
      );
    }
  });

  it("ensures NO direct prisma calls exist in src/service/ or src/app/api/ (only in src/server/)", () => {
    const serviceAndApiFiles = [
      ...getAllFiles(path.join(rootSrc, "service")),
      ...getAllFiles(path.join(rootSrc, "app", "api")),
    ];

    for (const file of serviceAndApiFiles) {
      const content = fs.readFileSync(file, "utf-8");
      assert.equal(
        content.includes("prisma."),
        false,
        `Direct prisma call found in ${path.relative(process.cwd(), file)} — must be delegated to src/server/`
      );
    }
  });
});

describe("2. Service API Deduplication & Request Payload Verification", () => {
  it("deduplicates concurrent GET /api/products calls and builds accurate query params", async () => {
    const recordedCalls: Array<{ url: string; init?: RequestInit }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      recordedCalls.push({ url: String(input), init });
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, pageSize: 9, totalPages: 1 },
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      // Simulate React StrictMode double invocation at the exact same millisecond
      const [res1, res2] = await Promise.all([
        fetchProductsApi({
          category: "Bottom",
          sizes: ["30", "32"],
          maxPrice: 350,
          sort: "lo",
          page: 2,
          pageSize: 9,
        }),
        fetchProductsApi({
          category: "Bottom",
          sizes: ["30", "32"],
          maxPrice: 350,
          sort: "lo",
          page: 2,
          pageSize: 9,
        }),
      ]);

      assert.equal(
        recordedCalls.length,
        1,
        "Expected exactly 1 network request for concurrent identical fetchProductsApi calls"
      );
      assert.equal(
        recordedCalls[0].url,
        "/api/products?category=Bottom&sizes=30%2C32&maxPrice=350&sort=lo&page=2&pageSize=9"
      );
      assert.equal(recordedCalls[0].init?.method, "GET");
      assert.equal(res1.success, true);
      assert.equal(res2.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("deduplicates concurrent Product Detail, Related, Shared, Search, and Recently Viewed calls", async () => {
    const recordedCalls: Array<{ url: string; method: string; body?: string }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      recordedCalls.push({
        url: String(input),
        method: init?.method || "GET",
        body: init?.body ? String(init.body) : undefined,
      });
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      await Promise.all([
        fetchProductBySlugApi("tage-utility-zip-trousers-16"),
        fetchProductBySlugApi("tage-utility-zip-trousers-16"),
      ]);
      assert.equal(
        recordedCalls.filter(
          (c) => c.url === "/api/products/tage-utility-zip-trousers-16"
        ).length,
        1
      );

      await Promise.all([
        fetchRelatedProductsApi("tage-utility-zip-trousers-16"),
        fetchRelatedProductsApi("tage-utility-zip-trousers-16"),
      ]);
      assert.equal(
        recordedCalls.filter(
          (c) => c.url === "/api/products/tage-utility-zip-trousers-16/related"
        ).length,
        1
      );

      await Promise.all([
        fetchSharedProductApi("share-code-123"),
        fetchSharedProductApi("share-code-123"),
      ]);
      assert.equal(
        recordedCalls.filter((c) => c.url === "/api/share/share-code-123")
          .length,
        1
      );

      await Promise.all([
        searchProductsApi("denim"),
        searchProductsApi("denim"),
      ]);
      assert.equal(
        recordedCalls.filter(
          (c) => c.url === "/api/products?q=denim&pageSize=12"
        ).length,
        1
      );

      await Promise.all([
        trackRecentlyViewedApi("tage-utility-zip-trousers-16"),
        trackRecentlyViewedApi("tage-utility-zip-trousers-16"),
      ]);
      const postRecent = recordedCalls.filter(
        (c) => c.url === "/api/recently-viewed" && c.method === "POST"
      );
      assert.equal(postRecent.length, 1);
      assert.deepEqual(JSON.parse(postRecent[0].body!), {
        itemId: "tage-utility-zip-trousers-16",
      });

      await Promise.all([
        fetchRecentlyViewedApi({
          exclude: "tage-utility-zip-trousers-16",
          guestIds: ["slug-1", "slug-2"],
        }),
        fetchRecentlyViewedApi({
          exclude: "tage-utility-zip-trousers-16",
          guestIds: ["slug-1", "slug-2"],
        }),
      ]);
      assert.equal(
        recordedCalls.filter(
          (c) =>
            c.url ===
            "/api/recently-viewed?exclude=tage-utility-zip-trousers-16&ids=slug-1%2Cslug-2"
        ).length,
        1
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("deduplicates concurrent Cart API calls and sends valid payloads for GET, POST, DELETE", async () => {
    const recordedCalls: Array<{ url: string; method: string; body?: string }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      recordedCalls.push({
        url: String(input),
        method: init?.method || "GET",
        body: init?.body ? String(init.body) : undefined,
      });
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      // 1. Concurrent GET /api/cart
      await Promise.all([
        fetchCartApi(["piece-1", "piece-2"]),
        fetchCartApi(["piece-1", "piece-2"]),
      ]);
      assert.equal(
        recordedCalls.filter(
          (c) => c.url === "/api/cart?ids=piece-1%2Cpiece-2" && c.method === "GET"
        ).length,
        1
      );

      // 2. Concurrent POST /api/cart (addToCartApi)
      await Promise.all([
        addToCartApi("piece-slug-1"),
        addToCartApi("piece-slug-1"),
      ]);
      const addCalls = recordedCalls.filter(
        (c) => c.url === "/api/cart" && c.method === "POST"
      );
      assert.equal(addCalls.length, 1);
      assert.deepEqual(JSON.parse(addCalls[0].body!), {
        itemId: "piece-slug-1",
      });

      // 3. Concurrent POST /api/cart (syncCartWithBackend)
      await Promise.all([syncCartWithBackend([]), syncCartWithBackend([])]);
      const syncCalls = recordedCalls.filter(
        (c) =>
          c.url === "/api/cart" &&
          c.method === "POST" &&
          c.body?.includes("syncItemIds")
      );
      assert.equal(syncCalls.length, 1);

      // 4. DELETE /api/cart (remove & clearAll)
      await removeFromCartApi("piece-slug-1");
      assert.equal(
        recordedCalls.some(
          (c) =>
            c.url === "/api/cart?itemId=piece-slug-1" && c.method === "DELETE"
        ),
        true
      );

      await clearCartApi();
      assert.equal(
        recordedCalls.some(
          (c) => c.url === "/api/cart?clearAll=true" && c.method === "DELETE"
        ),
        true
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("deduplicates concurrent Admin Products GET calls and formats POST, PATCH, DELETE payloads accurately", async () => {
    const recordedCalls: Array<{ url: string; method: string; body?: string }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      recordedCalls.push({
        url: String(input),
        method: init?.method || "GET",
        body: init?.body ? String(init.body) : undefined,
      });
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          success: true,
          data: { shareCode: "test-share", sharedImages: ["/img.jpg"], product: null },
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      // Simulate AdminLayout + useAdminProducts calling getAdminProductsAction simultaneously
      await Promise.all([getAdminProductsAction(), getAdminProductsAction()]);
      assert.equal(
        recordedCalls.filter(
          (c) => c.url === "/api/admin/products" && c.method === "GET"
        ).length,
        1
      );

      await createAdminProductAction({
        name: "Archive Moto Jacket",
        color: "Black",
        colorHex: "#000000",
        price: 320,
        category: "Outerwear",
        sizes: ["L"],
        images: ["/images/products/p1-01.jpg"],
        temporaryImages: [],
        isNew: true,
        isSale: false,
        isSoldOut: false,
      });
      const postCall = recordedCalls.find(
        (c) => c.url === "/api/admin/products" && c.method === "POST"
      );
      assert.ok(postCall);
      assert.equal(JSON.parse(postCall.body!).name, "Archive Moto Jacket");

      await updateAdminProductAction("prod-123", { price: 280 });
      const patchUpdateCall = recordedCalls.find(
        (c) =>
          c.url === "/api/admin/products" &&
          c.method === "PATCH" &&
          c.body?.includes('"mode":"update"')
      );
      assert.ok(patchUpdateCall);
      assert.deepEqual(JSON.parse(patchUpdateCall.body!), {
        mode: "update",
        productId: "prod-123",
        input: { price: 280 },
      });

      await updateAdminStockAction("prod-123", 0);
      const patchStockCall = recordedCalls.find(
        (c) =>
          c.url === "/api/admin/products" &&
          c.method === "PATCH" &&
          c.body?.includes('"mode":"stock"')
      );
      assert.ok(patchStockCall);
      assert.deepEqual(JSON.parse(patchStockCall.body!), {
        mode: "stock",
        productId: "prod-123",
        stock: 0,
      });

      await saveProductShareLinkAction({
        productId: "prod-123",
        selectedImages: ["/images/products/p1-01.jpg"],
      });
      const patchShareCall = recordedCalls.find(
        (c) =>
          c.url === "/api/admin/products" &&
          c.method === "PATCH" &&
          c.body?.includes('"mode":"share"')
      );
      assert.ok(patchShareCall);

      await deleteAdminProductAction("prod-123");
      assert.equal(
        recordedCalls.some(
          (c) =>
            c.url === "/api/admin/products?id=prod-123" &&
            c.method === "DELETE"
        ),
        true
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("validates and sends multipart/form-data to POST /api/upload for Cloudinary product images", async () => {
    const recordedCalls: Array<{ url: string; method: string; body?: BodyInit | null }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      recordedCalls.push({
        url: String(input),
        method: init?.method || "GET",
        body: init?.body,
      });
      return new Response(
        JSON.stringify({
          success: true,
          url: "https://res.cloudinary.com/tage-cloud/image/upload/v1731640000/tage/products/official/jacket-01.webp",
          data: [
            {
              url: "https://res.cloudinary.com/tage-cloud/image/upload/v1731640000/tage/products/official/jacket-01.webp",
              publicId: "tage/products/official/jacket-01",
              provider: "cloudinary",
              width: 1200,
              height: 1600,
              format: "webp",
              bytes: 142000,
            },
          ],
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      const dummyFile = new File(["dummy-image-bytes"], "jacket-01.webp", {
        type: "image/webp",
      });
      const result = await uploadProductImagesAction([dummyFile], "official");

      assert.equal(recordedCalls.length, 1);
      assert.equal(recordedCalls[0].url, "/api/upload");
      assert.equal(recordedCalls[0].method, "POST");
      assert.equal(result.length, 1);
      assert.equal(result[0].provider, "cloudinary");
      assert.equal(
        extractImageStorageKey(result[0].url, "local-sku", 0),
        "tage/products/official/jacket-01"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("3. Live PostgreSQL Server Queries Verification (src/server/products/queries.ts)", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("queries paginated shop catalog products and filters by category from Neon PostgreSQL", async (t) => {
    try {
      const allPage1 = await queryShopCatalogProducts({
        category: "All",
        sizes: [],
        q: "",
        sort: "new",
        page: 1,
        pageSize: 9,
      });

      assert.ok(allPage1.total > 0, "Expected seeded products in PostgreSQL");
      assert.ok(allPage1.items.length <= 9);

      const firstProduct = allPage1.items[0];
      const detail = await findProductDetailBySlug(firstProduct.slug);
      assert.ok(detail, "Expected findProductDetailBySlug to return product");
      assert.equal(detail.slug, firstProduct.slug);

      const related = await findRelatedProductsBySlug(firstProduct.slug);
      assert.ok(Array.isArray(related));
      assert.equal(
        related.some((r) => r.slug === firstProduct.slug),
        false,
        "Related products must exclude current product"
      );

      const sharedFallback = await findSharedProductByCode(firstProduct.slug);
      assert.ok(sharedFallback);
      assert.equal(sharedFallback.slug, firstProduct.slug);

      const adminAll = await findAllAdminProducts();
      assert.equal(adminAll.length, allPage1.total);
    } catch (err) {
      if (err instanceof Error && err.message.includes("EAI_AGAIN")) {
        t.skip("Database host unreachable in offline sandbox");
        return;
      }
      throw err;
    }
  });
});
