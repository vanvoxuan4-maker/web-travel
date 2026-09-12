import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { profileService, ProfileRecord } from '../../services/profileService';
import { CustomerRecord, BookingRecord } from '../admin.types';
import { sanitizePhone, validatePhone } from '../../utils/formValidation';
import { formatCurrencyVND } from '../../utils/formatters';
import { useAuth } from '../../auth/useAuth';

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const canManageCustomer = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isStaffOnly = !canManageCustomer;

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State: Profile Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'banned' | 'deleted'>('active');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Form State: Password Management
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Bookings List State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  // Auto dismiss feedback banner
  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  // Load Customer Profile and Bookings
  const loadCustomerData = useCallback(async () => {
    if (!id) {
      setErrorMsg('Không tìm thấy mã khách hàng trên URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let foundCustomer: CustomerRecord | null = null;

      if (isSupabaseConfigured && supabase) {
        // Fetch from Supabase profiles
        const { data: pData, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!pErr && pData) {
          const profile = pData as ProfileRecord;
          foundCustomer = {
            id: profile.id,
            name: profile.full_name || profile.email?.split('@')[0] || 'Khách Hàng',
            email: profile.email,
            phone: profile.phone || '',
            address: profile.address || '',
            points: profile.loyalty_points || 0,
            role: profile.role || 'customer',
            status: profile.status || 'active',
            joinedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Mới',
            avatarUrl: profile.avatar_url
          };
        }
      }

      // Fallback: search in local profiles if Supabase is offline or not found
      if (!foundCustomer) {
        const allProfiles = await profileService.getAllProfiles();
        const p = allProfiles.find((item) => item.id === id);
        if (p) {
          foundCustomer = {
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Khách Hàng',
            email: p.email,
            phone: p.phone || '',
            address: p.address || '',
            points: p.loyalty_points || 0,
            role: p.role || 'customer',
            status: p.status || 'active',
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Mới',
            avatarUrl: p.avatar_url
          };
        }
      }

      if (!foundCustomer) {
        setErrorMsg(`Không tìm thấy hồ sơ khách hàng với ID: "${id}".`);
        setLoading(false);
        return;
      }

      setCustomer(foundCustomer);
      setFullName(foundCustomer.name);
      setPhone(foundCustomer.phone === 'Chưa cập nhật' ? '' : foundCustomer.phone);
      setAddress(foundCustomer.address === 'Chưa cập nhật' ? '' : foundCustomer.address);
      setAvatarUrl(foundCustomer.avatarUrl || '');
      setPoints(foundCustomer.points);
      setStatus(foundCustomer.status);

      // 2. Fetch Customer Bookings
      setLoadingBookings(true);
      if (isSupabaseConfigured && supabase) {
        let bQuery = supabase
          .from('bookings')
          .select('*, tour:tours(title)')
          .order('created_at', { ascending: false });

        if (foundCustomer.email) {
          bQuery = bQuery.or(`customer_email.eq.${foundCustomer.email},user_id.eq.${foundCustomer.id}`);
        } else {
          bQuery = bQuery.eq('user_id', foundCustomer.id);
        }

        const { data: bData, error: bErr } = await bQuery;
        if (!bErr && bData) {
          const mappedBookings: BookingRecord[] = bData.map((b: any) => {
            const adults = Number(b.adults_count || b.adult_count) || 1;
            const children = Number(b.children_count || b.child_count) || 0;
            const toddlers = Number(b.toddlers_count) || 0;
            const infants = Number(b.infants_count || b.infant_count) || 0;
            const totalPax = adults + children + toddlers + infants;
            const totalAmt = Number(b.total_amount) || 0;
            const paidAmt = Number(b.paid_amount) || (b.booking_status === 'confirmed' ? totalAmt : b.booking_status === 'deposit' ? Math.round(totalAmt * 0.5) : 0);

            return {
              id: b.booking_code || b.id,
              bookingCode: b.booking_code || b.id,
              userId: b.user_id,
              customerName: b.customer_name || foundCustomer!.name,
              phone: b.customer_phone || foundCustomer!.phone,
              email: b.customer_email || foundCustomer!.email,
              customerAddress: b.customer_address || '',
              customerNotes: b.customer_notes || '',
              tourId: b.tour_id,
              tourTitle: b.tour_title || b.tour?.title || b.tour_id,
              tourImage: b.tour_image,
              departureDate: b.departure_date ? (b.departure_date.includes('-') ? new Date(b.departure_date).toLocaleDateString('vi-VN') : b.departure_date) : 'Đang xếp lịch',
              adultsCount: adults,
              childrenCount: children,
              toddlersCount: toddlers,
              infantsCount: infants,
              singleRoomsCount: b.single_rooms_count || 0,
              paxCount: totalPax,
              totalAmount: totalAmt,
              paidAmount: paidAmt,
              paymentMethod: b.payment_method || 'vietqr',
              paymentStatus: b.payment_status || 'pending',
              bookingStatus: b.booking_status || 'pending',
              status: b.booking_status || 'pending',
              createdAt: b.created_at ? new Date(b.created_at).toLocaleString('vi-VN') : 'Mới'
            };
          });
          setBookings(mappedBookings);
        }
      }
    } catch (err: any) {
      console.error('Error fetching customer detail:', err);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi tải thông tin khách hàng.');
    } finally {
      setLoading(false);
      setLoadingBookings(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  // Total spent calculation
  const totalSpent = useMemo(() => {
    return bookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'deposit') {
        return sum + (b.paidAmount || b.totalAmount || 0);
      }
      return sum;
    }, 0);
  }, [bookings]);

  // Membership Tier
  const memberTier = useMemo(() => {
    if (points >= 5000) return { name: 'Kim Cương', color: '#0284c7', bg: '#e0f2fe', icon: 'fa-gem' };
    if (points >= 2000) return { name: 'Vàng VIP', color: '#b45309', bg: '#fef3c7', icon: 'fa-crown' };
    if (points >= 500) return { name: 'Bạc Thân Thiết', color: '#475569', bg: '#f1f5f9', icon: 'fa-medal' };
    return { name: 'Thành Viên Mới', color: '#047857', bg: '#ecfdf5', icon: 'fa-user' };
  }, [points]);

  // Password Strength Meter
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) return { score, label: 'Mật khẩu yếu', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Mật khẩu trung bình', color: '#f59e0b' };
    return { score, label: 'Mật khẩu mạnh & an toàn', color: '#10b981' };
  };

  // Handle Save Profile Information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!canManageCustomer) {
      setActionFeedback({
        type: 'error',
        message: 'Từ chối quyền: Chỉ Quản Trị Viên hoặc Super Admin mới có quyền cập nhật thông tin khách hàng.'
      });
      return;
    }

    setIsSavingInfo(true);

    if (!fullName.trim()) {
      setActionFeedback({ type: 'error', message: 'Họ và tên khách hàng không được để trống.' });
      setIsSavingInfo(false);
      return;
    }

    if (phone.trim()) {
      const phoneCheck = validatePhone(phone.trim());
      if (!phoneCheck.isValid) {
        setActionFeedback({ type: 'error', message: phoneCheck.error || 'Số điện thoại không đúng định dạng.' });
        setIsSavingInfo(false);
        return;
      }
    }

    try {
      const res = await profileService.updateUserProfile(customer.id, {
        fullName: fullName.trim(),
        phone: sanitizePhone(phone.trim()),
        address: address.trim(),
        avatarUrl: avatarUrl.trim(),
        loyaltyPoints: points,
        status: status as any
      });

      if (res.success) {
        setCustomer({
          ...customer,
          name: fullName.trim(),
          phone: phone.trim() || 'Chưa cập nhật',
          address: address.trim() || 'Chưa cập nhật',
          avatarUrl: avatarUrl.trim(),
          points,
          status
        });
        setActionFeedback({ type: 'success', message: 'Đã lưu cập nhật thông tin khách hàng thành công!' });
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Không thể cập nhật hồ sơ khách hàng.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Có lỗi xảy ra khi lưu thông tin.' });
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Handle Direct Password Reset
  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!canManageCustomer) {
      setActionFeedback({
        type: 'error',
        message: 'Từ chối quyền: Chỉ Quản Trị Viên hoặc Super Admin mới có quyền cấp lại mật khẩu trực tiếp.'
      });
      return;
    }

    if (newPassword.length < 6) {
      setActionFeedback({ type: 'error', message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setActionFeedback({ type: 'error', message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.' });
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await profileService.adminResetCustomerPassword(customer.id, newPassword);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `Đã thiết lập mật khẩu mới thành công cho tài khoản ${customer.name}!`
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Không thể đặt lại mật khẩu.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!customer || !customer.email) {
      setActionFeedback({ type: 'error', message: 'Khách hàng này chưa có địa chỉ email hợp lệ.' });
      return;
    }

    if (!canManageCustomer) {
      setActionFeedback({
        type: 'error',
        message: 'Từ chối quyền: Chỉ Quản Trị Viên hoặc Super Admin mới có quyền gửi liên kết đặt lại mật khẩu.'
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await profileService.sendCustomerPasswordResetEmail(customer.email);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `Đã gửi email liên kết tạo mật khẩu mới đến hòm thư "${customer.email}"!`
        });
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Không thể gửi email đặt lại mật khẩu.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi gửi email reset.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ── Render Loading State ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'var(--font-body, "Montserrat", sans-serif)' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#047857' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
          Đang tải hồ sơ khách hàng...
        </p>
      </div>
    );
  }

  // ── Render Error State ──
  if (errorMsg || !customer) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', background: '#ffffff', borderRadius: '24px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.25rem' }}>
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Không Tìm Thấy Khách Hàng
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {errorMsg}
          </p>
          <Link
            to="/admin?tab=customers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#047857',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            <i className="fa-solid fa-arrow-left" /> Quay Lại Quản Lý Khách Hàng
          </Link>
        </div>
      </div>
    );
  }

  // ── Render Main Dedicated Page ──
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', display: 'flex', flexDirection: 'column' }}>

      {/* ── 1. Top Enterprise Sticky Header ── */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.9rem 2.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin?tab=customers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-arrow-left" /> Quay Lại
          </button>

          <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Link to="/admin" style={{ color: '#64748b', textDecoration: 'none' }}>Admin Portal</Link>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
              <Link to="/admin?tab=customers" style={{ color: '#64748b', textDecoration: 'none' }}>Khách Hàng Thành Viên</Link>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
              <span style={{ color: '#047857', fontWeight: 600 }}>Chi Tiết Hồ Sơ</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Hồ Sơ Khách Hàng: <span style={{ color: '#047857' }}>{customer.name}</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {canManageCustomer ? (
            <>
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingEmail || !customer.email}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#f0fdf4',
                  color: '#047857',
                  border: '1.5px solid #bbf7d0',
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isSendingEmail ? 'not-allowed' : 'pointer'
                }}
              >
                <i className={`fa-solid ${isSendingEmail ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                <span>Gửi Email Reset Pass</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingInfo}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isSavingInfo ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
                }}
              >
                <i className={`fa-solid ${isSavingInfo ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                <span>Lưu Thay Đổi</span>
              </button>
            </>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1.5px solid #bfdbfe',
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <i className="fa-solid fa-eye"></i>
              <span>Chế Độ Xem (Nhân Viên)</span>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Action Flash Feedback Message ── */}
      {actionFeedback && (
        <div
          style={{
            padding: '0.85rem 2.5rem',
            background: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: actionFeedback.type === 'success' ? '#047857' : '#b91c1c',
            borderBottom: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <i className={`fa-solid ${actionFeedback.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* ── 3. Main Container Body ── */}
      <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── HERO BANNER: CUSTOMER IDENTITY (Nền trắng viền ngọc sang trọng, chữ xanh) ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2rem 2.5rem',
            color: '#0f172a',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            {/* Big Avatar */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                border: '3px solid #bbf7d0',
                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(4, 120, 87, 0.2)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={customer.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                (customer.name || 'K').charAt(0).toUpperCase()
              )}
            </div>

            {/* Customer Basic Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#047857' }}>
                  {customer.name}
                </h1>
                <span
                  style={{
                    background: customer.status === 'active' ? '#ecfdf5' : '#fee2e2',
                    color: customer.status === 'active' ? '#047857' : '#dc2626',
                    border: `1px solid ${customer.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  {customer.status === 'active' ? '● Đang Hoạt Động' : '● Đã Bị Khóa'}
                </span>
                <span
                  style={{
                    background: memberTier.bg,
                    color: memberTier.color,
                    border: '1px solid rgba(0,0,0,0.06)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className={`fa-solid ${memberTier.icon}`}></i> {memberTier.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.65rem', flexWrap: 'wrap', color: '#475569', fontSize: '0.88rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500 }}>
                  <i className="fa-solid fa-envelope" style={{ color: '#0284c7' }}></i>
                  {customer.email || 'Chưa liên kết email'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500 }}>
                  <i className="fa-solid fa-phone" style={{ color: '#047857' }}></i>
                  {customer.phone || 'Chưa có số điện thoại'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#64748b' }}>
                  <i className="fa-regular fa-calendar-check" style={{ color: '#94a3b8' }}></i>
                  Gia nhập: {customer.joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Quick KPI stats in Hero Banner (Nền sáng, số xanh & vàng nổi bật) */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '0.85rem 1.4rem', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Tour Đã Đặt</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>{bookings.length}</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '0.85rem 1.4rem', textAlign: 'center', minWidth: '130px' }}>
              <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Tổng Chi Tiêu</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>{formatCurrencyVND(totalSpent)}</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '0.85rem 1.4rem', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '0.72rem', color: '#b45309', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Điểm Thưởng</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>{customer.points.toLocaleString('vi-VN')}</div>
            </div>
          </div>
        </div>

        {/* ── STAFF READ-ONLY NOTICE BANNER (PHƯƠNG ÁN 1) ── */}
        {isStaffOnly && (
          <div
            style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '16px',
              padding: '1rem 1.4rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>
                Chế Độ Xem Thông Tin Dành Cho Nhân Viên Vận Hành &amp; CSKH
              </div>
              <div style={{ fontSize: '0.82rem', color: '#3b82f6', marginTop: '0.15rem', lineHeight: 1.4 }}>
                Bạn đang xem thông tin thành viên và lịch sử tour để hỗ trợ khách hàng. Quyền điều chỉnh điểm thưởng, thay đổi trạng thái hoạt động và cấp lại mật khẩu được phân quyền cho <strong>Quản Trị Viên (Admin)</strong> và <strong>Super Admin</strong>.
              </div>
            </div>
          </div>
        )}

        {/* ── 2-COLUMN MAIN CONTENT GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem' }} className="customer-detail-grid">
          
          {/* ── COLUMN 1: EDIT PERSONAL INFORMATION ── */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '2rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-user-pen" style={{ color: '#047857' }}></i>
                Thông Tin Cá Nhân &amp; Hồ Sơ
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                {canManageCustomer
                  ? 'Cập nhật thông tin định danh thành viên, thông tin liên lạc và tích điểm thưởng'
                  : 'Xem thông tin định danh thành viên, thông tin liên lạc và điểm thưởng tích lũy'}
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Họ và Tên */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Họ và Tên Khách Hàng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isStaffOnly}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: isStaffOnly ? '#f8fafc' : '#ffffff',
                    color: isStaffOnly ? '#475569' : '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Địa Chỉ Email (Khóa cố định)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    disabled
                    value={customer.email}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontSize: '0.9rem',
                      cursor: 'not-allowed',
                      boxSizing: 'border-box'
                    }}
                  />
                  <i className="fa-solid fa-lock" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                </div>
              </div>

              {/* Số điện thoại & Điểm thưởng */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="tel"
                    disabled={isStaffOnly}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: isStaffOnly ? '#f8fafc' : '#ffffff',
                      color: isStaffOnly ? '#475569' : '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Điểm Tích Lũy (Loyalty Points)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={isStaffOnly}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: isStaffOnly ? '#f8fafc' : '#ffffff',
                      color: isStaffOnly ? '#64748b' : '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {isStaffOnly && (
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', display: 'block', marginTop: '0.25rem' }}>
                      🔒 Chỉ Quản trị viên mới có quyền điều chỉnh điểm thưởng
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar URL with Live Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Link Ảnh Đại Diện (Avatar URL)
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="url"
                    disabled={isStaffOnly}
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: isStaffOnly ? '#f8fafc' : '#ffffff',
                      color: isStaffOnly ? '#475569' : '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {avatarUrl && (
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e2e8f0', flexShrink: 0 }}>
                      <img src={avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Địa Chỉ */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Địa Chỉ Thường Trú / Nơi Ở
                </label>
                <input
                  type="text"
                  disabled={isStaffOnly}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: isStaffOnly ? '#f8fafc' : '#ffffff',
                    color: isStaffOnly ? '#475569' : '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Trạng Thái Hoạt Động */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                  Trạng Thái Tài Khoản
                </label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isStaffOnly ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>
                    <input
                      type="radio"
                      name="customerStatus"
                      value="active"
                      disabled={isStaffOnly}
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      style={{ accentColor: '#047857' }}
                    />
                    <span style={{ color: '#047857' }}>● Hoạt Động Bình Thường</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isStaffOnly ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>
                    <input
                      type="radio"
                      name="customerStatus"
                      value="banned"
                      disabled={isStaffOnly}
                      checked={status === 'banned'}
                      onChange={() => setStatus('banned')}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span style={{ color: '#dc2626' }}>● Đang Bị Khóa (Banned)</span>
                  </label>
                </div>
                {isStaffOnly && (
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', display: 'block', marginTop: '0.35rem' }}>
                    🔒 Chỉ Quản trị viên mới có quyền thay đổi trạng thái tài khoản
                  </span>
                )}
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                {canManageCustomer ? (
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    style={{
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 1.75rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: isSavingInfo ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)'
                    }}
                  >
                    <i className={`fa-solid ${isSavingInfo ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                    <span>{isSavingInfo ? 'Đang Lưu Thay Đổi...' : 'Lưu Thay Đổi Hồ Sơ'}</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                      fontSize: '0.84rem',
                      fontWeight: 600
                    }}
                  >
                    <i className="fa-solid fa-lock" style={{ color: '#94a3b8' }}></i>
                    <span>Quyền hạn Nhân Viên: Chỉ xem thông tin hồ sơ</span>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* ── COLUMN 2: PASSWORD MANAGEMENT (PHÂN QUYỀN RBAC) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Box 1: Thiết Lập Mật Khẩu Trực Tiếp */}
            {canManageCustomer ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-key" style={{ color: '#047857' }}></i>
                    Cấp Lại Mật Khẩu Trực Tiếp
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    Dùng khi khách hàng gọi hotline nhờ đổi mật khẩu hoặc cấp quyền đăng nhập nhanh
                  </p>
                </div>

                <form onSubmit={handleDirectPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {/* New Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        style={{
                          width: '100%',
                          padding: '0.75rem 2.75rem 0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>

                    {/* Strength Meter */}
                    {newPassword && (
                      <div style={{ marginTop: '0.45rem' }}>
                        {(() => {
                          const strength = getPasswordStrength(newPassword);
                          return (
                            <div>
                              <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.3rem' }}>
                                <div style={{ flex: 1, background: strength.score >= 1 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                                <div style={{ flex: 1, background: strength.score >= 2 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                                <div style={{ flex: 1, background: strength.score >= 3 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                                <div style={{ flex: 1, background: strength.score >= 4 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color }}>
                                {strength.label}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Xác Nhận Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại chính xác mật khẩu mới"
                        style={{
                          width: '100%',
                          padding: '0.75rem 2.75rem 0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                        Mật khẩu xác nhận chưa trùng khớp.
                      </span>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      style={{
                        background: '#047857',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem 1.6rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: isResettingPassword ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)'
                      }}
                    >
                      <i className={`fa-solid ${isResettingPassword ? 'fa-spinner fa-spin' : 'fa-shield-check'}`}></i>
                      <span>{isResettingPassword ? 'Đang Đặt Lại...' : 'Cập Nhật Mật Khẩu Khách Hàng'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    margin: '0 auto 1.25rem',
                    border: '2px solid #bfdbfe'
                  }}
                >
                  <i className="fa-solid fa-key"></i>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Quản Lý Mật Khẩu Khách Hàng
                </h3>
                <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.86rem', lineHeight: 1.6 }}>
                  Tính năng cấp lại mật khẩu trực tiếp yêu cầu quyền hạn cấp cao nhằm bảo vệ bí mật tài khoản và sự an toàn của khách hàng.
                </p>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    color: '#475569',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem'
                  }}
                >
                  <i className="fa-solid fa-circle-info" style={{ color: '#047857', marginTop: '0.15rem' }}></i>
                  <div>
                    <strong>Quy trình hỗ trợ:</strong> Khi khách hàng quên mật khẩu hoặc cần hỗ trợ truy cập gấp, nhân viên vui lòng báo cho <strong>Quản Trị Viên (Admin)</strong> để được xử lý theo đúng quy chuẩn bảo mật.
                  </div>
                </div>
              </div>
            )}

            {/* Box 2: Gửi Link Reset Qua Email */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #bbf7d0',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <i className="fa-solid fa-paper-plane" style={{ color: '#047857' }}></i>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#064e3b' }}>
                  Gửi Email Đặt Lại Mật Khẩu Tự Động
                </h4>
              </div>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                Gửi liên kết xác thực chính thức từ hệ thống tới hòm thư <strong>{customer.email}</strong> để khách hàng tự đặt mật khẩu riêng.
              </p>

              {canManageCustomer ? (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={isSendingEmail || !customer.email}
                  style={{
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.4rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: isSendingEmail ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)'
                  }}
                >
                  <i className={`fa-solid ${isSendingEmail ? 'fa-spinner fa-spin' : 'fa-envelope-open-text'}`}></i>
                  <span>{isSendingEmail ? 'Đang Gửi Email...' : 'Gửi Email Tạo Mật Khẩu Mới'}</span>
                </button>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.6rem 0.95rem',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <i className="fa-solid fa-lock" style={{ color: '#94a3b8' }}></i>
                  <span>Chỉ Quản trị viên mới có quyền gửi liên kết đặt lại mật khẩu</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ── 3. FULL BOOKING HISTORY TABLE ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-receipt" style={{ color: '#047857' }}></i>
                Lịch Sử Đặt Chỗ Của Khách Hàng
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.86rem' }}>
                Toàn bộ các đơn tour gắn với tài khoản này ({bookings.length} đơn)
              </p>
            </div>

            <Link
              to="/admin?tab=bookings"
              style={{
                fontSize: '0.85rem',
                color: '#047857',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Xem Tất Cả Đơn Hàng</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {loadingBookings ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }}></i> Đang tải đơn hàng...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.6rem', color: '#64748b' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h4 style={{ margin: '0 0 0.35rem', color: '#475569', fontSize: '1.1rem', fontWeight: 700 }}>
                Chưa có đơn đặt tour nào
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Khách hàng này chưa thực hiện đặt chỗ chuyến đi nào trên hệ thống WebTravel.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Mã Đơn</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Tên Tour Lữ Hành</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Khởi Hành</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'center' }}>Số Khách</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Thanh Toán</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Tổng Tiền</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'center' }}>Trạng Thái</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id || b.bookingCode} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>
                        {b.bookingCode || b.id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {b.tourTitle}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {b.departureDate}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                        {b.paxCount} khách
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#047857' }}>
                        {formatCurrencyVND(b.totalAmount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background:
                              b.status === 'confirmed' ? '#ecfdf5' : b.status === 'deposit' ? '#fffbeb' : b.status === 'pending' ? '#eff6ff' : '#fee2e2',
                            color:
                              b.status === 'confirmed' ? '#047857' : b.status === 'deposit' ? '#b45309' : b.status === 'pending' ? '#1d4ed8' : '#b91c1c'
                          }}
                        >
                          {b.status === 'confirmed' ? '● 100% Xong' : b.status === 'deposit' ? '● Đã Cọc 50%' : b.status === 'pending' ? '● Chờ Duyệt' : '● Đã Hủy'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Link
                          to={`/admin/bookings/${b.bookingCode || b.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.75rem',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            color: '#047857',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                          title="Mở hồ sơ chi tiết đơn hàng"
                        >
                          <span>Xem Đơn</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      <style>{`
        @media (max-width: 1024px) {
          .customer-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};
