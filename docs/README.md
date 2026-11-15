# Trung Tâm Tài Liệu Kiến Trúc & Luồng Nghiệp Vụ — TAGE E-Commerce

> **YÊU CẦU BẮT BUỘC TRƯỚC KHI CODE**: Mọi lập trình viên và AI Agent khi tham gia phát triển hoặc chỉnh sửa mã nguồn TAGE **bắt buộc phải đọc và tuân thủ nghiêm ngặt** các tài liệu trong thư mục `docs/` này.

---

## 📚 1. Tài Liệu Nền Tảng (Core Specifications)

| Tài liệu | Mô tả nội dung |
| :--- | :--- |
| [**1. AGENT_RULES.md**](./AGENT_RULES.md) | **Quy tắc bắt buộc cho AI Agent & Developer**. 7 điều nghiêm cấm tuyệt đối và Checklist kiểm tra trước khi hoàn thành task. |
| [**2. ARCHITECTURE.md**](./ARCHITECTURE.md) | **Kiến trúc Hệ thống & Cấu trúc Thư mục**. Phân tích kiến trúc 5 tầng, lý do thiết kế từng thư mục (đặc biệt là `src/app/api/`), cơ chế Zustand Store và lược đồ PostgreSQL MVP. |
| [**3. CONVENTIONS.md**](./CONVENTIONS.md) | **Quy chuẩn Code & Đặt tên**. Quy tắc đặt tên file, thư mục, Component, Hook, Store, quy tắc Server vs Client Component và TypeScript strictness. |

---

## 🔄 2. Tài Liệu Luồng Chi Tiết Theo Từng Tính Năng (Feature Implementation Flows)

Mỗi tài liệu dưới đây giải thích chi tiết luồng hoạt động từ giao diện (UI) -> Hook -> Service/Zustand Store -> API Route/Server Action -> Prisma PostgreSQL đã được triển khai trong code:

| STT | Tài liệu Luồng Tính năng | Nội dung chi tiết |
| :---: | :--- | :--- |
| **01** | [**Luồng Xác Thực & Phiên Đăng Nhập**](./flows/01-auth-and-session-flow.md) | Đăng nhập Email/Password & Google OAuth, cơ chế Dual-Token (Access Token Cookie Cache 5 phút + Refresh Token DB 7 ngày), bảo vệ `/admin` và đồng bộ Client qua `useAuthSync`. |
| **02** | [**Luồng Trang Chủ, Danh Sách Sản Phẩm, Lọc & Phân Trang**](./flows/02-home-and-catalog-flow.md) | Trang chủ (`/`), gọi API `/api/products` tại trang `/shop`, lọc dữ liệu trực tiếp trên DB, phân trang và cơ chế lưu `shopProducts` + merge cache vào `useProductStore`. |
| **03** | [**Luồng Chi Tiết Sản Phẩm, Tương Tự & Đã Xem**](./flows/03-product-detail-flow.md) | Gọi API `/api/products/[slug]` (kèm phối đồ `comboId`), API sản phẩm tương tự (`/related`) và cơ chế lai cho Sản phẩm đã xem (`/api/recently-viewed`: DB cho User / `localStorage` cho Guest). |
| **04** | [**Luồng Giỏ Hàng (1-of-1) & Checkout Instagram**](./flows/04-cart-and-checkout-flow.md) | Thiết kế API giỏ hàng `/api/cart` cho đồ 2hand độc bản (`qty = 1`), Optimistic UI trên `useCartStore`, tự động gộp giỏ hàng khi đăng nhập và luồng đặt hàng qua Instagram Direct (`/cart`, `/checkout`, `/checkout/success`). |
| **05** | [**Luồng Quản Trị Admin Studio**](./flows/05-admin-studio-flow.md) | Quản lý danh sách sản phẩm tại `/admin/products`, nạp dữ liệu từ DB vào `useProductStore`, tìm kiếm tức thì trên Store, phân trang và ghi vết `AuditLog` qua Server Actions. |
