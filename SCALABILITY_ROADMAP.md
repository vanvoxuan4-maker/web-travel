# 🚀 LỘ TRÌNH NÂNG CẤP HỆ THỐNG CHỊU TẢI CAO & FLASH SALE (SCALABILITY ROADMAP)

> **Tài liệu kỹ thuật nội bộ dành cho đội ngũ phát triển WebTravel**  
> **Phiên bản:** 1.1 (Cập nhật: 10/09/2026 — Bổ sung code pg_cron đầy đủ, tách bottleneck nghiệp vụ Voucher, thêm Retry Pattern)  
> **Ngày lập:** 10/09/2026  
> **Trạng thái:** Kế hoạch nâng cấp tương lai (Backlog / Future Enhancements)

---

## I. Tổng Quan & Kết Quả Đo Tải Thực Tế (Benchmark Baseline)

Dựa trên kết quả chạy kịch bản kiểm thử chịu tải [`scripts/stress_test.py`](./scripts/stress_test.py) ngày 10/09/2026:

| Chỉ số đo lường | Kết quả thực tế | Đánh giá năng lực |
|---|---|---|
| **Tốc độ phục vụ đọc tối đa (Max Read RPS)** | **237.5 requests / giây** | Tốt cho ngày thường (~14.200 lượt xem/phút) |
| **Độ trễ trung bình (Latency)** | Từ **203ms** (25 VUs) → **812ms** (200 VUs) | Suy giảm rõ khi tải tăng cao |
| **Ngưỡng chạm trần (Bottleneck Plateau)** | ~**80 người dùng đồng thời** | Tốc độ không tăng thêm được từ đây |
| **Khả năng chịu tải ghi ước tính (Write RPS)** | ~**20 – 50 đơn / giây** | **Không đủ cho Flash Sale quy mô lớn** |

> **Kết luận baseline**: Hệ thống đang hoàn toàn ổn định cho vận hành thông thường. Các vấn đề bên dưới chỉ biểu hiện khi có đợt tải đột biến lớn (Flash Sale, viral marketing, quảng cáo truyền thông).

---

## II. 5 Điểm Nghẽn Cần Nâng Cấp (Critical Bottlenecks)

