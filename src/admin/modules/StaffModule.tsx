import React, { useState, useMemo } from 'react';
import { StaffRecord } from '../admin.types';
import { useAuth } from '../../auth/useAuth';
import { UserRole } from '../../auth/auth.types';
import { canAssignRole, hasPermission } from '../../auth';
import { ConfirmAdminPromotionModal } from '../modals/ConfirmAdminPromotionModal';
import { exportStaffToCSV } from '../../utils/exportUtils';
import { removeVietnameseTones } from '../../utils/formatters';

interface StaffModuleProps {
  staff: StaffRecord[];
  onRoleChange: (staffId: string, newRole: UserRole) => Promise<void>;
  onToggleStatus: (staffId: string, currentStatus: 'active' | 'banned' | 'deleted') => Promise<void>;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  staff,
  onRoleChange,
  onToggleStatus
}) => {
  const { user: currentUser, isSuperAdmin: currentUserIsSuperAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'super_admin' | 'admin' | 'staff'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [pendingPromotion, setPendingPromotion] = useState<{
    customer: StaffRecord;
    targetRole: 'admin' | 'super_admin';
  } | null>(null);

  // 1. Metric stats
  const stats = useMemo(() => {
    let superAdmins = 0;
    let admins = 0;
    let operationalStaff = 0;
    let bannedStaff = 0;

    staff.forEach((s) => {
      if (s.role === 'super_admin') superAdmins++;
      else if (s.role === 'admin') admins++;
      else if (s.role === 'staff') operationalStaff++;

      if (s.status === 'banned') bannedStaff++;
    });

    return {
      total: staff.length,
      superAdmins,
      admins,
      operationalStaff,
      bannedStaff
    };
  }, [staff]);

  // 2. Filter logic
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // Role filter
      if (filterRole !== 'all' && s.role !== filterRole) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && s.status !== filterStatus) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const cleanQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
        const name = removeVietnameseTones((s.name || '').toLowerCase());
        const email = (s.email || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const empCode = (s.employeeCode || '').toLowerCase();
        const dept = removeVietnameseTones((s.department || '').toLowerCase());

        const matches =
          name.includes(cleanQuery) ||
          email.includes(cleanQuery) ||
          phone.includes(cleanQuery) ||
          empCode.includes(cleanQuery) ||
          dept.includes(cleanQuery);

        if (!matches) return false;
      }

      return true;
    });
  }, [staff, filterRole, filterStatus, searchQuery]);

  const handleRoleSelect = (member: StaffRecord, newRole: UserRole) => {
    if (newRole === member.role) return;

    if (!canAssignRole(currentUser?.role, newRole)) {
      alert('Bạn không có đủ thẩm quyền để gán vai trò này.');
      return;
    }

    if (newRole === 'admin' || newRole === 'super_admin') {
      setPendingPromotion({
        customer: member,
        targetRole: newRole
      });
    } else {
      onRoleChange(member.id, newRole);
    }
  };

  const handleConfirmPromotion = async (staffId: string, targetRole: 'admin' | 'super_admin') => {
    await onRoleChange(staffId, targetRole);
    setPendingPromotion(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── 1. KPI Metric Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Tổng nhân sự */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng Nhân Sự</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-id-badge" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
            {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>thành viên</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '0.25rem' }}>Đội ngũ nội bộ hệ thống</div>
        </div>

        {/* Tổng Quản Trị */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Super Admin</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-crown" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#b45309' }}>
            {stats.superAdmins} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>người</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Toàn quyền hệ thống & RBAC</div>
        </div>

        {/* Quản Trị Viên */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Quản Trị Viên</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-shield-halved" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d4ed8' }}>
            {stats.admins} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>người</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Quản lý tour, đơn hàng & nhân sự</div>
        </div>

        {/* Nhân Viên Vận Hành */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nhân Viên Vận Hành</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-headset" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857' }}>
            {stats.operationalStaff} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>người</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Xử lý tour, kiểm duyệt đơn</div>
        </div>
      </div>

      {/* ── 2. Staff Management Table ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        {/* Header & Export Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Đội Ngũ Nhân Sự &amp; Cán Bộ Điều Hành
              </h3>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap'
                }}
              >
                ● {filteredStaff.length} / {staff.length} Nhân sự
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Quản lý tài khoản nội bộ, phân quyền vận hành và kiểm soát truy cập phân cấp bảo mật cao
            </p>
          </div>

          <button
            type="button"
            onClick={() => exportStaffToCSV(filteredStaff)}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-file-csv" style={{ color: '#047857' }} /> Xuất Danh Sách Nhân Sự (CSV)
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.82rem' }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên, email, sđt, phòng ban hoặc mã nhân sự..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.3rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff',
                color: '#334155',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">🎖️ Tất cả vai trò</option>
              <option value="super_admin">👑 Super Admin</option>
              <option value="admin">🛡️ Quản Trị Viên</option>
              <option value="staff">🧑‍💼 Nhân Viên Vận Hành</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff',
                color: '#334155',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">🔘 Tất cả trạng thái</option>
              <option value="active">🟢 Đang hoạt động</option>
              <option value="banned">🔴 Đã khóa truy cập</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fa-solid fa-user-shield" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
            <p style={{ fontWeight: 600 }}>Không tìm thấy nhân sự nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Nhân Sự</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mã NV / Phòng Ban</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Số Điện Thoại</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vai Trò Hiện Tại</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ngày Tham Gia</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Phân Quyền &amp; Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, idx) => {
                  const isCurrentSelf =
                    s.id === currentUser?.id ||
                    s.email.toLowerCase() === currentUser?.email?.toLowerCase();

                  const empCode = s.employeeCode || `NV-${String(idx + 1).padStart(3, '0')}`;
                  const dept = s.department || (s.role === 'super_admin' ? 'Ban Giám Đốc' : s.role === 'admin' ? 'Bộ Phận Quản Lý' : 'Phòng Điều Hành');

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        background: isCurrentSelf ? 'rgba(236, 253, 245, 0.45)' : 'transparent'
                      }}
                    >
                      {/* Avatar + Tên + Email */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background:
                                s.role === 'super_admin'
                                  ? '#f59e0b'
                                  : s.role === 'admin'
                                  ? '#059669'
                                  : '#2563eb',
                              color: s.role === 'super_admin' ? '#111827' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              flexShrink: 0
                            }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{s.name}</span>
                              {isCurrentSelf && (
                                <span
                                  style={{
                                    background: '#047857',
                                    color: '#ffffff',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '4px',
                                    letterSpacing: '0.04em'
                                  }}
                                >
                                  BẠN
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Mã NV & Phòng ban */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.8rem' }}>{empCode}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dept}</div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '0.9rem 1rem', color: '#334155', fontWeight: 600 }}>{s.phone}</td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                        {s.role === 'super_admin' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            👑 Super Admin
                          </span>
                        ) : s.role === 'admin' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🛡️ Quản Trị Viên
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🧑‍💼 Nhân Viên Vận Hành
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            background: s.status === 'active' ? '#ecfdf5' : s.status === 'banned' ? '#fee2e2' : '#f1f5f9',
                            color: s.status === 'active' ? '#047857' : s.status === 'banned' ? '#b91c1c' : '#475569',
                            border: `1px solid ${s.status === 'active' ? '#a7f3d0' : s.status === 'banned' ? '#fecaca' : '#cbd5e1'}`
                          }}
                        >
                          <i className={`fa-solid ${s.status === 'active' ? 'fa-circle-check' : s.status === 'banned' ? 'fa-lock' : 'fa-trash-can'}`} style={{ fontSize: '0.7rem' }} />
                          {s.status === 'active' ? 'Hoạt Động' : s.status === 'banned' ? 'Đã Khóa' : 'Đã Xóa'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {s.joinedDate}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {currentUser?.role === 'staff' ? (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chỉ xem
                          </span>
                        ) : isCurrentSelf ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#047857',
                              background: '#d1fae5',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            <i className="fa-solid fa-shield-halved"></i> Tài Khoản Hiện Tại
                          </span>
                        ) : (s.role === 'admin' || s.role === 'super_admin') && !currentUserIsSuperAdmin ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: s.role === 'super_admin' ? '#92400e' : '#047857',
                              background: s.role === 'super_admin' ? '#fef3c7' : '#ecfdf5',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              border: '1px solid ' + (s.role === 'super_admin' ? '#fde68a' : '#a7f3d0')
                            }}
                          >
                            <i className="fa-solid fa-lock"></i> {s.role === 'super_admin' ? 'Super Admin' : 'Quản Trị Viên'}
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Role Selector */}
                            <select
                              value={s.role}
                              onChange={(e) => handleRoleSelect(s, e.target.value as UserRole)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: 'pointer',
                                background:
                                  s.role === 'super_admin'
                                    ? '#fef3c7'
                                    : s.role === 'admin'
                                    ? '#ecfdf5'
                                    : '#eff6ff',
                                color:
                                  s.role === 'super_admin'
                                    ? '#b45309'
                                    : s.role === 'admin'
                                    ? '#047857'
                                    : '#1d4ed8'
                              }}
                            >
                              <option value="staff">🧑‍💼 Nhân Viên</option>
                              {currentUserIsSuperAdmin && (
                                <>
                                  <option value="admin">🛡️ Quản Trị Viên</option>
                                  <option value="super_admin">👑 Super Admin</option>
                                </>
                              )}
                              <option value="customer">👤 Hạ xuống Khách Hàng</option>
                            </select>

                            {/* Lock / Unlock */}
                            {hasPermission(currentUser?.role, 'customer:ban') && (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(s.id, s.status)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: s.status === 'active' ? '#fee2e2' : '#ecfdf5',
                                  color: s.status === 'active' ? '#b91c1c' : '#047857',
                                  border: '1px solid ' + (s.status === 'active' ? '#fecaca' : '#a7f3d0'),
                                  borderRadius: '8px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {s.status === 'active' ? 'Khóa' : 'Mở Khóa'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Re-auth Modal */}
        {pendingPromotion && (
          <ConfirmAdminPromotionModal
            targetCustomer={pendingPromotion.customer}
            targetRole={pendingPromotion.targetRole}
            isOpen={!!pendingPromotion}
            onClose={() => setPendingPromotion(null)}
            onConfirmPromotion={handleConfirmPromotion}
          />
        )}
      </div>
    </div>
  );
};
