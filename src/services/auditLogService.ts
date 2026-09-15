import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuditLogRecord, AuditLogCategory } from '../admin/admin.types';
import { AppLogger } from '../utils/logger';

const LOCAL_LOGS_KEY = 'webtravel_audit_logs';

const INITIAL_MOCK_LOGS: AuditLogRecord[] = [
  {
    id: 'log-001',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    userName: 'Võ Xuân Vạn',
    userEmail: 'vanvoxuan4@gmail.com',
    userRole: 'super_admin',
    action: 'SYSTEM_INIT',
    actionCategory: 'system',
    targetId: 'SYS-2026',
    targetName: 'Hệ Thống WebTravel',
    details: { message: 'Khởi tạo hệ thống quản trị, kích hoạt phân hệ Audit Logs và Quản lý nhân sự' },
    ipAddress: '127.0.0.1',
    userAgent: 'WebTravel Admin Console'
  },
  {
    id: 'log-002',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    userName: 'Nguyễn Thu Trang',
    userEmail: 'trang.nguyen@webtravel.vn',
    userRole: 'admin',
    action: 'CONFIRM_BOOKING',
    actionCategory: 'booking',
    targetId: 'WT-20260914-F776BD',
    targetName: 'Cung Đường Vàng Nhật Bản: Tokyo - Núi Phú Sĩ - Kyoto - Osaka 6N5Đ',
    details: {
      oldStatus: 'pending',
      newStatus: 'confirmed',
      paidAmount: 57800000,
      paymentMethod: 'CREDIT_CARD',
      customer: 'tester (0965712527)'
    },
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-003',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userName: 'Võ Xuân Vạn',
    userEmail: 'vanvoxuan4@gmail.com',
    userRole: 'super_admin',
    action: 'UPDATE_LOYALTY_POINTS',
    actionCategory: 'customer',
    targetId: 'tester (0965712527)',
    targetName: 'Khách hàng tester',
    details: {
      oldPoints: 0,
      newPoints: 578,
      reason: 'Tự động tích lũy điểm thưởng đơn WT-20260914-F776BD (100.000đ = 1 điểm)'
    },
    ipAddress: '127.0.0.1'
  }
];

function getLocalLogs(): AuditLogRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_LOGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(INITIAL_MOCK_LOGS));
  return INITIAL_MOCK_LOGS;
}

function saveLocalLogs(logs: AuditLogRecord[]): void {
  try {
    // Giới hạn lưu tối đa 300 log mới nhất trong LocalStorage để tối ưu dung lượng
    const trimmed = logs.slice(0, 300);
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Lỗi khi lưu audit_logs vào localStorage:', err);
  }
}

