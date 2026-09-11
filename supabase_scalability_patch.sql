-- ==============================================================================
-- SCALABILITY PATCH v1.0 (Phase 1 + 2 + 3)
-- Áp dụng sau khi đã chạy supabase_schema.sql
--
-- Mục đích:
--   Phase 1: Chống Race Condition trừ ghế (SELECT FOR UPDATE + RAISE EXCEPTION)
--   Phase 1: Ghi nhận Voucher chỉ khi thanh toán thành công (paid / partially_paid)
--   Phase 2: Tự động hủy đơn pending quá 15 phút & nhả ghế / voucher (pg_cron)
--
-- Cách áp dụng: Chạy toàn bộ file này trong Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- 0. BỔ SUNG CỘT CẦN THIẾT NẾU CHƯA CÓ TRONG BẢNG CŨ
-- ==============================================================================
ALTER TABLE public.departure_dates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;

-- ==============================================================================
-- PHASE 1A — ATOMIC SEAT DEDUCTION TRIGGER
-- Nâng cấp trigger fn_manage_departure_seats:
--   - Thêm SELECT FOR UPDATE để khóa dòng khi trừ ghế (chống race condition)
--   - Kiểm tra đủ ghế trước khi INSERT booking; RAISE EXCEPTION nếu không đủ
--   - Backward compatible: nếu không có departure_dates row thì không block
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_manage_departure_seats()
RETURNS TRIGGER AS $$
DECLARE
    total_pax INTEGER;
    v_avail   INTEGER;
    v_total   INTEGER;
