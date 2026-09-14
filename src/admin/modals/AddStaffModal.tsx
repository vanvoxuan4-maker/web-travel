import React, { useState, useEffect } from 'react';
import { StaffRecord } from '../admin.types';
import { staffService } from '../../services/staffService';
import { validatePhone, validateEmail } from '../../utils/formValidation';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded: (newStaff: StaffRecord) => void;
}

const DEPARTMENTS = [
  'Điều Hành Tour',
  'Kinh Doanh & Sale',
  'Chăm Sóc Khách Hàng',
  'Kế Toán & Tài Chính',
  'IT & Kỹ Thuật',
  'Ban Giám Đốc'
];

const POSITIONS: Record<string, string[]> = {
  'Điều Hành Tour': ['Nhân Viên Điều Hành Tuyến', 'Chuyên Viên Điều Hành Quốc Tế', 'Trưởng Phòng Điều Hành'],
  'Kinh Doanh & Sale': ['Chuyên Viên Tư Vấn Tour', 'Trưởng Nhóm Kinh Doanh', 'Trưởng Phòng Kinh Doanh'],
  'Chăm Sóc Khách Hàng': ['Chuyên Viên CSKH', 'Nhân Viên Hỗ Trợ Đặt Vé', 'Trưởng Nhóm CSKH'],
  'Kế Toán & Tài Chính': ['Kế Toán Viên Thu Chi', 'Kế Toán Tổng Hợp', 'Kế Toán Trưởng'],
  'IT & Kỹ Thuật': ['Kỹ Sư Phần Mềm', 'Quản Trị Hệ Thống Web', 'Trưởng Nhóm Công Nghệ'],
  'Ban Giám Đốc': ['Phó Giám Đốc Vận Hành', 'Giám Đốc Điều Hành', 'Tổng Quản Trị Hệ Thống']
};

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onStaffAdded
}) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [identityCard, setIdentityCard] = useState('');
  const [department, setDepartment] = useState('Điều Hành Tour');
  const [position, setPosition] = useState('Nhân Viên Điều Hành Tuyến');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tự động sinh mã nhân viên kế tiếp khi mở modal
  useEffect(() => {
    if (isOpen) {
      staffService.getNextEmployeeCode().then(setEmployeeCode).catch(() => setEmployeeCode('NV-001'));
      setErrorMessage('');
    }
  }, [isOpen]);

  // Cập nhật chức danh tương ứng khi đổi phòng ban
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const availablePositions = POSITIONS[newDept] || [];
    if (availablePositions.length > 0) {
      setPosition(availablePositions[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên nhân viên.');
      return;
    }

    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Email không hợp lệ.');
      return;
    }

    const phoneCheck = validatePhone(phone.trim());
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || 'Số điện thoại không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffService.createStaff({
        employeeCode: employeeCode.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender,
        dateOfBirth: dateOfBirth || undefined,
        identityCard: identityCard.trim() || undefined,
        department,
        position,
        role,
        status: 'active',
        hireDate,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.success && res.data) {
        onStaffAdded(res.data);
        onClose();
      } else {
        setErrorMessage(res.error || 'Không thể tạo nhân viên mới.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi tạo nhân sự.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#34d399'
              }}
            >
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Thêm Nhân Sự Mới
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#a7f3d0' }}>
                Tạo hồ sơ cán bộ điều hành, phân quyền chức danh & phòng ban nội bộ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hàng 1: Mã NV & Vai Trò Hệ Thống */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Mã Nhân Viên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="VD: NV-004"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#047857',
                  fontFamily: 'monospace',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Phân Quyền Hệ Thống <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="staff">🧑‍💼 Nhân Viên Vận Hành (Staff)</option>
                <option value="admin">🛡️ Quản Trị Viên (Admin)</option>
              </select>
            </div>
          </div>

          {/* Hàng 2: Họ Tên & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Họ và Tên Đầy Đủ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Email Công Việc <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@webtravel.vn"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Hàng 3: SĐT & CCCD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Số Điện Thoại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Số CCCD / Hộ Chiếu
              </label>
              <input
                type="text"
                value={identityCard}
                onChange={(e) => setIdentityCard(e.target.value)}
                placeholder="079095xxxxxx"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Hàng 4: Phòng Ban & Chức Vụ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Phòng Ban <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Chức Danh / Vị Trí <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {(POSITIONS[department] || [position]).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 5: Giới Tính, Ngày Sinh, Ngày Vào Làm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Giới Tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#334155',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Ngày Sinh
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#334155',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Ngày Vào Làm
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#334155',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Hàng 6: Địa chỉ & SĐT Người Thân */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Địa Chỉ Cư Trú
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Quận 1, TP. Hồ Chí Minh"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Liên Hệ Khẩn Cấp (Người Thân)
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="0988 888 999 (Người thân)"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Ghi Chú Quản Lý Nội Bộ
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc phân công công việc cụ thể..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Đang Lưu...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> Xác Nhận Thêm Nhân Sự
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
