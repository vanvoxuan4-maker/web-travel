import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PaymentTransactionRecord } from '../../services/bookingService';
import { formatCurrencyVND, removeVietnameseTones } from '../../utils/formatters';

interface PaymentsModuleProps {
  transactions: PaymentTransactionRecord[];
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

type FilterType = 'all' | 'full' | 'deposit' | 'remaining' | 'refund';
type FilterMethod = 'all' | 'vietqr' | 'momo' | 'credit_card' | 'cash' | 'bank_transfer';

// Helper date formatter
const formatTxDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const getMethodBadge = (method?: string) => {
  switch (method?.toLowerCase()) {
    case 'vietqr':
      return { label: 'VietQR', icon: 'fa-qrcode', bg: '#eff6ff', color: '#1d4ed8' };
    case 'momo':
      return { label: 'Ví MoMo', icon: 'fa-wallet', bg: '#fdf2f8', color: '#be185d' };
    case 'credit_card':
      return { label: 'Thẻ Quốc Tế', icon: 'fa-credit-card', bg: '#f5f3ff', color: '#6d28d9' };
    case 'cash':
      return { label: 'Tiền Mặt', icon: 'fa-money-bill-1-wave', bg: '#f0fdf4', color: '#15803d' };
    case 'bank_transfer':
      return { label: 'Chuyển Khoản', icon: 'fa-building-columns', bg: '#f8fafc', color: '#334155' };
    default:
      return { label: method?.toUpperCase() || 'KHÁC', icon: 'fa-receipt', bg: '#f1f5f9', color: '#475569' };
  }
};

const getTypeBadge = (type?: string) => {
  switch (type) {
    case 'deposit':
      return { label: 'Đặt cọc 50%', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
    case 'remaining':
      return { label: 'Thu còn lại', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' };
    case 'full':
      return { label: 'Thanh toán 100%', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    case 'refund':
      return { label: 'Hoàn tiền', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    default:
      return { label: 'Thanh toán', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
  }
};

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  transactions,
  onRefresh,
  isLoading = false
}) => {
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedMethod, setSelectedMethod] = useState<FilterMethod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Copy code with flash notification
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1. Calculate KPI Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalSuccessCount = 0;
    let depositCount = 0;
    let fullCount = 0;
    let refundAmount = 0;
    let refundCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'success') {
        if (tx.paymentType === 'refund') {
          refundAmount += tx.amount;
          refundCount++;
        } else {
          totalRevenue += tx.amount;
          totalSuccessCount++;
          if (tx.paymentType === 'deposit') depositCount++;
          if (tx.paymentType === 'full') fullCount++;
        }
      }
    });

