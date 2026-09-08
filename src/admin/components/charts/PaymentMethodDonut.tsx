import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { PaymentMethodSlice } from '../../utils/chartDataHelpers';

interface PaymentMethodDonutProps {
  data: PaymentMethodSlice[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as PaymentMethodSlice;
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '0.65rem 0.9rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></span>
          <strong style={{ color: '#f8fafc' }}>{item.name}</strong>
        </div>
        <div style={{ color: '#94a3b8' }}>
          Giao dịch: <strong style={{ color: '#ffffff' }}>{item.count} đơn</strong> ({item.percentage}%)
        </div>
      </div>
    );
  }
  return null;
};

export const PaymentMethodDonut: React.FC<PaymentMethodDonutProps> = ({ data }) => {
  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);

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
            background: '#fdf2f8',
            color: '#db2777',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}
        >
          <i className="fa-solid fa-credit-card"></i>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Phương Thức Thanh Toán
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Phân bổ cổng thanh toán
          </p>
        </div>
      </div>

      {/* Donut Chart */}
      <div style={{ position: 'relative', width: '100%', height: '180px' }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={4}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {totalTransactions}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem', fontWeight: 600 }}>
            GIAO DỊCH
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        {data.map((item) => (
          <div
            key={item.method}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              background: '#f8fafc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0
                }}
              ></span>
              <span style={{ color: '#334155', fontWeight: 500 }}>{item.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>{item.count}</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b', minWidth: '30px', textAlign: 'right' }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
