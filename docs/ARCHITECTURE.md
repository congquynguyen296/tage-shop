# Kiến Trúc Hệ Thống & Thiết Kế Cấu Trúc Thư Mục — TAGE E-Commerce (MVP)

Tài liệu này mô tả toàn diện kiến trúc kỹ thuật của nền tảng thương mại điện tử **TAGE** (chuyên đồ second-hand / archive độc bản **1-of-1**), được xây dựng trên **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Zustand**, **Zod**, **Better Auth**, và **Prisma + Neon PostgreSQL**.

---

## 1. Kiến Trúc Phân Tầng (5-Layer Decoupled Architecture)

Dự án tuân thủ nghiêm ngặt mô hình phân tách trách nhiệm thành **5 tầng độc lập**, đi từ giao diện người dùng (Client) xuống cơ sở dữ liệu (Server/DB):

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: ROUTE PAGES & LAYOUTS (src/app/)                                │
│ - Định tuyến URL, nhận params/searchParams, lắp ghép các Component.     │
│ - Tuyệt đối không chứa logic nghiệp vụ hay gọi fetch() trực tiếp.       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TẦNG 2: PRESENTATIONAL COMPONENTS & CUSTOM HOOKS                        │
│ - src/components/: Hiển thị UI thuần túy (ui/, home/, product/, cart/). │
│ - src/hooks/: Điều phối state giao diện, kết nối UI với Service/Store.  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TẦNG 3: BUSINESS SERVICE & STATE LAYER (src/service/<module>/)          │
│ - queries.ts: Gọi REST API (GET /api/...) lấy dữ liệu cho Client.       │
│ - actions.ts: Gọi REST API (POST/PATCH/DELETE /api/...) thay đổi dữ liệu│
│ - store.ts: Quản lý Global State & Cache phía Client bằng Zustand.      │
│ - schema.ts: Kiểm duyệt dữ liệu đầu vào/đầu ra bằng Zod.                │
│ * Tuyệt đối KHÔNG gọi trực tiếp Prisma DB tại tầng này.                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TẦNG 4: API ROUTE HANDLERS (src/app/api/) — THIN HTTP CONTROLLERS       │
│ - Nhận Request, kiểm tra quyền (getSession / requireAdmin) & Zod.       │
│ - Điều hướng xuống các Repository ở Tầng 5 (src/server/) và trả JSON.   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TẦNG 5: SERVER CORE & REPOSITORIES (src/server/, prisma/) — GỌI PRISMA  │
│ - src/server/products/: Các Repository truy vấn sản phẩm, Admin, History│
│ - src/server/cart/: Repository truy vấn & đồng bộ giỏ hàng PostgreSQL.  │
│ - src/server/db/: Khởi tạo PrismaPg Pool & Mapper chuyển đổi DB -> DTO. │
│ - src/server/auth/: Cấu hình Better Auth, Session & Guards bảo vệ.      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Giải Thích Chi Tiết Thiết Kế Cấu Trúc Thư Mục

