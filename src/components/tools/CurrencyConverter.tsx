import React, { useState, useEffect, useCallback } from 'react';

const FALLBACK_RATES: Record<string, number> = {
  VND: 1,
  USD: 0.0000392,
  JPY: 0.006083,  // 1 JPY = ~164.39 VND
  THB: 0.00142,   // 1 THB = ~704 VND
  EUR: 0.0000358, // 1 EUR = ~27,900 VND
  KRW: 0.0538     // 1 KRW = ~18.58 VND
};

const CURRENCY_DETAILS: Record<string, { symbol: string; name: string }> = {
  VND: { symbol: '₫', name: 'Việt Nam Đồng' },
  USD: { symbol: '$', name: 'Đồng Đô la Mỹ' },
  JPY: { symbol: '¥', name: 'Yên Nhật' },
  THB: { symbol: '฿', name: 'Baht Thái' },
  EUR: { symbol: '€', name: 'Euro' },
  KRW: { symbol: '₩', name: 'Won Hàn Quốc' }
};

const WORLD_CLOCKS = [
  { city: 'Hà Nội / TP.HCM', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { city: 'Tokyo (Nhật Bản)', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: 'Bangkok (Thái Lan)', timezone: 'Asia/Bangkok', flag: '🇹🇭' },
  { city: 'Seoul (Hàn Quốc)', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { city: 'Paris (Pháp)', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { city: 'London (Anh)', timezone: 'Europe/London', flag: '🇬🇧' }
];

export const CurrencyConverter: React.FC = () => {
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [fromCurrency, setFromCurrency] = useState('VND');
  const [toCurrency, setToCurrency] = useState('USD');
  const [fromAmountStr, setFromAmountStr] = useState<string>('10,000,000');
  const [toAmountStr, setToAmountStr] = useState<string>('392.00');
  const [includeFee, setIncludeFee] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Vừa cập nhật');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Fetch Realtime Rates with Dual API Fallback
  useEffect(() => {
    async function fetchRates() {
      try {
        let res = await fetch('https://api.exchangerate-api.com/v4/latest/VND');
        if (!res.ok) {
          res = await fetch('https://open.er-api.com/v6/latest/VND');
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setRates(data.rates);
            const now = new Date();
            setLastUpdated(`Đã cập nhật lúc ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} UTC`);
          }
        }
      } catch {
        setLastUpdated('Tỷ giá tham khảo (Offline)');
      }
    }
    fetchRates();
  }, []);

  // 2. Realtime 1-Second Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parseNumber = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/,/g, '').trim();
    return parseFloat(clean) || 0;
  };

  const formatPrecision = (num: number): string => {
    if (isNaN(num) || num === 0) return '0';
    if (Math.abs(num) < 0.001) return num.toFixed(6);
    if (Math.abs(num) < 1) return num.toFixed(4);
    const parts = num.toString().split('.');
    const integerPart = new Intl.NumberFormat('en-US').format(parseInt(parts[0]) || 0);
    if (parts.length > 1) {
      return `${integerPart}.${parts[1].substring(0, 2)}`;
    }
    return integerPart;
  };

  // Convert Left -> Right
  const handleFromChange = useCallback((valStr: string, currentRates = rates, fromC = fromCurrency, toC = toCurrency, fee = includeFee) => {
    setFromAmountStr(valStr);
    const num = parseNumber(valStr);
    const rateFrom = currentRates[fromC] || FALLBACK_RATES[fromC] || 1;
    const rateTo = currentRates[toC] || FALLBACK_RATES[toC] || 1;
    let directRate = rateTo / rateFrom;
    if (fee && fromC !== toC) directRate *= 0.98;
    const result = num * directRate;
    setToAmountStr(formatPrecision(result));
  }, [rates, fromCurrency, toCurrency, includeFee]);

  // Convert Right -> Left (2-way conversion)
  const handleToChange = useCallback((valStr: string) => {
    setToAmountStr(valStr);
    const num = parseNumber(valStr);
    const rateFrom = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
    let directRate = rateFrom / rateTo;
    if (includeFee && fromCurrency !== toCurrency) directRate *= 1.02;
    const result = num * directRate;
    setFromAmountStr(formatPrecision(result));
  }, [rates, fromCurrency, toCurrency, includeFee]);

  // Recalculate on currency/fee switch
  useEffect(() => {
    handleFromChange(fromAmountStr);
  }, [fromCurrency, toCurrency, includeFee, rates]);

  const handleSwap = () => {
    const nextFrom = toCurrency;
    const nextTo = fromCurrency;
    setFromCurrency(nextFrom);
    setToCurrency(nextTo);
  };

  const fromNum = parseNumber(fromAmountStr);

  return (
    <div className="tool-content-panel" id="tool-panel-currency" style={{ display: 'block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Left Card Panel: Google Currency Converter */}
        <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '1.75rem', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginBottom: '0.2rem', color: '#111827' }}>
            <i className="fa-solid fa-coins" style={{ color: 'var(--accent-emerald)' }}></i> Chuyển Đổi Tỷ Giá Trực Tuyến
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
            Tỷ giá liên ngân hàng thời gian thực (Cập nhật tự động)
          </p>

          {/* Google Style Headline Block */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.15rem 1.35rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div id="google-headline-sub" style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>
              {formatPrecision(fromNum)} {CURRENCY_DETAILS[fromCurrency]?.name} =
            </div>
            <div id="google-headline-main" style={{ fontFamily: 'var(--font-body)', fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.2rem 0', fontVariantNumeric: 'lining-nums tabular-nums' }}>
              {toAmountStr} {CURRENCY_DETAILS[toCurrency]?.name}
            </div>
            <div id="google-headline-time" style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {lastUpdated} · Từ thị trường tài chính quốc tế
            </div>
          </div>

          {/* Controls Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.85rem', alignItems: 'center', marginBottom: '1rem' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <select
                id="currency-from-select"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}
              >
                {Object.keys(CURRENCY_DETAILS).map(k => (
                  <option key={k} value={k}>{k} {CURRENCY_DETAILS[k].symbol} - {CURRENCY_DETAILS[k].name}</option>
                ))}
              </select>
              <input
                type="text"
                id="currency-from-amount"
                value={fromAmountStr}
                onChange={(e) => handleFromChange(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#ffffff', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}
              />
            </div>

            {/* Swap Button */}
            <button
              type="button"
              className="btn-secondary"
              id="currency-swap-btn"
              onClick={handleSwap}
              style={{ padding: '0.75rem', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s ease' }}
              title="Đổi chiều tiền tệ"
            >
              <i className="fa-solid fa-arrow-right-arrow-left"></i>
            </button>

            {/* Right Column (2-Way conversion) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <select
                id="currency-to-select"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}
              >
                {Object.keys(CURRENCY_DETAILS).map(k => (
                  <option key={k} value={k}>{k} {CURRENCY_DETAILS[k].symbol} - {CURRENCY_DETAILS[k].name}</option>
                ))}
              </select>
              <input
                type="text"
                id="currency-to-amount"
                value={toAmountStr}
                onChange={(e) => handleToChange(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#ffffff', fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}
              />
            </div>
          </div>

          {/* Fee Checkbox & Warning Note directly stacked */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <input
                type="checkbox"
                id="currency-fee-check"
                checked={includeFee}
                onChange={(e) => setIncludeFee(e.target.checked)}
              />
              Tính thêm ~2% phụ phí đổi tiền mặt/quẹt thẻ thực tế tại quầy
            </label>

            <p style={{ fontSize: '0.78rem', margin: 0, fontStyle: 'italic', color: '#64748b', lineHeight: 1.45 }}>
              ⚠️ Tỷ giá được cập nhật tự động từ thị trường tài chính quốc tế. Tỷ giá đổi tiền mặt tại các quầy thu đổi tư nhân hoặc sân bay có thể chênh lệch từ 1% - 3%.
            </p>
          </div>
        </div>

        {/* Right Card Panel: World Clocks without date/weekday */}
        <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '1.75rem', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginBottom: '0.2rem', color: '#111827' }}>
            <i className="fa-regular fa-clock" style={{ color: 'var(--accent-emerald)' }}></i> Giờ Quốc Tế Trực Tuyến
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
            Múi giờ thời gian thực tại các thủ phủ du lịch
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} id="world-clocks-container">
            {WORLD_CLOCKS.map(wc => {
              const timeStr = new Intl.DateTimeFormat('vi-VN', {
                timeZone: wc.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).format(currentTime);

              return (
                <div
                  key={wc.city}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.85rem 0.75rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '1.35rem', marginBottom: '0.2rem' }}>{wc.flag}</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>{wc.city}</div>
                  <div style={{ fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', marginTop: '0.25rem', letterSpacing: '0.02em' }}>
                    {timeStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
