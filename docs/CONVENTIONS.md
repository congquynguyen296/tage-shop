# Quy Chuẩn Đặt Tên & Coding Conventions — TAGE E-Commerce

Tài liệu này quy định các tiêu chuẩn bắt buộc về đặt tên, phân tách Server/Client Component, định kiểu TypeScript và tổ chức mã nguồn trong dự án **TAGE**.

---

## 1. Quy Chuẩn Đặt Tên (Naming Conventions)

### 1.1. Thư mục (Directories)
- **Tất cả tên thư mục** sử dụng chữ thường phân cách bằng dấu gạch ngang (`kebab-case`):
  - Ví dụ: `src/components/product/`, `src/service/products/`, `src/app/api/recently-viewed/`.
- **Route Groups** của Next.js đặt trong ngoặc tròn: `(shop)`.
- **Dynamic Route Segments** đặt trong ngoặc vuông: `[slug]`, `[...all]`.

### 1.2. Tệp tin (Files)
- **React Component files**: Sử dụng `PascalCase.tsx` (ví dụ: `ProductCard.tsx`, `FilterDrawer.tsx`, `CartSummary.tsx`).
- **Next.js App Router files**: Tuân thủ đúng tên chuẩn của Next.js: `page.tsx`, `layout.tsx`, `not-found.tsx`, `sitemap.ts`, `route.ts`.
- **Service & Logic files**: Sử dụng tên theo vai trò trong từng module `src/service/<module>/`:
  - `queries.ts`: Các hàm gọi API `GET` lấy dữ liệu.
  - `actions.ts`: Các hàm Server Actions hoặc gọi API `POST`/`PATCH`/`DELETE`.
  - `schema.ts`: Các lược đồ kiểm duyệt dữ liệu bằng Zod.
  - `store.ts`: Khởi tạo Zustand Store của module đó.
- **Custom Hooks**: Bắt đầu bằng tiền tố `use` viết theo `camelCase.ts` trong `src/hooks/` (ví dụ: `useShopCatalog.ts`, `useProductDetail.ts`, `useAuthSync.ts`).
- **Server Core files**: Đặt trong `src/server/` với `import "server-only";` ở dòng đầu tiên (`client.ts`, `mappers.ts`, `auth.ts`, `session.ts`, `guards.ts`).

### 1.3. Định danh trong Code (Identifiers)
- **React Components**: `PascalCase` (`export function ProductCard()`).
- **TypeScript Interfaces / Types**: `PascalCase` (`Product`, `CartItem`, `PrismaItemWithRelations`).
- **Zod Schemas**: `PascalCase` kết thúc bằng hậu tố `Schema` (`ProductFilterSchema`, `UpsertProductSchema`, `CheckoutFormSchema`).
- **Zustand Stores**: Bắt đầu bằng `use`, kết thúc bằng `Store` (`useProductStore`, `useCartStore`, `useAuthStore`, `useOrderStore`).
- **Hằng số toàn cục**: `UPPER_SNAKE_CASE` (`NAV_CATEGORIES`, `INSTAGRAM_SHOP_URL`, `STANDARD_SHIPPING_FEE`).
- **Hàm và Biến**: `camelCase` (`mapPrismaItemToProduct`, `handleAddToCart`).

---

## 2. Quy Tắc Server Component vs Client Component

1. **Server Operations (`src/server/**`, `src/app/api/**/route.ts`, `src/service/products/actions.ts`)**:
   - Chạy hoàn toàn trên môi trường Node.js của Server, kết nối trực tiếp tới PostgreSQL thông qua `prisma`.
   - Tuyệt đối không import các file trong `src/server/**` vào các Client Component (`"use client"`).
2. **Client Components (`"use client"`)**:
   - Bắt buộc đặt `"use client";` ở dòng số 1 khi sử dụng React Hooks (`useState`, `useEffect`, `useMemo`), sự kiện DOM (`onClick`, `onSubmit`), hoặc đọc dữ liệu từ Zustand Store.
3. **An toàn Hydration (Hydration Safety)**:
   - Khi hiển thị dữ liệu được lưu trong `localStorage` qua Zustand `persist` (như số lượng giỏ hàng, thông tin tài khoản), cần kiểm tra trạng thái `mounted` hoặc đồng bộ qua `useEffect` để tránh lỗi lệch HTML giữa Server-Side Rendering (SSR) và Client Render.

---

## 3. Tiêu Chuẩn TypeScript Nghiêm Ngặt (Strict TypeScript)

1. **Không dùng `any` (Zero `any` Policy)**:
   - Mọi kết quả truy vấn từ Prisma trong `src/app/api/**/route.ts` và `src/service/products/actions.ts` phải được gán kiểu tường minh thông qua các interface trong `src/server/db/mappers.ts` (`PrismaItemWithRelations`, `PrismaCartItemWithRelations`, `PrismaRecentlyViewedWithRelations`).
   - Mọi tham số callback trong `.map()`, `.filter()`, `.find()` phải có kiểu dữ liệu rõ ràng để tránh lỗi `ts(7006)` trên mọi IDE.
2. **Thứ tự Import chuẩn**:
   ```tsx
   // 1. React & Next.js core
   import { useEffect, useState } from "react";
   import Link from "next/link";

   // 2. Thư viện bên thứ ba (Zod, Zustand, Prisma...)
   import { z } from "zod";

   // 3. Internal Types & Server Mappers
   import { Product, CartItem } from "@/types";

   // 4. Config & Utilities
   import { money, getSafeProductImage } from "@/config/utils";

   // 5. Service, Store & Custom Hooks
   import { useProductStore } from "@/service/products/store";
   import { useShopCatalog } from "@/hooks/useShopCatalog";

   // 6. UI Components
   import { ProductCard } from "@/components/product/ProductCard";
   ```

---

## 4. Nguyên Tắc Tách Nhỏ Component & Hook (Decomposition Rules)

1. **Page chỉ làm nhiệm vụ Điều phối Bố cục (Layout Orchestrator)**:
   - File `page.tsx` không được chứa hàng trăm dòng xử lý state hay gọi `fetch` trực tiếp.
   - Mọi logic lấy dữ liệu, lọc, phân trang, đồng bộ store phải được đặt trong **Custom Hook** tương ứng:
     - `/shop` (`src/app/(shop)/shop/page.tsx`) -> điều phối bởi [`useShopCatalog`](../src/hooks/useShopCatalog.ts).
     - `/product/[slug]` (`src/app/(shop)/product/[slug]/page.tsx`) -> điều phối bởi [`useProductDetail`](../src/hooks/useProductDetail.ts).
     - `/cart` (`src/app/(shop)/cart/page.tsx`) -> điều phối bởi [`useCart`](../src/hooks/useCart.ts).
     - `/checkout` (`src/app/(shop)/checkout/page.tsx`) -> điều phối bởi [`useCheckout`](../src/hooks/useCheckout.ts).
     - `/admin/products` (`src/app/admin/products/page.tsx`) -> điều phối bởi [`useAdminProducts`](../src/hooks/useAdminProducts.ts).
2. **Tái sử dụng UI Components**:
   - Các thành phần dùng chung như phân trang ([`Pagination.tsx`](../src/components/ui/Pagination.tsx) + [`usePagination.ts`](../src/hooks/usePagination.ts)), thẻ sản phẩm ([`ProductCard.tsx`](../src/components/product/ProductCard.tsx)), băng chuyền sản phẩm ([`ProductCarousel.tsx`](../src/components/product/ProductCarousel.tsx)) được tái sử dụng xuyên suốt giữa Trang chủ, Trang danh sách, Trang chi tiết và Trang quản trị Admin.
