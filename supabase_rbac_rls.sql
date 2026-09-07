-- ==============================================================================
-- WEBTRAVEL RBAC (ROLE-BASED ACCESS CONTROL) ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Hệ thống phân quyền 4 cấp độ:
-- 1. super_admin : Toàn quyền tối cao (chủ hệ thống)
-- 2. admin       : Quản trị viên vận hành (đơn, tour, coupon, nhân viên)
-- 3. staff       : Nhân viên vận hành (xem, đối soát, duyệt đơn hàng; không sửa/xóa tour)
-- 4. customer    : Khách hàng (chỉ truy cập và quản lý dữ liệu cá nhân của chính mình)
-- ==============================================================================

-- BƯỚC CHUẨN BỊ: Đảm bảo các cột schema cần thiết tồn tại để chống lỗi schema
ALTER TABLE IF EXISTS public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.tours ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 0. HÀM HELPER LẤY VAI TRÒ (ROLE) CỦA USER ĐANG ĐĂNG NHẬP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  -- Lấy role từ bảng profiles theo auth.uid()
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ==============================================================================
-- 1. BẢO MẬT BẢNG PROFILES (Tài Khoản & Phân Quyền)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1.1. Xem hồ sơ (SELECT)
-- Khách hàng chỉ xem profile của mình; Staff, Admin, Super Admin xem được toàn bộ danh sách
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);

-- 1.2. Tạo hồ sơ mới (INSERT)
-- User đăng ký tài khoản tự động tạo profile với role mặc định là 'customer'
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND (role IS NULL OR role = 'customer')
);

-- 1.3. Cập nhật hồ sơ & phân quyền (UPDATE)
-- - Khách hàng chỉ được cập nhật thông tin cá nhân của mình, KHÔNG được đổi role hoặc status
-- - Admin chỉ được nâng cấp quyền lên 'staff' hoặc hạ xuống 'customer', KHÔNG được phong 'admin' hoặc 'super_admin'
-- - Chỉ Super Admin mới có quyền phong hoặc tước quyền 'admin' / 'super_admin'
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.get_current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  -- Trường hợp 1: Người dùng tự sửa thông tin cá nhân (không được đổi role / status)
  (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
  )
  -- Trường hợp 2: Admin quản trị (chỉ được gán customer hoặc staff)
  OR (
    public.get_current_user_role() = 'admin'
    AND role IN ('customer', 'staff')
    AND id != auth.uid()
  )
  -- Trường hợp 3: Super Admin (toàn quyền phân quyền)
  OR (
    public.get_current_user_role() = 'super_admin'
  )
);


-- ==============================================================================
-- 2. BẢO MẬT BẢNG BOOKINGS (Quản Lý Đơn Tour & Giữ Chỗ)
-- ==============================================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2.1. Xem đơn hàng (SELECT)
-- Khách hàng chỉ xem đơn của chính mình; Staff, Admin, Super Admin xem toàn bộ đơn
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
CREATE POLICY "bookings_select_policy"
ON public.bookings FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);

-- 2.2. Tạo đơn đặt tour (INSERT)
-- Người dùng đã đăng nhập có thể tạo đơn cho chính mình
DROP POLICY IF EXISTS "bookings_insert_policy" ON public.bookings;
CREATE POLICY "bookings_insert_policy"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- 2.3. Duyệt & Cập nhật đơn hàng (UPDATE)
-- - Khách hàng chỉ được cập nhật đơn của mình khi hủy đơn (booking_status = 'cancelled')
-- - Staff, Admin, Super Admin được quyền cập nhật trạng thái đơn (duyệt cọc 50%, 100%, hủy)
DROP POLICY IF EXISTS "bookings_update_policy" ON public.bookings;
CREATE POLICY "bookings_update_policy"
ON public.bookings FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
)
WITH CHECK (
  -- Khách hàng chỉ được đổi trạng thái hủy
  (user_id = auth.uid() AND booking_status = 'cancelled')
  -- Nhân sự vận hành và quản trị viên
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);

-- 2.4. XÓA CỨNG ĐƠN HÀNG (DELETE)
-- Tuyệt đối ngăn chặn khách hàng và Staff xóa đơn hàng; CHỈ Admin và Super Admin mới có quyền xóa cứng
DROP POLICY IF EXISTS "bookings_delete_policy" ON public.bookings;
CREATE POLICY "bookings_delete_policy"
ON public.bookings FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
);


