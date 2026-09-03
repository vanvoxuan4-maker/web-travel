import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

// Initialize Supabase Client (Only if configured, otherwise create dummy client)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

/**
 * Bọc Promise bất kỳ bằng thời gian chờ tối đa (Timeout Guard)
 * Giúp chống treo ứng dụng khi mạng chập chờn hoặc API bị nghẽn
 * @param promise Tác vụ bất đồng bộ
 * @param timeoutMs Thời gian chờ tối đa (mặc định 8000ms)
 * @param errorMessage Thông điệp lỗi khi quá thời gian
 */
export async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  timeoutMs = 8000,
  errorMessage = 'Yêu cầu kết nối máy chủ quá thời gian chờ (Gateway Timeout)'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}


