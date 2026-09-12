-- ==============================================================================
-- SUPABASE RPC: ADMIN RESET USER PASSWORD
-- Cho phép Quản Trị Viên (Super Admin / Admin) đổi/đặt lại mật khẩu cho khách hàng
-- ==============================================================================

-- Bật extension pgcrypto nếu chưa có
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Tạo hàm đặt lại mật khẩu với quyền SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 1. Kiểm tra xác thực: người gọi phải đăng nhập
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để thực hiện thao tác này.';
  END IF;

  -- 2. Kiểm tra vai trò của người gọi trong bảng profiles: chỉ super_admin hoặc admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Từ chối truy cập: Chỉ Quản Trị Viên (Admin/Super Admin) mới có quyền đặt lại mật khẩu cho thành viên.';
  END IF;

  -- 3. Kiểm tra độ dài mật khẩu mới
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
  END IF;

  -- 4. Cập nhật mật khẩu mã hóa trong bảng auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tài khoản người dùng với ID đã cho.';
  END IF;

  RETURN TRUE;
END;
$$;

-- Cấp quyền thực thi cho người dùng đã đăng nhập (logic hàm sẽ tự kiểm tra vai trò admin)
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_reset_user_password IS 'RPC cho phép Admin/Super Admin đặt lại mật khẩu tài khoản khách hàng trực tiếp.';
