import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { TopTourDataPoint } from '../../utils/chartDataHelpers';
import { formatCurrencyVND } from '../../../utils/formatters';

interface TopToursBarChartProps {
  data: TopTourDataPoint[];
}

const BAR_COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#db2777'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as TopTourDataPoint;
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.8rem',
          maxWidth: '280px'
        }}
      >
        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', lineHeight: 1.3 }}>
          {item.tourTitle}
        </div>
        <div style={{ color: '#cbd5e1', marginBottom: '0.2rem' }}>
          Lượt đặt chỗ: <strong style={{ color: '#facc15' }}>{item.bookingsCount} lượt</strong>
        </div>
        <div style={{ color: '#cbd5e1' }}>
          Doanh thu: <strong style={{ color: '#34d399' }}>{formatCurrencyVND(item.revenue)}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const TopToursBarChart: React.FC<TopToursBarChartProps> = ({ data }) => {
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#ecfeff',
            color: '#0891b2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}
        >
          <i className="fa-solid fa-ranking-star"></i>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Top 5 Tour Bán Chạy Nhất
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Theo số lượng đặt chỗ thực tế
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '0.85rem'
          }}
        >
          Chưa có dữ liệu đặt tour
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="shortTitle"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookingsCount" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
