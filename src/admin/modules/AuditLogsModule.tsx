import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogRecord } from '../admin.types';
import { auditLogService } from '../../services/auditLogService';

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  booking: { label: 'Đơn Đặt Tour', icon: 'fa-receipt', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  payment: { label: 'Thanh Toán', icon: 'fa-credit-card', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  tour: { label: 'Kho Tour', icon: 'fa-map-location-dot', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  staff: { label: 'Nhân Sự', icon: 'fa-id-badge', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  customer: { label: 'Khách Hàng', icon: 'fa-users', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  coupon: { label: 'Mã Giảm Giá', icon: 'fa-tags', color: '#c026d3', bg: '#fae8ff', border: '#f5d0fe' },
  system: { label: 'Hệ Thống', icon: 'fa-gear', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  auth: { label: 'Bảo Mật & Quyền', icon: 'fa-shield-halved', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
};

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditLogService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Lỗi khi tải nhật ký hoạt động:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const handleNewLog = () => {
      fetchLogs();
    };
    window.addEventListener('webtravel:audit_log_created', handleNewLog);
    return () => {
      window.removeEventListener('webtravel:audit_log_created', handleNewLog);
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    let bookingLogs = 0;
    let paymentLogs = 0;
    let securityStaffLogs = 0;

    logs.forEach(l => {
      if (l.actionCategory === 'booking') bookingLogs++;
      else if (l.actionCategory === 'payment') paymentLogs++;
      else if (l.actionCategory === 'staff' || l.actionCategory === 'auth' || l.actionCategory === 'customer') securityStaffLogs++;
    });

    return {
      total: logs.length,
      bookingLogs,
      paymentLogs,
      securityStaffLogs
    };
  }, [logs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterCategory !== 'all' && l.actionCategory !== filterCategory) return false;
      if (filterRole !== 'all' && l.userRole !== filterRole) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = l.action.toLowerCase().includes(q);
        const matchUser = (l.userName || '').toLowerCase().includes(q) || (l.userEmail || '').toLowerCase().includes(q);
        const matchTarget = (l.targetId || '').toLowerCase().includes(q) || (l.targetName || '').toLowerCase().includes(q);
        return matchAction || matchUser || matchTarget;
      }
      return true;
    });
  }, [logs, filterCategory, filterRole, searchQuery]);

  const handleCopyPayload = (details: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── 1. KPI Metric Summary Cards (Modern SaaS Emerald) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        
        {/* Tổng số nhật ký */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.35rem 1.4rem',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tổng Nhật Ký
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats.total.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>sự kiện</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '0.7rem' }} /> Lưu trữ thời gian thực toàn hệ thống
          </div>
        </div>

        {/* Xử lý đơn tour */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.35rem 1.4rem',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Xử Lý Đơn Tour
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.02em', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats.bookingLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>lần</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-receipt" />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-bolt" style={{ fontSize: '0.7rem' }} /> Duyệt đơn, cọc 50%, hủy & hoàn tour
          </div>
        </div>

        {/* Thanh toán & Giao dịch */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.35rem 1.4rem',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Giao Dịch Tài Chính
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#d97706', letterSpacing: '-0.02em', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats.paymentLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>lần</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-credit-card" />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-qrcode" style={{ fontSize: '0.7rem' }} /> Đối soát VietQR, thẻ & hoàn tiền
          </div>
        </div>

        {/* Bảo mật & Nhân sự */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.35rem 1.4rem',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bảo Mật &amp; Nhân Sự
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats.securityStaffLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>thao tác</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-shield-halved" />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-user-shield" style={{ fontSize: '0.7rem' }} /> Phân quyền, khóa nick & điểm thưởng
          </div>
        </div>
      </div>

      {/* ── 2. Main Audit Trail Card (Clean & Neat Table) ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '1.6rem 1.75rem',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Header & Export Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.35rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
              </h3>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap'
                }}
              >
                ● {filteredLogs.length} Bản ghi
              </span>
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              Theo dõi chi tiết mọi thay đổi dữ liệu, truy vết người thực hiện và đối soát minh bạch
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={fetchLogs}
              style={{
                padding: '0.52rem 0.95rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              title="Tải lại dữ liệu mới nhất"
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#059669' }} />
              <span>Làm Mới</span>
            </button>

            <button
              type="button"
              onClick={() => auditLogService.exportLogsToCSV(filteredLogs)}
              style={{
                padding: '0.52rem 1.15rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1.5px solid #a7f3d0',
                color: '#047857',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 1px 3px rgba(4, 120, 87, 0.08)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              <i className="fa-solid fa-file-csv" style={{ color: '#059669', fontSize: '0.95rem' }} />
              <span>Xuất Nhật Ký (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar Bar */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            marginBottom: '1.35rem',
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
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}
            />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, email, người thao tác hoặc hành động..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.25rem',
                borderRadius: '9px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
            />
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                borderRadius: '9px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff',
                color: '#334155',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="all">📂 Tất cả danh mục</option>
              <option value="booking">📋 Đơn Đặt Tour</option>
              <option value="payment">💳 Thanh Toán</option>
              <option value="tour">🗺️ Kho Tour Lữ Hành</option>
              <option value="staff">🧑‍💼 Quản Lý Nhân Sự</option>
              <option value="customer">👥 Khách Hàng Thành Viên</option>
              <option value="coupon">🏷️ Mã Giảm Giá</option>
              <option value="system">⚙️ Hệ Thống & Bảo Mật</option>
            </select>
          </div>

          {/* Filter Role */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                borderRadius: '9px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff',
                color: '#334155',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="all">👤 Mọi vai trò</option>
              <option value="super_admin">👑 Super Admin</option>
              <option value="admin">🛡️ Quản Trị Viên (Admin)</option>
              <option value="staff">🧑‍💼 Nhân Viên Vận Hành</option>
              <option value="system">🤖 Tự Động (Hệ Thống)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '0.85rem'
              }}
            >
              <i className="fa-solid fa-clipboard-list" />
            </div>
            <h4 style={{ margin: '0 0 0.35rem', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>
              Không tìm thấy nhật ký phù hợp
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc danh mục phía trên
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Thời Gian</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Người Thực Hiện</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Hành Động</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Danh Mục</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Đối Tượng Tác Động</th>
                  <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const cat = CATEGORY_LABELS[log.actionCategory] || { label: log.actionCategory, icon: 'fa-tag', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
                  const isSevere = log.action.includes('CANCEL') || log.action.includes('LOCK') || log.action.includes('DELETE');
                  const isSuccessAction = log.action.includes('CONFIRM') || log.action.includes('CREATE') || log.action.includes('APPROVE');
                  const isPromote = log.action.includes('PROMOTE');

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Thời gian */}
                      <td style={{ padding: '0.95rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Người thực hiện */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background:
                                log.userRole === 'super_admin'
                                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                                  : log.userRole === 'admin'
                                  ? 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)'
                                  : 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
                              color: log.userRole === 'super_admin' ? '#b45309' : log.userRole === 'admin' ? '#047857' : '#1d4ed8',
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}
                          >
                            {(log.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                              {log.userName || 'Hệ Thống'}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {log.userEmail || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mã Hành Động */}
                      <td style={{ padding: '0.95rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '7px',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: '0.02em',
                            background: isSevere
                              ? '#fef2f2'
                              : isPromote
                              ? '#fdf4ff'
                              : isSuccessAction
                              ? '#ecfdf5'
                              : '#f8fafc',
                            color: isSevere
                              ? '#dc2626'
                              : isPromote
                              ? '#9333ea'
                              : isSuccessAction
                              ? '#047857'
                              : '#334155',
                            border: `1px solid ${
                              isSevere
                                ? '#fecaca'
                                : isPromote
                                ? '#f0abfc'
                                : isSuccessAction
                                ? '#a7f3d0'
                                : '#e2e8f0'
                            }`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Danh mục */}
                      <td style={{ padding: '0.95rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.22rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: cat.bg,
                            color: cat.color,
                            border: `1px solid ${cat.border}`
                          }}
                        >
                          <i className={`fa-solid ${cat.icon}`} style={{ fontSize: '0.68rem' }} />
                          {cat.label}
                        </span>
                      </td>

                      {/* Đối tượng tác động */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        {log.targetId && (
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#047857', fontSize: '0.79rem' }}>
                            {log.targetId}
                          </div>
                        )}
                        {log.targetName && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748b',
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '0.1rem'
                            }}
                            title={log.targetName}
                          >
                            {log.targetName}
                          </div>
                        )}
                      </td>

                      {/* Chi tiết nút bấm */}
                      <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '0.36rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #a7f3d0',
                            background: '#ecfdf5',
                            color: '#047857',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#047857';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ecfdf5';
                            e.currentTarget.style.color = '#047857';
                          }}
                        >
                          <i className="fa-solid fa-circle-info" /> Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 3. Modern Detail Modal View (Glassmorphism & Clean JSON) ── */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}
                >
                  <i className="fa-solid fa-file-waveform" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Chi Tiết Nhật Ký Kiểm Toán
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Mã bản ghi: <code style={{ color: '#047857', fontWeight: 700 }}>{selectedLog.id}</code>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Quick Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Người thực hiện</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginTop: '0.15rem' }}>{selectedLog.userName}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{selectedLog.userEmail} ({selectedLog.userRole})</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Hành Động &amp; Danh Mục</span>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem', marginTop: '0.15rem' }}>{selectedLog.action}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Danh mục: {selectedLog.actionCategory}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Thời Điểm Thực Hiện</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                  {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Đối Tượng Tác Động</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                  {selectedLog.targetName || selectedLog.targetId || 'Không có'}
                </div>
                {selectedLog.targetId && (
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                    ID: {selectedLog.targetId}
                  </div>
                )}
              </div>
            </div>

            {/* JSON Payload Details Viewer */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                  Dữ Liệu Chi Tiết (Event Payload)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyPayload(selectedLog.details)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: copiedPayload ? '#ecfdf5' : '#f8fafc',
                    color: copiedPayload ? '#047857' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className={copiedPayload ? 'fa-solid fa-check' : 'fa-solid fa-copy'} />
                  <span>{copiedPayload ? 'Đã sao chép!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '1.15rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  border: '1px solid #334155',
                  margin: 0
                }}
              >
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(4, 120, 87, 0.2)'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