BEGIN
    -- === BOOKING CREATED: Atomic seat deduction with row-level lock ===
    IF (TG_OP = 'INSERT' AND NEW.booking_status != 'cancelled') THEN
        total_pax := NEW.adults_count
                   + NEW.children_count
                   + COALESCE(NEW.toddlers_count, 0)
                   + NEW.infants_count;

        -- Khóa dòng departure_dates trong transaction này (ngăn các transaction song song đọc cùng giá trị)
        SELECT available_seats, total_seats
        INTO   v_avail, v_total
        FROM   public.departure_dates
        WHERE  tour_id = NEW.tour_id
          AND  date    = NEW.departure_date
        FOR UPDATE;

        -- Chỉ kiểm tra khi row tồn tại (backward compat: không có row = không có ràng buộc)
        IF v_avail IS NOT NULL AND v_avail < total_pax THEN
            RAISE EXCEPTION 'INSUFFICIENT_SEATS: Chỉ còn % chỗ, yêu cầu %',
                            v_avail, total_pax
                  USING ERRCODE = 'P0001';
        END IF;

        -- Cập nhật an toàn (chỉ khi row tồn tại)
        IF v_avail IS NOT NULL THEN
            UPDATE public.departure_dates
            SET
                available_seats = v_avail - total_pax,
                status = CASE
                    WHEN (v_avail - total_pax) <= 0 THEN 'sold_out'
                    WHEN (v_avail - total_pax) <= 5 THEN 'few_seats'
                    ELSE 'available'
                END
            WHERE tour_id = NEW.tour_id
              AND date    = NEW.departure_date;
        END IF;
    END IF;

    -- === BOOKING CANCELLED: Restore seats ===
    IF (TG_OP = 'UPDATE' AND OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled') THEN
        total_pax := OLD.adults_count
                   + OLD.children_count
                   + COALESCE(OLD.toddlers_count, 0)
                   + OLD.infants_count;

        UPDATE public.departure_dates
        SET
            available_seats = LEAST(COALESCE(total_seats, 99999), available_seats + total_pax),
            status = CASE
                WHEN (available_seats + total_pax) <= 0 THEN 'sold_out'
                WHEN (available_seats + total_pax) <= 5 THEN 'few_seats'
                ELSE 'available'
            END
        WHERE tour_id = OLD.tour_id
          AND date    = OLD.departure_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo trigger đã tồn tại (trigger definition giữ nguyên, chỉ function được upgrade)
DROP TRIGGER IF EXISTS trg_manage_seats ON public.bookings;
CREATE TRIGGER trg_manage_seats
    AFTER INSERT OR UPDATE OF booking_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_departure_seats();

-- ==============================================================================
-- PHASE 1A — UTILITY RPCs (deduct_seats_atomic / restore_seats_atomic)
-- Dùng cho admin tool, stress test, hoặc gọi trực tiếp khi cần
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.deduct_seats_atomic(
    p_tour_id TEXT,
    p_date    TEXT,
    p_count   INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current INTEGER;
    v_total   INTEGER;
    v_updated INTEGER;
BEGIN
    SELECT available_seats, total_seats
    INTO   v_current, v_total
    FROM   public.departure_dates
    WHERE  tour_id = p_tour_id
      AND  date    = p_date
    FOR UPDATE;

    IF v_current IS NULL OR v_current < p_count THEN
        RETURN jsonb_build_object(
            'success',   false,
            'error',     'INSUFFICIENT_SEATS',
            'remaining', COALESCE(v_current, 0)
        );
    END IF;

    v_updated := v_current - p_count;

    UPDATE public.departure_dates
    SET
        available_seats = v_updated,
        status = CASE
            WHEN v_updated <= 0 THEN 'sold_out'
            WHEN v_updated <= 5 THEN 'few_seats'
            ELSE 'available'
        END
    WHERE tour_id = p_tour_id
      AND date    = p_date;

    RETURN jsonb_build_object('success', true, 'remaining', v_updated);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_seats_atomic(
    p_tour_id TEXT,
    p_date    TEXT,
    p_count   INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current INTEGER;
    v_total   INTEGER;
    v_updated INTEGER;
BEGIN
    SELECT available_seats, total_seats
    INTO   v_current, v_total
    FROM   public.departure_dates
    WHERE  tour_id = p_tour_id
      AND  date    = p_date
    FOR UPDATE;

    IF v_current IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy ngày khởi hành');
    END IF;

    v_updated := LEAST(COALESCE(v_total, 99999), v_current + p_count);

    UPDATE public.departure_dates
    SET
        available_seats = v_updated,
        status = CASE
            WHEN v_updated <= 0 THEN 'sold_out'
            WHEN v_updated <= 5 THEN 'few_seats'
            ELSE 'available'
        END
    WHERE tour_id = p_tour_id
      AND date    = p_date;

    RETURN jsonb_build_object('success', true, 'remaining', v_updated);
END;
$$;

-- ==============================================================================
-- PHASE 1B — FIX COUPON TRIGGER
-- Vấn đề cũ: Tăng used_count ngay khi INSERT booking (dù chưa thanh toán đồng nào)
-- Giải pháp: Chỉ ghi nhận voucher khi payment_status chuyển sang paid / partially_paid
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_manage_coupon_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_discount_applied NUMERIC  := 0;
    v_coupon           RECORD;
    v_already_counted  BOOLEAN  := false;
BEGIN
    -- === XÁC NHẬN THANH TOÁN: Ghi nhận voucher khi đã thanh toán ===
    IF (TG_OP = 'UPDATE'
        AND OLD.payment_status NOT IN ('paid', 'partially_paid')
        AND NEW.payment_status IN ('paid', 'partially_paid')
        AND NEW.coupon_code IS NOT NULL) THEN

        -- Kiểm tra đã ghi nhận chưa (chống double-count khi retry)
        SELECT EXISTS (
            SELECT 1 FROM public.coupon_usages
            WHERE coupon_code = NEW.coupon_code
              AND booking_id  = NEW.id
        ) INTO v_already_counted;

        IF NOT v_already_counted THEN
            -- Tăng used_count trong bảng coupons
            UPDATE public.coupons
            SET used_count = used_count + 1,
                updated_at = NOW()
            WHERE code = NEW.coupon_code;

            -- Tính số tiền giảm thực tế
            SELECT * INTO v_coupon FROM public.coupons WHERE code = NEW.coupon_code;
            IF v_coupon IS NOT NULL THEN
                IF v_coupon.discount_amount > 0 THEN
                    v_discount_applied := v_coupon.discount_amount;
                ELSIF v_coupon.discount_percent > 0 THEN
                    v_discount_applied := ROUND(
                        NEW.total_amount * v_coupon.discount_percent / 100.0, 0
                    );
                END IF;
            END IF;

            -- Ghi log vào coupon_usages (ON CONFLICT DO NOTHING phòng khi trigger chạy lại)
            INSERT INTO public.coupon_usages (coupon_code, user_id, booking_id, discount_applied)
            VALUES (NEW.coupon_code, NEW.user_id, NEW.id, v_discount_applied)
            ON CONFLICT (coupon_code, booking_id) DO NOTHING;
        END IF;
    END IF;

    -- === HỦY ĐƠN: Hoàn lại lượt dùng coupon (chỉ hoàn nếu đã thanh toán trước đó) ===
    IF (TG_OP = 'UPDATE'
        AND OLD.booking_status != 'cancelled'
        AND NEW.booking_status = 'cancelled'
        AND OLD.coupon_code IS NOT NULL
        AND OLD.payment_status IN ('paid', 'partially_paid')) THEN

        -- Hoàn lại used_count
        UPDATE public.coupons
        SET used_count = GREATEST(0, used_count - 1),
            updated_at = NOW()
        WHERE code = OLD.coupon_code;

        -- Xóa bản ghi coupon_usages
        DELETE FROM public.coupon_usages
        WHERE coupon_code = OLD.coupon_code
          AND booking_id  = OLD.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cập nhật trigger: bỏ INSERT, chỉ còn UPDATE; bắt thêm payment_status changes
DROP TRIGGER IF EXISTS trg_manage_coupon_usage ON public.bookings;
CREATE TRIGGER trg_manage_coupon_usage
    AFTER UPDATE OF booking_status, payment_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_coupon_usage();

-- ==============================================================================
-- PHASE 2 — AUTO-CANCEL EXPIRED BOOKINGS (pg_cron)
-- Tự động hủy đơn pending quá 15 phút và nhả ghế / xóa coupon_usages lỗi thời
-- LƯU Ý: pg_cron chỉ có trên Supabase Pro. Trên Free tier: dùng Lazy Cancel ở TS.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.auto_cancel_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Duyệt và đánh dấu cancelled tất cả đơn pending quá 15 phút
    FOR rec IN
        UPDATE public.bookings
        SET    booking_status = 'cancelled'
        WHERE  booking_status = 'pending'
          AND  payment_status = 'pending'
          AND  created_at     < NOW() - INTERVAL '15 minutes'
        RETURNING
            id,
            tour_id,
            departure_date,
            (adults_count + children_count + COALESCE(toddlers_count, 0) + infants_count) AS total_pax,
            coupon_code
    LOOP
        -- 1. Hoàn trả ghế (trigger fn_manage_departure_seats đã xử lý qua UPDATE booking_status,
        --    nhưng ghi thêm ở đây để an toàn với các edge case)
        -- (trigger sẽ xử lý việc restore seats - không cần gọi lại)

        -- 2. Dọn coupon_usages legacy (nếu có record từ trước khi patch này được áp dụng)
        IF rec.coupon_code IS NOT NULL THEN
            DELETE FROM public.coupon_usages
            WHERE booking_id  = rec.id
              AND coupon_code  = rec.coupon_code;
        END IF;
    END LOOP;
END;
$$;

-- Cấu hình pg_cron: Chạy tự động mỗi 1 phút
-- Chỉ chạy trên Supabase Pro (cần extension pg_cron đã được bật)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('auto-cancel-expired-bookings');
        PERFORM cron.schedule(
            'auto-cancel-expired-bookings',
            '*/1 * * * *',
            'SELECT public.auto_cancel_expired_bookings()'
        );
        RAISE NOTICE 'pg_cron job "auto-cancel-expired-bookings" đã được đăng ký thành công.';
    ELSE
        RAISE NOTICE 'pg_cron không khả dụng (gói Free). Lazy Cancel sẽ được xử lý bởi TS code.';
    END IF;
END;
$$;

-- ==============================================================================
-- CẤP QUYỀN EXECUTE CHO CÁC HÀM MỚI
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.deduct_seats_atomic(TEXT, TEXT, INT)     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_seats_atomic(TEXT, TEXT, INT)    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auto_cancel_expired_bookings()            TO service_role;

-- ==============================================================================
-- KIỂM TRA NHANH: Xem các trigger đã được đăng ký đúng
-- ==============================================================================
-- SELECT tgname, tgtype, proname
-- FROM   pg_trigger t
-- JOIN   pg_proc    p ON p.oid = t.tgfoid
-- JOIN   pg_class   c ON c.oid = t.tgrelid
-- WHERE  c.relname = 'bookings';
