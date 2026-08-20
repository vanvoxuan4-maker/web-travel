# 🌍 WebTravel - Travel Tour & Utility Platform

Hệ thống ứng dụng Web dành cho du lịch: Tìm kiếm & khám phá Tour, xem Lịch trình tương tác, Dự toán ngân sách và Thiết kế Tour cá nhân hóa.

---

## 📁 Cấu trúc Thư mục Dự án (Project Structure)

```text
webtravel/
├── assets/                  # Tài nguyên tĩnh
│   ├── images/              # Hình ảnh tour, banner, địa điểm
│   └── icons/               # SVG icons, favicon
├── src/                     # Mã nguồn ứng dụng
│   ├── css/                 # Hệ thống CSS Design System
│   │   ├── variables.css    # Thiết lập màu sắc, typography, hiệu ứng 3D/glassmorphism
│   │   ├── components.css   # Styles cho Cards, Modals, Buttons, Badges
│   │   └── main.css         # Entry stylesheet chính
│   ├── js/                  # Xử lý logic JavaScript
│   │   ├── data/            # Cơ sở dữ liệu mẫu (Tour data, danh mục, tỷ giá)
│   │   │   └── toursData.js
│   │   ├── utils/           # Hàm tiện ích (định dạng tiền tệ, ngày tháng, tính toán)
│   │   │   └── formatters.js
│   │   ├── tools/           # Logic riêng cho từng công cụ (Budget, Builder, Packing)
│   │   └── app.js           # File khởi chạy chính của ứng dụng
│   └── components/          # Giao diện thành phần (được dùng để tái sử dụng)
├── index.html               # Trang HTML chính (Entry Point)
└── README.md                # Tài liệu hướng dẫn cấu trúc dự án
```

---

## 🎯 Định hướng Các Module Cốt lõi
1. **Module 🌐 Explore Tours**: Khám phá tour trong nước & quốc tế kèm bộ lọc đa tiêu chí.
2. **Module 🗺️ Tour Timeline Modal**: Xem chi tiết lộ trình từng ngày.
3. **Module 🧮 Budget Estimator**: Công cụ tính chi phí tour tự động.
4. **Module 🎨 Custom Tour Builder**: Bộ thiết kế tour theo nhu cầu cá nhân.
5. **Module 🎒 Smart Packing Assistant**: Trợ lý chuẩn bị đồ hành lý thông minh.
