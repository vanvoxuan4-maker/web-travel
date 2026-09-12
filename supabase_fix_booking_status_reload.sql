-- ==============================================================================
-- WEBTRAVEL - FIX LỖI THAY ĐỔI / NHẢY TRẠNG THÁI ĐƠN HÀNG KHI RELOAD TRANG
-- Chạy script này trong Supabase SQL Editor để sửa dứt điểm lỗi Database
-- ==============================================================================

-- 1. Bổ sung cột updated_at cho bảng coupons (Chống lỗi 42703 làm rollback đơn hàng)
ALTER TABLE IF EXISTS public.coupons 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Hàm helper lấy vai trò (role) người dùng hiện tại (Đặt trước Policy để tránh lỗi phụ thuộc)
-- Bảo mật: SET search_path = public, pg_temp để chống lỗ hổng search_path injection
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  -- 1. Ưu tiên lấy role từ bảng public.profiles
  SELECT LOWER(TRIM(role)) INTO v_role 
  FROM public.profiles 
  WHERE id = auth.uid();

  -- 2. Fallback: Lấy từ auth.users.raw_user_meta_data nếu profiles chưa kịp đồng bộ
  IF v_role IS NULL THEN
    SELECT LOWER(TRIM(raw_user_meta_data->>'role')) INTO v_role 
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(v_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Phân quyền thực thi hàm cho authenticated và anon
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;

-- 3. Cập nhật hàm trigger fn_manage_coupon_usage() chuẩn xác, an toàn và chống rollback
CREATE OR REPLACE FUNCTION public.fn_manage_coupon_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_discount_applied NUMERIC  := 0;
    v_coupon           RECORD;
    v_already_counted  BOOLEAN  := false;
BEGIN
    -- === XÁC NHẬN THANH TOÁN: Ghi nhận voucher khi đã thanh toán (INSERT hoặc UPDATE) ===
    IF ((TG_OP = 'INSERT' AND NEW.payment_status IN ('paid', 'partially_paid') AND NEW.coupon_code IS NOT NULL)
        OR (TG_OP = 'UPDATE' AND (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('paid', 'partially_paid'))
            AND NEW.payment_status IN ('paid', 'partially_paid') AND NEW.coupon_code IS NOT NULL)) THEN

        -- Kiểm tra mã coupon có thực sự tồn tại trong bảng coupons không (chống lỗi Foreign Key 23503)
        SELECT * INTO v_coupon FROM public.coupons WHERE code = NEW.coupon_code;

        IF v_coupon IS NOT NULL THEN
            -- Kiểm tra đã ghi nhận coupon_usages cho đơn này chưa (chống double-count khi retry)
            SELECT EXISTS (
                SELECT 1 FROM public.coupon_usages
                WHERE coupon_code = NEW.coupon_code
                  AND booking_id  = NEW.id
            ) INTO v_already_counted;

            IF NOT v_already_counted THEN
                -- Tăng used_count trong bảng coupons an toàn
                UPDATE public.coupons
                SET used_count = used_count + 1,
                    updated_at = NOW()
                WHERE code = NEW.coupon_code;

                -- Tính số tiền giảm thực tế
                IF v_coupon.discount_amount > 0 THEN
                    v_discount_applied := v_coupon.discount_amount;
                ELSIF v_coupon.discount_percent > 0 THEN
                    v_discount_applied := ROUND(
                        COALESCE(NEW.total_amount, 0) * v_coupon.discount_percent / 100.0, 0
                    );
                END IF;

                -- Ghi log vào coupon_usages (ON CONFLICT DO NOTHING phòng khi trigger chạy lại)
                INSERT INTO public.coupon_usages (coupon_code, user_id, booking_id, discount_applied)
                VALUES (NEW.coupon_code, NEW.user_id, NEW.id, v_discount_applied)
                ON CONFLICT (coupon_code, booking_id) DO NOTHING;
            END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Kích hoạt trigger trg_manage_coupon_usage trên bảng bookings
DROP TRIGGER IF EXISTS trg_manage_coupon_usage ON public.bookings;
CREATE TRIGGER trg_manage_coupon_usage
    AFTER INSERT OR UPDATE OF booking_status, payment_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_coupon_usage();

-- 4. Cập nhật RLS Policy trên bảng bookings
-- Khách hàng: Chỉ cập nhật thanh toán hoặc hủy đơn của chính mình (chống Broken Access Control)
-- Staff / Admin / Super Admin: Có toàn quyền duyệt và cập nhật mọi trạng thái
DROP POLICY IF EXISTS "bookings_update_policy" ON public.bookings;
CREATE POLICY "bookings_update_policy"
ON public.bookings FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
)
WITH CHECK (
  -- Khách hàng chỉ được hủy đơn của mình hoặc cập nhật thanh toán mà không được tự ý đổi sang 'confirmed'
  (
    user_id = auth.uid() 
    AND booking_status IN ('pending', 'cancelled')
    AND payment_status IN ('pending', 'partially_paid', 'paid', 'refunded')
  )
  -- Nhân sự vận hành và quản trị viên có toàn quyền cập nhật
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);