```text
ling-tage-dev/
├── docs/                           # Trung tâm tài liệu kiến trúc, quy ước & luồng nghiệp vụ
│   ├── README.md                   # Mục lục tài liệu dự án
│   ├── AGENT_RULES.md              # 7 quy tắc bắt buộc & checklist kiểm tra trước khi hoàn thành
│   ├── ARCHITECTURE.md             # Tài liệu kiến trúc hệ thống & cấu trúc thư mục (file này)
│   ├── CONVENTIONS.md              # Quy chuẩn đặt tên file, biến, component, hook, TypeScript
│   └── flows/                      # Tài liệu luồng chi tiết (End-to-End Flows) cho từng tính năng
│       ├── 01-auth-and-session-flow.md
│       ├── 02-home-and-catalog-flow.md
│       ├── 03-product-detail-flow.md
│       ├── 04-cart-and-checkout-flow.md
│       └── 05-admin-studio-flow.md
│
├── prisma/                         # Tầng lược đồ Cơ sở dữ liệu & Seed
│   ├── schema.prisma               # Định nghĩa các bảng PostgreSQL cho bản MVP
│   └── seed.ts                     # Script khởi tạo tài khoản Admin, Category & 16 sản phẩm mẫu
│
├── public/                         # Tài nguyên tĩnh (Static Assets)
│   ├── images/products/            # Hình ảnh sản phẩm thực tế
│   ├── logo/                       # Logo thương hiệu TAGE
│   └── video/                      # Video banner trang chủ
│
└── src/
    ├── middleware.ts               # Edge Middleware chặn truy cập trái phép vào /admin/*
    │
    ├── app/                        # TẦNG 1 & 4: Next.js 15 App Router
    │   ├── (shop)/                 # Route Group cho Khách hàng (dùng chung Header & Footer)
    │   │   ├── layout.tsx          # Layout Storefront (Header, Marquee, Footer)
    │   │   ├── page.tsx            # Trang chủ (/)
    │   │   ├── shop/page.tsx       # Trang danh sách sản phẩm, lọc & phân trang (/shop)
    │   │   ├── product/[slug]/     # Trang chi tiết sản phẩm (/product/[slug])
    │   │   ├── cart/page.tsx       # Trang giỏ hàng (/cart)
    │   │   ├── checkout/           # Trang nhập thông tin giao hàng (/checkout) & xác nhận (/checkout/success)
    │   │   └── account/page.tsx    # Trang tài khoản khách hàng (/account)
    │   │
    │   ├── auth/                   # Route cho Xác thực (Layout tối giản tập trung vào Form)
    │   │   ├── login/page.tsx      # Đăng nhập (/auth/login)
    │   │   ├── register/page.tsx   # Đăng ký (/auth/register)
    │   │   ├── forgot-password/    # Quên mật khẩu
    │   │   ├── reset-password/     # Đặt lại mật khẩu
    │   │   └── verify-2fa/         # Xác thực 2 lớp (TOTP) cho Admin
    │   │
    │   ├── admin/                  # Route cho Quản trị viên (Admin Studio)
    │   │   ├── layout.tsx          # Layout Admin (Sidebar, Auth Guard, nạp danh sách sản phẩm)
    │   │   ├── page.tsx            # Dashboard tổng quan (/admin)
    │   │   ├── products/page.tsx   # Quản lý sản phẩm, tìm kiếm & phân trang (/admin/products)
    │   │   ├── orders/page.tsx     # Quản lý đơn hàng (/admin/orders)
    │   │   ├── customers/page.tsx  # Quản lý khách hàng (/admin/customers)
    │   │   └── security/page.tsx   # Quản lý phiên đăng nhập & bảo mật 2FA (/admin/security)
    │   │
    │   └── api/                    # TẦNG 4: RESTful API Route Handlers (xem giải thích Mục 3)
    │       ├── auth/[...all]/route.ts
    │       ├── products/route.ts
    │       ├── products/[slug]/route.ts
    │       ├── products/[slug]/related/route.ts
    │       ├── recently-viewed/route.ts
    │       ├── cart/route.ts
    │       └── upload/route.ts
    │
    ├── components/                 # TẦNG 2A: Presentational UI Components (chia theo Domain)
    │   ├── ui/                     # Các thành phần UI nguyên tử tái sử dụng (Pagination, Field, Accordion, Icons...)
    │   ├── layout/                 # Header, Footer, MobileMenu, SearchOverlay, TopProgressBar
    │   ├── home/                   # Các khối giao diện Trang chủ (HomeVideoBanner, HomeEditorialTile...)
    │   ├── product/                # ProductCard, ProductGallery, ProductInfo, ProductComboLook, FilterDrawer...
    │   ├── cart/                   # CartItemRow, CartSummary, FlyToCart
    │   ├── checkout/               # CheckoutForm, CheckoutContactStep, CheckoutAddressStep, OrderSummaryAside
    │   └── admin/                  # Các bảng, thanh tìm kiếm, modal thêm/sửa sản phẩm của Admin Studio
    │
    ├── hooks/                      # TẦNG 2B: Custom React Hooks (đóng gói toàn bộ logic tương tác UI)
    │   ├── useAuthSync.ts          # Đồng bộ phiên Better Auth với Zustand (useAuthStore, useCartStore, RecentlyViewed)
    │   ├── useShopCatalog.ts       # Điều phối bộ lọc, phân trang & gọi API cho trang /shop
    │   ├── useProductDetail.ts     # Điều phối API chi tiết, sản phẩm tương tự & sản phẩm đã xem
    │   ├── useCart.ts              # Tính toán tạm tính, giảm giá, phí ship và thao tác giỏ hàng
    │   ├── useCheckout.ts          # Kiểm duyệt form giao hàng, tạo tin nhắn Instagram & lưu đơn tham chiếu
    │   ├── useAdminProducts.ts     # Tìm kiếm trên store, lọc danh mục, phân trang & CRUD sản phẩm Admin
    │   ├── usePagination.ts        # Thuật toán tính dải số trang và dấu "..." (DOTS) dùng chung
    │   └── useDebounce.ts          # Debounce giá trị nhập liệu tìm kiếm
    │
    ├── service/                    # TẦNG 3: Business Service & State Management (chia theo Module nghiệp vụ)
    │   ├── auth/                   # schema.ts (Zod), store.ts (useAuthStore)
    │   ├── products/               # queries.ts (GET /api/products*), actions.ts (CRUD /api/admin/products), store.ts (useProductStore), schema.ts
    │   ├── cart/                   # queries.ts (GET /api/cart), actions.ts (POST/DELETE /api/cart), store.ts (useCartStore), schema.ts
    │   ├── orders/                 # store.ts (useOrderStore), schema.ts, actions.ts
    │   └── ui/                     # store.ts (useUiStore điều khiển TopProgressBar)
    │
    ├── server/                     # TẦNG 5: Server-Only Core & DB Queries/Actions (chỉ chạy trên Server, có "server-only")
    │   ├── products/
    │   │   ├── queries.ts          # Truy vấn ĐỌC Prisma (shop catalog, product detail, related, shared link, recently viewed)
    │   │   └── actions.ts          # Truy vấn GHI Prisma (Admin CRUD sản phẩm, tồn kho, share link, AuditLog & lưu lịch sử xem)
    │   ├── cart/
    │   │   ├── queries.ts          # Truy vấn ĐỌC Prisma cho giỏ hàng User & Guest
    │   │   └── actions.ts          # Truy vấn GHI Prisma (thêm/xóa giỏ hàng & đồng bộ khi đăng nhập)
    │   ├── db/
    │   │   ├── client.ts           # Singleton PrismaClient kết nối Neon PostgreSQL qua @prisma/adapter-pg
    │   │   └── mappers.ts          # Hàm mapPrismaItemToProduct chuẩn hóa dữ liệu DB sang kiểu Product của FE
    │   └── auth/
    │       ├── client.ts           # Khởi tạo Better Auth Server (Cookie Cache Access Token + DB Refresh Token)
    │       ├── queries.ts          # Hàm getSession(), getFreshSession(), requireUser(), requireAdmin()
    │       └── actions.ts          # Hàm sendAuthEmail() gửi email xác thực / khôi phục mật khẩu
    │
    ├── config/                     # Cấu hình hằng số & hàm tiện ích dùng chung (utils.ts, auth.ts)
    ├── lib/                        # Client SDK (auth-client.ts khởi tạo Better Auth React Client)
    └── types/                      # Định nghĩa toàn bộ TypeScript Interfaces dùng chung (index.ts)
```

