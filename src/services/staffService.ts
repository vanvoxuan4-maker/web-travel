import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { StaffRecord } from '../admin/admin.types';
import { AppLogger } from '../utils/logger';

const LOCAL_STAFF_KEY = 'webtravel_local_staff';

// Danh sách nhân sự mẫu ban đầu khi chạy offline hoặc Supabase chưa seed
const INITIAL_MOCK_STAFF: StaffRecord[] = [
  {
    id: 'staff-001',
    employeeCode: 'NV-001',
    name: 'Võ Xuân Vạn',
    email: 'vanvoxuan4@gmail.com',
    phone: '0965712527',
    gender: 'male',
    dateOfBirth: '1995-08-15',
    identityCard: '079095012345',
    department: 'Ban Giám Đốc',
    position: 'Tổng Quản Trị Hệ Thống',
    role: 'super_admin',
    status: 'active',
    hireDate: '2024-01-01',
    joinedDate: '01/01/2024',
    address: 'TP. Hồ Chí Minh',
    emergencyContact: '0988889999 (Người thân)',
    notes: 'Tài khoản sáng lập và điều hành toàn bộ hệ sinh thái WebTravel',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z'
  },
  {
    id: 'staff-002',
    employeeCode: 'NV-002',
    name: 'Nguyễn Thu Trang',
    email: 'trang.nguyen@webtravel.vn',
    phone: '0912345678',
    gender: 'female',
    dateOfBirth: '1998-05-20',
    identityCard: '001198056789',
    department: 'Kinh Doanh & Sale',
    position: 'Trưởng Phòng Kinh Doanh',
    role: 'admin',
    status: 'active',
    hireDate: '2024-03-15',
    joinedDate: '15/03/2024',
    address: 'Hà Nội',
    emergencyContact: '0903112233 (Mẹ)',
    notes: 'Phụ trách duyệt đơn đặt tour lớn và chương trình ưu đãi',
    createdAt: '2024-03-15T08:00:00Z',
    updatedAt: '2024-03-15T08:00:00Z'
  },
  {
    id: 'staff-003',
    employeeCode: 'NV-003',
    name: 'Trần Minh Tuấn',
    email: 'tuan.tran@webtravel.vn',
    phone: '0933887766',
    gender: 'male',
    dateOfBirth: '2000-11-10',
    identityCard: '079200088991',
    department: 'Điều Hành Tour',
    position: 'Chuyên Viên Điều Hành Tuyến Quốc Tế',
    role: 'staff',
    status: 'active',
    hireDate: '2024-06-01',
    joinedDate: '01/06/2024',
    address: 'Đà Nẵng',
    emergencyContact: '0944556677 (Bố)',
    notes: 'Quản lý lịch khởi hành các tour Nhật Bản, Hàn Quốc, Châu Âu',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-01T08:00:00Z'
  }
];

function getLocalStaff(): StaffRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STAFF_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(INITIAL_MOCK_STAFF));
  return INITIAL_MOCK_STAFF;
}

function saveLocalStaff(staff: StaffRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(staff));
  } catch (err) {
    console.warn('Lỗi khi lưu staff vào localStorage:', err);
  }
}

