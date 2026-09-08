/**
 * Form Validation & Input Sanitization Utilities for WebTravel
 * Chuẩn hóa dữ liệu đầu vào & kiểm tra định dạng thời gian thực
 */

// Danh sách các đầu số hợp lệ của các nhà mạng viễn thông Việt Nam (Viettel, VinaPhone, MobiFone, Vietnamobile, Gmobile, Itelecom, Wintel)
// 032-039, 052, 056, 058, 059, 070, 076-079, 081-089, 090-099
export const VN_PHONE_PREFIX_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-9])/;
export const VN_PHONE_FULL_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-9])\d{7}$/;

/**
 * Lọc bỏ ngay lập tức mọi ký tự chữ cái, ký tự đặc biệt và khoảng trắng,
 * chỉ giữ lại chữ số 0-9 và giới hạn tối đa 10 chữ số.
 */
export function sanitizePhone(input: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '').slice(0, 10);
}

export interface PhoneValidationResult {
  isValid: boolean;
  error: string | null;
  length: number;
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại Việt Nam
 */
export function validatePhone(phone: string): PhoneValidationResult {
  const clean = sanitizePhone(phone);

  if (!clean) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số điện thoại liên hệ.',
      length: 0
    };
  }

  if (!clean.startsWith('0')) {
    return {
      isValid: false,
      error: 'Số điện thoại phải bắt đầu bằng số 0.',
      length: clean.length
    };
  }

  if (clean.length >= 3 && !VN_PHONE_PREFIX_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Đầu số không thuộc các nhà mạng hợp lệ tại Việt Nam (03x, 05x, 07x, 08x, 09x).',
      length: clean.length
    };
  }

  if (clean.length < 10) {
    return {
      isValid: false,
      error: `Số điện thoại phải có đúng 10 chữ số (hiện có: ${clean.length}/10).`,
      length: clean.length
    };
  }

  if (!VN_PHONE_FULL_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Số điện thoại không đúng định dạng chuẩn 10 số của Việt Nam.',
      length: clean.length
    };
  }

  return {
    isValid: true,
    error: null,
    length: clean.length
  };
}

/**
 * Kiểm tra định dạng Email chuẩn
 */
export function validateEmail(email: string): { isValid: boolean; error: string | null } {
  const clean = email.trim();
  if (!clean) {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Địa chỉ email không đúng định dạng (ví dụ: name@example.com).' };
  }

  return { isValid: true, error: null };
}

/**
 * Dịch và chuẩn hóa thông báo lỗi từ Supabase Auth sang tiếng Việt thân thiện
 */
export function translateAuthError(errorMessage?: string | null): string {
  if (!errorMessage) {
    return 'Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.';
  }

  const msg = errorMessage.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.';
  }

  if (msg.includes('user already registered') || msg.includes('user already exists')) {
    return 'Địa chỉ email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác.';
  }

  if (msg.includes('password should be at least 6 characters') || msg.includes('weak password')) {
    return 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) để xác nhận.';
  }

  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Bạn đã thực hiện thao tác quá nhiều lần. Vui lòng đợi 1-2 phút rồi thử lại.';
  }

  if (msg.includes('user not found')) {
    return 'Không tìm thấy tài khoản với địa chỉ email này trên hệ thống.';
  }

  if (msg.includes('signup requires a valid password')) {
    return 'Vui lòng nhập mật khẩu hợp lệ cho tài khoản.';
  }

  if (msg.includes('network error') || msg.includes('failed to fetch')) {
    return 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng Internet của bạn.';
  }

  return errorMessage;
}
