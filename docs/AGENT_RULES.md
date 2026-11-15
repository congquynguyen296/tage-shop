# Quy Tắc Bắt Buộc Cho AI Agent & Developer (Agent Checklist)

> **DÀNH CHO MỌI AI AGENT**: Mỗi khi thực hiện thêm tính năng, sửa lỗi hoặc refactor trên dự án này, bạn **BẮT BUỘC** phải đọc và tuân thủ tuyệt đối các quy tắc dưới đây.

---

## 1. Tài Liệu Bắt Buộc Đọc Trước Khi Viết Code

Trước khi tạo file mới hoặc chỉnh sửa file hiện có:
1. Đọc [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) để nắm rõ cấu trúc 5 tầng và vị trí đặt file đúng chuẩn.
2. Đọc [`docs/CONVENTIONS.md`](./CONVENTIONS.md) để đặt tên file, component, hook, store và định nghĩa kiểu TypeScript chính xác.
3. Đọc các file trong [`docs/flows/`](./flows/) liên quan đến tính năng đang sửa để hiểu rõ luồng dữ liệu đầu-cuối.

---

## 2. 7 Quy Tắc Nghiêm Cấm Tuyệt Đối (Strictly Prohibited Rules)

1. ❌ **CẤM viết logic gọi API (`fetch`) hoặc xử lý nghiệp vụ trực tiếp bên trong UI Component / Page**:
   - Các file `page.tsx` và `src/components/**` chỉ chịu trách nhiệm hiển thị giao diện và nhận dữ liệu từ Custom Hooks (`src/hooks/*`) hoặc Service (`src/service/<module>/queries.ts`, `actions.ts`, `store.ts`).
2. ❌ **CẤM gửi dữ liệu lên Server / API mà không qua kiểm duyệt Zod Schema**:
   - Mọi dữ liệu đầu vào từ form (Đăng nhập, Đăng ký, Checkout, Tạo/Sửa sản phẩm) và payload của API Route đều phải được parse qua schema trong `schema.ts` hoặc đầu file `route.ts`.
3. ❌ **CẤM sử dụng kiểu `any` dưới mọi hình thức**:
   - Mọi biến, tham số hàm, kết quả trả về từ Prisma hoặc API đều phải được định kiểu tường minh từ `src/types/index.ts`, `src/server/db/mappers.ts`, hoặc suy diễn từ Zod Schema.
4. ❌ **CẤM import đường dẫn tương đối sâu quá 2 cấp** (ví dụ: `../../../../service`):
   - Bắt buộc sử dụng alias `@/service/...`, `@/components/...`, `@/hooks/...`, `@/server/...`, `@/types/...`.
5. ❌ **CẤM thay đổi tên thương hiệu**:
   - Tên thương hiệu chính thức và duy nhất là **`TAGE`**.
6. ❌ **CẤM sử dụng dữ liệu Mock tĩnh thay cho API trên các luồng chính**:
   - Mọi dữ liệu sản phẩm, bộ lọc, phân trang, chi tiết sản phẩm, sản phẩm tương tự, lịch sử đã xem và giỏ hàng đều phải gọi API kết nối PostgreSQL thực tế.
7. ❌ **CẤM bỏ qua bước kiểm tra TypeScript trước khi kết thúc công việc**:
   - Luôn chạy `npx tsc --noEmit` để đảm bảo **0 lỗi TypeScript** trên toàn dự án.

---

## 3. Checklist Kiểm Tra Trước Khi Hoàn Thành Task

- [ ] File mới tạo nằm đúng tầng kiến trúc quy định trong `docs/ARCHITECTURE.md`.
- [ ] Dữ liệu đầu vào/đầu ra đã có Zod Schema kiểm duyệt.
- [ ] State được lưu và cập nhật đúng chuẩn trên Zustand Store (`useProductStore`, `useCartStore`, `useAuthStore`, `useOrderStore`).
- [ ] Có khai báo `"use client";` ở dòng 1 đối với các file sử dụng React Hooks hoặc Browser APIs.
- [ ] Tách nhỏ các thành phần giao diện phức tạp thành các sub-component độc lập; không để `page.tsx` phình to.
- [ ] Đã chạy `npx tsc --noEmit` với kết quả **0 Errors**.
