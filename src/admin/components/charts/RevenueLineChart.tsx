import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TimeGranularity, TrendDataPoint } from '../../utils/chartDataHelpers';
import { formatCurrencyVND } from '../../../utils/formatters';

interface RevenueLineChartProps {
  data: TrendDataPoint[];
  granularity: TimeGranularity;
  onGranularityChange: (g: TimeGranularity) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const p = payload[0]?.payload as TrendDataPoint;
    if (!p) return null;

    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          padding: '0.9rem 1.15rem',
          borderRadius: '12px',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.82rem',
          minWidth: '240px'
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.6rem', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.4rem' }}>
          Thời điểm: <span style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{label}</span>
        </div>

        {/* 1. Tổng giá trị đơn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
            Tổng giá trị đơn:
          </span>
          <strong style={{ color: '#f8fafc' }}>{formatCurrencyVND(p.revenue)}</strong>
        </div>

        {/* 2. Đã thanh toán 100% */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
            Đã thanh toán 100%:
          </span>
          <strong style={{ color: '#93c5fd' }}>{formatCurrencyVND(p.fullPaidAmount)}</strong>
        </div>

        {/* 3. Tiền đặt cọc (50%) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }}></span>
            Tiền đặt cọc (50%):
          </span>
          <strong style={{ color: '#fde68a' }}>{formatCurrencyVND(p.depositAmount)}</strong>
        </div>

        {/* 4. Công nợ còn phải thu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></span>
            Công nợ còn phải thu:
          </span>
          <strong style={{ color: '#fca5a5' }}>{formatCurrencyVND(p.remainingAmount)}</strong>
        </div>

        {/* 5. Tổng thực thu */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '0.45rem',
            borderTop: '1px dashed #334155',
            marginTop: '0.2rem',
            color: '#e2e8f0',
            fontWeight: 600
          }}
        >
          <span>Tổng tiền đã thu:</span>
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>{formatCurrencyVND(p.totalCollected)}</span>
        </div>

        {/* Số đơn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.76rem', color: '#94a3b8' }}>
          <span>Số đơn phát sinh:</span>
          <strong style={{ color: '#facc15' }}>{p.count} đơn</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  granularity,
  onGranularityChange
}) => {
  const totalPeriodRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodCollected = data.reduce((sum, d) => sum + d.totalCollected, 0);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Header with Granularity Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}
            >
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Biểu Đồ Doanh Thu & Thu Tiền
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Tổng giá trị đơn: <strong style={{ color: '#047857', fontWeight: 700 }}>{formatCurrencyVND(totalPeriodRevenue)}</strong>
            {' · '}
            Đã thu: <strong style={{ color: '#2563eb', fontWeight: 700 }}>{formatCurrencyVND(totalPeriodCollected)}</strong>
          </p>
        </div>

        {/* Granularity Toggle Buttons (Ngày / Tuần / Tháng) */}
        <div
          style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          {(
            [
              { key: 'day', label: 'Theo Ngày (30 ngày)', icon: 'fa-calendar-day' },
              { key: 'week', label: 'Theo Tuần (12 tuần)', icon: 'fa-calendar-week' },
              { key: 'month', label: 'Theo Tháng (12 tháng)', icon: 'fa-calendar' }
            ] as const
          ).map((item) => {
            const isActive = granularity === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onGranularityChange(item.key)}
                style={{
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#047857' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className={`fa-solid ${item.icon}`} style={{ fontSize: '0.75rem' }}></i>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart with Separate Lines for Total, Full Paid, Deposit, and Remaining */}
      <div style={{ flex: 1, minHeight: '290px', width: '100%' }}>
        <ResponsiveContainer width="100%" height={290}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fullPaidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}k`)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 1. Tổng giá trị đơn */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#059669"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGradient)"
              name="Tổng giá trị đơn"
            />

            {/* 2. Đã thanh toán 100% */}
            <Area
              type="monotone"
              dataKey="fullPaidAmount"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fullPaidGradient)"
              name="Thanh toán 100%"
            />

            {/* 3. Tiền đặt cọc (50%) */}
            <Area
              type="monotone"
              dataKey="depositAmount"
              stroke="#d97706"
              strokeWidth={2}
              strokeDasharray="4 3"
              fillOpacity={1}
              fill="url(#depositGradient)"
              name="Tiền đặt cọc"
            />

            {/* 4. Công nợ còn phải thu */}
            <Area
              type="monotone"
              dataKey="remainingAmount"
              stroke="#dc2626"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="none"
              name="Công nợ cần thu"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend - Separated and Clear */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginTop: '0.85rem',
          fontSize: '0.78rem',
          color: '#475569',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.75rem'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '14px', height: '3px', background: '#059669', borderRadius: '2px' }}></span>
          <strong>Tổng giá trị đơn</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '14px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></span>
          <strong>Thanh toán 100%</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '14px', height: '2px', borderTop: '2px dashed #d97706' }}></span>
          <strong>Tiền đặt cọc (50%)</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '14px', height: '2px', borderTop: '2px dotted #dc2626' }}></span>
          <strong>Công nợ cần thu</strong>
        </span>
      </div>
    </div>
  );
};
