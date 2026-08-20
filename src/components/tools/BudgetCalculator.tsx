import React, { useState, useMemo } from 'react';
import { TOURS_DATA } from '../../data/toursData';
import { formatCurrencyVND } from '../../utils/formatters';

interface BudgetCalculatorProps {
  onOpenBooking?: (tourId: string) => void;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ onOpenBooking }) => {
  const [tourId, setTourId] = useState(TOURS_DATA[0].id);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [infants, setInfants] = useState(0);

  const [hotelStar, setHotelStar] = useState('3');
  const [flightMode, setFlightMode] = useState('standard');
  const [diningSurchargePerDay, setDiningSurchargePerDay] = useState(150000);
  const [shoppingAmount, setShoppingAmount] = useState(2000000);

  const [singleRoom, setSingleRoom] = useState(false);
  const [insurance, setInsurance] = useState(true);
  const [tips, setTips] = useState(true);
  const [useBuffer, setUseBuffer] = useState(true);
  const [activePreset, setActivePreset] = useState<'budget' | 'standard' | 'luxury'>('standard');
  const [copied, setCopied] = useState(false);

  const tour = useMemo(() => TOURS_DATA.find(t => t.id === tourId) || TOURS_DATA[0], [tourId]);

  const calculation = useMemo(() => {
    const priceAdult = tour.priceAdult || 12290000;
    const priceChild = tour.priceChild || Math.round(priceAdult * 0.75);
    const priceToddler = Math.round(priceAdult * 0.5);
    const priceInfant = 500000;

    // 1. Base Tour Cost
    const costAdults = adults * priceAdult;
    const costChildren = children * priceChild;
    const costToddlers = toddlers * priceToddler;
    const costInfants = infants * priceInfant;
    const baseTourCost = costAdults + costChildren + costToddlers + costInfants;

    // 2. Hotel Upgrade
    let hotelSurchargePerNight = 0;
    if (hotelStar === '4') hotelSurchargePerNight = 350000;
    if (hotelStar === '5') hotelSurchargePerNight = 850000;
    const nights = tour.durationNights || 3;
    const payingPax = adults + children;
    const hotelCost = nights * hotelSurchargePerNight * (payingPax || 1);

    // 3. Flight
    let flightUnitAdjustment = 0;
    if (flightMode === 'business') flightUnitAdjustment = 4500000;
    if (flightMode === 'none') flightUnitAdjustment = -2500000;
    const flightCost = flightUnitAdjustment * (payingPax || 1);

    // 4. Dining
    const days = tour.durationDays || (nights + 1);
    const diningCost = days * diningSurchargePerDay * (payingPax || 1);

    // 5. Shopping
    const shoppingCost = shoppingAmount * adults;

    // 6. Addons
    let addonsCost = 0;
    let singleRoomCost = 0;
    let insuranceCost = 0;
    let tipsCost = 0;

    if (singleRoom) {
      singleRoomCost = nights * 800000;
      addonsCost += singleRoomCost;
    }
    if (insurance) {
      insuranceCost = (adults + children + toddlers) * 150000;
      addonsCost += insuranceCost;
    }
    if (tips) {
      tipsCost = days * 50000 * (adults + children);
      addonsCost += tipsCost;
    }

    const subtotal = Math.max(0, baseTourCost + hotelCost + flightCost + diningCost + shoppingCost + addonsCost);
    const contingency = useBuffer ? Math.round(subtotal * 0.1) : 0;
    const grandTotal = subtotal + contingency;
    const totalPax = adults + children + toddlers + infants;
    const perPerson = totalPax > 0 ? Math.round(grandTotal / totalPax) : grandTotal;

    // Bar Chart Percentages
    const pTour = grandTotal > 0 ? Math.round((baseTourCost / grandTotal) * 100) : 0;
    const pHotel = grandTotal > 0 && hotelCost > 0 ? Math.round((hotelCost / grandTotal) * 100) : 0;
    const pFlight = grandTotal > 0 && flightCost > 0 ? Math.round((flightCost / grandTotal) * 100) : 0;
    const pDining = grandTotal > 0 && diningCost > 0 ? Math.round((diningCost / grandTotal) * 100) : 0;
    const pShop = grandTotal > 0 && shoppingCost > 0 ? Math.round((shoppingCost / grandTotal) * 100) : 0;
    const pBuffer = grandTotal > 0 && contingency > 0 ? Math.round((contingency / grandTotal) * 100) : 0;
    const pAddons = Math.max(0, 100 - (pTour + pHotel + pFlight + pDining + pShop + pBuffer));

    return {
      baseTourCost,
      hotelCost,
      flightCost,
      diningCost,
      shoppingCost,
      addonsCost,
      singleRoomCost,
      insuranceCost,
      tipsCost,
      contingency,
      grandTotal,
      perPerson,
      totalPax,
      nights,
      days,
      percentages: { pTour, pHotel, pFlight, pDining, pShop, pBuffer, pAddons }
    };
  }, [tour, adults, children, toddlers, infants, hotelStar, flightMode, diningSurchargePerDay, shoppingAmount, singleRoom, insurance, tips, useBuffer]);

  const applyPreset = (preset: 'budget' | 'standard' | 'luxury') => {
    setActivePreset(preset);
    if (preset === 'budget') {
      setHotelStar('3');
      setFlightMode('none');
      setDiningSurchargePerDay(0);
      setShoppingAmount(1000000);
      setUseBuffer(false);
      setSingleRoom(false);
    } else if (preset === 'standard') {
      setHotelStar('3');
      setFlightMode('standard');
      setDiningSurchargePerDay(150000);
      setShoppingAmount(2000000);
      setUseBuffer(true);
      setSingleRoom(false);
    } else if (preset === 'luxury') {
      setHotelStar('5');
      setFlightMode('business');
      setDiningSurchargePerDay(700000);
      setShoppingAmount(5000000);
      setUseBuffer(true);
      setSingleRoom(true);
    }
  };

  const copySummary = () => {
    const text = `📊 BẢNG DỰ TOÁN CHI PHÍ HÀNH TRÌNH - WEBTRAVEL
Tour: ${tour.title}
Khách: ${adults} Người lớn, ${children} Trẻ em, ${toddlers} Trẻ nhỏ, ${infants} Em bé
- Chi phí tour cơ bản: ${formatCurrencyVND(calculation.baseTourCost)}
- Khách sạn & Tiện ích: ${formatCurrencyVND(calculation.hotelCost)}
- Vé máy bay & Vận chuyển: ${formatCurrencyVND(calculation.flightCost)}
- Ẩm thực tự do: ${formatCurrencyVND(calculation.diningCost)}
- Quỹ mua sắm: ${formatCurrencyVND(calculation.shoppingCost)}
- Dự phòng an toàn 10%: ${formatCurrencyVND(calculation.contingency)}
=> TỔNG CHI PHÍ DỰ TOÁN: ${formatCurrencyVND(calculation.grandTotal)} (~${formatCurrencyVND(calculation.perPerson)}/khách)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="tool-content-panel" id="tool-panel-budget" style={{ display: 'block' }}>
      {/* Quick Preset Style Selector */}
      <div className="budget-presets-bar">
        <span className="budget-presets-title">
          <i className="fa-solid fa-wand-magic-sparkles"></i> Gợi ý phong cách chi tiêu nhanh:
        </span>
        <div className="budget-preset-buttons">
          <button
            type="button"
            className={`budget-preset-btn ${activePreset === 'budget' ? 'active' : ''}`}
            onClick={() => applyPreset('budget')}
          >
            <i className="fa-solid fa-backpack"></i> Tiết Kiệm (Backpacker)
          </button>
          <button
            type="button"
            className={`budget-preset-btn ${activePreset === 'standard' ? 'active' : ''}`}
            onClick={() => applyPreset('standard')}
          >
            <i className="fa-solid fa-mug-hot"></i> Tiêu Chuẩn (Comfort)
          </button>
          <button
            type="button"
            className={`budget-preset-btn ${activePreset === 'luxury' ? 'active' : ''}`}
            onClick={() => applyPreset('luxury')}
          >
            <i className="fa-solid fa-crown"></i> Nghỉ Dưỡng VIP (Luxury)
          </button>
        </div>
      </div>

      <div className="budget-grid">
        {/* LEFT COLUMN: Smart Parameters Form */}
        <form id="budget-form" onSubmit={(e) => e.preventDefault()} className="budget-form-card">
          {/* 1. Tour Selection */}
          <div className="form-group">
            <label htmlFor="budget-tour-select">
              <i className="fa-solid fa-map-location-dot"></i> 1. Chọn Hành Trình Du Lịch:
            </label>
            <select
              id="budget-tour-select"
              value={tourId}
              onChange={(e) => setTourId(e.target.value)}
            >
              {TOURS_DATA.map(t => (
                <option key={t.id} value={t.id}>
                  {t.shortTitle || t.title} ({t.durationDays}N{t.durationNights}Đ) - Từ {formatCurrencyVND(t.priceAdult)}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Passenger Counts (4 Age Tiers) */}
          <div className="form-group">
            <label>
              <i className="fa-solid fa-users"></i> 2. Số Lượng Hành Khách Theo Độ Tuổi:
            </label>
            <div className="budget-passengers-grid">
              <div className="passenger-counter-box">
                <div className="p-label">
                  <strong>Người lớn</strong>
                  <small>&ge; 12 tuổi</small>
                </div>
                <div className="counter-control">
                  <input
                    type="number"
                    id="budget-adults"
                    min="1"
                    max="50"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <div className="passenger-counter-box">
                <div className="p-label">
                  <strong>Trẻ em</strong>
                  <small>5 - 11 tuổi</small>
                </div>
                <div className="counter-control">
                  <input
                    type="number"
                    id="budget-children"
                    min="0"
                    max="30"
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="passenger-counter-box">
                <div className="p-label">
                  <strong>Trẻ nhỏ</strong>
                  <small>2 - 4 tuổi</small>
                </div>
                <div className="counter-control">
                  <input
                    type="number"
                    id="budget-toddlers"
                    min="0"
                    max="20"
                    value={toddlers}
                    onChange={(e) => setToddlers(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="passenger-counter-box">
                <div className="p-label">
                  <strong>Em bé</strong>
                  <small>&lt; 2 tuổi</small>
                </div>
                <div className="counter-control">
                  <input
                    type="number"
                    id="budget-infants"
                    min="0"
                    max="10"
                    value={infants}
                    onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Hotel & Flight Tiers */}
          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="budget-hotel-select">
                <i className="fa-solid fa-hotel"></i> 3. Hạng Khách Sạn:
              </label>
              <select
                id="budget-hotel-select"
                value={hotelStar}
                onChange={(e) => setHotelStar(e.target.value)}
              >
                <option value="3">🏨 3★ Tiêu chuẩn tour gốc (Bao gồm)</option>
                <option value="4">🏨 4★ Superior (+350.000 ₫/đêm/người)</option>
                <option value="5">👑 5★ Luxury Resort (+850.000 ₫/đêm/người)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budget-flight-select">
                <i className="fa-solid fa-plane-departure"></i> 4. Hạng Vé Máy Bay:
              </label>
              <select
                id="budget-flight-select"
                value={flightMode}
                onChange={(e) => setFlightMode(e.target.value)}
              >
                <option value="standard">🎫 Phổ thông tiêu chuẩn (Bao gồm)</option>
                <option value="business">✨ Nâng cấp Thương gia VIP (+4.500.000 ₫/người)</option>
                <option value="none">🚫 Tự túc vé máy bay (-2.500.000 ₫/người)</option>
              </select>
            </div>
          </div>

          {/* 4. Dining & Street Food Budget Per Day */}
          <div className="form-group">
            <label htmlFor="budget-dining-select">
              <i className="fa-solid fa-utensils"></i> 5. Ẩm Thực Tự Do Ngoài Lịch Trình (Cafe, Phố đêm, Ăn vặt):
            </label>
            <select
              id="budget-dining-select"
              value={diningSurchargePerDay}
              onChange={(e) => setDiningSurchargePerDay(parseInt(e.target.value) || 0)}
            >
              <option value="0">Tối giản / Đã đủ theo bữa tour (0 ₫/ngày/người)</option>
              <option value="150000">Tiêu chuẩn trải nghiệm phố ẩm thực (+150.000 ₫/ngày/người)</option>
              <option value="350000">Thoải mái thử đặc sản & Cafe chill (+350.000 ₫/ngày/người)</option>
              <option value="700000">Gourmet ẩm thực cao cấp & Bar (+700.000 ₫/ngày/người)</option>
            </select>
          </div>

          {/* 5. Shopping & Activities Slider */}
          <div className="form-group">
            <div className="budget-slider-header">
              <label htmlFor="budget-shopping-range">
                <i className="fa-solid fa-bag-shopping"></i> 6. Quỹ Mua Sắm Đặc Sản & Trải Nghiệm Tự Do:
              </label>
              <span className="budget-slider-badge" id="budget-shopping-display">
                {formatCurrencyVND(shoppingAmount)}
              </span>
            </div>
            <input
              type="range"
              id="budget-shopping-range"
              min="0"
              max="20000000"
              step="500000"
              value={shoppingAmount}
              onChange={(e) => setShoppingAmount(parseInt(e.target.value) || 0)}
              className="budget-range-input"
            />
            <div className="slider-marks">
              <span>0 ₫</span>
              <span>5 triệu</span>
              <span>10 triệu</span>
              <span>20 triệu</span>
            </div>
          </div>

          {/* 6. Add-on Services & Contingency Buffer */}
          <div className="form-group">
            <label>
              <i className="fa-solid fa-shield-halved"></i> 7. Dịch Vụ Mở Rộng & Bộ Đệm An Toàn:
            </label>
            <div className="budget-checkbox-list">
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  id="budget-buffer-toggle"
                  checked={useBuffer}
                  onChange={(e) => setUseBuffer(e.target.checked)}
                />
                <div className="checkbox-text">
                  <strong><i className="fa-solid fa-umbrella"></i> Bộ đệm an toàn rủi ro +10% (Khuyến nghị quốc tế)</strong>
                  <small>Dự phòng phát sinh cho thuốc men, taxi phát sinh hoặc tình huống ngoài ý muốn.</small>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  id="budget-single-room"
                  checked={singleRoom}
                  onChange={(e) => setSingleRoom(e.target.checked)}
                />
                <div className="checkbox-text">
                  <strong><i className="fa-solid fa-bed"></i> Phụ thu phòng đơn riêng tư (+800.000 ₫/đêm)</strong>
                  <small>Áp dụng khi đi 1 mình và muốn ở trọn vẹn 1 phòng riêng biệt.</small>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  id="budget-insurance"
                  checked={insurance}
                  onChange={(e) => setInsurance(e.target.checked)}
                />
                <div className="checkbox-text">
                  <strong><i className="fa-solid fa-passport"></i> Bảo hiểm du lịch Quốc tế hạn mức cao (+150.000 ₫/người)</strong>
                  <small>Bồi thường hành lý thất lạc, hoãn hủy chuyến bay & viện phí tối đa 1 tỷ ₫.</small>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  id="budget-tips"
                  checked={tips}
                  onChange={(e) => setTips(e.target.checked)}
                />
                <div className="checkbox-text">
                  <strong><i className="fa-solid fa-hand-holding-dollar"></i> Tiền Tip văn minh cho HDV & Lái xe (+50.000 ₫/ngày/người)</strong>
                  <small>Khoản tri ân công sức phục vụ chu đáo của đội ngũ hậu cần.</small>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: Interactive Bento Dashboard & Cost Breakdown */}
        <div className="budget-dashboard-card" id="budget-dashboard-result">
          {/* Main Header KPI Card */}
          <div className="budget-kpi-banner">
            <div className="budget-kpi-title">
              <i className="fa-solid fa-receipt"></i> TỔNG CHI PHÍ DỰ TOÁN TOÀN CHUYẾN
            </div>
            <div className="budget-grand-total" id="budget-total-price">
              {formatCurrencyVND(calculation.grandTotal)}
            </div>

            <div className="budget-per-person-banner" id="budget-per-person">
              <i className="fa-solid fa-user-check"></i> Trung bình: ~ <strong>{formatCurrencyVND(calculation.perPerson)}</strong> / khách ({calculation.totalPax} khách)
            </div>
          </div>

          {/* Visual Stacked Bar Chart (% Breakdown) */}
          <div className="budget-chart-section">
            <div className="chart-header">
              <span><i className="fa-solid fa-chart-pie"></i> Cơ cấu phân bổ ngân sách:</span>
              <small id="budget-total-items-count">Đầy đủ 6 danh mục</small>
            </div>
            <div className="budget-stacked-bar" id="budget-stacked-bar">
              {calculation.percentages.pTour > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pTour}%`, background: 'var(--accent-forest)' }}
                  title={`Tour gốc: ${calculation.percentages.pTour}%`}
                />
              )}
              {calculation.percentages.pHotel > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pHotel}%`, background: '#0284c7' }}
                  title={`Khách sạn: ${calculation.percentages.pHotel}%`}
                />
              )}
              {calculation.percentages.pFlight > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pFlight}%`, background: '#8b5cf6' }}
                  title={`Máy bay: ${calculation.percentages.pFlight}%`}
                />
              )}
              {calculation.percentages.pDining > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pDining}%`, background: '#f59e0b' }}
                  title={`Ẩm thực: ${calculation.percentages.pDining}%`}
                />
              )}
              {calculation.percentages.pShop > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pShop}%`, background: '#ec4899' }}
                  title={`Mua sắm: ${calculation.percentages.pShop}%`}
                />
              )}
              {calculation.percentages.pBuffer > 0 && (
                <div
                  className="budget-bar-segment"
                  style={{ width: `${calculation.percentages.pBuffer}%`, background: '#10b981' }}
                  title={`Dự phòng: ${calculation.percentages.pBuffer}%`}
                />
              )}
            </div>

            <div className="budget-chart-legend" id="budget-chart-legend">
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: 'var(--accent-forest)' }}></span> Tour gốc
                </span>
                <span className="legend-percent">{calculation.percentages.pTour}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: '#0284c7' }}></span> Khách sạn
                </span>
                <span className="legend-percent">{calculation.percentages.pHotel}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: '#8b5cf6' }}></span> Hàng không
                </span>
                <span className="legend-percent">{calculation.percentages.pFlight}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: '#f59e0b' }}></span> Ẩm thực
                </span>
                <span className="legend-percent">{calculation.percentages.pDining}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: '#ec4899' }}></span> Mua sắm
                </span>
                <span className="legend-percent">{calculation.percentages.pShop}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-tag">
                  <span className="legend-dot" style={{ background: '#10b981' }}></span> Dự phòng 10%
                </span>
                <span className="legend-percent">{calculation.percentages.pBuffer}%</span>
              </div>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="budget-breakdown-wrapper">
            <div className="breakdown-header-title">
              <span><i className="fa-solid fa-list-check"></i> Chi tiết từng khoản chi phí:</span>
            </div>
            <div className="budget-itemized-list" id="budget-breakdown-details">
              <div className="breakdown-row">
                <div className="breakdown-left">
                  <i className="fa-solid fa-ticket"></i> Tour trọn gói ({calculation.totalPax} khách)
                </div>
                <div className="breakdown-val">{formatCurrencyVND(calculation.baseTourCost)}</div>
              </div>

              {calculation.hotelCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-hotel"></i> Nâng hạng khách sạn ({hotelStar}★)
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.hotelCost)}</div>
                </div>
              )}

              {calculation.flightCost !== 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-plane"></i> {flightMode === 'business' ? 'Hạng thương gia VIP' : 'Khấu trừ vé tự túc'}
                  </div>
                  <div className="breakdown-val">
                    {calculation.flightCost > 0 ? `+${formatCurrencyVND(calculation.flightCost)}` : formatCurrencyVND(calculation.flightCost)}
                  </div>
                </div>
              )}

              {calculation.diningCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-utensils"></i> Ẩm thực tự do ({calculation.days} ngày)
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.diningCost)}</div>
                </div>
              )}

              {calculation.shoppingCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-bag-shopping"></i> Quỹ mua sắm & tiêu vặt
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.shoppingCost)}</div>
                </div>
              )}

              {calculation.singleRoomCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-bed"></i> Phụ thu phòng đơn ({calculation.nights} đêm)
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.singleRoomCost)}</div>
                </div>
              )}

              {calculation.insuranceCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-passport"></i> Bảo hiểm du lịch quốc tế
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.insuranceCost)}</div>
                </div>
              )}

              {calculation.tipsCost > 0 && (
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <i className="fa-solid fa-hand-holding-dollar"></i> Tiền tip HDV & Lái xe
                  </div>
                  <div className="breakdown-val">+{formatCurrencyVND(calculation.tipsCost)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Contingency Buffer Alert Notice */}
          {useBuffer && calculation.contingency > 0 && (
            <div className="budget-contingency-box" id="budget-contingency-box">
              <i className="fa-solid fa-shield-cat"></i>
              <div>
                <strong>Quỹ dự phòng an toàn (10%):</strong>
                <span id="budget-contingency-amount">{formatCurrencyVND(calculation.contingency)}</span>
                <p>Khoản tiền này khuyến nghị chuẩn bị sẵn trong thẻ hoặc tiền mặt để xử lý tình huống bất ngờ.</p>
              </div>
            </div>
          )}

          {/* Export & Share Action Bar */}
          <div className="budget-export-actions">
            <button
              type="button"
              className="btn-budget-action"
              id="btn-budget-copy"
              onClick={copySummary}
            >
              <i className={copied ? "fa-solid fa-check" : "fa-solid fa-copy"}></i> {copied ? 'Đã Sao Chép' : 'Sao Chép Báo Cáo'}
            </button>
            <button
              type="button"
              className="btn-budget-action"
              id="btn-budget-print"
              onClick={printReport}
            >
              <i className="fa-solid fa-print"></i> In / Xuất PDF
            </button>
            <button
              type="button"
              className="btn-budget-action primary"
              id="btn-budget-book-now"
              onClick={() => onOpenBooking && onOpenBooking(tour.id)}
            >
              <i className="fa-solid fa-calendar-check"></i> Đặt Tour Theo Dự Toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
