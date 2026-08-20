# 📚 BẢN THIẾT KẾ & YÊU CẦU CHỨC NĂNG HỆ THỐNG WEBSITE DU LỊCH TOÀN DIỆN
*(Enterprise Travel Platform Functional Blueprint & Specifications)*

Dự án: **WebTravel Editorial & Booking Platform**  
Đơn vị phát triển: **Google DeepMind Agentic Pair Programming**  

---

## 🏛️ TỔNG QUAN PHÂN HỆ NGUYÊN TẮC (SYSTEM ARCHITECTURE ROLES)

Hệ thống được thiết kế hoàn chỉnh với 4 phân hệ chính:
1. **User Frontend (Dành cho Khách hàng)**: Trải nghiệm tìm kiếm, chọn lọc, đặt tour & tiện ích hành trình.
2. **Admin Dashboard (Dành cho Nhà quản lý)**: Quản lý tour, tồn chỗ, đơn hàng, CRM khách hàng & báo cáo doanh thu.
3. **Advanced Integrations (Tích hợp nâng cao)**: Đa ngôn ngữ, đa tiền tệ & Trợ lý Chatbot AI.
4. **Legal & Conversion Optimization (Pháp lý, Bản đồ & Tối ưu chuyển đổi)**: Hủy/hoàn tiền, Visa, Xuất PDF, Mã QR vé điện tử & Voucher Engine.

---

## 👥 I. PHÂN HỆ KHÁCH HÀNG (USER FRONTEND)

### 🟢 1. Core Booking Engine (Bộ Máy Tìm Kiếm & Đặt Tour)
- **Bộ Lọc Thông Minh (Smart Search & Filter)**:
  - Lọc theo Điểm đến, Ngày đi/về, Mức giá, Số lượng khách.
  - **Lọc theo Tiêu chuẩn Hạng Sao Khách Sạn**: *3★ Tiết kiệm*, *4★ Phổ thông*, *5★ Luxury Resort*.
  - Lọc theo Loại hình tour: *Nghỉ dưỡng*, *Văn hóa - Di sản*, *Mạo hiểm & Khám phá*, *Gia đình*.
- **Chi Tiết Tour & Transparency Specs**:
  - Dòng thời gian lịch trình chi tiết từng ngày (Day-by-Day Itinerary).
  - Minh bạch danh sách khách sạn dự kiến & tiêu chuẩn phòng (Twin/Double, kèm buffet sáng).
  - Danh mục Giá tour trọn gói ĐÃ BAO GỒM & KHÔNG BAO GỒM.
  - Chính sách hủy hoàn rõ ràng & vị trí tích hợp bản đồ.
- **Quy Trình Đặt Chỗ & Thanh Toán (Booking & Checkout)**:
  - Tùy chọn ngày khởi hành & số lượng hành khách.
  - Áp dụng Mã giảm giá (Voucher / Coupon Engine).
  - Tích hợp mô phỏng cổng thanh toán đa dạng: *Chuyển khoản QR ngân hàng (VietQR)*, *VNPAY*, *MoMo*, *Visa/Mastercard*.

---

### 🔵 2. Tra Cứu Thông Tin & Tương Tác (Content & Customer Portal)
- **Góc Tạp Chí & Cẩm Nang Du Lịch (Editorial Travel Journal / Blog)**:
  - Bài viết chia sẻ kinh nghiệm chuyến đi, ẩm thực địa phương, thời tiết từng mùa giúp chuẩn hóa SEO.
- **Đánh Giá & Bình Luận (Reviews & Ratings System)**:
  - Khách hàng để lại đánh giá sao, bình luận & hình ảnh thực tế sau chuyến đi.
- **Trang Quản Lý Cá Nhân (User Portal)**:
  - Quản lý lịch sử đơn hàng (*Đã xác nhận, Đã thanh toán, Đã hủy*).
  - Danh sách tour đã lưu yêu thích (Wishlist).
  - Tải **Vé điện tử (E-ticket)** & Hóa đơn tự động.

---

## ⚙️ II. PHÂN HỆ NHÀ QUẢN LÝ (ADMIN DASHBOARD)

### 📊 1. Quản Lý Sản Phẩm & Tồn Chỗ (Tour & Inventory Management)
- **CRUD Sản Phẩm Tour**: Thêm mới, chỉnh sửa, ẩn/xóa lịch trình tour.
- **Bảng Giá Theo Mùa (Seasonal Dynamic Pricing)**: Điều chỉnh giá linh hoạt theo mùa cao điểm / thấp điểm / ngày lễ Tết.
- **Quản Lý Số Lượng Chỗ (Availability & Capacity Tracker)**: Cài đặt hạn ngạch số chỗ trống còn lại cho từng ngày khởi hành.

