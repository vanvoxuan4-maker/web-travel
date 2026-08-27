import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { bookingService, BookingPayload } from '../../services/bookingService';
import { profileService } from '../../services/profileService';
import { formatCurrencyVND } from '../../utils/formatters';
import { ETicketModal } from '../components/profile/ETicketModal';
import { Link } from 'react-router-dom';

type ProfileTab = 'bookings' | 'settings' | 'loyalty';
type BookingFilter = 'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('bookings');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');

  // Bookings state
  const [bookings, setBookings] = useState<BookingPayload[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);
  const [selectedETicket, setSelectedETicket] = useState<BookingPayload | null>(null);

  // Cancellation Modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingPayload | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  // Profile Edit state
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
      setEditAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const loadUserBookings = async () => {
    if (!user) return;
    setIsLoadingBookings(true);
    try {
      const list = await bookingService.getUserBookings(user.id, user.email, user.phone);
      setBookings(list);
    } catch (e) {
      console.error('Error loading bookings:', e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadUserBookings();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const res = await profileService.updateUserProfile(user.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        avatarUrl: editAvatarUrl.trim()
      });

      if (res.success) {
        setSaveSuccessMsg('Cập nhật thông tin tài khoản thành công!');
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        setSaveErrorMsg(res.error || 'Có lỗi xảy ra khi lưu thông tin');
      }
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsProcessingCancel(true);
    try {
      await bookingService.cancelBooking(cancellingBooking.bookingCode, cancelReason);
      await loadUserBookings();
      setCancellingBooking(null);
      setCancelReason('');
      alert(`Đã hủy đặt chỗ mã ${cancellingBooking.bookingCode} thành công.`);
    } catch (e) {
      alert('Không thể hủy đơn, vui lòng thử lại hoặc liên hệ tổng đài 1800 646 888.');
    } finally {
      setIsProcessingCancel(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.bookingStatus === bookingFilter;
  });

  // Loyalty Tier Calculation
  const loyaltyPoints = user?.loyaltyPoints || 0;
  const getTier = (points: number) => {
    if (points >= 5000) return { name: 'Hạng Kim Cương (Diamond)', color: '#7c3aed', icon: 'fa-gem', discount: '10%' };
    if (points >= 2000) return { name: 'Hạng Vàng (Gold)', color: '#d97706', icon: 'fa-crown', discount: '5%' };
    if (points >= 500) return { name: 'Hạng Bạc (Silver)', color: '#0284c7', icon: 'fa-medal', discount: '3%' };
    return { name: 'Thành Viên Mới (Standard)', color: '#059669', icon: 'fa-seedling', discount: '0%' };
  };
  const tier = getTier(loyaltyPoints);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '8.5rem', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 2-COLUMN MAIN LAYOUT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '1.75rem',
            alignItems: 'start'
          }}
          className="profile-2col-container"
        >
          
          {/* ================= COLUMN 1: SIDEBAR (HỒ SƠ & MENU DỌC) ================= */}
          <aside
            style={{
              position: 'sticky',
              top: '120px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* User Profile Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem 1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent Gradient Header Stripe */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 50%, #10b981 100%)'
                }}
              />

              {/* Avatar */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: user?.avatarUrl
                    ? `url(${user.avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: '3px solid #ffffff',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: '0.25rem auto 0.75rem'
                }}
              >
                {!user?.avatarUrl && (user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U')}
              </div>

              {/* Full Name */}
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {user?.fullName || user?.email.split('@')[0]}
              </h2>

              {/* Role Badge */}
              <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                <span
                  style={{
                    background: user?.role === 'super_admin' ? '#fef3c7' : user?.role === 'admin' ? '#eff6ff' : '#f1f5f9',
                    color: user?.role === 'super_admin' ? '#b45309' : user?.role === 'admin' ? '#1d4ed8' : '#475569',
                    border: `1px solid ${user?.role === 'super_admin' ? '#fde68a' : user?.role === 'admin' ? '#bfdbfe' : '#e2e8f0'}`,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {user?.role === 'super_admin' ? '⚡ Super Admin' : user?.role === 'admin' ? '👑 Admin' : '👤 Tài Khoản Thành Viên'}
                </span>
              </div>

              {/* Contact Mini List */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '0.75rem 0.85rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  color: '#475569',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <i className="fa-solid fa-envelope" style={{ color: '#059669', width: '14px' }}></i>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </span>
                </div>
                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-phone" style={{ color: '#059669', width: '14px' }}></i>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: '#dc2626', width: '14px', marginTop: '2px' }}></i>
                    <span style={{ lineHeight: 1.3 }}>{user.address}</span>
                  </div>
                )}
              </div>

              {/* Subtle Loyalty Row (Minimalist & Non-intrusive) */}
              <div
                style={{
                  marginTop: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748b' }}>
                  <i className={`fa-solid ${tier.icon}`} style={{ color: tier.color, fontSize: '0.85rem' }}></i>
                  <span>{tier.name}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#047857' }}>
                  {loyaltyPoints.toLocaleString('vi-VN')} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>điểm</span>
                </div>
              </div>
            </div>

            {/* Vertical Menu Navigation */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              {/* Tab 1: Bookings */}
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'bookings' ? '#ecfdf5' : 'transparent',
                  color: activeTab === 'bookings' ? '#047857' : '#475569',
                  fontWeight: activeTab === 'bookings' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fa-solid fa-receipt" style={{ color: activeTab === 'bookings' ? '#047857' : '#94a3b8', fontSize: '1rem', width: '18px' }}></i>
                  <span>Đơn Đặt Chỗ Của Tôi</span>
                </div>
                <span
                  style={{
                    background: activeTab === 'bookings' ? '#047857' : '#f1f5f9',
                    color: activeTab === 'bookings' ? '#ffffff' : '#64748b',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  {bookings.length}
                </span>
              </button>

              {/* Tab 2: Settings */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'settings' ? '#ecfdf5' : 'transparent',
                  color: activeTab === 'settings' ? '#047857' : '#475569',
                  fontWeight: activeTab === 'settings' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <i className="fa-solid fa-user-gear" style={{ color: activeTab === 'settings' ? '#047857' : '#94a3b8', fontSize: '1rem', width: '18px' }}></i>
                <span>Thông Tin Cá Nhân</span>
              </button>

              {/* Tab 3: Loyalty & Rewards */}
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'loyalty' ? '#ecfdf5' : 'transparent',
                  color: activeTab === 'loyalty' ? '#047857' : '#475569',
                  fontWeight: activeTab === 'loyalty' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <i className="fa-solid fa-gift" style={{ color: activeTab === 'loyalty' ? '#047857' : '#94a3b8', fontSize: '1rem', width: '18px' }}></i>
                <span>Điểm Thưởng &amp; Voucher</span>
              </button>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0.35rem 0' }} />

              {/* Admin Portal Link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: '#d97706',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    background: '#fffbeb',
                    border: '1px solid #fde68a'
                  }}
                >
                  <i className="fa-solid fa-gauge" style={{ width: '18px' }}></i>
                  <span>Trang Quản Trị Admin</span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={signOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '18px' }}></i>
                <span>Đăng Xuất</span>
              </button>
            </div>
          </aside>

          {/* ================= COLUMN 2: CONTEXT AREA (NỘI DUNG CHÍNH) ================= */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            
            {/* ================= TAB 1 CONTEXT: ĐƠN ĐẶT CHỖ ================= */}
            {activeTab === 'bookings' && (
              <div>
                {/* Header Context Title */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      Lịch Sử Đơn Đặt Chỗ
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Quản lý danh sách tour đã đặt, xuất vé điện tử E-Ticket và kiểm tra lịch trình
                    </p>
                  </div>

                  <Link
                    to="/"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '0.55rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Đặt Tour Mới
                  </Link>
                </div>

                {/* Filter Chips */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {[
                    { id: 'all', label: 'Tất Cả' },
                    { id: 'confirmed', label: 'Đã Giữ Chỗ / Xác Nhận' },
                    { id: 'pending', label: 'Chờ Thanh Toán' },
                    { id: 'completed', label: 'Đã Hoàn Tất' },
                    { id: 'cancelled', label: 'Đã Hủy' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBookingFilter(f.id as BookingFilter)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: bookingFilter === f.id ? '#047857' : '#e2e8f0',
                        background: bookingFilter === f.id ? '#047857' : '#ffffff',
                        color: bookingFilter === f.id ? '#ffffff' : '#64748b',
                        boxShadow: bookingFilter === f.id ? '0 2px 4px rgba(4, 120, 87, 0.2)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Bookings List Content */}
                {isLoadingBookings ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#047857' }}></i>
                    <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>Đang tải lịch sử đặt chỗ...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>
                      <i className="fa-solid fa-suitcase-rolling"></i>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontWeight: 800 }}>Chưa có đơn đặt tour nào</h3>
                    <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.88rem' }}>
                      Khám phá các hành trình du lịch mới nhất và nhận ưu đãi độc quyền từ WebTravel!
                    </p>
                    <Link
                      to="/"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#047857',
                        color: '#ffffff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.3)'
                      }}
                    >
                      <i className="fa-solid fa-compass"></i> Khám Phá Tour Ngay
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredBookings.map((booking) => {
                      const isCancelled = booking.bookingStatus === 'cancelled';
                      return (
                        <div
                          key={booking.bookingCode}
                          style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            padding: '1.5rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            opacity: isCancelled ? 0.75 : 1
                          }}
                        >
                          {/* Booking Card Header */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: '#047857', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                {booking.bookingCode}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Ngày đặt: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <span
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: booking.bookingStatus === 'confirmed' ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#fffbeb',
                                  color: booking.bookingStatus === 'confirmed' ? '#047857' : isCancelled ? '#dc2626' : '#d97706',
                                  border: `1px solid ${booking.bookingStatus === 'confirmed' ? '#a7f3d0' : isCancelled ? '#fecaca' : '#fde68a'}`
                                }}
                              >
                                {booking.bookingStatus === 'confirmed' ? '✓ ĐÃ XÁC NHẬN' : isCancelled ? '✕ ĐÃ HỦY' : '⏳ CHỜ DUYỆT'}
                              </span>

                              <span
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: booking.paymentStatus === 'paid' ? '#eff6ff' : '#f8fafc',
                                  color: booking.paymentStatus === 'paid' ? '#2563eb' : '#64748b',
                                  border: '1px solid #e2e8f0'
                                }}
                              >
                                {booking.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN 100%' : booking.paymentStatus === 'partially_paid' ? 'ĐÃ ĐẶT CỌC' : 'CHỜ THANH TOÁN'}
                              </span>
                            </div>
                          </div>

                          {/* Tour Info & Details */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                {booking.tourTitle}
                              </h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
                                <span>
                                  <i className="fa-solid fa-calendar-day" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                                  Khởi hành: <strong>{booking.departureDate}</strong>
                                </span>
                                <span>
                                  <i className="fa-solid fa-users" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                                  Số khách: <strong>{booking.adultsCount} Lớn{booking.childrenCount > 0 ? ` + ${booking.childrenCount} Trẻ em` : ''}{(booking.toddlersCount || 0) > 0 ? ` + ${booking.toddlersCount} Trẻ nhỏ` : ''}{booking.infantsCount > 0 ? ` + ${booking.infantsCount} Em bé` : ''}</strong>
                                </span>
                                <span>
                                  <i className="fa-solid fa-credit-card" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                                  Hình thức: <strong>{booking.paymentMethod.toUpperCase()}</strong>
                                </span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Tổng thanh toán</div>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857' }}>
                                {formatCurrencyVND(booking.totalAmount)}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Người đặt: <strong>{booking.customerName}</strong> ({booking.customerPhone})
                            </div>

                            <div style={{ display: 'flex', gap: '0.65rem' }}>
                              {/* View E-ticket button */}
                              <button
                                type="button"
                                onClick={() => setSelectedETicket(booking)}
                                style={{
                                  background: '#047857',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '0.6rem 1.15rem',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'
                                }}
                              >
                                <i className="fa-solid fa-qrcode"></i>
                                Xem Vé Điện Tử (E-Ticket)
                              </button>

                              {/* Cancel button if not yet cancelled */}
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => setCancellingBooking(booking)}
                                  style={{
                                    background: '#ffffff',
                                    color: '#ef4444',
                                    border: '1px solid #fecaca',
                                    borderRadius: '10px',
                                    padding: '0.6rem 0.95rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Hủy Tour
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2 CONTEXT: THÔNG TIN CÁ NHÂN ================= */}
            {activeTab === 'settings' && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    Thông Tin Cá Nhân &amp; Tài Khoản
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                    Cập nhật thông tin chính xác để hệ thống tự động điền khi đặt tour và xuất vé điện tử
                  </p>
                </div>

                {saveSuccessMsg && (
                  <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: '0.5rem' }}></i> {saveSuccessMsg}
                  </div>
                )}

                {saveErrorMsg && (
                  <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.5rem' }}></i> {saveErrorMsg}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Địa Chỉ Email (Không thể đổi)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        background: '#f1f5f9',
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Số Điện Thoại Liên Hệ
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Ví dụ: 0912 345 678"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Link Ảnh Đại Diện (Avatar URL)
                    </label>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Địa Chỉ Nhà / Điểm Đón Mặc Định
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Ví dụ: Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      style={{
                        background: '#047857',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem 1.75rem',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.3)'
                      }}
                    >
                      {isSavingProfile ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Đang Lưu...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= TAB 3 CONTEXT: ĐIỂM THƯỞNG & VOUCHER ================= */}
            {activeTab === 'loyalty' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Loyalty Tier Progress Banner */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    padding: '2rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT
                      </div>
                      <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                        Quyền Lợi &amp; Tích Lũy Điểm Thưởng
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#047857' }}>
                        {loyaltyPoints.toLocaleString('vi-VN')}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Điểm khả dụng</span>
                    </div>
                  </div>

                  {/* Tier Progress Bar */}
                  <div style={{ background: '#f1f5f9', borderRadius: '10px', height: '12px', overflow: 'hidden', margin: '1.25rem 0 0.5rem' }}>
                    <div
                      style={{
                        background: 'linear-gradient(90deg, #059669 0%, #d97706 50%, #7c3aed 100%)',
                        height: '100%',
                        width: `${Math.min(100, (loyaltyPoints / 5000) * 100)}%`,
                        borderRadius: '10px'
                      }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                    <span>🌱 Mới (0đ)</span>
                    <span>🥉 Hạng Bạc (500đ)</span>
                    <span>👑 Hạng Vàng (2.000đ)</span>
                    <span>💎 Kim Cương (5.000đ)</span>
                  </div>
                </div>

                {/* 3 Active Vouchers Grid */}
                <div>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Voucher &amp; Mã Giảm Giá Độc Quyền
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {[
                      { code: 'SUMMER2026', discount: 'Giảm 15% Tối Đa 500.000đ', min: 'Đơn từ 3.000.000đ', exp: '31/08/2026', color: '#047857', bg: '#ecfdf5' },
                      { code: 'WELCOME', discount: 'Giảm 100.000đ Cho Khách Mới', min: 'Áp dụng cho mọi tour', exp: '31/12/2026', color: '#2563eb', bg: '#eff6ff' },
                      { code: 'LOYALTY50', discount: 'Trừ 50.000đ Từ Điểm Thưởng', min: 'Dành cho hạng Bạc trở lên', exp: 'Vô thời hạn', color: '#7c3aed', bg: '#f5f3ff' }
                    ].map((v) => (
                      <div
                        key={v.code}
                        style={{
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: '1.5px dashed #cbd5e1',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.05rem', color: v.color, background: v.bg, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                              {v.code}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>HSD: {v.exp}</span>
                          </div>
                          <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                            {v.discount}
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{v.min}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            alert(`Đã sao chép mã giảm giá: ${v.code}`);
                          }}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '0.45rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <i className="fa-solid fa-copy"></i> Sao Chép Mã Voucher
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </main>

        </div>

      </div>

      {/* ================= ETICKET MODAL ================= */}
      {selectedETicket && (
        <ETicketModal
          booking={selectedETicket}
          onClose={() => setSelectedETicket(null)}
        />
      )}

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      {cancellingBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3 style={{ margin: '0 0 0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Xác Nhận Hủy Đặt Chỗ?
            </h3>
            <p style={{ margin: '0 0 1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
              Bạn đang yêu cầu hủy tour <strong>{cancellingBooking.tourTitle}</strong> (Mã: <code>{cancellingBooking.bookingCode}</code>).
            </p>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#475569', marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b' }}>
              <strong>Chính sách hoàn tiền:</strong> Tùy theo thời điểm hủy so với ngày khởi hành ({cancellingBooking.departureDate}), mức hoàn tiền sẽ áp dụng từ 50% đến 100% theo điều khoản lữ hành.
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Lý do hủy (Không bắt buộc):
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="VD: Thay đổi lịch trình công tác, có việc đột xuất..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Giữ Lại Tour
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isProcessingCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {isProcessingCancel ? 'Đang Xử Lý...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive CSS for Mobile */}
      <style>{`
        @media (max-width: 900px) {
          .profile-2col-container {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: static !important;
          }
        }
      `}</style>

    </div>
  );
};
