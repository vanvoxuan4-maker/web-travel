# 🌍 WebTravel – Nền Tảng Đặt Tour Du Lịch & Trải Nghiệm Cao Cấp

<p align="center">
  <img src="./public/images/banner_halong.png" alt="WebTravel Banner" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/CSS3-Custom_Design_System-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-059669?style=for-the-badge" alt="Status" />
</p>

---

## 📖 Giới Thiệu Dự Án (Overview)

**WebTravel** là nền tảng thương mại điện tử du lịch thế hệ mới, được thiết kế theo phong cách tạp chí biên tập cao cấp (**Editorial Luxury Aesthetics**). Hệ thống cung cấp trải nghiệm toàn diện cho du khách từ tìm kiếm, so sánh hành trình, tra cứu lịch trình bay, dự toán ngân sách cho đến đặt chỗ trực tuyến và thanh toán tự động qua mã **VietQR Napas 247**.

Dự án được xây dựng trên nền tảng **React 18 + TypeScript + Vite**, kết hợp hệ thống Design System thuần CSS tinh gọn, tối ưu hóa hiệu năng render và tuân thủ các tiêu chuẩn bảo mật web nghiêm ngặt.

---

## 🌟 Tính Năng Nổi Bật (Core Features)

### 1. 🏖️ Khám Phá & Bộ Lọc Hành Trình Thông Minh (Tour Explorer)
* **Hero Showcase Slider:** Trình diễn các điểm đến biểu tượng với hình ảnh chất lượng cao và thông tin nổi bật.
* **Bộ Lọc Đa Tiêu Chí:** Tìm kiếm tức thì theo từ khóa, điểm khởi hành (Hà Nội, TP.HCM, Đà Nẵng), loại hình tour (Biển đảo, Nghỉ dưỡng, Khám phá...), tiêu chuẩn sao khách sạn (3★ - 5★) và mức ngân sách.
* **Bento Grid Layout:** Thẻ tour thiết kế hiện đại, hiển thị trực quan giá gốc, giá ưu đãi, thời lượng, tiêu chuẩn khách sạn và số chỗ còn nhận.
* **So Sánh Tour Đối Soát:** Cho phép chọn tối đa 4 tour để so sánh trực quan từng tiêu chí (Giá, Độ tuổi, Tiêu chuẩn xe/khách sạn, Chỉ số trải nghiệm).

---

### 2. 🗺️ Trang Chi Tiết Tour Đẳng Cấp (Tour Detail Experience)
* **Magazine Gallery Showcase:** Bộ sưu tập ảnh phong cách biên tập, tự động phóng to xem chi tiết độ nét cao.
* **Thanh Chỉ Số Độc Quyền:**
  * **LEI (Local Experience Index):** Đánh giá mức độ trải nghiệm văn hóa bản địa.
  * **ESG Score:** Đánh giá tiêu chuẩn du lịch xanh và trách nhiệm môi trường.
* **Lịch Khởi Hành & Chặng Bay Tương Tác:**
  * **Tự động tính Thứ trong tuần (`getDayOfWeekVN`):** Ánh xạ chính xác lịch vạn niên cho từng ngày đi.
  * **Lộ trình bay khứ hồi (Outbound & Inbound):** Hiển thị số hiệu chuyến bay, hãng hàng không, giờ cất cánh/hạ cánh và timeline đường bay.
  * **Bảng phân bổ giá tour 4 độ tuổi:** Minh bạch chi phí cho Người lớn, Trẻ em (5–11t), Trẻ nhỏ (2–4t) và Em bé (<2t).
* **Lịch Trình Chi Tiết (Itinerary Timeline):** Khung lịch trình từng ngày kèm hình ảnh minh họa, thực đơn ăn uống và điểm tham quan.
* **Tiêu Chuẩn Khách Sạn & Dịch Vụ:** Thông số phòng nghỉ, danh mục dịch vụ bao gồm/không bao gồm và chính sách hoàn hủy rõ ràng.

---

### 3. 🛒 Hệ Thống Đặt Chỗ & Thanh Toán Độc Lập (Checkout Engine)
* **Trang Checkout Riêng Biệt (`/checkout/:tourId`):** Không dùng popup, tối ưu hóa không gian hiển thị và tăng tỷ lệ hoàn tất đơn hàng.
* **Quy Trình 4 Bước Chuẩn Hóa:**
  * **Bước 1:** Khung xác nhận ngày khởi hành (kèm lưới chọn ngày khác được căn chỉnh cân đối, thẳng hàng 100%).
  * **Bước 2:** Chọn số lượng khách theo 4 phân tầng độ tuổi với cơ chế **khóa số lượng tự động khi hết chỗ**.
  * **Bước 3:** Tùy chọn sắp xếp phòng khách sạn (Phòng đôi tiêu chuẩn vs Phòng đơn riêng) và gói dịch vụ mở rộng (Bảo hiểm quốc tế, Xe Limousine đón tận nhà).
  * **Bước 4:** Thu thập thông tin người đại diện nhận vé an toàn.
* **Bảng Giá & Thanh Toán Thông Minh:**
  * Đồng hồ đếm ngược giữ chỗ an toàn `15:00`.
  * Áp dụng mã Voucher giảm giá trực tiếp (`SUMMER2026`, `VIP1000`).
  * Lựa chọn **Thanh toán 100%** hoặc **Đặt cọc giữ chỗ 50%**.
* **Thanh Toán Tự Động Qua VietQR:** Tự động sinh mã QR Napas 247 chính xác theo số tiền và cú pháp chuyển khoản tương ứng với mã hồ sơ `WT-xxxxxx`.

---