---

## 3. Tại Sao Thư Mục `src/app/api/` Được Thiết Kế Như Vậy?

Trong **Next.js 15 App Router**, thư mục `src/app/api/` sử dụng cơ chế **File-system Route Handlers** (mỗi file `route.ts` đại diện cho một HTTP endpoint theo chuẩn Web `Request` / `Response`). Kiến trúc thư mục `src/app/api/` của dự án được thiết kế dựa trên **4 nguyên lý cốt lõi của RESTful API**:

```text
src/app/api/
├── auth/
│   └── [...all]/route.ts          # Catch-all Route cho toàn bộ hệ thống xác thực Better Auth
├── admin/
│   └── products/route.ts          # Admin Resource: GET, POST, PATCH, DELETE /api/admin/products
├── products/
│   ├── route.ts                   # Collection Resource: GET /api/products (Lọc, Tìm kiếm, Phân trang)
│   └── [slug]/
│       ├── route.ts               # Item Resource: GET /api/products/:slug (Chi tiết 1 sản phẩm + Combo)
│       └── related/
│           └── route.ts           # Sub-resource: GET /api/products/:slug/related (Sản phẩm tương tự)
├── share/
│   └── [code]/route.ts            # Shared Link Resource: GET /api/share/:code (Trang tĩnh cho KH)
├── recently-viewed/
│   └── route.ts                   # User/Guest History Resource: GET & POST /api/recently-viewed
├── cart/
│   └── route.ts                   # Singleton User Resource: GET, POST, DELETE /api/cart
└── upload/
    └── route.ts                   # Utility Resource: POST /api/upload
```

### Giải thích lý do thiết kế từng nhánh trong `src/app/api/`:

