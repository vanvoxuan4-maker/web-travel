import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TOURS_DATA } from '../data/toursData';
import { Tour } from '../types/tour.types';
import { formatCurrencyVND } from '../utils/formatters';

interface BookingRecord {
  id: string;
  customerName: string;
  phone: string;
  tourTitle: string;
  departureDate: string;
  paxCount: number;
  totalAmount: number;
  status: 'confirmed' | 'deposit' | 'pending' | 'cancelled';
  createdAt: string;
}

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'WT-847291',
    customerName: 'Nguyễn Hoàng Nam',
    phone: '0903124567',
    tourTitle: 'Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình Tràng An',
    departureDate: '10/09/2026',
    paxCount: 2,
    totalAmount: 24580000,
    status: 'confirmed',
    createdAt: '19/08/2026 14:30'
  },
  {
    id: 'WT-592813',
    customerName: 'Trần Thị Mai',
    phone: '0912445889',
    tourTitle: 'Thiên Đường Nghỉ Dưỡng Phú Quốc 5★',
    departureDate: '22/09/2026',
    paxCount: 4,
    totalAmount: 16470000,
    status: 'deposit',
    createdAt: '19/08/2026 16:15'
  },
  {
    id: 'WT-301928',
    customerName: 'Lê Minh Quân',
    phone: '0988776655',
    tourTitle: 'Tour Nhật Bản Cung Đường Vàng Mùa Thu',
    departureDate: '15/09/2026',
    paxCount: 2,
    totalAmount: 63800000,
    status: 'confirmed',
    createdAt: '20/08/2026 08:20'
  },
  {
    id: 'WT-112948',
    customerName: 'Phạm Thu Trang',
    phone: '0933112233',
    tourTitle: 'Khám Phá Sapa - Chinh Phục Fansipan',
    departureDate: '19/09/2026',
    paxCount: 3,
    totalAmount: 9600000,
    status: 'pending',
    createdAt: '20/08/2026 09:05'
  }
];

