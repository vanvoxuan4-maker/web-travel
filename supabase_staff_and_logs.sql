-- ==============================================================================
-- WEBTRAVEL - SUPABASE DATABASE MIGRATION SCRIPT
-- BẢNG NHẬT KÝ HOẠT ĐỘNG (audit_logs)
-- Nhân sự được quản lý trực tiếp qua bảng profiles (lọc theo role staff, admin, super_admin)
-- Hướng dẫn: Copy toàn bộ nội dung file này và dán vào Supabase SQL Editor rồi bấm RUN.
-- ==============================================================================

-- 1. TÙY CHỌN DỌN DẸP BẢNG STAFF CŨ (NẾU ĐÃ TỪNG TẠO)
drop table if exists public.staff cascade;

-- 2. BẢNG NHẬT KÝ HOẠT ĐỘNG (public.audit_logs)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id text,
  user_name text,
  user_email text,
  user_role text default 'staff',
  action text not null,
  action_category text not null default 'system' check (action_category in ('booking', 'payment', 'tour', 'staff', 'customer', 'coupon', 'system', 'auth')),
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
-- 1. Cho phép ghi nhận audit log
drop policy if exists "Cho phép ghi nhận audit log" on public.audit_logs;
create policy "Cho phép ghi nhận audit log"
  on public.audit_logs
  for insert
  with check (true);

-- 2. Cho phép xem audit logs đối với tài khoản đã xác thực
drop policy if exists "Cho phép xem audit logs" on public.audit_logs;
create policy "Cho phép xem audit logs"
  on public.audit_logs
  for select
  using (
    auth.role() = 'authenticated'
  );

-- ==============================================================================
-- 3. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- ==============================================================================

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
    '{"message": "Khởi tạo hệ thống quản trị, kích hoạt phân hệ Audit Logs"}'::jsonb
  ),
  (
    now() - interval '1 hour',
    'Hệ Thống',
    'system@webtravel.vn',
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