1. **Phân cấp Tài nguyên theo chuẩn REST (`Collection` -> `Item` -> `Sub-resource`)**:
   - **`/api/products/route.ts` (Collection)**: Đại diện cho tập hợp sản phẩm. Nhận các query parameters (`?category=Top&sizes=M,L&maxPrice=400&sort=lo&page=1&pageSize=9`) để lọc trên toàn bộ cơ sở dữ liệu và trả về kết quả phân trang.
   - **`/api/products/[slug]/route.ts` (Single Item)**: Sử dụng Dynamic Segment `[slug]` để định danh duy nhất một sản phẩm theo đường dẫn thân thiện SEO (hoặc ID). Endpoint này tải thêm cả các sản phẩm phối cùng bộ (`comboId`).
   - **`/api/products/[slug]/related/route.ts` (Sub-resource)**: Vì danh sách "Sản phẩm tương tự" phụ thuộc trực tiếp vào sản phẩm `[slug]` đang xem, việc đặt `related/route.ts` bên trong `[slug]/` thể hiện đúng mối quan hệ cha-con (`/api/products/:slug/related`) và cho phép tách biệt truy vấn chi tiết sản phẩm với truy vấn gợi ý sản phẩm (tránh làm chậm thời gian tải thông tin chính của sản phẩm).

2. **Tách biệt Tài nguyên theo Ngữ cảnh Người dùng (`/api/cart` và `/api/recently-viewed`)**:
   - **`/api/cart/route.ts`**: Giỏ hàng là tài nguyên gắn liền với phiên của người dùng hiện tại (`session.user.id`). Do đặc thù mỗi sản phẩm second-hand chỉ có **1 chiếc duy nhất (`qty = 1`)**, chúng ta không cần route `/api/cart/[itemId]` để `PATCH` tăng/giảm số lượng, mà chỉ cần gom gọn 3 method `GET` (lấy giỏ hàng & tự động dọn các món đã bán), `POST` (thêm 1 món hoặc đồng bộ giỏ hàng Guest khi vừa đăng nhập), và `DELETE` (xóa 1 món hoặc xóa toàn bộ giỏ) trong cùng 1 file `route.ts`.
   - **`/api/recently-viewed/route.ts`**: Xử lý bài toán lai (Hybrid Storage) giữa **User đã đăng nhập** (đọc/ghi bảng `recently_viewed_items` trong PostgreSQL) và **Guest chưa đăng nhập** (nhận danh sách ID từ `localStorage` qua `?ids=...` để trả về thông tin sản phẩm tươi nhất từ DB).