-- ==============================================================================
-- 3. BẢO MẬT BẢNG TOURS (Kho Tour Lữ Hành)
-- ==============================================================================
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- 3.1. Xem danh sách tour (SELECT)
-- Mọi người (kể cả khách vãng lai) có thể xem các tour đang mở bán (status = 'published' hoặc khác 'hidden', 'deleted')
-- Staff, Admin, Super Admin có thể xem toàn bộ tour kể cả tour tạm ẩn
DROP POLICY IF EXISTS "tours_select_policy" ON public.tours;
CREATE POLICY "tours_select_policy"
ON public.tours FOR SELECT
TO public
USING (
  status NOT IN ('hidden', 'deleted')
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);

-- 3.2. Thêm tour mới (INSERT)
-- Chỉ Admin và Super Admin được phép thêm tour mới
DROP POLICY IF EXISTS "tours_insert_policy" ON public.tours;
CREATE POLICY "tours_insert_policy"
ON public.tours FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

-- 3.3. Sửa thông tin, giá & lịch trình tour (UPDATE)
-- Chỉ Admin và Super Admin được phép sửa tour (Staff KHÔNG được phép)
DROP POLICY IF EXISTS "tours_update_policy" ON public.tours;
CREATE POLICY "tours_update_policy"
ON public.tours FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

-- 3.4. Xóa vĩnh viễn tour (DELETE)
-- CHỈ DUY NHẤT Super Admin mới có quyền xóa tour khỏi cơ sở dữ liệu
DROP POLICY IF EXISTS "tours_delete_policy" ON public.tours;
CREATE POLICY "tours_delete_policy"
ON public.tours FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'super_admin'
);


-- ==============================================================================
-- 4. BẢO MẬT BẢNG COUPONS (Mã Giảm Giá & Voucher)
-- ==============================================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4.1. Xem coupon (SELECT)
-- Người dùng xem mã còn hoạt động; Staff/Admin/Super Admin xem toàn bộ
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
CREATE POLICY "coupons_select_policy"
ON public.coupons FOR SELECT
TO authenticated
USING (
  is_active = true
  OR public.get_current_user_role() IN ('staff', 'admin', 'super_admin')
);

-- 4.2. Tạo mã khuyến mãi (INSERT)
-- Chỉ Admin và Super Admin được tạo voucher
DROP POLICY IF EXISTS "coupons_insert_policy" ON public.coupons;
CREATE POLICY "coupons_insert_policy"
ON public.coupons FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

-- 4.3. Cập nhật mã khuyến mãi (UPDATE)
-- Chỉ Admin và Super Admin được cập nhật voucher
DROP POLICY IF EXISTS "coupons_update_policy" ON public.coupons;
CREATE POLICY "coupons_update_policy"
ON public.coupons FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

-- 4.4. Xóa mã khuyến mãi (DELETE)
-- CHỈ Super Admin mới có quyền xóa coupon
DROP POLICY IF EXISTS "coupons_delete_policy" ON public.coupons;
CREATE POLICY "coupons_delete_policy"
ON public.coupons FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'super_admin'
);

-- ==============================================================================
-- 5. SPRINT 1: TỒN CHỖ TOUR & ALLOTMENT TỰ ĐỘNG (INVENTORY ALLOTMENT)
-- ==============================================================================
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 25;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS booked_seats INTEGER DEFAULT 0;

-- Bảng departure_dates quản lý tồn chỗ theo từng ngày khởi hành
CREATE TABLE IF NOT EXISTS public.departure_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL,
  date TEXT NOT NULL,
  available_seats INTEGER DEFAULT 15,
  price_adult NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available', -- 'available', 'few_seats', 'sold_out'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT departure_dates_unique UNIQUE (tour_id, date)
);

ALTER TABLE public.departure_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departure_dates_select_policy" ON public.departure_dates;
CREATE POLICY "departure_dates_select_policy"
ON public.departure_dates FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "departure_dates_manage_policy" ON public.departure_dates;
CREATE POLICY "departure_dates_manage_policy"
ON public.departure_dates FOR ALL
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

