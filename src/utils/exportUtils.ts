import { BookingRecord, CustomerRecord, StaffRecord } from '../admin/admin.types';

/**
 * Helper to escape CSV cell value according to RFC 4180
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Downloads a CSV file with UTF-8 BOM so Excel on Windows properly displays Vietnamese characters.
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((r) => r.map(escapeCSV).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export booking records to CSV
 */
export function exportBookingsToCSV(bookings: BookingRecord[], filename?: string): void {
  if (bookings.length === 0) {
    alert('Không có dữ liệu đơn hàng để xuất file!');
    return;
  }

  const defaultFilename = `WebTravel_DonHang_${new Date().toISOString().slice(0, 10)}`;
  const headers = [
    'Mã Đơn',
    'Khách Hàng',
    'Số Điện Thoại',
    'Email',
    'Địa Chỉ',
    'Ghi Chú',
    'Tên Tour',
    'Ngày Khởi Hành',
    'Số Khách',
    'Tổng Tiền (VNĐ)',
    'Đã Thu (VNĐ)',
    'Phương Thức TT',
    'Trạng Thái TT',
    'Trạng Thái Đơn',
    'Ngày Đặt'
  ];

  const rows = bookings.map((b) => {
    const paidAmt = b.paidAmount || (b.status === 'confirmed' ? b.totalAmount : b.status === 'deposit' ? Math.round(b.totalAmount * 0.5) : 0);
    const statusLabel =
      b.status === 'confirmed'
        ? 'Đã thanh toán 100%'
        : b.status === 'deposit'
        ? 'Đã đặt cọc 50%'
        : b.status === 'pending'
        ? 'Chờ thanh toán'
        : 'Đã hủy';

    return [
      b.bookingCode || b.id,
      b.customerName,
      b.phone,
      b.email || '',
      b.customerAddress || '',
      b.customerNotes || '',
      b.tourTitle,
      b.departureDate,
      b.paxCount,
      b.totalAmount,
      paidAmt,
      b.paymentMethod || 'vietqr',
      b.paymentStatus || 'pending',
      statusLabel,
      b.createdAt
    ];
  });

  downloadCSV(filename || defaultFilename, headers, rows);
}

/**
 * Export staff records to CSV
 */
export function exportStaffToCSV(staffList: (StaffRecord | CustomerRecord)[], filename?: string): void {
  if (staffList.length === 0) {
    alert('Không có dữ liệu nhân sự để xuất file!');
    return;
  }

  const defaultFilename = `WebTravel_DoiNguNhanSu_${new Date().toISOString().slice(0, 10)}`;
  const headers = [
    'Mã Nhân Viên',
    'Họ Và Tên',
    'Email',
    'Số Điện Thoại',
    'Địa Chỉ',
    'Phòng Ban',
    'Vai Trò',
    'Trạng Thái',
    'Ngày Tham Gia'
  ];

  const rows = staffList.map((s, idx) => {
    const staff = s as StaffRecord;
    const roleLabel =
      s.role === 'super_admin'
        ? 'Tổng Quản Trị (Super Admin)'
        : s.role === 'admin'
        ? 'Quản Trị Viên (Admin)'
        : s.role === 'staff'
        ? 'Nhân Viên Vận Hành'
        : 'Khách Hàng';

    const empCode = staff.employeeCode || `NV-${String(idx + 1).padStart(3, '0')}`;
    const department = staff.department || (s.role === 'super_admin' ? 'Ban Giám Đốc' : s.role === 'admin' ? 'Bộ Phận Quản Lý' : 'Phòng Điều Hành');

    return [
      empCode,
      s.name,
      s.email,
      s.phone,
      s.address,
      department,
      roleLabel,
      s.status === 'active' ? 'Đang hoạt động' : 'Đã khóa',
      s.joinedDate
    ];
  });

  downloadCSV(filename || defaultFilename, headers, rows);
}

/**
 * Export customer records to CSV
 */
export function exportCustomersToCSV(customers: CustomerRecord[], filename?: string): void {
  if (customers.length === 0) {
    alert('Không có dữ liệu khách hàng để xuất file!');
    return;
  }

  const defaultFilename = `WebTravel_KhachHang_${new Date().toISOString().slice(0, 10)}`;
  const headers = [
    'Họ Và Tên',
    'Email',
    'Số Điện Thoại',
    'Địa Chỉ',
    'Điểm Thưởng ⭐',
    'Trạng Thái',
    'Ngày Tham Gia'
  ];

  const rows = customers.map((c) => [
    c.name,
    c.email,
    c.phone,
    c.address,
    c.points,
    c.status === 'active' ? 'Hoạt động' : 'Đã khóa',
    c.joinedDate
  ]);

  downloadCSV(filename || defaultFilename, headers, rows);
}