3. **Catch-All Route cho Authentication (`/api/auth/[...all]/route.ts`)**:
   - Cú pháp `[...all]` của Next.js bắt mọi đường dẫn con dưới `/api/auth/*` (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`, `/api/auth/callback/google`, `/api/auth/get-session`, `/api/auth/sign-out`, `/api/auth/two-factor/*`) và chuyển tiếp thẳng vào bộ xử lý `toNextJsHandler(auth.handler)` của Better Auth. Nhờ đó không phải viết thủ công hàng chục file route lẻ tẻ cho từng bước xác thực.

4. **Đồng nhất 100% Truy vấn Cơ sở dữ liệu tại `src/app/api/**/route.ts`**:
   - Mọi tương tác đọc/ghi xuống PostgreSQL (`prisma.*`) của cả **Storefront (Khách hàng)** lẫn **Admin Studio (`/api/admin/products/route.ts`)** đều đi qua một cổng duy nhất là **`src/app/api/**/route.ts`**.
   - Tầng **`src/service/<module>/`** (`queries.ts`, `actions.ts`) hoàn toàn chạy ở phía Client làm nhiệm vụ gọi HTTP `fetch('/api/...')` và đồng bộ dữ liệu với **Zustand Store (`store.ts`)**, giúp kiến trúc rõ ràng, dễ hiểu và không bị chồng chéo giữa Server Actions và API Routes.

---

## 4. Kiến Trúc Quản Lý State Phía Client (Zustand Stores)

Dự án sử dụng 5 Zustand Store chuyên biệt (không dùng Context APIồng kềnh):

| Tên Store | File Định Nghĩa | Vai Trò & Cơ Chế Hoạt Động | Lưu Trữ (`localStorage`) |
| :--- | :--- | :--- | :--- |
| **`useProductStore`** | [`src/service/products/store.ts`](../src/service/products/store.ts) | Lưu trữ: <br>1. `shopProducts`, `shopTotal`, `shopTotalPages` cho trang `/shop` hiện tại.<br>2. `products`: Bộ nhớ đệm (Normalized Cache) gộp tất cả sản phẩm đã tải từ `/shop`, trang chi tiết, hoặc Admin để tra cứu tức thì.<br>3. `recentlyViewedIds`: Mảng ID sản phẩm đã xem cho khách vãng lai (Guest). | `tage-products-storage` |
| **`useCartStore`** | [`src/service/cart/store.ts`](../src/service/cart/store.ts) | Quản lý giỏ hàng độc bản (`qty = 1` cho mỗi món). Hỗ trợ **Optimistic UI** (cập nhật giao diện ngay lập tức khi thêm/xóa) và đồng bộ ngầm với PostgreSQL qua `/api/cart`. Tự động gộp giỏ hàng từ `localStorage` lên DB khi đăng nhập (`syncWithServer`). | `tage-cart-storage` |
| **`useAuthStore`** | [`src/service/auth/store.ts`](../src/service/auth/store.ts) | Lưu thông tin hồ sơ người dùng (`id`, `name`, `email`, `role`). Được đồng bộ tự động theo thời gian thực với phiên Better Auth thông qua hook `useAuthSync`. | `tage-auth-storage` |
| **`useOrderStore`** | [`src/service/orders/service.ts`](../src/service/orders/service.ts) | Lưu đơn hàng tham chiếu vừa tạo và nội dung tin nhắn Instagram (`lastInstagramMessage`) để hiển thị lại ở trang `/checkout/success`. | `tage-orders-storage` |
| **`useUiStore`** | [`src/service/ui/store.ts`](../src/service/ui/store.ts) | Quản lý thanh tiến trình `TopProgressBar` khi chuyển trang hoặc đang tải dữ liệu API. | Chỉ lưu trên RAM |

---

## 5. Thiết Kế Cơ Sở Dữ Liệu (Prisma + Neon PostgreSQL)

Lược đồ [`prisma/schema.prisma`](../prisma/schema.prisma) đã được tinh gọn tối đa cho mục tiêu triển khai nhanh **MVP**, chỉ giữ lại đúng **12 bảng cốt lõi**:

1. **Nhóm Xác thực & Bảo mật (6 bảng chuẩn Better Auth)**:
   - `User` (`users`): Thông tin tài khoản, vai trò (`user` / `admin`), trạng thái 2FA.
   - `Session` (`sessions`): Lưu Refresh Token (`token`), thời hạn (`expiresAt`), IP, User-Agent.
   - `Account` (`accounts`): Lưu mật khẩu băm (email/password) và OAuth tokens (`accessToken`, `refreshToken` của Google).
   - `Verification` (`verifications`): Lưu mã/token xác thực email và đặt lại mật khẩu.
   - `TwoFactor` (`two_factors`): Lưu khóa bí mật TOTP và backup codes cho Admin.
   - `RateLimit` (`rate_limits`): Chống brute-force đăng nhập và giới hạn tần suất gọi API xác thực.
2. **Nhóm Danh mục & Sản phẩm Độc bản 1-of-1 (3 bảng)**:
   - `Category` (`categories`): Danh mục sản phẩm (`Top`, `Bottom`, `Outerwear`, `New Arrivals`).
   - `Item` (`items`): Mỗi dòng là **1 sản phẩm độc bản duy nhất** (`sku`, `slug`, `title`, `priceMinor`, `sizeLabel`, `status: AVAILABLE | SOLD`, `isNew`, `comboId`, `comboTitle`).
   - `ItemImage` (`item_images`): Danh sách hình ảnh chính thức và hình ảnh tạm (`isTemporary`) của từng sản phẩm.
3. **Nhóm Trải nghiệm Mua sắm Khách hàng (2 bảng mới)**:
   - `CartItem` (`cart_items`): Giỏ hàng lưu DB cho người dùng đã đăng nhập (`@@unique([userId, itemId])`).
   - `RecentlyViewed` (`recently_viewed_items`): Lịch sử xem sản phẩm của người dùng đã đăng nhập (`@@unique([userId, itemId])`, đánh chỉ mục theo `[userId, viewedAt(sort: Desc)]`).
4. **Nhóm Kiểm toán Quản trị (1 bảng)**:
   - `AuditLog` (`audit_logs`): Ghi vết toàn bộ thao tác thêm/sửa/xóa sản phẩm và cập nhật tồn kho của Admin.
