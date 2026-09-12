import React, { useState, useMemo } from 'react';
import { CustomerRecord, BookingRecord } from '../admin.types';
import { profileService } from '../../services/profileService';
import { sanitizePhone, validatePhone } from '../../utils/formValidation';
import { formatCurrencyVND } from '../../utils/formatters';

interface CustomerDetailModalProps {
  customer: CustomerRecord;
  bookings?: BookingRecord[];
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: CustomerRecord) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  bookings = [],
  onClose,
  onCustomerUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'bookings'>('info');

  // Form states: Personal Info
  const [fullName, setFullName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone !== 'Chưa cập nhật' ? customer.phone : '');
  const [address, setAddress] = useState(customer.address !== 'Chưa cập nhật' ? customer.address : '');
  const [points, setPoints] = useState<number>(customer.points || 0);
  const [status, setStatus] = useState<'active' | 'banned' | 'deleted'>(customer.status);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccessMsg, setInfoSuccessMsg] = useState('');
  const [infoErrorMsg, setInfoErrorMsg] = useState('');

  // Form states: Password Reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Filter bookings associated with this customer
  const customerBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchEmail = customer.email && b.email && b.email.toLowerCase() === customer.email.toLowerCase();
      const matchPhone = customer.phone && b.phone && b.phone === customer.phone;
      const matchUserId = (b as any).userId && (b as any).userId === customer.id;
      return matchEmail || matchPhone || matchUserId;
    });
  }, [bookings, customer]);

  // Total spent calculation
  const totalSpent = useMemo(() => {
    return customerBookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'deposit') {
        return sum + (b.paidAmount || b.totalAmount || 0);
      }
      return sum;
    }, 0);
  }, [customerBookings]);

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

  // Handle Save Customer Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setInfoSuccessMsg('');
    setInfoErrorMsg('');

    if (!fullName.trim()) {
      setInfoErrorMsg('Họ và tên không được để trống.');
      setIsSavingInfo(false);
      return;
    }

    if (phone.trim()) {
      const phoneCheck = validatePhone(phone.trim());
      if (!phoneCheck.isValid) {
        setInfoErrorMsg(phoneCheck.error || 'Số điện thoại không đúng định dạng.');
        setIsSavingInfo(false);
        return;
      }
    }

    try {
      const res = await profileService.updateUserProfile(customer.id, {
        fullName: fullName.trim(),
        phone: sanitizePhone(phone.trim()),
        address: address.trim(),
        loyaltyPoints: points,
        status: status as any
      });

      if (res.success) {
        const updated: CustomerRecord = {
          ...customer,
          name: fullName.trim(),
          phone: phone.trim() || 'Chưa cập nhật',
          address: address.trim() || 'Chưa cập nhật',
          points,
          status
        };
        onCustomerUpdated(updated);
        setInfoSuccessMsg('Đã cập nhật thông tin khách hàng thành công!');
        setTimeout(() => setInfoSuccessMsg(''), 4000);
      } else {
        setInfoErrorMsg(res.error || 'Không thể lưu thông tin khách hàng.');
      }
    } catch (err: any) {
      setInfoErrorMsg(err?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Handle Direct Password Reset
  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await profileService.adminResetCustomerPassword(customer.id, newPassword);
      if (res.success) {
        setPasswordSuccessMsg(`Đã đặt lại mật khẩu mới cho khách hàng ${customer.name} thành công!`);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 6000);
      } else {
        setPasswordErrorMsg(res.error || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!customer.email) {
      setPasswordErrorMsg('Khách hàng này không có địa chỉ email hợp lệ.');
      return;
    }

    setIsSendingEmail(true);
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    try {
      const res = await profileService.sendCustomerPasswordResetEmail(customer.email);
      if (res.success) {
        setPasswordSuccessMsg(`Đã gửi email hướng dẫn đặt lại mật khẩu đến "${customer.email}" thành công!`);
        setTimeout(() => setPasswordSuccessMsg(''), 6000);
      } else {
        setPasswordErrorMsg(res.error || 'Không thể gửi email đặt lại mật khẩu.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err?.message || 'Có lỗi khi gửi email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div
          style={{
            padding: '1.5rem 2rem',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: '#047857',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {(customer.name || 'K').charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                  {customer.name}
                </h3>
                <span
                  style={{
                    background: customer.status === 'active' ? '#ecfdf5' : '#fee2e2',
                    color: customer.status === 'active' ? '#047857' : '#dc2626',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {customer.status === 'active' ? '● Hoạt Động' : '● Đã Khóa'}
                </span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}
                >
                  ID: {customer.id.substring(0, 8)}
                </span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                <i className="fa-solid fa-envelope" style={{ marginRight: '0.4rem', color: '#38bdf8' }}></i>
                {customer.email || 'Chưa liên kết email'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Đóng cửa sổ"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* ================= STATS RIBBON ================= */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.85rem 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Tổng Tour Đã Đặt
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
              {customerBookings.length} Đơn
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Tổng Chi Tiêu
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857', marginTop: '0.15rem' }}>
              {formatCurrencyVND(totalSpent)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Điểm Thưởng Tích Lũy
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', marginTop: '0.15rem' }}>
              {customer.points.toLocaleString('vi-VN')} pts
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Ngày Tham Gia
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', marginTop: '0.25rem' }}>
              {customer.joinedDate}
            </div>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 2rem',
            background: '#ffffff',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'info' ? '2.5px solid #047857' : '2.5px solid transparent',
              color: activeTab === 'info' ? '#047857' : '#64748b',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-user-pen"></i>
            Thông Tin Cá Nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2.5px solid #047857' : '2.5px solid transparent',
              color: activeTab === 'password' ? '#047857' : '#64748b',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-key"></i>
            Đổi / Cấp Lại Mật Khẩu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'bookings' ? '2.5px solid #047857' : '2.5px solid transparent',
              color: activeTab === 'bookings' ? '#047857' : '#64748b',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-receipt"></i>
            Lịch Sử Đặt Tour ({customerBookings.length})
          </button>
        </div>

        {/* ================= MODAL BODY CONTENT ================= */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
          
          {/* ================= TAB 1: THÔNG TIN CÁ NHÂN ================= */}
          {activeTab === 'info' && (
            <div>
              {infoSuccessMsg && (
                <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{infoSuccessMsg}</span>
                </div>
              )}

              {infoErrorMsg && (
                <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{infoErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Họ và Tên */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Họ và Tên Khách Hàng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
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

                {/* Số Điện Thoại */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Điểm Thưởng Tích Lũy */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Điểm Thưởng Tích Lũy (Loyalty Points)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Địa Chỉ */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Địa Chỉ Thường Trú / Giao Nhận Vé
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Trạng Thái Tài Khoản */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Trạng Thái Hoạt Động Tài Khoản
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="accountStatus"
                        value="active"
                        checked={status === 'active'}
                        onChange={() => setStatus('active')}
                        style={{ accentColor: '#047857' }}
                      />
                      <span style={{ color: '#047857' }}>● Hoạt Động Bình Thường</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="accountStatus"
                        value="banned"
                        checked={status === 'banned'}
                        onChange={() => setStatus('banned')}
                        style={{ accentColor: '#dc2626' }}
                      />
                      <span style={{ color: '#dc2626' }}>● Đang Bị Khóa (Banned)</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Đóng
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    style={{
                      padding: '0.75rem 1.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#047857',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: isSavingInfo ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)'
                    }}
                  >
                    {isSavingInfo ? (
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

          {/* ================= TAB 2: ĐỔI MẬT KHẨU ================= */}
          {activeTab === 'password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {passwordSuccessMsg && (
                <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              {/* PHƯƠNG ÁN 1: ĐẶT MẬT KHẨU TRỰC TIẾP */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-key"></i>
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Phương Án 1: Thiết Lập Mật Khẩu Mới Trực Tiếp
                  </h4>
                </div>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.84rem', color: '#64748b' }}>
                  Sử dụng khi khách hàng gọi điện hoặc gửi yêu cầu nhờ Quản trị viên cấp mật khẩu đăng nhập tạm thời.
                </p>

                <form onSubmit={handleDirectPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
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
                          padding: '0.7rem 2.75rem 0.7rem 1rem',
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

                    {/* Strength meter */}
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
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: strength.color }}>
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
                          padding: '0.7rem 2.75rem 0.7rem 1rem',
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
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.7rem 1.5rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: isResettingPassword ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.25)'
                      }}
                    >
                      {isResettingPassword ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Đang Đặt Lại...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-shield-check"></i> Cập Nhật Mật Khẩu Cho Khách
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* PHƯƠNG ÁN 2: GỬI LINK RESET QUA EMAIL */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#047857', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#064e3b' }}>
                      Phương Án 2: Gửi Email Đặt Lại Mật Khẩu
                    </h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#166534', maxWidth: '480px' }}>
                    Hệ thống sẽ gửi email chứa liên kết bảo mật chính thức của Supabase Auth đến <strong>{customer.email}</strong> để khách hàng tự đặt mật khẩu riêng.
                  </p>
                </div>

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
                    boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isSendingEmail ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Đang Gửi...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Gửi Email Reset
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 3: LỊCH SỬ ĐẶT TOUR ================= */}
          {activeTab === 'bookings' && (
            <div>
              {customerBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', color: '#64748b' }}>
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', color: '#475569', fontSize: '1.05rem', fontWeight: 700 }}>
                    Chưa có lịch sử đặt tour
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Khách hàng này chưa thực hiện bất kỳ giao dịch đặt chỗ nào trên hệ thống.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Mã Đơn</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Tên Tour</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Ngày Đi</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Tổng Tiền</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerBookings.map((b) => (
                        <tr key={b.id || b.bookingCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>
                            {b.bookingCode || b.id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                            {b.tourTitle}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                            {b.departureDate}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#047857' }}>
                            {formatCurrencyVND(b.totalAmount)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background:
                                  b.status === 'confirmed' ? '#ecfdf5' : b.status === 'deposit' ? '#fffbeb' : b.status === 'pending' ? '#eff6ff' : '#fee2e2',
                                color:
                                  b.status === 'confirmed' ? '#047857' : b.status === 'deposit' ? '#b45309' : b.status === 'pending' ? '#1d4ed8' : '#b91c1c'
                              }}
                            >
                              {b.status === 'confirmed' ? '100% Xong' : b.status === 'deposit' ? 'Đã Cọc 50%' : b.status === 'pending' ? 'Chờ Duyệt' : 'Đã Hủy'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