export const AdminDashboardPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>(TOURS_DATA);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'overview' | 'tours' | 'bookings'>('overview');

  // Edit price modal state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  // New tour modal state
  const [isAddTourOpen, setIsAddTourOpen] = useState(false);
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourCode, setNewTourCode] = useState('WT-NEW');
  const [newTourDest, setNewTourDest] = useState('');
  const [newTourPrice, setNewTourPrice] = useState(5000000);
  const [newTourCat, setNewTourCat] = useState<'domestic' | 'international'>('domestic');

  const totalRevenue = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.totalAmount : sum, 0);
  const totalPax = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.paxCount : sum, 0);

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour) return;
    setTours(tours.map(t => t.id === editingTour.id ? { ...t, priceAdult: newPrice } : t));
    setEditingTour(null);
  };

  const handleStatusChange = (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'cancelled') => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourTitle.trim()) return;

    const newTourObj: Tour = {
      id: `tour-${Date.now()}`,
      code: newTourCode,
      sku: `NDSGN${Math.floor(100 + Math.random() * 900)}`,
      title: newTourTitle,
      shortTitle: newTourTitle,
      destination: newTourDest || 'Điểm đến mới',
      category: newTourCat,
      type: 'Nghỉ Dưỡng & Khám Phá',
      departureFrom: 'Hà Nội / TP.HCM',
      seatsLeft: 8,
      departureSchedule: 'Hàng tuần',
      availableDates: ['15/09/2026', '22/09/2026', '29/09/2026'],
      departureDates: [
        { date: '15/09/2026', seats: 8, priceAdult: newTourPrice, label: 'Mới' }
      ],
      durationDays: 4,
      durationNights: 3,
      priceAdult: newTourPrice,
      priceChild: Math.round(newTourPrice * 0.75),
      priceToddler: Math.round(newTourPrice * 0.5),
      priceInfant: 500000,
      tier: 'standard',
      tierName: 'Dòng Tiêu Chuẩn',
      hotelTier: 'Khách Sạn 4★',
      starRating: 4,
      starCategory: 'standard',
      leiScore: '90/100',
      esgScore: '88/100',
      hotelSpecs: {
        hotelName: 'Khách sạn tiêu chuẩn 4 sao',
        roomType: 'Phòng Deluxe (2 khách/phòng)',
        inclusions: ['Buffet sáng', 'Hồ bơi', 'Wifi miễn phí']
      },
      gallery: [{ url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85', title: newTourTitle }],
      inclusionsList: ['Xe đưa đón', 'Khách sạn 4 sao', 'Hướng dẫn viên', 'Bảo hiểm'],
      exclusionsList: ['Chi phí cá nhân', 'Phòng đơn'],
      refundPolicy: [{ condition: 'Hủy trước 15 ngày', fee: 'Miễn phí hoàn 100%' }],
      faqs: [{ q: 'Tour khởi hành từ đâu?', a: 'Khởi hành tại Hà Nội hoặc TP.HCM theo lịch.' }],
      rating: 5.0,
      reviewsCount: 1,
      badge: 'Tour Mới',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      highlights: ['Khám phá danh thắng nổi tiếng', 'Nghỉ dưỡng tiêu chuẩn 4 sao', 'Trải nghiệm ẩm thực phong phú'],
      itinerary: [
        { day: 1, title: 'Khởi hành & Check-in', morning: 'Tập trung tại điểm hẹn.', afternoon: 'Nhận phòng khách sạn.', evening: 'Dạo chơi tự do.', activities: 'Di chuyển và nhận phòng.' },
        { day: 2, title: 'Tham quan danh thắng', morning: 'Khám phá điểm đến.', afternoon: 'Trải nghiệm văn hóa.', evening: 'Thưởng thức ẩm thực.', activities: 'Tham quan trọn ngày.' },
        { day: 3, title: 'Mua sắm & Trở về', morning: 'Mua đặc sản.', afternoon: 'Khởi hành về.', evening: 'Về đến điểm xuất phát.', activities: 'Mua sắm và kết thúc tour.' }
      ]
    };

    setTours([newTourObj, ...tours]);
    setIsAddTourOpen(false);
    setNewTourTitle('');
  };

  return (
    <div className="admin-dashboard-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem 5rem' }}>
      <div className="container">
        {/* Admin Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
          <div>
            <span className="badge" style={{ background: '#1e293b', color: '#fff', marginBottom: '0.4rem', display: 'inline-block' }}>
              <i className="fa-solid fa-lock"></i> Phân Hệ Quản Trị Hệ Thống
            </span>
            <h1 style={{ fontSize: '1.85rem', color: '#111827', margin: 0, fontFamily: 'var(--font-heading)' }}>
              WebTravel Management Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/" className="btn-secondary" style={{ fontSize: '0.88rem' }}>
              <i className="fa-solid fa-arrow-left"></i> Xem Trang Khách Hàng
            </Link>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '0.88rem' }}
              onClick={() => setIsAddTourOpen(true)}
            >
              <i className="fa-solid fa-plus"></i> Thêm Tour Mới
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`bento-star-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fa-solid fa-chart-pie"></i> Tổng Quan & Doanh Thu
          </button>
          <button
            type="button"
            className={`bento-star-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="fa-solid fa-receipt"></i> Quản Lý Đơn Booking ({bookings.length})
          </button>
          <button
            type="button"
            className={`bento-star-btn ${activeTab === 'tours' ? 'active' : ''}`}
            onClick={() => setActiveTab('tours')}
          >
            <i className="fa-solid fa-map-location-dot"></i> Danh Mục Tour ({tours.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tổng Doanh Thu Đã Xác Nhận</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-forest)', margin: '0.3rem 0' }}>
                  {formatCurrencyVND(totalRevenue)}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#059669' }}>
                  <i className="fa-solid fa-arrow-trend-up"></i> +18.4% so với tháng trước
                </span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tổng Lượt Khách Đã Đặt</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.3rem 0' }}>
                  {totalPax} Hành Khách
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  4 Đơn hàng trực tuyến
                </span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tỷ Lệ Lấp Đầy Chỗ (Occupancy)</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', margin: '0.3rem 0' }}>
                  82.5%
                </div>
                <span style={{ fontSize: '0.78rem', color: '#059669' }}>
                  Hạn ngạch ổn định
                </span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sản Phẩm Đang Hoạt Động</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', margin: '0.3rem 0' }}>
                  {tours.length} Hành Trình
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  100% Khách sạn 4-5 sao
                </span>
              </div>
            </div>

            {/* Quick Recent Bookings Table */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#111827', margin: '0 0 1rem' }}>
                <i className="fa-solid fa-clock-rotate-left"></i> Đơn Đặt Tour Gần Nhất
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Mã Đơn</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Khách Hàng</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tên Tour</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ngày Đi</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tổng Tiền</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-forest)' }}>{b.id}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{b.customerName} ({b.phone})</td>
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.tourTitle}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{b.departureDate}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{formatCurrencyVND(b.totalAmount)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: b.status === 'confirmed' ? '#ecfdf5' : b.status === 'deposit' ? '#fef3c7' : '#f1f5f9',
                            color: b.status === 'confirmed' ? '#059669' : b.status === 'deposit' ? '#d97706' : '#64748b'
                          }}>
                            {b.status === 'confirmed' ? 'Đã Thanh Toán 100%' : b.status === 'deposit' ? 'Đã Cọc 50%' : 'Chờ Xử Lý'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#111827', margin: '0 0 1.25rem' }}>
              Danh Sách Đơn Đặt Chỗ & Xử Lý Thanh Toán
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Mã Booking</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Khách Hàng</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Hành Trình</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Khởi Hành</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Số Khách</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tổng Thu</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-forest)' }}>{b.id}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div><strong>{b.customerName}</strong></div>
                        <small style={{ color: 'var(--text-muted)' }}>{b.phone}</small>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '220px' }}>{b.tourTitle}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{b.departureDate}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{b.paxCount} pax</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{formatCurrencyVND(b.totalAmount)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: b.status === 'confirmed' ? '#ecfdf5' : b.status === 'deposit' ? '#fef3c7' : b.status === 'cancelled' ? '#fef2f2' : '#f1f5f9',
                          color: b.status === 'confirmed' ? '#059669' : b.status === 'deposit' ? '#d97706' : b.status === 'cancelled' ? '#dc2626' : '#64748b'
                        }}>
                          {b.status === 'confirmed' ? 'Đã Thanh Toán' : b.status === 'deposit' ? 'Đã Cọc 50%' : b.status === 'cancelled' ? 'Đã Hủy' : 'Chờ Xử Lý'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {b.status !== 'confirmed' && (
                            <button
                              type="button"
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                              onClick={() => handleStatusChange(b.id, 'confirmed')}
                            >
                              Duyệt Đủ
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                              onClick={() => handleStatusChange(b.id, 'cancelled')}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOURS MANAGEMENT */}
        {activeTab === 'tours' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#111827', margin: 0 }}>
                Quản Lý Danh Mục Tour & Bảng Giá
              </h3>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setIsAddTourOpen(true)}
              >
                <i className="fa-solid fa-plus"></i> Thêm Tour Mới
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Mã Tour</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tên Hành Trình</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Phân Loại</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Hạng Sao</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Giá Niêm Yết</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Chỗ Nhận</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{t.code}</td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '260px' }}>
                        <Link to={`/tour/${t.id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
                          {t.title}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge" style={{ background: t.category === 'international' ? '#eff6ff' : '#f0fdf4', color: t.category === 'international' ? '#2563eb' : '#15803d' }}>
                          {t.category === 'international' ? 'Quốc Tế' : 'Trong Nước'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{t.hotelTier || `${t.starRating}★`}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-forest)' }}>
                        {formatCurrencyVND(t.priceAdult)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: t.seatsLeft <= 3 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                          {t.seatsLeft} chỗ
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}
                            onClick={() => {
                              setEditingTour(t);
                              setNewPrice(t.priceAdult);
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Đổi Giá
                          </button>
                          <Link
                            to={`/tour/${t.id}`}
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'none', color: '#1e293b' }}
                          >
                            <i className="fa-solid fa-eye"></i> Xem
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Price Modal */}
      {editingTour && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setEditingTour(null); }}>
          <div className="modal-container" style={{ maxWidth: '420px', width: '90%' }}>
            <button type="button" className="modal-close-btn" onClick={() => setEditingTour(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <form onSubmit={handleUpdatePrice} style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}>Điều Chỉnh Giá Niêm Yết</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{editingTour.title}</p>
              
              <div className="form-group-budget" style={{ marginBottom: '1.25rem' }}>
                <label>Giá Tour Người Lớn (VND)</label>
                <input
                  type="number"
                  step="100000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingTour(null)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Tour Modal */}
      {isAddTourOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setIsAddTourOpen(false); }}>
          <div className="modal-container" style={{ maxWidth: '520px', width: '90%' }}>
            <button type="button" className="modal-close-btn" onClick={() => setIsAddTourOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <form onSubmit={handleAddTour} style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>Thêm Tour Mới Vào Hệ Thống</h3>

              <div className="form-group-budget" style={{ marginBottom: '0.8rem' }}>
                <label>Tên Tour *</label>
                <input type="text" required placeholder="Ví dụ: Quy Nhơn - Kỳ Co - Eo Gió 4★" value={newTourTitle} onChange={(e) => setNewTourTitle(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div className="form-group-budget">
                  <label>Mã Tour</label>
                  <input type="text" placeholder="WT-QN06" value={newTourCode} onChange={(e) => setNewTourCode(e.target.value)} />
                </div>
                <div className="form-group-budget">
                  <label>Phân Loại</label>
                  <select value={newTourCat} onChange={(e) => setNewTourCat(e.target.value as 'domestic' | 'international')}>
                    <option value="domestic">Trong Nước</option>
                    <option value="international">Quốc Tế</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.25rem' }}>
                <div className="form-group-budget">
                  <label>Điểm Đến</label>
                  <input type="text" placeholder="Quy Nhơn, Bình Định" value={newTourDest} onChange={(e) => setNewTourDest(e.target.value)} />
                </div>
                <div className="form-group-budget">
                  <label>Giá Niêm Yết (VND)</label>
                  <input type="number" step="100000" value={newTourPrice} onChange={(e) => setNewTourPrice(parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddTourOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Tạo & Đăng Tour</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
