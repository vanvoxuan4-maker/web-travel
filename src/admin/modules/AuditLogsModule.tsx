import React, { useState, useMemo, useEffect } from 'react';
import { AuditLogRecord, AuditLogCategory } from '../admin.types';
import { auditLogService } from '../../services/auditLogService';

interface AuditLogsModuleProps {
  logs?: AuditLogRecord[];
  onRefresh?: () => void;
}

const CATEGORY_LABELS: Record<AuditLogCategory, { label: string; icon: string; color: string; bg: string }> = {
  booking: { label: 'Đơn Đặt Tour', icon: 'fa-receipt', color: '#047857', bg: '#ecfdf5' },
  payment: { label: 'Thanh Toán', icon: 'fa-credit-card', color: '#2563eb', bg: '#eff6ff' },
  tour: { label: 'Kho Tour', icon: 'fa-map-location-dot', color: '#d97706', bg: '#fefce8' },
  staff: { label: 'Nhân Sự', icon: 'fa-id-badge', color: '#7c3aed', bg: '#f5f3ff' },
  customer: { label: 'Khách Hàng', icon: 'fa-users', color: '#0891b2', bg: '#ecfeff' },
  coupon: { label: 'Mã Giảm Giá', icon: 'fa-tags', color: '#e11d48', bg: '#fff1f2' },
  system: { label: 'Hệ Thống', icon: 'fa-server', color: '#475569', bg: '#f8fafc' },
  auth: { label: 'Xác Thực', icon: 'fa-shield-halved', color: '#dc2626', bg: '#fef2f2' }
};

export const AuditLogsModule: React.FC<AuditLogsModuleProps> = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditLogService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Lỗi tải nhật ký audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const handleNewLog = (e: any) => {
      if (e?.detail) {
        setLogs(prev => [e.detail, ...prev]);
      }
    };

    window.addEventListener('webtravel:audit_log_created', handleNewLog);
    return () => {
      window.removeEventListener('webtravel:audit_log_created', handleNewLog);
    };
  }, []);

  // Thống kê Metrics
  const stats = useMemo(() => {
    let bookingLogs = 0;
    let paymentLogs = 0;
    let securityStaffLogs = 0;

    logs.forEach(l => {
      if (l.actionCategory === 'booking') bookingLogs++;
      else if (l.actionCategory === 'payment') paymentLogs++;
      else if (l.actionCategory === 'staff' || l.actionCategory === 'auth' || l.actionCategory === 'customer') {
        securityStaffLogs++;
      }
    });

    return {
      total: logs.length,
      bookingLogs,
      paymentLogs,
      securityStaffLogs
    };
  }, [logs]);

  // Bộ lọc dữ liệu
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Tổng số log */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng Số Nhật Ký</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
            {stats.total.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>sự kiện</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Lưu trữ thời gian thực toàn hệ thống</div>
        </div>

        {/* Thao tác đơn hàng */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Xử Lý Đơn Tour</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-receipt" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#2563eb' }}>
            {stats.bookingLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Duyệt đơn, cọc 50%, hủy & hoàn tour</div>
        </div>

        {/* Thanh toán & Giao dịch */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Giao Dịch Tài Chính</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fefce8', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-credit-card" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#d97706' }}>
            {stats.paymentLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Đối soát VietQR, thẻ & hoàn trả tiền</div>
        </div>

        {/* Nhân sự & Bảo mật */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nhân Sự &amp; Bảo Mật</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-shield-halved" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed' }}>
            {stats.securityStaffLogs.toLocaleString('vi-VN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>thao tác</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem' }}>Phân quyền, khóa/mở tài khoản & điểm thưởng</div>
        </div>
      </div>

      {/* 2. Main Table Card */}
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
                Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
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
                ● {filteredLogs.length} Bản ghi
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Theo dõi chi tiết mọi thay đổi dữ liệu, truy vết người thực hiện và đối soát minh bạch
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={fetchLogs}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="Tải lại dữ liệu mới nhất"
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} /> Làm Mới
            </button>

            <button
              type="button"
              onClick={() => auditLogService.exportLogsToCSV(filteredLogs)}
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
              <i className="fa-solid fa-file-csv" style={{ color: '#047857' }} /> Xuất Nhật Ký (CSV)
            </button>
          </div>
        </div>

        {/* Filters Bar */}
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
              placeholder="Tìm theo mã đơn, email, người thao tác hoặc hành động..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fa-solid fa-clipboard-check" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
            <p style={{ fontWeight: 600 }}>Không tìm thấy bản ghi nhật ký nào phù hợp.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Thời Gian</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Người Thực Hiện</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Hành Động</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Danh Mục</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Đối Tượng Tác Động</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const cat = CATEGORY_LABELS[log.actionCategory] || { label: log.actionCategory, icon: 'fa-tag', color: '#475569', bg: '#f1f5f9' };
                  const isSevere = log.action.includes('CANCEL') || log.action.includes('LOCK') || log.action.includes('DELETE');
                  const isSuccessAction = log.action.includes('CONFIRM') || log.action.includes('CREATE') || log.action.includes('APPROVE');

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Thời gian */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Người thực hiện */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: log.userRole === 'super_admin' ? '#fef3c7' : log.userRole === 'admin' ? '#ecfdf5' : '#eff6ff',
                              color: log.userRole === 'super_admin' ? '#b45309' : log.userRole === 'admin' ? '#047857' : '#1d4ed8',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {(log.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                              {log.userName || 'Hệ Thống'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {log.userEmail || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mã Hành Động */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            background: isSevere ? '#fef2f2' : isSuccessAction ? '#ecfdf5' : '#f8fafc',
                            color: isSevere ? '#dc2626' : isSuccessAction ? '#047857' : '#334155',
                            border: `1px solid ${isSevere ? '#fecaca' : isSuccessAction ? '#a7f3d0' : '#e2e8f0'}`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Danh mục */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '20px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            background: cat.bg,
                            color: cat.color
                          }}
                        >
                          <i className={`fa-solid ${cat.icon}`} style={{ fontSize: '0.7rem' }} />
                          {cat.label}
                        </span>
                      </td>

                      {/* Đối tượng tác động */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {log.targetId && (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#047857', fontSize: '0.8rem' }}>
                            {log.targetId}
                          </div>
                        )}
                        {log.targetName && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.targetName}>
                            {log.targetName}
                          </div>
                        )}
                      </td>

                      {/* Chi tiết nút bấm */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <i className="fa-solid fa-eye" style={{ color: '#059669' }} /> Chi Tiết
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

      {/* 3. Detail Drawer / Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                >
                  <i className="fa-solid fa-clipboard-list"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Chi Tiết Nhật Ký Hoạt Động
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Hành Động:</span>
                  <div style={{ fontWeight: 800, color: '#047857', fontFamily: 'monospace' }}>{selectedLog.action}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Thời Gian:</span>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Người Thực Hiện:</span>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedLog.userName} ({selectedLog.userRole})</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{selectedLog.userEmail}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Đối Tượng:</span>
                  <div style={{ fontWeight: 700, color: '#047857' }}>{selectedLog.targetId || 'N/A'}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{selectedLog.targetName || ''}</div>
                </div>
              </div>

              {/* JSON Payload Details */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Dữ Liệu Thay Đổi Chi Tiết (JSON Data Payload):
                </span>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#34d399',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0
                  }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
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
