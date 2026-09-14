-- ==============================================================================
-- WEBTRAVEL - SUPABASE DATABASE MIGRATION SCRIPT
-- BẢNG NHÂN SỰ (staff) & NHẬT KÝ HOẠT ĐỘNG (audit_logs)
-- Hướng dẫn: Copy toàn bộ nội dung file này và dán vào Supabase SQL Editor rồi bấm RUN.
-- ==============================================================================

-- 1. BẢNG NHÂN SỰ NỘI BỘ (public.staff)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  employee_code text unique not null,
  full_name text not null,
  email text unique not null,
  phone text not null,
  avatar_url text,
  gender text default 'male' check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  identity_card text,
  department text not null default 'Điều Hành Tour',
  position text not null default 'Chuyên Viên Tư Vấn',
  role text not null default 'staff' check (role in ('staff', 'admin', 'super_admin')),
  status text not null default 'active' check (status in ('active', 'banned', 'resigned')),
  hire_date date default current_date,
  address text,
  emergency_contact text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bật Row Level Security (RLS) cho bảng staff
alter table public.staff enable row level security;

-- Index cho bảng staff để tối ưu tốc độ tìm kiếm
create index if not exists idx_staff_employee_code on public.staff(employee_code);
create index if not exists idx_staff_email on public.staff(email);
create index if not exists idx_staff_department on public.staff(department);
create index if not exists idx_staff_status on public.staff(status);
create index if not exists idx_staff_role on public.staff(role);

-- Chính sách RLS cho bảng staff:
-- 1. Cho phép đọc thông tin nhân viên cho các tài khoản đã đăng nhập có quyền staff/admin/super_admin
create policy "Cho phép nhân viên và admin xem danh sách nhân sự"
  on public.staff
  for select
  using (
    auth.role() = 'authenticated'
  );

-- 2. Chỉ Admin và Super Admin được phép thêm nhân sự mới
create policy "Cho phép admin và super admin thêm nhân sự mới"
  on public.staff
  for insert
  with check (
    auth.role() = 'authenticated'
  );

-- 3. Cho phép Admin và Super Admin cập nhật hồ sơ nhân sự
create policy "Cho phép admin và super admin sửa thông tin nhân sự"
  on public.staff
  for update
  using (
    auth.role() = 'authenticated'
  );

-- 4. Chỉ Super Admin được phép xóa nhân sự
create policy "Chỉ Super Admin được phép xóa nhân sự"
  on public.staff
  for delete
  using (
    auth.role() = 'authenticated'
  );

-- ==============================================================================
-- 2. BẢNG NHẬT KÝ HOẠT ĐỘNG (public.audit_logs)
-- ==============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id text,
  user_name text,
  user_email text,
  user_role text default 'staff',
  action text not null,
  action_category text not null default 'booking' check (action_category in ('booking', 'payment', 'tour', 'staff', 'customer', 'coupon', 'system', 'auth')),
  target_id text,
  target_name text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text
);

-- Bật Row Level Security (RLS) cho bảng audit_logs
alter table public.audit_logs enable row level security;

-- Index cho bảng audit_logs để tìm kiếm và lọc phân trang mượt mà
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_action_category on public.audit_logs(action_category);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_target_id on public.audit_logs(target_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);

-- Chính sách RLS cho bảng audit_logs:
-- 1. Cho phép người dùng đã xác thực (nhân viên, admin) tạo bản ghi nhật ký
create policy "Cho phép ghi nhận audit log"
  on public.audit_logs
  for insert
  with check (true);

-- 2. Chỉ Admin và Super Admin được phép đọc nhật ký
create policy "Cho phép xem audit logs"
  on public.audit_logs
  for select
  using (
    auth.role() = 'authenticated'
  );

-- ==============================================================================
-- 3. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- ==============================================================================

-- Thêm nhân sự mẫu nếu bảng staff đang trống
insert into public.staff (
  employee_code,
  full_name,
  email,
  phone,
  gender,
  date_of_birth,
  identity_card,
  department,
  position,
  role,
  status,
  hire_date,
  address,
  emergency_contact,
  notes
)
values
  (
    'NV-001',
    'Võ Xuân Vạn',
    'vanvoxuan4@gmail.com',
    '0965712527',
    'male',
    '1995-08-15',
    '079095012345',
    'Ban Giám Đốc',
    'Tổng Quản Trị Hệ Thống',
    'super_admin',
    'active',
    '2024-01-01',
    'TP. Hồ Chí Minh',
    '0988889999 (Người thân)',
    'Tài khoản sáng lập và điều hành toàn bộ hệ sinh thái WebTravel'
  ),
  (
    'NV-002',
    'Nguyễn Thu Trang',
    'trang.nguyen@webtravel.vn',
    '0912345678',
    'female',
    '1998-05-20',
    '001198056789',
    'Kinh Doanh & Sale',
    'Trưởng Phòng Kinh Doanh',
    'admin',
    'active',
    '2024-03-15',
    'Hà Nội',
    '0903112233 (Mẹ)',
    'Phụ trách duyệt đơn đặt tour lớn và chương trình ưu đãi'
  ),
  (
    'NV-003',
    'Trần Minh Tuấn',
    'tuan.tran@webtravel.vn',
    '0933887766',
    'male',
    '2000-11-10',
    '079200088991',
    'Điều Hành Tour',
    'Chuyên Viên Điều Hành Tuyến Quốc Tế',
    'staff',
    'active',
    '2024-06-01',
    'Đà Nẵng',
    '0944556677 (Bố)',
    'Quản lý lịch khởi hành các tour Nhật Bản, Hàn Quốc, Châu Âu'
  )
on conflict (employee_code) do nothing;

-- Thêm một số bản ghi nhật ký hoạt động mẫu ban đầu
insert into public.audit_logs (
  created_at,
  user_name,
  user_email,
  user_role,
  action,
  action_category,
  target_id,
  target_name,
  details
)
values
  (
    now() - interval '2 hours',
    'Võ Xuân Vạn',
    'vanvoxuan4@gmail.com',
    'super_admin',
    'SYSTEM_INIT',
    'system',
    'SYS-2026',
    'Hệ Thống WebTravel',
    '{"message": "Khởi tạo hệ thống quản trị, kích hoạt phân hệ Audit Logs và Quản lý nhân sự"}'::jsonb
  ),
  (
    now() - interval '1 hour',
    'Nguyễn Thu Trang',
    'trang.nguyen@webtravel.vn',
    'admin',
    'CONFIRM_BOOKING',
    'booking',
    'WT-20260914-F776BD',
    'Cung Đường Vàng Nhật Bản: Tokyo - Núi Phú Sĩ - Kyoto - Osaka 6N5Đ',
    '{"old_status": "pending", "new_status": "confirmed", "paid_amount": 57800000, "payment_method": "CREDIT_CARD"}'::jsonb
  ),
  (
    now() - interval '30 minutes',
    'Võ Xuân Vạn',
    'vanvoxuan4@gmail.com',
    'super_admin',
    'UPDATE_LOYALTY_POINTS',
    'customer',
    'tester (0965712527)',
    'Khách hàng tester',
    '{"old_points": 0, "new_points": 578, "reason": "Tự động tích lũy điểm thưởng đơn WT-20260914-F776BD"}'::jsonb
  );
