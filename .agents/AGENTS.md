# 📜 Quy Tắc Làm Việc & Nguyên Tắc Hợp Tác (AGENTS.md)

## 1. Không Tự Đoán Ý & Quy Trình Đặt Câu Hỏi (No Guessing & Questioning Protocol)
- Khi gặp yêu cầu chưa rõ ràng, có điểm mơ hồ hoặc có nhiều hướng đi khác nhau, **tuyệt đối không tự đoán ý người dùng** để viết code ngay.
- **Quy trình đặt câu hỏi chuẩn**:
  - Dừng lại ngay lập tức và nêu rõ điểm thắc mắc hoặc chưa đủ thông tin.
  - Liệt kê sẵn các phương án lựa chọn rõ ràng (Phương án A, Phương án B, Phương án C...).
  - Tóm tắt ngắn gọn Ưu/Nhược điểm của từng phương án và đưa ra đề xuất (Recommendation) từ góc nhìn kỹ thuật.
  - Chờ người dùng chốt lựa chọn trước khi tiến hành viết code.

## 2. Minh Bạch Khi Lựa Chọn Công Nghệ & Kiến Trúc (Technical Transparency)
- Trước khi đề xuất bất kỳ công nghệ, thư viện, framework hay mẫu thiết kế (design pattern) nào:
  - Giải thích rõ **Lý do vì sao chọn**.
  - Phân tích chi tiết **Ưu điểm (Pros)** và **Nhược điểm (Cons)**.
  - Nêu rõ các phương án thay thế (nếu có).
  - Đưa ra khuyến nghị nhưng **chờ người dùng quyết định**.

## 3. Xác Nhận Trước Khi Triển Khai Code (Explicit Approval Before Coding)
- Chỉ tiến hành viết mã nguồn (code) sau khi đã thảo luận thống nhất và được người dùng đồng ý với giải pháp/công nghệ đó.

## 4. Đọc & Hiểu Luồng Code Trước Khi Chỉnh Sửa (Read Before Edit)
- Trước khi sửa lỗi hay thêm tính năng mới, bắt buộc phải **đọc kỹ các file liên quan** để hiểu rõ logic hiện tại và cấu trúc dữ liệu.
- Tuyệt đối không tự ý viết lại (rewrite) hoặc đè code khi chưa kiểm tra kỹ lưỡng các luồng phụ thuộc.

## 5. Quản Lý Thư Viện Tinh Gọn (Clean Dependencies & No Unused Code)
- Không khai báo hay cài đặt thư viện bừa bãi khi chưa thực sự cần thiết và chưa được người dùng xác nhận.
- Tuyệt đối không để lại các dòng `import`/khai báo thư viện thừa (dead imports) hoặc file rác không được sử dụng trong dự án.

## 6. Bảo Vệ Tính Năng Cũ & Kiểm Tra Lỗi Thực Tế (No Regression & Error Handling)
- Khi sửa đổi một hàm hoặc component, phải đảm bảo các nơi khác sử dụng nó không bị hỏng (tránh breaking changes).
- Không dùng `try/catch` rỗng để giấu lỗi hoặc trả về dữ liệu giả để "qua mắt". Nếu có lỗi, phải tìm tận gốc nguyên nhân để xử lý.
- Luôn kiểm tra/xác nhận tính năng chạy đúng trước khi báo hoàn tất công việc.

## 7. Bảo Mật Thông Tin & Phòng Chống Lỗ Hổng Web (Security & Vulnerability Prevention)
- Tuyệt đối không viết trực tiếp API key, password, hay secret token vào trong mã nguồn.
- **Chống SQL Injection**: Luôn làm sạch dữ liệu đầu vào (Input Sanitization/Validation) và dùng Parameterized Queries (hoặc SDK chuẩn của Supabase/ORM), tuyệt đối không cộng chuỗi SQL thô (`raw SQL string concatenation`).
- **Chống XSS (Cross-Site Scripting)**: Tránh render trực tiếp HTML bằng `innerHTML` với dữ liệu từ người dùng nhập mà chưa qua kiểm duyệt. Dùng `textContent` hoặc các hàm escape an toàn.
- **Phòng chống DDoS & Spacing**: Áp dụng cơ chế Debounce/Throttle cho ô tìm kiếm ở Frontend và cấu hình Rate Limiting ở API/Backend.
- **Chống Phân Quyền Trái Phép (Broken Access Control / IDOR)**: Luôn xác thực quyền sở hữu dữ liệu ở Server-side/Supabase RLS trước khi cho phép người dùng xem hoặc sửa thông tin chuyến đi/đặt tour.
- **Chống CSRF & Clickjacking**: Sử dụng `SameSite` Cookie, JWT Authorization headers và thiết lập Header `X-Frame-Options: DENY` chống nhúng iframe ẩn.
- **Bảo vệ Form Hỏi Đáp & Prompt Injection (Q&A / Form Security)**:
  - Với Form gửi câu hỏi/tư vấn: Dùng **reCAPTCHA / Cloudflare Turnstile** hoặc kỹ thuật **Honeypot** để chống bot tự động spam câu hỏi làm rác database.
  - Với Trợ lý AI Hỏi Đáp: Kiểm duyệt đầu vào (Prompt Sanitization) tránh lỗi **Prompt Injection** (cố tình lừa AI tiết lộ thông tin hệ thống).

## 8. Quản Lý File An Toàn (Safe File Management)
- Không tự ý xóa các file cấu hình hoặc file quan trọng của dự án (như `package.json`, `.gitignore`, `README.md`, `variables.css`) khi chưa được người dùng đồng ý.

## 9. Tối Ưu Hiệu Năng & Mã Nguồn Sạch (Performance & Clean Code)
- Đặt tên biến, hàm, file rõ nghĩa (tiếng Anh chuẩn).
- Thêm comment giải thích cho các đoạn logic/thuật toán phức tạp.
- Tối ưu hóa hiệu năng render UI, tránh viết trùng lặp CSS hoặc tải các tài nguyên quá nặng làm giật lag ứng dụng.

## 10. Kiểm Thử Tương Thích Trước Khi Hoàn Tất (Testing & Compatibility Verification)
- Sau khi viết hoặc sửa đổi bất kỳ đoạn code nào, bắt buộc phải **kiểm tra độ tương thích** (Integration & Compatibility Test) với các thành phần khác trong dự án.
- Kiểm tra luồng dữ liệu đầu vào/đầu ra, đảm bảo tính năng mới hoạt động chính xác và **không gây ra lỗi chéo (side-effects)** ở các chức năng đã có.
- Không được báo hoàn tất công việc nếu chưa chạy thử nghiệm thành công.