    return {
      netRevenue: Math.max(0, totalRevenue - refundAmount),
      totalRevenue,
      totalSuccessCount,
      depositCount,
      fullCount,
      refundAmount,
      refundCount,
      totalCount: transactions.length
    };
  }, [transactions]);

  // 2. Filter & Search logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by Type
      if (selectedType !== 'all') {
        if (selectedType === 'refund') {
          if (tx.paymentType !== 'refund' && tx.status !== 'refunded') return false;
        } else if (tx.paymentType !== selectedType) {
          return false;
        }
      }

      // Filter by Method
      if (selectedMethod !== 'all' && tx.paymentMethod?.toLowerCase() !== selectedMethod) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const cleanQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
        const txCode = (tx.transactionCode || '').toLowerCase();
        const bCode = (tx.bookingCode || '').toLowerCase();
        const notes = removeVietnameseTones((tx.notes || '').toLowerCase());
        const payer = removeVietnameseTones((tx.payerName || '').toLowerCase());

        return (
          txCode.includes(cleanQuery) ||
          bCode.includes(cleanQuery) ||
          notes.includes(cleanQuery) ||
          payer.includes(cleanQuery)
        );
      }

      return true;
    });
  }, [transactions, selectedType, selectedMethod, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Không có dữ liệu giao dịch để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Mã Giao Dịch',
      'Mã Đơn Tour',
      'Thời Gian',
      'Hình Thức',
      'Loại Giao Dịch',
      'Số Tiền (VND)',
      'Trạng Thái',
      'Ghi Chú'
    ];

    const rows = filteredTransactions.map((tx, idx) => [
      idx + 1,
      `"${tx.transactionCode}"`,
      `"${tx.bookingCode}"`,
      `"${formatTxDate(tx.paidAt || tx.createdAt)}"`,
      `"${tx.paymentMethod?.toUpperCase() || ''}"`,
      `"${getTypeBadge(tx.paymentType).label}"`,
      tx.amount,
      `"${tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lich_su_giao_dich_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── 1. Header & Quick Actions ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <i className="fa-solid fa-credit-card" style={{ color: '#059669' }} />
            Lịch Sử Giao Dịch & Thanh Toán
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Theo dõi dòng tiền, đối soát giao dịch trực tuyến VietQR và xác nhận thanh toán từ ban điều hành.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#059669' }} />
            {isLoading ? 'Đang cập nhật...' : 'Làm mới'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-file-excel" />
            Xuất Báo Cáo CSV
          </button>
        </div>
      </div>

      {/* ── 2. KPI Metrics Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Thực thu */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-sack-dollar" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Tổng Dòng Tiền Thực Thu
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>
              {formatCurrencyVND(stats.netRevenue)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
              {stats.totalSuccessCount} giao dịch thành công
            </div>
          </div>
        </div>

        {/* Card 2: Đặt cọc 50% */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-circle-dollar-to-slot" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Giao Dịch Đặt Cọc
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7', marginTop: '0.15rem' }}>
              {stats.depositCount} lượt
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              Khách cọc trước 50%
            </div>
          </div>
        </div>

        {/* Card 3: Thanh toán 100% */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#f0fdf4',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-circle-check" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Thu Toàn Bộ 100%
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', marginTop: '0.15rem' }}>
              {stats.fullCount} lượt
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              Đã tất toán toàn bộ
            </div>
          </div>
        </div>

        {/* Card 4: Tổng số giao dịch */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-receipt" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Tổng Bản Ghi Giao Dịch
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#334155', marginTop: '0.15rem' }}>
              {stats.totalCount}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              Lưu trữ an toàn trên Supabase
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả loại', count: transactions.length },
              { id: 'deposit', label: 'Đặt cọc 50%', count: stats.depositCount },
              { id: 'full', label: 'Thanh toán 100%', count: stats.fullCount },
              { id: 'remaining', label: 'Thu còn lại' },
              { id: 'refund', label: 'Hoàn tiền', count: stats.refundCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setSelectedType(tab.id as FilterType); setCurrentPage(1); }}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '999px',
                  border: `1.5px solid ${selectedType === tab.id ? '#059669' : '#e2e8f0'}`,
                  background: selectedType === tab.id ? '#ecfdf5' : '#ffffff',
                  color: selectedType === tab.id ? '#059669' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: selectedType === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: selectedType === tab.id ? '#059669' : '#f1f5f9',
                    color: selectedType === tab.id ? '#ffffff' : '#64748b',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Method Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Phương thức:</span>
            <select
              value={selectedMethod}
              onChange={(e) => { setSelectedMethod(e.target.value as FilterMethod); setCurrentPage(1); }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Tất cả phương thức</option>
              <option value="vietqr">VietQR (Quét mã)</option>
              <option value="momo">Ví MoMo</option>
              <option value="credit_card">Thẻ Quốc Tế</option>
              <option value="cash">Tiền Mặt</option>
              <option value="bank_transfer">Chuyển Khoản</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '0.9rem'
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm kiếm theo mã giao dịch (TXN-...), mã đơn tour (WT-...), ghi chú, người nộp..."
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Main Transactions Table ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {isLoading && transactions.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669', marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700 }}>Đang tải danh sách giao dịch từ hệ thống...</div>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.65rem',
              marginBottom: '1rem'
            }}>
              <i className="fa-solid fa-file-circle-xmark" />
            </div>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', color: '#334155', fontWeight: 800 }}>
              Không Tìm Thấy Giao Dịch Phù Hợp
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các bản ghi khác.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569', width: '60px' }}>STT</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569' }}>Thời Gian</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569' }}>Mã Giao Dịch</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569' }}>Mã Đơn Tour</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569' }}>Loại GD</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569' }}>Hình Thức</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Số Tiền</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#475569', textAlign: 'center', width: '100px' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const typeBadge = getTypeBadge(tx.paymentType);
                  const methodBadge = getMethodBadge(tx.paymentMethod);
                  const isRefund = tx.paymentType === 'refund' || tx.status === 'refunded';

                  return (
                    <tr
                      key={tx.id || tx.transactionCode || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* STT */}
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                        {globalIdx}
                      </td>

                      {/* Thời gian */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                          {formatTxDate(tx.paidAt || tx.createdAt)}
                        </div>
                      </td>

                      {/* Mã giao dịch */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <code style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            background: '#f1f5f9',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '5px',
                            color: '#0f172a',
                            fontWeight: 800
                          }}>
                            {tx.transactionCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.transactionCode)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: copiedCode === tx.transactionCode ? '#059669' : '#94a3b8',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              fontSize: '0.8rem'
                            }}
                            title="Sao chép mã giao dịch"
                          >
                            <i className={`fa-solid ${copiedCode === tx.transactionCode ? 'fa-check' : 'fa-copy'}`} />
                          </button>
                        </div>
                        {tx.notes && !tx.notes.includes('Đồng bộ giao dịch thanh toán') && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '280px' }}>
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Mã đơn tour liên kết */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/admin/bookings/${tx.bookingCode || tx.bookingId}`}
                          style={{
                            fontWeight: 800,
                            color: '#0284c7',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title="Xem chi tiết hồ sơ đơn tour"
                        >
                          <i className="fa-solid fa-receipt" style={{ fontSize: '0.75rem' }} />
                          {tx.bookingCode || tx.bookingId}
                        </Link>
                      </td>

                      {/* Loại GD */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: typeBadge.bg,
                          color: typeBadge.color,
                          border: `1px solid ${typeBadge.border}`
                        }}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Hình thức */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: methodBadge.bg,
                          color: methodBadge.color
                        }}>
                          <i className={`fa-solid ${methodBadge.icon}`} />
                          {methodBadge.label}
                        </span>
                      </td>

                      {/* Số tiền */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontWeight: 900,
                          fontSize: '0.96rem',
                          color: isRefund ? '#dc2626' : '#059669'
                        }}>
                          {isRefund ? '-' : '+'} {formatCurrencyVND(tx.amount)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          background: tx.status === 'success' ? '#dcfce7' : tx.status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color: tx.status === 'success' ? '#15803d' : tx.status === 'pending' ? '#b45309' : '#b91c1c'
                        }}>
                          <i className={`fa-solid ${tx.status === 'success' ? 'fa-check' : tx.status === 'pending' ? 'fa-clock' : 'fa-xmark'}`} style={{ fontSize: '0.72rem' }} />
                          {tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Chờ duyệt' : 'Thất bại'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <Link
                          to={`/admin/bookings/${tx.bookingCode || tx.bookingId}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#f1f5f9',
                            color: '#334155',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s'
                          }}
                          title="Mở hồ sơ đơn tour"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Pagination Footer ── */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> – <strong>{Math.min(currentPage * pageSize, filteredTransactions.length)}</strong> trên tổng số <strong>{filteredTransactions.length}</strong> giao dịch
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `1px solid ${currentPage === p ? '#059669' : '#cbd5e1'}`,
                    background: currentPage === p ? '#059669' : '#ffffff',
                    color: currentPage === p ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
