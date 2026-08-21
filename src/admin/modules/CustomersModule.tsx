import React, { useState } from 'react';
import { CustomerRecord } from '../admin.types';
import { useAuth } from '../../auth/useAuth';
import { UserRole } from '../../auth/auth.types';
import { ConfirmAdminPromotionModal } from '../modals/ConfirmAdminPromotionModal';

interface CustomersModuleProps {
  customers: CustomerRecord[];
  onRoleChange: (customerId: string, newRole: UserRole) => Promise<void>;
  onToggleStatus: (customerId: string, currentStatus: 'active' | 'banned' | 'deleted') => Promise<void>;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  customers,
  onRoleChange,
  onToggleStatus
}) => {
  const { user: currentUser, isSuperAdmin: currentUserIsSuperAdmin } = useAuth();
  const [pendingPromotion, setPendingPromotion] = useState<{
    customer: CustomerRecord;
    targetRole: 'admin' | 'super_admin';
  } | null>(null);

  const handleRoleSelect = (customer: CustomerRecord, newRole: UserRole) => {
    if (newRole === customer.role) return;

    if (newRole === 'admin' || newRole === 'super_admin') {
      // High-security operation: open verification modal with re-auth
      setPendingPromotion({
        customer,
        targetRole: newRole
      });
    } else {
      // Direct update for staff / customer
      onRoleChange(customer.id, newRole);
    }
  };

  const handleConfirmPromotion = async (customerId: string, targetRole: 'admin' | 'super_admin') => {
    await onRoleChange(customerId, targetRole);
    setPendingPromotion(null);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Danh Sách Khách Hàng &amp; Nhân Sự (4 Cấp Độ Quyền)
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
              ● Dữ Liệu Thời Gian Thực ({customers.length} Tài khoản)
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Phân quyền đa cấp độ: 👑 Super Admin &gt; 🛡️ Quản Trị Viên &gt; 🧑‍💼 Nhân Viên &gt; 👤 Khách Hàng
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="fa-solid fa-users" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
          <p>Chưa có tài khoản nào trong hệ thống.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Thành Viên</th>
                <th style={{ padding: '0.75rem 1rem' }}>Số Điện Thoại</th>
                <th style={{ padding: '0.75rem 1rem' }}>Địa Chỉ Liên Hệ</th>
                <th style={{ padding: '0.75rem 1rem' }}>Điểm Tích Lũy ⭐</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vai Trò Hiện Tại</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ngày Tham Gia</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Phân Quyền &amp; Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const isCurrentSelf =
                  c.id === currentUser?.id ||
                  c.email.toLowerCase() === currentUser?.email.toLowerCase();

                const isTargetSuperAdmin = c.role === 'super_admin';

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      background: isCurrentSelf ? 'rgba(236, 253, 245, 0.45)' : 'transparent'
                    }}
                  >
                    {/* User Info */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background:
                              c.role === 'super_admin'
                                ? '#f59e0b'
                                : c.role === 'admin'
                                ? '#059669'
                                : c.role === 'staff'
                                ? '#2563eb'
                                : '#64748b',
                            color: c.role === 'super_admin' ? '#111827' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>{c.name}</span>
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
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td style={{ padding: '0.9rem 1rem', color: '#334155', fontWeight: 600 }}>{c.phone}</td>

                    {/* Address */}
                    <td style={{ padding: '0.9rem 1rem', color: '#475569', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.address}
                    </td>

                    {/* Points */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#d97706' }}>
                      {c.points} Điểm
                    </td>

                    {/* Role Badges (4 Levels) */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      {c.role === 'super_admin' || isCurrentSelf ? (
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
                      ) : c.role === 'admin' ? (
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
                      ) : c.role === 'staff' ? (
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
                          🧑‍💼 Nhân Viên
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
                            fontWeight: 700,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          👤 Khách Hàng
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: c.status === 'active' ? '#ecfdf5' : '#fee2e2',
                          color: c.status === 'active' ? '#047857' : '#b91c1c'
                        }}
                      >
                        {c.status === 'active' ? 'Hoạt Động' : 'Đã Khóa'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {c.joinedDate}
                    </td>

                    {/* Actions: Role Selector & Lock */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isCurrentSelf ? (
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
                          <i className="fa-solid fa-shield-halved"></i> Được bảo vệ
                        </span>
                      ) : isTargetSuperAdmin && !currentUserIsSuperAdmin ? (
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#92400e',
                            background: '#fef3c7',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <i className="fa-solid fa-lock"></i> Super Admin
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 4-Tier Role Selector Dropdown */}
                          <select
                            value={c.role}
                            onChange={(e) => handleRoleSelect(c, e.target.value as UserRole)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              outline: 'none',
                              cursor: 'pointer',
                              background:
                                c.role === 'super_admin'
                                  ? '#fef3c7'
                                  : c.role === 'admin'
                                  ? '#ecfdf5'
                                  : c.role === 'staff'
                                  ? '#eff6ff'
                                  : '#ffffff',
                              color:
                                c.role === 'super_admin'
                                  ? '#b45309'
                                  : c.role === 'admin'
                                  ? '#047857'
                                  : c.role === 'staff'
                                  ? '#1d4ed8'
                                  : '#334155'
                            }}
                          >
                            <option value="customer">👤 Khách Hàng</option>
                            <option value="staff">🧑‍💼 Nhân Viên</option>
                            <option value="admin">🛡️ Quản Trị Viên</option>
                          </select>

                          {/* Toggle Lock / Unlock */}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(c.id, c.status)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: c.status === 'active' ? '#fee2e2' : '#ecfdf5',
                              color: c.status === 'active' ? '#b91c1c' : '#047857',
                              border: '1px solid ' + (c.status === 'active' ? '#fecaca' : '#a7f3d0'),
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {c.status === 'active' ? 'Khóa' : 'Mở Khóa'}
                          </button>
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

      {/* Re-authentication Confirmation Modal for Admin / Super Admin Promotion */}
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
  );
};
