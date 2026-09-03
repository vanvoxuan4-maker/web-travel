/**
 * WebTravel Lightweight Structured Logger & Trace Tracker
 * Cung cấp giải pháp ghi log có cấu trúc và truy vết lỗi (Correlation ID / Trace ID)
 * Tự động che dữ liệu nhạy cảm (Password, Token, OTP) và tối ưu hiệu năng.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  traceId?: string;
  action?: string;
  userId?: string;
  bookingCode?: string;
  tourId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'secretkey',
  'otp',
  'cardnumber',
  'cvv',
  'creditcard',
  'pin'
]);

/**
 * Tự động che dữ liệu nhạy cảm trước khi log
 */
function sanitizeData<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '******';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export class AppLogger {
  private static isProduction = import.meta.env?.PROD ?? false;

  /**
   * Sinh mã Trace ID / Correlation ID độc nhất cho mỗi phiên giao dịch/yêu cầu
   * @param prefix Tiền tố gợi nhớ (VD: 'WT-BOOK', 'WT-PAY', 'WT-ERR')
   */
  static generateTraceId(prefix = 'WT'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Ghi log cấp độ DEBUG (Tự động ẩn trên Production)
   */
  static debug(message: string, context: LogContext = {}) {
    if (this.isProduction) return;
    this.output('DEBUG', message, context);
  }

  /**
   * Ghi log cấp độ INFO (Sự kiện thành công, Đặt tour, Thanh toán)
   */
  static info(message: string, context: LogContext = {}) {
    this.output('INFO', message, context);
  }

  /**
   * Ghi log cấp độ WARN (Cảnh báo tiềm ẩn, Fallback, Hết hạn)
   */
  static warn(message: string, context: LogContext = {}) {
    this.output('WARN', message, context);
  }

  /**
   * Ghi log cấp độ ERROR (Bắt lỗi, Exception, Thất bại)
   */
  static error(message: string, error?: unknown, context: LogContext = {}) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;

    this.output('ERROR', message, {
      ...context,
      error: errorDetails
    });
  }

  /**
   * Định dạng xuất log ra Console chuẩn JSON/Format
   */
  private static output(level: LogLevel, message: string, context: LogContext) {
    const sanitized = sanitizeData(context) as LogContext;
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: context.traceId || context.bookingCode || undefined,
      ...sanitized
    };

    if (level === 'ERROR') {
      console.error(`[${level}] ${payload.timestamp} [${payload.traceId || 'GLOBAL'}]: ${message}`, payload);
    } else if (level === 'WARN') {
      console.warn(`[${level}] ${payload.timestamp} [${payload.traceId || 'GLOBAL'}]: ${message}`, payload);
    } else {
      console.log(`[${level}] ${payload.timestamp} [${payload.traceId || 'GLOBAL'}]: ${message}`, payload);
    }
  }
}