export const auditLogService = {
  /**
   * Ghi nhận một hành động vào hệ thống nhật ký (Tự động ghi vào Supabase + LocalStorage)
   */
  async logAction(params: {
    action: string;
    actionCategory?: AuditLogCategory;
    category?: AuditLogCategory | string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    };
  }): Promise<void> {
    try {
      // 1. Xác định thông tin người thực hiện
      let actorId = params.user?.id;
      let actorName = params.user?.name;
      let actorEmail = params.user?.email;
      let actorRole = params.user?.role;

      if (!actorId || !actorEmail) {
        try {
          const localUser = JSON.parse(localStorage.getItem('webtravel_auth_user') || '{}');
          if (localUser.id) {
            if (!actorId) actorId = localUser.id;
            if (!actorName) actorName = localUser.fullName || localUser.email?.split('@')[0];
            if (!actorEmail) actorEmail = localUser.email;
            if (!actorRole) actorRole = localUser.role;
          }
        } catch {}
      }

      const rawCat = (params.actionCategory || params.category || 'system').toLowerCase();
      const validCategories: AuditLogCategory[] = ['booking', 'payment', 'tour', 'staff', 'customer', 'coupon', 'system', 'auth'];
      const resolvedCategory: AuditLogCategory = validCategories.includes(rawCat as any)
        ? (rawCat as AuditLogCategory)
        : rawCat.includes('auth') || rawCat.includes('security')
        ? 'auth'
        : 'system';

      const now = new Date().toISOString();
      const newRecord: AuditLogRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        userId: actorId,
        userName: actorName || 'Hệ Thống WebTravel',
        userEmail: actorEmail || 'system@webtravel.vn',
        userRole: actorRole || 'system',
        action: params.action,
        actionCategory: resolvedCategory,
        targetId: params.targetId,
        targetName: params.targetName,
        details: params.details || {},
        ipAddress: 'Client Web'
      };

      // 2. Ghi vào Supabase audit_logs nếu có cấu hình
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('audit_logs').insert({
            created_at: now,
            user_id: newRecord.userId,
            user_name: newRecord.userName,
            user_email: newRecord.userEmail,
            user_role: newRecord.userRole,
            action: newRecord.action,
            action_category: newRecord.actionCategory,
            target_id: newRecord.targetId,
            target_name: newRecord.targetName,
            details: newRecord.details,
            ip_address: newRecord.ipAddress,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
          });
        } catch (dbErr) {
          console.warn('Không thể insert audit log vào Supabase:', dbErr);
        }
      }

      // 3. Luôn lưu vào LocalStorage cache
      const currentLogs = getLocalLogs();
      const updatedLogs = [newRecord, ...currentLogs];
      saveLocalLogs(updatedLogs);

      // 4. Phát sự kiện toàn cục để tab Nhật Ký cập nhật tức thì
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('webtravel:audit_log_created', {
          detail: newRecord
        }));
      }

      AppLogger.info(`[AUDIT] ${newRecord.action} - ${newRecord.targetName || newRecord.targetId || ''}`, {
        action: newRecord.action,
        category: newRecord.actionCategory,
        actor: newRecord.userEmail
      });
    } catch (err) {
      console.warn('Lỗi khi ghi nhật ký audit log:', err);
    }
  },

  /**
   * Lấy danh sách nhật ký có bộ lọc
   */
  async getAuditLogs(filters?: {
    category?: string;
    role?: string;
    search?: string;
  }): Promise<AuditLogRecord[]> {
    let logs: AuditLogRecord[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (filters?.category && filters.category !== 'all') {
          query = query.eq('action_category', filters.category);
        }
        if (filters?.role && filters.role !== 'all') {
          query = query.eq('user_role', filters.role);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          logs = data.map((row: any) => ({
            id: row.id,
            createdAt: row.created_at,
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            userRole: row.user_role,
            action: row.action,
            actionCategory: row.action_category as AuditLogCategory,
            targetId: row.target_id,
            targetName: row.target_name,
            details: row.details || {},
            ipAddress: row.ip_address,
            userAgent: row.user_agent
          }));

          saveLocalLogs(logs);
          return logs;
        }
      } catch (err) {
        console.warn('Supabase fetch audit logs error, using local fallback:', err);
      }
    }

    logs = getLocalLogs();

    if (filters?.category && filters.category !== 'all') {
      logs = logs.filter(l => l.actionCategory === filters.category);
    }
    if (filters?.role && filters.role !== 'all') {
      logs = logs.filter(l => l.userRole === filters.role);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(l =>
        l.action.toLowerCase().includes(q) ||
        (l.userName && l.userName.toLowerCase().includes(q)) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
        (l.targetId && l.targetId.toLowerCase().includes(q)) ||
        (l.targetName && l.targetName.toLowerCase().includes(q))
      );
    }

    return logs;
  },

  /**
   * Xuất danh sách nhật ký ra file CSV chuẩn UTF-8
   */
  exportLogsToCSV(logs: AuditLogRecord[]): void {
    if (!logs || logs.length === 0) {
      alert('Không có dữ liệu nhật ký để xuất file.');
      return;
    }

    const headers = [
      'Thời Gian',
      'Người Thực Hiện',
      'Email',
      'Vai Trò',
      'Hành Động',
      'Phân Loại',
      'Mã Đối Tượng',
      'Tên Đối Tượng',
      'Chi Tiết'
    ];

    const rows = logs.map(l => [
      `"${new Date(l.createdAt).toLocaleString('vi-VN')}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${(l.userEmail || '').replace(/"/g, '""')}"`,
      `"${(l.userRole || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.actionCategory || '').replace(/"/g, '""')}"`,
      `"${(l.targetId || '').replace(/"/g, '""')}"`,
      `"${(l.targetName || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `WebTravel_Audit_Logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