### 📋 2. Quản Lý Đơn Hàng & CRM (Booking & Customer Management)
- **Quản Lý Đặt Chỗ (Booking Operations)**: Tiếp nhận đơn đặt tour, xác nhận giữ chỗ, cập nhật trạng thái thanh toán.
- **Tự Động Hóa Email (Auto Email Dispatcher)**: Tự động gửi Email xác nhận, Vé điện tử (E-ticket) & Email nhắc lịch trước ngày khởi hành.
- **Quản Lý Khách Hàng (CRM)**: Lưu trữ hồ sơ thông tin liên hệ, lịch sử giao dịch để chăm sóc & tiếp thị Marketing.

### 📈 3. Thống Kê & Báo Cáo (Analytics & Insights)
- Báo cáo biểu đồ doanh thu theo tháng/quý.
- Thống kê Tour bán chạy nhất (Top Trending Tours).
- Báo cáo tỷ lệ hủy đơn & phân tích lưu lượng truy cập trang web.

---

## 🌐 III. TÍCH HỢP NÂNG CAO (ADVANCED INTEGRATIONS)

1. **Đa Tiền Tệ & Đa Ngôn Ngữ (Multi-Currency & Multi-Language)**:
   - Chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh linh hoạt.
   - Công cụ chuyển đổi tỷ giá thời gian thực (Google-style Realtime Forex API) hỗ trợ khách quốc tế.
2. **Trợ Lý AI & Live Chat Hỗ Trợ 24/7**:
   - Tích hợp Chatbot AI tự động tư vấn lịch trình chuyến đi 24/7.
   - Tích hợp nút Chat trực tiếp qua Zalo / WhatsApp / Facebook Messenger.

---

## 🛡️ IV. PHÁP LÝ, BẢN ĐỒ & TỐI ƯU CHUYỂN ĐỔI (LEGAL, MAPS & CONVERSION)

### 📜 1. Minh Bạch Pháp Lý & An Toàn Du Lịch
- **Chính Sách Hủy / Hoàn Tiền (Refund Policy)**: Minh bạch tỷ lệ hoàn tiền theo mốc thời gian (Trước 7 ngày: 100%, 3-5 ngày: 50%, <24h: 0%).
- **Hướng Dẫn Visa & Hộ Chiếu**: Tự động nhắc hạn hộ chiếu >6 tháng & hỗ trợ dịch vụ làm Visa cho tour quốc tế.

### 🗺️ 2. Tiện Ích Trải Nghiệm & Lưu Trữ
- **Bản Đồ Tương Tác Lộ Trình (Interactive Itinerary Map)**: Ghim các mốc dừng chân của tour trực quan trên Google Maps.
- **Xuất File Lịch Trình PDF (Export PDF)**: Tải file lịch trình PDF xem offline khi không có mạng.
- **Mã QR Vé Điện Tử (E-ticket QR Code)**: Tạo mã QR quét check-in nhanh khi lên xe/du thuyền.

### 🎁 3. Tiếp Thị & Thúc Đẩy Chuyển Đổi (Conversion & Marketing)
- **Hệ Thống Voucher (Promo Engine)**: Áp dụng mã giảm giá `SUMMER2026`, `WELCOME`.
- **Đồng Hồ Đếm Ngược Flash Sale**: Đếm ngược giờ vàng kích thích khách chốt tour (FOMO).
- **Tích Điểm Thưởng (Loyalty Points)**: Tích điểm đổi quà hoặc trừ tiền trực tiếp cho lần đặt sau.

---

## 📌 V. MA TRẬN TIẾN ĐỘ PHÁT TRIỂN (DEVELOPMENT ROADMAP)

| Phân Hệ | Chức Năng | Trạng Thái |
| :--- | :--- | :--- |
| **User Frontend** | Giao diện Editorial, Bento Grid, Dark/Light Palette (Emerald White) | ✅ Completed |
| **User Frontend** | Bộ 4 Tool tiện ích (Dự toán Ngân sách, Tự thiết kế tour, Tỷ giá Google, Hành lý Smart) | ✅ Completed |
| **User Frontend** | Tỷ giá thời gian thực chuẩn Google & Cân đối đối xứng giao diện | ✅ Completed |
| **User Frontend** | Bộ lọc Hạng Sao (3★ / 4★ / 5★) & Minh bạch Tiêu chuẩn Khách sạn trong Tour Details | 🔄 In Progress |
| **User Frontend** | Form Đặt tour sinh Mã Xác Nhận & Giỏ hàng / Wishlist (LocalStorage) | ✅ Completed |
| **Admin Dashboard**| Quản lý Tour, Đơn hàng, CRM & Báo cáo Doanh thu (Kết nối Supabase Cloud) | 📅 Next Phase |
| **Advanced** | Multi-currency Google Forex API & World Clocks | ✅ Completed |
| **Advanced** | AI Travel Assistant Chatbot & Multi-language toggle | 📅 Next Phase |
| **Legal & Conversion**| Chính sách Hủy hoàn, Xuất PDF, Mã QR E-ticket & Promo Code Engine | 📅 Next Phase |

---
*Bản thiết kế được lưu tự động tại thư mục dự án:* [`TRAVEL_WEBSITE_REQUIREMENTS.md`](file:///d:/VScode/vscode%20py/webtravel/TRAVEL_WEBSITE_REQUIREMENTS.md)