### 🔴 1. Lỗi "Đua Lệnh" (Race Condition) Khi Trừ Số Ghế Tour
- **Vị trí code**: `deductSeats()` — [`src/utils/inventoryManager.ts` L151](./src/utils/inventoryManager.ts#L151)
- **Cơ chế hiện tại (lỗi Read-Modify-Write trên client)**:
  1. Client đọc `available_seats` từ Supabase về trình duyệt.
  2. Dùng JavaScript tính: `updatedSeats = available_seats - count`.
  3. Gửi lệnh `UPDATE` ghi đè số ghế mới xuống database.
- **Hậu quả khi quá tải**: 100 khách cùng bấm đặt 1 tour còn 1 ghế ➔ Cả 100 người đều đọc được số `1`, cùng tính ra `0`, và cùng ghi đè `0` xuống ➔ **Bán lố 99 vé tour (Overbooking)**.
- **Giải pháp**: Dùng PostgreSQL Atomic Function → Xem [Giải Pháp 1](#-giải-pháp-1-chuyển-sang-lệnh-nguyên-tử-postgresql-atomic-rpc).

---

### 🔴 2. Lỗi Nghiệp Vụ: Ghi Nhận Voucher Đã Dùng Quá Sớm (Trước Khi Thanh Toán)
- **Vị trí code**: `recordCouponUsage()` được gọi bên trong `createBooking()` — [`src/services/bookingService.ts` L177](./src/services/bookingService.ts#L177)
- **Vấn đề**: Voucher bị đánh dấu "Đã dùng" và `used_count` bị tăng **ngay khi khách tạo đơn `pending`** (chưa chuyển khoản một đồng nào).
- **Hậu quả**:
  - Khách tạo đơn rồi bỏ đi không thanh toán ➔ Mã voucher của tài khoản đó bị khóa vĩnh viễn.
  - Lượt dùng chung (`used_count`) bị trừ oan ➔ Các khách khác không dùng được mã.
- **Giải pháp**: Chuyển lệnh gọi `recordCouponUsage` vào hàm `updatePaymentStatus` — chỉ ghi nhận khi `payment_status = 'paid'` hoặc `'partially_paid'`.

---

### 🔴 3. Thiếu Cơ Chế Tự Động Hủy Đơn & Nhả Ghế/Voucher (Reservation TTL)
- **Vấn đề**: Khi khách tắt tab hoặc bỏ trang thanh toán, đơn hàng `pending` tồn tại mãi mãi, ghế và voucher bị giam không được giải phóng.
- **Hậu quả**: Các slot tour thực tế còn trống nhưng hệ thống hiển thị là "Hết chỗ" hoặc "Voucher đã hết lượt".
- **Giải pháp**: Cấu hình Supabase `pg_cron` → Xem [Giải Pháp 2](#-giải-pháp-2-tự-động-hủy-đơn-quá-hạn-bằng-pg_cron).

---

### 🔴 4. Silent Fallback Sang LocalStorage Khi Database Timeout
- **Vị trí code**: `createBooking()` — [`src/services/bookingService.ts` L165](./src/services/bookingService.ts#L165)
- **Vấn đề**: Khi database quá tải và timeout sau 8 giây, hệ thống lặng lẽ lưu đơn vào `localStorage` của máy khách rồi báo "Đặt tour thành công".
- **Hậu quả nghiêm trọng**: Đơn hàng không hề tồn tại trong database công ty. Khi khách đến ngày đi tour, sẽ không có tên trong danh sách.
- **Giải pháp**: Thay bằng cơ chế Retry có thông báo rõ ràng → Xem [Giải Pháp 3](#-giải-pháp-3-thay-silent-fallback-bằng-retry-minh-bạch).

---

### 🟡 5. Giới Hạn Kết Nối Database (Connection Pool Exhaustion)
- Supabase gói tiêu chuẩn giới hạn từ **60 – 200 kết nối đồng thời**.
- Khi hàng nghìn người cùng gửi request ghi đơn, connection pool bị cạn kiệt ➔ HTTP `429` hoặc `500`.
- **Mức độ ưu tiên**: Thấp hơn các mục trên (chỉ xảy ra khi lượng người dùng thực tế đã rất lớn).
- **Giải pháp**: Bật PgBouncer Transaction Pooling trên Supabase Dashboard hoặc nâng cấp gói Supabase Pro/Team.

---

## III. Giải Pháp Kỹ Thuật Chi Tiết (Actionable Solutions)

### 🛠️ Giải Pháp 1: Chuyển Sang Lệnh Nguyên Tử (PostgreSQL Atomic RPC)
> *Ưu tiên số 1 — Giải quyết hoàn toàn lỗi bán lố mà không cần đầu tư thêm hạ tầng.*

Thay vì đọc về JS rồi mới tính, viết một **PostgreSQL RPC Function** chạy toàn bộ logic trong database với `FOR UPDATE` lock:

```sql
-- Chạy trong Supabase SQL Editor
-- Hàm trừ ghế an toàn tuyệt đối cấp Database (Atomic Seat Deduction)
CREATE OR REPLACE FUNCTION deduct_seats_atomic(
  p_tour_id TEXT,
  p_date    TEXT,
  p_count   INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INT;
  v_updated INT;
BEGIN
  -- FOR UPDATE: khóa đúng dòng này trong mili-giây, ngăn transaction khác chen vào
  SELECT available_seats
  INTO   v_current
  FROM   departure_dates
  WHERE  tour_id = p_tour_id
    AND  date    = p_date
  FOR UPDATE;

  -- Kiểm tra đủ ghế
  IF v_current IS NULL OR v_current < p_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Hết chỗ hoặc không đủ số ghế yêu cầu',
      'remaining', COALESCE(v_current, 0)
    );
  END IF;

  v_updated := v_current - p_count;

  UPDATE departure_dates
  SET
    available_seats = v_updated,
    status = CASE
      WHEN v_updated <= 0 THEN 'sold_out'
      WHEN v_updated <= 5 THEN 'few_seats'
      ELSE 'available'
    END,
    updated_at = NOW()
  WHERE tour_id = p_tour_id AND date = p_date;

  RETURN jsonb_build_object(
    'success',   true,
    'remaining', v_updated
  );
END;
$$;
```

**Cách gọi từ TypeScript (Supabase RPC):**
```ts
// Thay thế toàn bộ logic deductSeats() hiện tại
const { data, error } = await supabase.rpc('deduct_seats_atomic', {
  p_tour_id: tourId,
  p_date:    date,
  p_count:   count
});

if (error || !data?.success) {
  return { success: false, error: data?.error || 'Hết chỗ' };
}
// data.remaining = số ghế còn lại sau khi trừ
```

---

### 🛠️ Giải Pháp 2: Tự Động Hủy Đơn Quá Hạn Bằng `pg_cron`
> *Giải quyết bài toán tự nhả ghế & voucher ngay cả khi khách tắt trình duyệt.*

**Bước 1:** Bật extension `pg_cron` trong Supabase Dashboard → **Database** → **Extensions** → Bật `pg_cron`.

**Bước 2:** Chạy script SQL sau trong Supabase SQL Editor:

```sql
-- ============================================================
-- HÀM HỦY ĐƠN QUÁ HẠN & TỰ ĐỘNG NHẠCH GHẾ + VOUCHER
-- ============================================================
CREATE OR REPLACE FUNCTION auto_cancel_expired_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Lấy danh sách các đơn pending quá 15 phút và đặt trạng thái cancelled
  FOR rec IN
    UPDATE bookings
    SET    booking_status = 'cancelled'
    WHERE  booking_status = 'pending'
      AND  payment_status = 'pending'
      AND  created_at     < NOW() - INTERVAL '15 minutes'
    RETURNING id, tour_id, departure_date,
              (adults_count + children_count + toddlers_count) AS total_pax,
              coupon_code
  LOOP
    -- 1. Hoàn trả ghế về kho (cộng ngược lại)
    UPDATE departure_dates
    SET
      available_seats = available_seats + rec.total_pax,
      status = CASE
        WHEN (available_seats + rec.total_pax) > 5 THEN 'available'
        WHEN (available_seats + rec.total_pax) > 0  THEN 'few_seats'
        ELSE 'sold_out'
      END,
      updated_at = NOW()
    WHERE tour_id = rec.tour_id
      AND date    = rec.departure_date;

    -- 2. Hoàn trả lượt dùng voucher (nếu có)
    IF rec.coupon_code IS NOT NULL THEN
      UPDATE coupons
      SET    used_count = GREATEST(0, used_count - 1),
             updated_at = NOW()
      WHERE  code = rec.coupon_code;

      -- Xóa bản ghi coupon_usages gắn với đơn bị hủy
      DELETE FROM coupon_usages
      WHERE booking_id = rec.id;
    END IF;

  END LOOP;
END;
$$;

-- ============================================================
-- LẬP LỊCH: CHẠY MỖI 1 PHÚT TỰ ĐỘNG
-- ============================================================
SELECT cron.schedule(
  'auto-cancel-expired-bookings',   -- tên job (unique)
  '*/1 * * * *',                    -- mỗi 1 phút
  'SELECT auto_cancel_expired_bookings()'
);
```

> **Lưu ý Supabase:** `pg_cron` chỉ có trên gói **Pro** trở lên. Nếu dùng gói Free, thay thế bằng **Lazy Cancel** (kiểm tra `created_at + 15 min` tại thời điểm khách validate lại mã hoặc xem danh sách đơn).

---

### 🛠️ Giải Pháp 3: Thay Silent Fallback Bằng Retry Minh Bạch
> *Đảm bảo khách hàng không bao giờ nhận thông báo "thành công" giả tạo khi database lỗi.*

**Thay thế logic trong [`bookingService.ts`](./src/services/bookingService.ts):**

```ts
// Cơ chế Exponential Backoff Retry (3 lần, trước khi thực sự báo lỗi cho user)
async function createBookingWithRetry(
  payload: BookingPayload,
  maxRetries = 3
): Promise<{ success: boolean; data?: any; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await supabase.from('bookings').insert([...]).select().single();
      if (!result.error) return { success: true, data: result.data };

      // Nếu lỗi không phải do mạng (ví dụ lỗi dữ liệu) thì không retry
      if (result.error.code !== 'PGRST301') throw result.error;
    } catch (err) {
      if (attempt === maxRetries) {
        // Chỉ sau khi thử 3 lần thất bại mới báo lỗi thật sự cho người dùng
        // KHÔNG lưu vào localStorage để tránh đơn ma
        return {
          success: false,
          error: `Máy chủ đang quá tải. Vui lòng thử lại sau ít phút. (${attempt}/${maxRetries})`
        };
      }
      // Chờ theo cấp số nhân trước khi thử lại: 1s → 2s → 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  return { success: false, error: 'Không thể kết nối máy chủ.' };
}
```

> **Quan trọng:** Xóa hoàn toàn khối `this.saveToLocalStorage(payloadWithTime)` trong phần `catch` của `createBooking` đối với các giao dịch có liên quan đến tiền tệ. `localStorage` chỉ nên dùng để lưu **bản sao tham khảo sau khi đã ghi thành công xuống Supabase**.

---

### 🛠️ Giải Pháp 4: Bổ Sung Redis Caching & Queue (Giai Đoạn Quy Mô Cực Lớn)
> *Chỉ cần thiết khi lượng truy cập vượt ~50.000 người/phút hoặc chuẩn bị Flash Sale toàn quốc.*

1. **Redis Cache (Upstash Redis — Serverless, không cần server riêng)**: Lưu cache danh mục tour và chi tiết tour lên RAM. Giảm 90% lượt query đọc từ Supabase.
2. **Redis Atomic Counter cho Flash Sale**: Thay thế `used_count` trong bảng `coupons` bằng `DECR` trên Redis, đảm bảo tuyệt đối không bán lố voucher kể cả với 10.000 người/giây.
3. **Rate Limiting per IP**: `INCR booking_attempts:{ip}` với TTL 60 giây, giới hạn mỗi IP chỉ được bấm tạo đơn tối đa 5 lần/phút.
4. **Message Queue (Upstash QStash)**: Đẩy yêu cầu tạo đơn vào hàng đợi, worker xử lý tuần tự, database không bị shock tải đột ngột.

---

## IV. Lộ Trình Triển Khai (Implementation Phases)

| Giai đoạn | Nội dung thực hiện | Mức độ phức tạp | Ưu tiên |
|---|---|---|---|
| **Phase 1** ⭐ | • Chuyển `recordCouponUsage` sang gọi sau khi `paid`/`partially_paid`.<br>• Viết và deploy SQL Atomic Function `deduct_seats_atomic`.<br>• Cập nhật `inventoryManager.ts` dùng RPC thay vì client-side logic. | 🟡 Vừa | **Cao nhất** |
| **Phase 2** | • Deploy `pg_cron` job tự hủy đơn sau 15 phút (cần Supabase Pro).<br>• Hoặc dùng **Lazy Cancel** nếu còn dùng gói Free.<br>• Khóa/làm mờ QR VietQR trên UI khi `secondsRemaining = 0`. | 🟡 Vừa | Cao |
| **Phase 3** | • Xóa silent LocalStorage fallback, thay bằng Retry + thông báo rõ ràng.<br>• Bật Cloudflare CDN Cache cho trang tour tĩnh. | 🟢 Thấp | Trung bình |
| **Phase 4** | • Tích hợp Upstash Redis Rate Limiting & Flash Sale Counter.<br>• Webhook Banking tự động đối soát (SePay / Casso).<br>• Nâng gói Supabase lên Pro để có PgBouncer Transaction Pooling. | 🔴 Nâng cao | Khi cần Flash Sale lớn |

---

## V. Checklist Xác Nhận Trước Khi Chạy Flash Sale

Trước mỗi chiến dịch quảng cáo quy mô lớn, đội kỹ thuật cần xác nhận các mục sau:

- [ ] `deduct_seats_atomic` RPC đã được deploy và test trên Supabase.
- [ ] `pg_cron` job đang hoạt động, đơn hết hạn được tự hủy trong 15 phút.
- [ ] `recordCouponUsage` chỉ được gọi khi đơn ở trạng thái `paid`/`partially_paid`.
- [ ] Silent LocalStorage fallback đã được xóa khỏi `createBooking`.
- [ ] Đã chạy lại `scripts/stress_test.py` để xác nhận ngưỡng mới sau các tối ưu.
- [ ] Đã chạy `scripts/security_audit_test.py` để đảm bảo điểm bảo mật ≥ 80/100.

---

*Tài liệu được cập nhật cùng với codebase. Mỗi khi hoàn thành một Phase, hãy đánh dấu ✅ vào bảng lộ trình và cập nhật số phiên bản.*