### 4. 🛠️ Bộ Tiện Ích Du Lịch Chuyên Nghiệp (Smart Travel Tools)

| Tiện Ích | Mô Tả Chi Tiết |
| :--- | :--- |
| 🧮 **Dự Toán Ngân Sách Pro** | Dự toán 6 danh mục chi phí (Tour, Khách sạn, Chặng bay, Ăn uống, Mua sắm, Quỹ dự phòng 10%), biểu đồ Stacked Bar Chart theo tỷ lệ %, hỗ trợ In/Xuất phiếu dự toán. |
| 💱 **Đổi Tỷ Giá 2 Chiều & Múi Giờ** | Chuyển đổi ngoại tệ 2 chiều theo thời gian thực (VND, USD, JPY, EUR, THB, KRW) qua API liên ngân hàng quốc tế; Đồng hồ múi giờ IANA chạy giây thời gian thực. |
| 🎒 **Gợi Ý Checklist Hành Lý** | 4 bộ danh mục hành lý được cá nhân hóa cho từng loại hình (Biển đảo, Leo núi, Quốc tế, Gia đình), tick sẵn các vật phẩm thiết yếu bắt buộc. |
| 🎨 **Tự Thiết Kế Tour (Custom Builder)** | Phác thảo lộ trình tự động cho khách đoàn riêng/tour may đo theo số ngày, điểm đến và phong cách mong muốn. |

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

* **Ngôn Ngữ & Framework:** React 18, TypeScript (Strict Mode).
* **Định Tuyến:** React Router v6 (SPA Navigation with ScrollToTop).
* **Trình Đóng Gói (Bundler):** Vite v6 (Build cực nhanh, bundle nén ~103 kB).
* **Giao Diện & Styling:** CSS3 Vanilla Design System (CSS Custom Properties, Glassmorphism, BEM Methodology).
* **Quản Lý Dữ Liệu:** In-Memory & LocalStorage Inventory State Manager, Dual Live Forex API.
* **Bảo Mật:** XSS Input Sanitization, Parametric Validation, Rate Limiting & Debouncing Search.

---

## 📁 Cấu Trúc Thư Mục (Project Architecture)

```text
webtravel/
├── public/                      # Static assets & public images
│   └── images/                  # Banner & destination photos
├── src/
│   ├── assets/                  # Bundled assets
│   ├── components/              # Reusable React components
│   │   ├── ai/                  # AI Travel Assistant Modal
│   │   ├── booking/             # Booking engine components
│   │   ├── home/                # Hero Slider & Home sections
│   │   ├── layout/              # Navbar, Footer & Layout wrappers
│   │   ├── tools/               # Budget, Currency, Packing & Builder tools
│   │   └── tour/                # TourCard, Comparison, ETicket modals
│   ├── css/                     # Design System stylesheets
│   │   ├── modules/             # Modular CSS (Header, Slider, Cards, Modals...)
│   │   ├── components.css       # Core UI components
│   │   ├── variables.css        # Color tokens, typography, radii, shadows
│   │   └── main.css             # Main stylesheet entry
│   ├── data/                    # Master Mock Data & Tours Catalog
│   │   └── toursData.ts         # Centralized tour specifications
│   ├── hooks/                   # Custom React hooks (useTourFilter)
│   ├── pages/                   # Main Page Views
│   │   ├── HomePage.tsx         # Trang chủ
│   │   ├── TourDetailPage.tsx   # Trang chi tiết tour
│   │   ├── CheckoutPage.tsx     # Trang đặt tour & thanh toán
│   │   ├── AdminDashboardPage.tsx # Bảng quản trị tour
│   │   └── detail-sections/     # Sub-sections của trang chi tiết tour
│   ├── types/                   # TypeScript interfaces & type definitions
│   ├── utils/                   # Helper functions (formatters, inventory, sanitization)
│   ├── App.tsx                  # App Root & Route Declarations
│   └── main.tsx                 # React DOM Entrypoint
├── index.html                   # HTML Entry
├── package.json                 # Dependencies & Scripts
├── tsconfig.json                # Strict TypeScript Compiler Options
└── vite.config.ts               # Vite Configuration
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Getting Started)

### 1. Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 18.0.0`
* **npm:** Phiên bản `>= 9.0.0`

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Khởi chạy máy chủ phát triển (Development Server)
```bash
npm run dev
```
👉 Mở trình duyệt và truy cập: **`http://localhost:3000`**

### 4. Kiểm tra kiểu dữ liệu & Đóng gói Production
```bash
# Kiểm tra TypeScript Type Check
npm run type-check

# Đóng gói Production Bundle
npm run build

# Xem trước bản Production
npm run preview
```

---

## 🔒 Quy Tắc Phát Triển & Chuẩn Mã Nguồn (`AGENTS.md`)

Dự án tuân thủ nghiêm ngặt **10 Nguyên Tắc Kỹ Thuật**:
1. **No Guessing & Questioning Protocol:** Xác nhận yêu cầu kỹ thuật trước khi code.
2. **Clean Dependencies & Zero Dead Code:** Bật `"noUnusedLocals": true`, `"noUnusedParameters": true`, không để lại dead imports.
3. **Security by Design:** Chống tấn công XSS, bảo mật dữ liệu khách hàng, mã hóa thông tin thanh toán VietQR.
4. **No Regression:** Bảo vệ tuyệt đối các tính năng và logic nghiệp vụ hiện có.
5. **High Performance:** Tối ưu hóa render React, kích thước bundle siêu nhẹ (<105 kB gzipped).

---

## 📜 Giấy Phép (License)

Dự án được phát triển và sở hữu bởi **WebTravel Editorial Team**. Bản quyền thuộc về WebTravel 2026.