export const staffService = {
  /**
   * Lấy toàn bộ danh sách nhân sự từ Supabase kèm fallback LocalStorage
   */
  async getAllStaff(): Promise<StaffRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: StaffRecord[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            employeeCode: row.employee_code,
            name: row.full_name,
            email: row.email,
            phone: row.phone || '',
            avatarUrl: row.avatar_url,
            gender: row.gender || 'male',
            dateOfBirth: row.date_of_birth,
            identityCard: row.identity_card,
            department: row.department || 'Điều Hành Tour',
            position: row.position || 'Chuyên Viên Tư Vấn',
            role: row.role || 'staff',
            status: row.status || 'active',
            hireDate: row.hire_date,
            address: row.address || '',
            emergencyContact: row.emergency_contact || '',
            notes: row.notes || '',
            joinedDate: row.hire_date ? new Date(row.hire_date).toLocaleDateString('vi-VN') : 'Mới',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          saveLocalStaff(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch staff exception, using local fallback:', err);
      }
    }

    return getLocalStaff();
  },

  /**
   * Tự động sinh mã nhân viên kế tiếp (VD: NV-004)
   */
  async getNextEmployeeCode(): Promise<string> {
    const list = await this.getAllStaff();
    let maxNum = 0;
    list.forEach(s => {
      const match = s.employeeCode?.match(/NV-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `NV-${String(nextNum).padStart(3, '0')}`;
  },

  /**
   * Thêm nhân viên mới
   */
  async createStaff(
    payload: Omit<StaffRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; data?: StaffRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const newStaffRecord: StaffRecord = {
        ...payload,
        id: `staff-${Date.now()}`,
        joinedDate: payload.hireDate ? new Date(payload.hireDate).toLocaleDateString('vi-VN') : 'Hôm nay',
        createdAt: now,
        updatedAt: now
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('staff')
            .insert({
              employee_code: payload.employeeCode,
              full_name: payload.name,
              email: payload.email.trim(),
              phone: payload.phone.trim(),
              avatar_url: payload.avatarUrl,
              gender: payload.gender || 'male',
              date_of_birth: payload.dateOfBirth || null,
              identity_card: payload.identityCard || null,
              department: payload.department,
              position: payload.position,
              role: payload.role,
              status: payload.status,
              hire_date: payload.hireDate || new Date().toISOString().slice(0, 10),
              address: payload.address || null,
              emergency_contact: payload.emergencyContact || null,
              notes: payload.notes || null,
              created_at: now,
              updated_at: now
            })
            .select()
            .single();

          if (!error && data) {
            newStaffRecord.id = data.id;
          } else if (error) {
            console.warn('Lỗi Supabase khi thêm nhân viên, dùng fallback:', error.message);
          }
        } catch (e) {
          console.warn('Supabase exception khi thêm nhân sự:', e);
        }
      }

      // Cập nhật LocalStorage
      const localList = getLocalStaff();
      const updatedList = [...localList, newStaffRecord];
      saveLocalStaff(updatedList);

      AppLogger.info('Thêm nhân viên mới thành công', {
        action: 'CREATE_STAFF',
        employeeCode: payload.employeeCode,
        name: payload.name,
        email: payload.email,
        role: payload.role
      });

      return { success: true, data: newStaffRecord };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Có lỗi xảy ra khi tạo nhân viên mới' };
    }
  },

  /**
   * Cập nhật thông tin nhân viên
   */
  async updateStaff(
    id: string,
    updates: Partial<StaffRecord>
  ): Promise<{ success: boolean; data?: StaffRecord; error?: string }> {
    try {
      const now = new Date().toISOString();

      if (isSupabaseConfigured && supabase) {
        try {
          const dbPayload: any = { updated_at: now };
          if (updates.name !== undefined) dbPayload.full_name = updates.name;
          if (updates.email !== undefined) dbPayload.email = updates.email;
          if (updates.phone !== undefined) dbPayload.phone = updates.phone;
          if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
          if (updates.gender !== undefined) dbPayload.gender = updates.gender;
          if (updates.dateOfBirth !== undefined) dbPayload.date_of_birth = updates.dateOfBirth;
          if (updates.identityCard !== undefined) dbPayload.identity_card = updates.identityCard;
          if (updates.department !== undefined) dbPayload.department = updates.department;
          if (updates.position !== undefined) dbPayload.position = updates.position;
          if (updates.role !== undefined) dbPayload.role = updates.role;
          if (updates.status !== undefined) dbPayload.status = updates.status;
          if (updates.hireDate !== undefined) dbPayload.hire_date = updates.hireDate;
          if (updates.address !== undefined) dbPayload.address = updates.address;
          if (updates.emergencyContact !== undefined) dbPayload.emergency_contact = updates.emergencyContact;
          if (updates.notes !== undefined) dbPayload.notes = updates.notes;

          const { error } = await supabase
            .from('staff')
            .update(dbPayload)
            .or(`id.eq.${id},email.eq.${updates.email}`);

          if (error) {
            console.warn('Lỗi Supabase khi sửa nhân sự:', error.message);
          }
        } catch (e) {
          console.warn('Supabase exception khi sửa nhân viên:', e);
        }
      }

      // Cập nhật LocalStorage
      const localList = getLocalStaff();
      let updatedRecord: StaffRecord | undefined;
      const updatedList = localList.map(s => {
        if (s.id === id || (updates.email && s.email.toLowerCase() === updates.email.toLowerCase())) {
          updatedRecord = { ...s, ...updates, updatedAt: now };
          return updatedRecord;
        }
        return s;
      });
      saveLocalStaff(updatedList);

      return { success: true, data: updatedRecord };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Có lỗi xảy ra khi cập nhật nhân viên' };
    }
  },

  /**
   * Đổi quyền vai trò của nhân viên
   */
  async updateStaffRole(id: string, newRole: 'staff' | 'admin' | 'super_admin'): Promise<{ success: boolean; error?: string }> {
    return this.updateStaff(id, { role: newRole });
  },

  /**
   * Khóa / mở khóa hoặc cập nhật trạng thái làm việc
   */
  async updateStaffStatus(id: string, newStatus: 'active' | 'banned' | 'resigned'): Promise<{ success: boolean; error?: string }> {
    return this.updateStaff(id, { status: newStatus });
  },

  /**
   * Xóa nhân viên khỏi hệ thống (Chỉ Super Admin)
   */
  async deleteStaff(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', id);

          if (error) {
            console.warn('Lỗi Supabase khi xóa nhân viên:', error.message);
          }
        } catch (e) {
          console.warn('Supabase delete staff exception:', e);
        }
      }

      const localList = getLocalStaff();
      const updatedList = localList.filter(s => s.id !== id);
      saveLocalStaff(updatedList);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Có lỗi khi xóa nhân viên' };
    }
  }
};
