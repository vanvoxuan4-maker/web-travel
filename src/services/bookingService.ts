import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabaseClient';
import { AppLogger } from '../utils/logger';
import { restoreSeats } from '../utils/inventoryManager';
import { couponService } from './couponService';
import { toIsoDate } from '../utils/formatters';
import { TOURS_DATA } from '../data/toursData';

export type PaymentMethod = 'vietqr' | 'momo' | 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';

export interface BookingPayload {
  id?: string;
  bookingCode: string;
  userId?: string;
  tourId: string;
  tourTitle: string;
  tourImage?: string;
  departureDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  customerNotes?: string;
  adultsCount: number;
  childrenCount: number;
  toddlersCount?: number;
  infantsCount: number;
  singleRoomsCount: number;
  totalAmount: number;
  paidAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  createdAt?: string;
}

/**
 * Single source of truth for booking UI status
 * Synchronized across Admin Portal, Customer Profile, and E-Ticket
 */
export function getBookingUiStatus(booking: {
  bookingStatus?: string;
  paymentStatus?: string;
  paidAmount?: number;
  totalAmount?: number;
}): 'confirmed' | 'deposit' | 'pending' | 'cancelled' {
  const bStatus = booking.bookingStatus?.toLowerCase();
  const pStatus = booking.paymentStatus?.toLowerCase();
  const paid = Number(booking.paidAmount) || 0;
  const total = Number(booking.totalAmount) || 0;

  // 1. Cancelled / Refunded / Failed
  if (bStatus === 'cancelled' || pStatus === 'failed' || pStatus === 'refunded') {
    return 'cancelled';
  }

  // 2. Paid 100% (Confirmed)
  if (pStatus === 'paid' || bStatus === 'completed' || bStatus === 'confirmed') {
    return 'confirmed';
  }

  // 3. Deposit 50% (Partially Paid)
  if (pStatus === 'partially_paid' || bStatus === 'deposit' || (paid > 0 && paid < total)) {
    return 'deposit';
  }

  // 4. Default: Pending verification / Pending payment
  return 'pending';
}

export interface PaymentTransactionRecord {
  id?: string;
  bookingId?: string;
  bookingCode: string;
  transactionCode: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentType?: 'deposit' | 'remaining' | 'full' | 'refund';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  bankName?: string;
  payerName?: string;
  notes?: string;
  paidAt?: string;
  createdAt?: string;
}

const LOCAL_BOOKINGS_KEY = 'webtravel_local_bookings';
const LOCAL_TRANSACTIONS_KEY = 'webtravel_local_transactions';

/**
 * Check if a string is a valid UUID v4 format.
 * Used to prevent PostgreSQL casting errors when querying by booking_code (TEXT)
 * vs id (UUID). Passing a non-UUID string to an id.eq filter causes error 22P02.
 */
const isUuid = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const bookingService = {
  /**
   * Save a new booking to Supabase and fallback/sync to localStorage
   */
  async createBooking(booking: BookingPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    const timestamp = booking.createdAt || new Date().toISOString();
    const payloadWithTime: BookingPayload = {
      ...booking,
      toddlersCount: booking.toddlersCount || 0,
      createdAt: timestamp
    };

    AppLogger.info('Bắt đầu quy trình tạo đơn đặt tour', {
      action: 'BOOKING_CREATE_START',
      bookingCode: booking.bookingCode,
      tourId: booking.tourId,
      totalAmount: booking.totalAmount,
      customerPhone: booking.customerPhone
    });

    // 1. If Supabase is configured, insert to Supabase database
    if (isSupabaseConfigured && supabase) {
      try {
        // Resolve authenticated user ID from active Supabase session to ensure auth.uid() match
        let resolvedUserId = booking.userId;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            resolvedUserId = sessionData.session.user.id;
          }
        } catch (authErr) {
          console.warn('Could not get session user in createBooking:', authErr);
        }

        // Guarantee profile exists in public.profiles to satisfy FK bookings_user_id_fkey
        if (resolvedUserId) {
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', resolvedUserId)
              .maybeSingle();

            if (!prof) {
              await supabase.from('profiles').upsert({
                id: resolvedUserId,
                email: booking.customerEmail || 'customer@webtravel.vn',
                full_name: booking.customerName || 'Khách hàng',
                role: 'customer',
                status: 'active'
              });
            }
          } catch (profErr) {
            console.warn('Ensure profile exists warning:', profErr);
          }
        }

        // Standardize departure_date to ISO YYYY-MM-DD for PostgreSQL DATE compatibility
        const isoDepartureDate = toIsoDate(booking.departureDate);

        // Resolve canonical tourId if slug was passed
        let canonicalTourId = booking.tourId;
        const matchedTour = TOURS_DATA.find(t => t.id === canonicalTourId || t.slug === canonicalTourId);
        if (matchedTour) {
          canonicalTourId = matchedTour.id;
        }

        const { data, error }: any = await withTimeout(
          supabase
            .from('bookings')
            .insert([
              {
                booking_code: booking.bookingCode,
                user_id: resolvedUserId || null,
                tour_id: canonicalTourId,
                tour_title: booking.tourTitle,
                departure_date: isoDepartureDate,
                customer_name: booking.customerName,
                customer_phone: booking.customerPhone,
                customer_email: booking.customerEmail,
                customer_address: booking.customerAddress || '',
                customer_notes: booking.customerNotes || '',
                adults_count: booking.adultsCount,
                children_count: booking.childrenCount,
                toddlers_count: booking.toddlersCount || 0,
                infants_count: booking.infantsCount,
                single_rooms_count: booking.singleRoomsCount,
                total_amount: booking.totalAmount,
                paid_amount: booking.paidAmount || (booking.paymentStatus === 'paid' ? booking.totalAmount : 0),
                coupon_code: booking.couponCode || null,
                payment_method: booking.paymentMethod,
                payment_status: booking.paymentStatus,
                booking_status: booking.bookingStatus,
                created_at: timestamp
              }
            ])
            .select()
            .single(),
          8000,
          'Supabase booking creation timed out after 8s'
        );

        if (error) {
          // Kiểm tra lỗi không đủ ghế từ trigger DB (Phase 1)
          const isSeatError = (error.message || '').includes('INSUFFICIENT_SEATS');
          const isDateError = (error.message || '').includes('date/time field value out of range');
          const userMsg = isSeatError
            ? 'Rất tiếc! Số ghế còn lại không đủ cho yêu cầu của bạn. Vui lòng chọn ngày khác hoặc giảm số lượng khách.'
            : isDateError
            ? 'Ngày khởi hành không hợp lệ. Vui lòng chọn lại ngày trên lịch.'
            : `Không thể tạo đơn đặt tour: ${error.message}. Vui lòng thử lại.`;
          AppLogger.warn('Supabase booking insert trả về lỗi', {
            action: 'BOOKING_CREATE_SUPABASE_ERROR',
            bookingCode: booking.bookingCode,
            error: error.message
          });
          // Phase 3: Không lưu localStorage khi Supabase lỗi — tránh tạo "đơn ma"
          return { success: false, error: userMsg };
        }

        const savedPayload: BookingPayload = {
          ...payloadWithTime,
          id: data.id,
          userId: resolvedUserId,
          tourId: canonicalTourId,
          departureDate: isoDepartureDate
        };
        this.saveToLocalStorage(savedPayload);


        // Tự động ghi nhận giao dịch vào payment_transactions trên Supabase nếu đơn có thanh toán/cọc ban đầu
        const initialPaid = Number(booking.paidAmount) || (booking.paymentStatus === 'paid' ? Number(booking.totalAmount) : 0);
        if (initialPaid > 0 && data?.id) {
          const txCode = `TXN-${booking.bookingCode}-${Date.now().toString(36).toUpperCase()}`;
          const isDeposit = booking.paymentStatus === 'partially_paid' || (initialPaid < Number(booking.totalAmount));
          try {
            const { error: txErr } = await supabase
              .from('payment_transactions')
              .insert([{
                booking_id: data.id,
                booking_code: booking.bookingCode,
                transaction_code: txCode,
                amount: initialPaid,
                currency: 'VND',
                payment_method: booking.paymentMethod || 'vietqr',
                payment_type: isDeposit ? 'deposit' : 'full',
                status: 'success',
                notes: `Thanh toán ban đầu khi tạo đơn ${booking.bookingCode}`,
                paid_at: timestamp
              }]);
            if (txErr) console.warn('Supabase insert initial payment transaction warning:', txErr);
          } catch (txEx) {
            console.warn('Supabase insert initial payment transaction exception:', txEx);
          }
        }

        AppLogger.info('Tạo đơn đặt tour thành công vào Supabase', {
          action: 'BOOKING_CREATE_SUCCESS',
          bookingCode: booking.bookingCode,
          bookingId: data.id
        });

        return { success: true, data: savedPayload };
      } catch (err: any) {
        AppLogger.error('Ngoại lệ khi lưu đơn đặt tour vào Supabase', err, {
          action: 'BOOKING_CREATE_EXCEPTION',
          bookingCode: booking.bookingCode
        });
        // Phase 3: Không lưu localStorage khi Supabase lỗi — tránh tạo "đơn ma".
        // Nếu lỗi là do thiếu ghế (trigger exception), trả thông báo thân thiện.
        const isSeatError = (err?.message || '').includes('INSUFFICIENT_SEATS');
        return {
          success: false,
          error: isSeatError
            ? 'Rất tiếc! Số ghế còn lại không đủ cho yêu cầu của bạn. Vui lòng chọn ngày khác hoặc giảm số lượng khách.'
            : 'Máy chủ đang gián đoạn hoặc quá tải. Vui lòng thử lại sau ít phút.'
        };
      }
    }

    // 2. Fallback to LocalStorage (chế độ demo / Supabase chưa kết nối)
    this.saveToLocalStorage(payloadWithTime);

    AppLogger.info('Lưu đơn đặt tour vào LocalStorage (chế độ demo/offline)', {
      action: 'BOOKING_CREATE_LOCAL_SUCCESS',
      bookingCode: booking.bookingCode
    });
    return { success: true, data: payloadWithTime };
  },

  /**
   * Fetch a single booking by bookingCode
   */
  async getBookingByCode(bookingCode: string): Promise<BookingPayload | null> {
    const code = bookingCode.trim().toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_code', code)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            bookingCode: data.booking_code,
            userId: data.user_id,
            tourId: data.tour_id,
            tourTitle: data.tour_title,
            departureDate: data.departure_date,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            customerAddress: data.customer_address,
            customerNotes: data.customer_notes,
            adultsCount: data.adults_count || 1,
            childrenCount: data.children_count || 0,
            toddlersCount: data.toddlers_count || 0,
            infantsCount: data.infants_count || 0,
            singleRoomsCount: data.single_rooms_count || 0,
            totalAmount: data.total_amount || 0,
            paidAmount: data.paid_amount || 0,
            couponCode: data.coupon_code,
            couponDiscount: data.coupon_discount || 0,
            paymentMethod: data.payment_method || 'vietqr',
            paymentStatus: data.payment_status || 'pending',
            bookingStatus: data.booking_status || 'confirmed',
            createdAt: data.created_at
          };
        }
      } catch (err) {
        console.warn('Error fetching booking by code from Supabase:', err);
      }
    }

    // Search local storage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const found = localBookings.find(b => b.bookingCode.toUpperCase() === code);
      return found || null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch all bookings for a specific user (by userId, email, or phone)
   */
  async getUserBookings(userId: string, email?: string, phone?: string): Promise<BookingPayload[]> {
    const list: BookingPayload[] = [];
    const seenCodes = new Set<string>();

    // 1. Fetch from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('bookings').select('*');
        
        const conditions: string[] = [];
        if (userId && isUuid(userId)) conditions.push(`user_id.eq.${userId}`);
        if (email && email.trim()) conditions.push(`customer_email.eq.${email.trim()}`);
        if (phone && phone.trim()) conditions.push(`customer_phone.eq.${phone.trim()}`);

        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          data.forEach((row: any) => {
            const code = row.booking_code;
            if (!seenCodes.has(code)) {
              seenCodes.add(code);
              list.push({
                id: row.id,
                bookingCode: row.booking_code,
                userId: row.user_id,
                tourId: row.tour_id,
                tourTitle: row.tour_title,
                departureDate: row.departure_date,
                customerName: row.customer_name,
                customerPhone: row.customer_phone,
                customerEmail: row.customer_email,
                customerAddress: row.customer_address,
                customerNotes: row.customer_notes,
                adultsCount: row.adults_count || 1,
                childrenCount: row.children_count || 0,
                toddlersCount: row.toddlers_count || 0,
                infantsCount: row.infants_count || 0,
                singleRoomsCount: row.single_rooms_count || 0,
                totalAmount: row.total_amount || 0,
                paidAmount: row.paid_amount || 0,
                couponCode: row.coupon_code,
                couponDiscount: row.coupon_discount || 0,
                paymentMethod: row.payment_method || 'vietqr',
                paymentStatus: row.payment_status || 'pending',
                bookingStatus: row.booking_status || 'pending',
                createdAt: row.created_at
              });
            }
          });

          // Sync fresh status to LocalStorage cache so other tabs / local reads stay up to date
          try {
            const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
            const updatedLocal = localBookings.map(lb => {
              const fresh = data.find((d: any) => d.booking_code === lb.bookingCode || d.id === lb.id);
              if (fresh) {
                return {
                  ...lb,
                  bookingStatus: fresh.booking_status,
                  paymentStatus: fresh.payment_status,
                  paidAmount: fresh.paid_amount,
                  totalAmount: fresh.total_amount
                };
              }
              return lb;
            });
            localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedLocal));
          } catch (e) {
            console.warn('Could not sync fresh Supabase bookings to localStorage:', e);
          }
        }
      } catch (err) {
        console.warn('Error querying user bookings from Supabase:', err);
      }
    }

    // 2. Merge with LocalStorage bookings
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      localBookings.forEach(lb => {
        const matchesUser = (userId && lb.userId === userId) ||
          (email && lb.customerEmail?.toLowerCase() === email.toLowerCase()) ||
          (phone && lb.customerPhone === phone);

        if (matchesUser && !seenCodes.has(lb.bookingCode)) {
          seenCodes.add(lb.bookingCode);
          list.push(lb);
        }
      });
    } catch (e) {
      console.warn('Could not read local bookings:', e);
    }

    // Sort latest first
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  /**
   * Update payment status and record transaction
   */
  async updatePaymentStatus(
    bookingCode: string,
    paymentStatus: PaymentStatus,
    amount?: number,
    paymentMethod?: PaymentMethod,
    transactionCode?: string
  ): Promise<{ success: boolean; error?: string }> {
    const code = bookingCode.trim().toUpperCase();
    const txCode = transactionCode || `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch booking to get ID and total amount
        let findQuery = supabase
          .from('bookings')
          .select('id, total_amount, payment_method, coupon_code, user_id, customer_name, customer_email, customer_phone');

        if (isUuid(code)) {
          findQuery = findQuery.or(`booking_code.eq.${code},id.eq.${code}`);
        } else {
          findQuery = findQuery.eq('booking_code', code);
        }

        const { data: bookingData } = await findQuery.maybeSingle();

        if (bookingData) {
          const totalAmt = Number(bookingData.total_amount) || 0;
          const paidAmt = paymentStatus === 'paid' ? totalAmt : paymentStatus === 'partially_paid' ? (amount || Math.round(totalAmt * 0.5)) : 0;
          const finalAmount = amount || paidAmt || totalAmt;
          const method = paymentMethod || bookingData.payment_method || 'vietqr';

          // Update booking with select() verification
          let updateQuery = supabase
            .from('bookings')
            .update({
              payment_status: paymentStatus,
              paid_amount: paidAmt
            });

          if (bookingData.id) {
            updateQuery = updateQuery.eq('id', bookingData.id);
          } else {
            updateQuery = updateQuery.eq('booking_code', code);
          }

          const { error: updateErr } = await updateQuery.select('id, booking_code');

          if (updateErr) {
            console.error('Supabase update payment_status error:', updateErr);
            return { success: false, error: updateErr.message || 'Lỗi cập nhật thanh toán trên database' };
          }

          // If paid or partially paid, create payment transaction record
          if (paymentStatus === 'paid' || paymentStatus === 'partially_paid') {
            const { error: txErr } = await supabase
              .from('payment_transactions')
              .insert([
                {
                  booking_id: bookingData.id,
                  booking_code: code,
                  transaction_code: txCode,
                  amount: finalAmount,
                  currency: 'VND',
                  payment_method: method,
                  payment_type: paymentStatus === 'paid' ? 'full' : 'deposit',
                  status: 'success',
                  notes: `Xác nhận thanh toán đơn ${code} qua ${method.toUpperCase()}`
                }
              ]);
            if (txErr) console.warn('Supabase insert payment transaction warning:', txErr);
          }

          // Phase 1: Ghi nhận coupon usage CHỈ khi đã xác nhận thanh toán thành công
          if (
            (paymentStatus === 'paid' || paymentStatus === 'partially_paid') &&
            bookingData.coupon_code
          ) {
            couponService.validateCoupon(bookingData.coupon_code, totalAmt).then(res => {
              const discount = res.valid ? res.discountAmount : 0;
              couponService.recordCouponUsage({
                couponCode: bookingData.coupon_code!,
                userId: bookingData.user_id || null,
                bookingId: bookingData.id,
                bookingCode: code,
                discountApplied: discount,
                customerName: bookingData.customer_name || '',
                customerEmail: bookingData.customer_email || '',
                customerPhone: bookingData.customer_phone || ''
              }).catch(err => console.warn('Could not record coupon usage on payment:', err));
            }).catch(() => {});
          }
        }
      } catch (err: any) {
        console.error('Supabase update payment status error:', err);
      }
    }

    // 2. Update in LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const updated = localBookings.map(b => {
        if (b.bookingCode.toUpperCase() === code) {
          const totalAmt = Number(b.totalAmount) || 0;
          const paidAmt = paymentStatus === 'paid' ? totalAmt : paymentStatus === 'partially_paid' ? (amount || Math.round(totalAmt * 0.5)) : 0;
          return {
            ...b,
            paymentStatus,
            paidAmount: paidAmt
          };
        }
        return b;
      });
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));

      // Record local transaction
      const localTransactions: PaymentTransactionRecord[] = JSON.parse(localStorage.getItem(LOCAL_TRANSACTIONS_KEY) || '[]');
      localTransactions.push({
        bookingCode: code,
        transactionCode: txCode,
        amount: amount || 0,
        paymentMethod: paymentMethod || 'vietqr',
        status: 'success',
        paidAt: new Date().toISOString()
      });
      localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(localTransactions));
    } catch (e) {
      console.warn('Could not update payment status in localStorage:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webtravel_booking_updated', {
        detail: { bookingCode: code, paymentStatus }
      }));
    }

    return { success: true };
  },

  /**
   * Update full booking and payment status (from Admin or Customer action)
   * Synchronizes both Supabase and LocalStorage, and dispatches an event
   */
  async updateBookingAdminStatus(
    bookingCode: string,
    newUiStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled'
  ): Promise<{ success: boolean; error?: string }> {
    const code = bookingCode.trim().toUpperCase();
    const paymentStatus: PaymentStatus = newUiStatus === 'confirmed' ? 'paid' : newUiStatus === 'deposit' ? 'partially_paid' : newUiStatus === 'cancelled' ? 'refunded' : 'pending';
    const bookingStatus: BookingStatus = newUiStatus === 'confirmed' ? 'confirmed' : newUiStatus === 'cancelled' ? 'cancelled' : 'pending';

    // 1. Update Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch booking to get total_amount for calculating paidAmount.
        // IMPORTANT: Never use .or(`id.eq.${nonUuidString}`) — PostgreSQL will
        // throw error 22P02 (invalid input syntax for type uuid) and silently
        // fail, causing the status to appear changed in UI but reset on reload.
        let fetchQuery = supabase
          .from('bookings')
          .select('id, total_amount, paid_amount, payment_method, coupon_code, user_id, customer_name, customer_email, customer_phone');

        if (isUuid(code)) {
          fetchQuery = fetchQuery.or(`booking_code.eq.${code},id.eq.${code}`);
        } else {
          fetchQuery = fetchQuery.eq('booking_code', code);
        }

        const { data: bookingData, error: fetchErr } = await fetchQuery.maybeSingle();

        if (fetchErr) {
          console.error('Supabase updateBookingAdminStatus fetch error:', fetchErr);
        }

        const totalAmt = Number(bookingData?.total_amount) || 0;
        const currentPaid = Number(bookingData?.paid_amount) || 0;
        const paidAmt = newUiStatus === 'confirmed' ? totalAmt : newUiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0;

        let updateQuery = supabase
          .from('bookings')
          .update({
            booking_status: bookingStatus,
            payment_status: paymentStatus,
            paid_amount: paidAmt
          });

        if (bookingData?.id) {
          updateQuery = updateQuery.eq('id', bookingData.id);
        } else if (isUuid(code)) {
          updateQuery = updateQuery.or(`booking_code.eq.${code},id.eq.${code}`);
        } else {
          updateQuery = updateQuery.eq('booking_code', code);
        }

        const { data: updatedRows, error: updateErr } = await updateQuery.select('id, booking_code');

        if (updateErr) {
          console.error('Supabase updateBookingAdminStatus update error:', updateErr);
          return { success: false, error: updateErr.message || 'Lỗi cập nhật trạng thái đơn hàng trên database' };
        }

        if (updatedRows && updatedRows.length === 0) {
          console.warn('Supabase updateBookingAdminStatus: 0 rows updated for', code);
        }
          AppLogger.info('Cập nhật trạng thái đơn hàng thành công trên Supabase', {
            action: 'BOOKING_STATUS_UPDATE',
            bookingCode: code,
            newUiStatus,
            bookingStatus,
            paymentStatus,
            paidAmt
          });

          // Ghi nhận transaction vào bảng payment_transactions khi Admin xác nhận thanh toán
          if (bookingData?.id && (newUiStatus === 'confirmed' || newUiStatus === 'deposit')) {
            const isDeposit = newUiStatus === 'deposit';
            const targetPaid = isDeposit ? Math.round(totalAmt * 0.5) : totalAmt;
            const diffAmount = Math.max(0, targetPaid - currentPaid);
            const recordAmount = diffAmount > 0 ? diffAmount : (currentPaid === 0 ? targetPaid : 0);

            if (recordAmount > 0) {
              const txCode = `TXN-ADM-${code}-${Date.now().toString(36).toUpperCase()}`;
              const txType = isDeposit ? 'deposit' : (currentPaid > 0 ? 'remaining' : 'full');
              const method = (bookingData.payment_method || 'vietqr') as PaymentMethod;
              const noteText = isDeposit
                ? 'Admin duyệt đặt cọc 50%'
                : (currentPaid > 0 ? 'Admin duyệt thanh toán phần còn lại' : 'Admin duyệt thanh toán 100%');

              try {
                const { error: txErr } = await supabase
                  .from('payment_transactions')
                  .insert([{
                    booking_id: bookingData.id,
                    booking_code: code,
                    transaction_code: txCode,
                    amount: recordAmount,
                    currency: 'VND',
                    payment_method: method,
                    payment_type: txType,
                    status: 'success',
                    notes: noteText,
                    paid_at: new Date().toISOString()
                  }]);
                if (txErr) console.warn('Supabase insert payment transaction warning:', txErr);
              } catch (txEx) {
                console.warn('Supabase insert payment transaction exception:', txEx);
              }
            }
          }

          // Broadcast realtime event across all tabs, devices and browsers
          try {
            const realtimeChannel = supabase.channel('webtravel_realtime_bookings');
            realtimeChannel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                realtimeChannel.send({
                  type: 'broadcast',
                  event: 'booking_updated',
                  payload: {
                    bookingCode: code,
                    bookingId: bookingData?.id || code,
                    newUiStatus,
                    bookingStatus,
                    paymentStatus,
                    paidAmount: paidAmt,
                    timestamp: Date.now()
                  }
                }).then(() => {
                  setTimeout(() => { supabase?.removeChannel(realtimeChannel); }, 1200);
                });
              }
            });
          } catch (broadcastErr) {
            console.warn('Realtime broadcast error:', broadcastErr);
          }

          // Ghi nhận hoặc hoàn trả coupon_usages khi Admin duyệt/hủy đơn
          if ((newUiStatus === 'confirmed' || newUiStatus === 'deposit') && bookingData?.coupon_code) {
            couponService.validateCoupon(bookingData.coupon_code, totalAmt, bookingData.user_id).then(res => {
              const discount = res.valid ? res.discountAmount : 0;
              couponService.recordCouponUsage({
                couponCode: bookingData.coupon_code,
                userId: bookingData.user_id || null,
                bookingId: bookingData.id,
                bookingCode: code,
                discountApplied: discount,
                customerName: bookingData.customer_name || '',
                customerEmail: bookingData.customer_email || '',
                customerPhone: bookingData.customer_phone || ''
              }).catch(err => console.warn('Could not record coupon usage on admin status update:', err));
            }).catch(() => {});
          } else if (newUiStatus === 'cancelled' && bookingData?.coupon_code) {
            couponService.refundCouponUsage(bookingData.coupon_code, bookingData.id)
              .catch(err => console.warn('Could not refund coupon usage on admin cancel:', err));
          }
      } catch (err: any) {
        console.error('Supabase updateBookingAdminStatus error:', err);
      }
    }

    // 2. Update LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const targetBooking = localBookings.find(b => b.bookingCode?.toUpperCase() === code || b.id === bookingCode);
      if (newUiStatus === 'cancelled' && targetBooking?.couponCode) {
        couponService.refundCouponUsage(targetBooking.couponCode, targetBooking.id || targetBooking.bookingCode)
          .catch(e => console.warn('Could not refund coupon usage:', e));
      } else if ((newUiStatus === 'confirmed' || newUiStatus === 'deposit') && targetBooking?.couponCode) {
        couponService.recordCouponUsage({
          couponCode: targetBooking.couponCode,
          userId: targetBooking.userId || null,
          bookingId: targetBooking.id,
          bookingCode: code,
          discountApplied: targetBooking.couponDiscount || 0,
          customerName: targetBooking.customerName || '',
          customerEmail: targetBooking.customerEmail || '',
          customerPhone: targetBooking.customerPhone || ''
        }).catch(e => console.warn('Could not record coupon usage locally:', e));
      }

      // Ghi nhận transaction vào LocalStorage khi Admin duyệt
      if (newUiStatus === 'confirmed' || newUiStatus === 'deposit') {
        const localTransactions: PaymentTransactionRecord[] = JSON.parse(
          localStorage.getItem(LOCAL_TRANSACTIONS_KEY) || '[]'
        );
        const totalAmt = Number(targetBooking?.totalAmount) || 0;
        const currentPaid = Number(targetBooking?.paidAmount) || 0;
        const isDeposit = newUiStatus === 'deposit';
        const targetPaid = isDeposit ? Math.round(totalAmt * 0.5) : totalAmt;
        const diffAmount = Math.max(0, targetPaid - currentPaid);
        const recordAmount = diffAmount > 0 ? diffAmount : (currentPaid === 0 ? targetPaid : 0);

        if (recordAmount > 0) {
          const txCode = `TXN-ADM-${code}-${Date.now().toString(36).toUpperCase()}`;
          localTransactions.push({
            bookingId: targetBooking?.id,
            bookingCode: code,
            transactionCode: txCode,
            amount: recordAmount,
            currency: 'VND',
            paymentMethod: (targetBooking?.paymentMethod as PaymentMethod) || 'vietqr',
            paymentType: isDeposit ? 'deposit' : (currentPaid > 0 ? 'remaining' : 'full'),
            status: 'success',
            notes: isDeposit
              ? 'Admin duyệt đặt cọc 50%'
              : (currentPaid > 0 ? 'Admin duyệt thanh toán phần còn lại' : 'Admin duyệt thanh toán 100%'),
            paidAt: new Date().toISOString()
          });
          localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(localTransactions));
        }
      }

      const updated = localBookings.map(b => {
        if (b.bookingCode?.toUpperCase() === code || b.id === bookingCode) {
          const totalAmt = Number(b.totalAmount) || 0;
          const paidAmt = newUiStatus === 'confirmed' ? totalAmt : newUiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0;
          return {
            ...b,
            bookingStatus,
            paymentStatus,
            paidAmount: paidAmt
          };
        }
        return b;
      });
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
      localStorage.setItem('webtravel_last_status_sync', Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage updateBookingAdminStatus error:', e);
    }

    // 3. Dispatch global event for instant reactivity across tabs / pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webtravel_booking_updated', {
        detail: { bookingCode: code, newUiStatus, paymentStatus, bookingStatus }
      }));
    }

    return { success: true };
  },

  /**
   * Cancel an existing booking
   */
  async cancelBooking(bookingCode: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const code = bookingCode.trim().toUpperCase();

    // 1. Update Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        let cancelQuery = supabase
          .from('bookings')
          .update({
            booking_status: 'cancelled',
            payment_status: 'refunded',
            customer_notes: reason ? `[Khách yêu cầu hủy: ${reason}]` : '[Khách yêu cầu hủy]'
          });

        if (isUuid(code)) {
          cancelQuery = cancelQuery.or(`booking_code.eq.${code},id.eq.${code}`);
        } else {
          cancelQuery = cancelQuery.eq('booking_code', code);
        }

        const { error: cancelErr } = await cancelQuery.select('id');

        if (cancelErr) {
          console.error('Supabase cancel booking error:', cancelErr);
          return { success: false, error: cancelErr.message || 'Lỗi hủy đơn hàng trên database' };
        }
      } catch (err: any) {
        console.warn('Failed to update cancel status in Supabase:', err);
        return { success: false, error: err?.message || 'Lỗi kết nối khi hủy đơn hàng' };
      }
    }

    // 2. Update LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const targetBooking = localBookings.find(b => b.bookingCode.toUpperCase() === code);
      if (targetBooking?.couponCode) {
        couponService.refundCouponUsage(targetBooking.couponCode, targetBooking.id || targetBooking.bookingCode)
          .catch(e => console.warn('Could not refund coupon usage on cancel:', e));
      }

      const updated = localBookings.map(b => {
        if (b.bookingCode.toUpperCase() === code) {
          return { 
            ...b, 
            bookingStatus: 'cancelled' as const,
            paymentStatus: 'refunded' as const
          };
        }
        return b;
      });
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update cancel in localStorage:', e);
    }

    // Broadcast realtime cancellation
    try {
      if (isSupabaseConfigured && supabase) {
        const cancelChannel = supabase.channel('webtravel_realtime_bookings');
        cancelChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            cancelChannel.send({
              type: 'broadcast',
              event: 'booking_updated',
              payload: {
                bookingCode: code,
                newUiStatus: 'cancelled',
                bookingStatus: 'cancelled',
                paymentStatus: 'refunded',
                timestamp: Date.now()
              }
            }).then(() => {
              setTimeout(() => { supabase?.removeChannel(cancelChannel); }, 1200);
            });
          }
        });
      }
    } catch (e) {
      console.warn('Realtime cancel broadcast error:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webtravel_booking_updated', {
        detail: { bookingCode: code, newUiStatus: 'cancelled', paymentStatus: 'refunded', bookingStatus: 'cancelled' }
      }));
    }

    return { success: true };
  },

  /**
   * Lookup a booking by code and phone number
   */
  async lookupBooking(bookingCode: string, phone: string): Promise<BookingPayload | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_code', bookingCode.trim().toUpperCase())
          .eq('customer_phone', phone.trim())
          .single();

        if (!error && data) {
          return {
            id: data.id,
            bookingCode: data.booking_code,
            tourId: data.tour_id,
            tourTitle: data.tour_title,
            departureDate: data.departure_date,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            customerAddress: data.customer_address,
            customerNotes: data.customer_notes,
            adultsCount: data.adults_count || 1,
            childrenCount: data.children_count || 0,
            toddlersCount: data.toddlers_count || 0,
            infantsCount: data.infants_count || 0,
            singleRoomsCount: data.single_rooms_count || 0,
            totalAmount: data.total_amount || 0,
            paidAmount: data.paid_amount || 0,
            couponCode: data.coupon_code,
            couponDiscount: data.coupon_discount || 0,
            paymentMethod: data.payment_method || 'vietqr',
            paymentStatus: data.payment_status || 'pending',
            bookingStatus: data.booking_status || 'pending',
            createdAt: data.created_at
          };
        }
      } catch (err) {
        console.warn('Supabase booking lookup fallback:', err);
      }
    }

    // Fallback search in LocalStorage
    try {
      const localBookings = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const found = localBookings.find(
        (b: BookingPayload) => 
          b.bookingCode.toUpperCase() === bookingCode.trim().toUpperCase() && 
          b.customerPhone.trim() === phone.trim()
      );
      return found || null;
    } catch {
      return null;
    }
  },

  /**
   * Internal helper to persist booking in LocalStorage
   */
  saveToLocalStorage(booking: BookingPayload) {
    try {
      const existing: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const updated = [booking, ...existing.filter(b => b.bookingCode !== booking.bookingCode)];
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save booking to localStorage:', e);
    }
  },

  /**
   * Hard delete a booking permanently from database and local storage
   */
  async deleteBooking(bookingIdOrCode: string): Promise<{ success: boolean; error?: string }> {
    const idOrCode = (bookingIdOrCode || '').trim();
    if (!idOrCode) return { success: false, error: 'Mã đơn hàng không hợp lệ' };

    // 1. Find the booking to restore seats if needed
    let bookingToRestore: BookingPayload | null = null;
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      bookingToRestore = localBookings.find(b => 
        (b.id && b.id === idOrCode) || 
        b.bookingCode.toUpperCase() === idOrCode.toUpperCase()
      ) || null;
    } catch (e) {
      console.warn('Error reading local bookings for seat restore:', e);
    }

    // 2. Delete from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        if (!bookingToRestore) {
          // Build query safely to avoid 22P02 UUID cast error
          let seatQuery = supabase
            .from('bookings')
            .select('tour_id, departure_date, adults_count, children_count, toddlers_count');

          if (isUuid(idOrCode)) {
            seatQuery = seatQuery.or(`id.eq.${idOrCode},booking_code.eq.${idOrCode}`);
          } else {
            seatQuery = seatQuery.eq('booking_code', idOrCode);
          }

          const { data } = await seatQuery.maybeSingle();
          if (data) {
            const seats = (data.adults_count || 1) + (data.children_count || 0) + (data.toddlers_count || 0);
            restoreSeats(data.tour_id, data.departure_date, seats);
          }
        }

        // Build delete query safely to avoid 22P02 UUID cast error
        let deleteQuery = supabase.from('bookings').delete();

        if (isUuid(idOrCode)) {
          deleteQuery = deleteQuery.or(`id.eq.${idOrCode},booking_code.eq.${idOrCode}`);
        } else {
          deleteQuery = deleteQuery.eq('booking_code', idOrCode);
        }

        const { error } = await deleteQuery;

        if (error) {
          console.error('Supabase delete booking error:', error);
          return { success: false, error: error.message || 'Lỗi khi xóa đơn hàng khỏi database' };
        }
      } catch (err: any) {
        console.error('Supabase delete booking exception:', err);
        return { success: false, error: err?.message || 'Lỗi kết nối khi xóa đơn hàng' };
      }
    }

    // Restore seats & refund coupon if found
    if (bookingToRestore) {
      if (bookingToRestore.tourId && bookingToRestore.departureDate) {
        const totalSeats = (bookingToRestore.adultsCount || 1) + 
                           (bookingToRestore.childrenCount || 0) + 
                           (bookingToRestore.toddlersCount || 0);
        restoreSeats(bookingToRestore.tourId, bookingToRestore.departureDate, totalSeats);
      }
      if (bookingToRestore.couponCode) {
        couponService.refundCouponUsage(bookingToRestore.couponCode, bookingToRestore.id || bookingToRestore.bookingCode)
          .catch(e => console.warn('Could not refund coupon usage on delete:', e));
      }
    }

    // 3. Delete from LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
      const filtered = localBookings.filter(b => 
        b.id !== idOrCode && 
        b.bookingCode.toUpperCase() !== idOrCode.toUpperCase()
      );
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(filtered));
      localStorage.setItem('webtravel_last_status_sync', Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage delete booking error:', e);
    }

    return { success: true };
  },

  /**
   * Get all payment transactions for a given booking code or id
   * Strictly reads directly from Supabase payment_transactions table (100% database only)
   */
  async getTransactionsByBookingCode(bookingCodeOrId: string): Promise<PaymentTransactionRecord[]> {
    const cleanCode = (bookingCodeOrId || '').trim().toUpperCase();
    if (!cleanCode) return [];

    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('payment_transactions')
        .select('*');

      if (isUuid(cleanCode)) {
        query = query.or(`booking_id.eq.${cleanCode},booking_code.eq.${cleanCode}`);
      } else {
        query = query.eq('booking_code', cleanCode);
      }

      query = query.order('paid_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch payment_transactions error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((t: any) => ({
        id: t.id,
        bookingId: t.booking_id,
        bookingCode: t.booking_code,
        transactionCode: t.transaction_code,
        amount: Number(t.amount) || 0,
        currency: t.currency || 'VND',
        paymentMethod: (t.payment_method || 'vietqr') as PaymentMethod,
        paymentType: t.payment_type || 'full',
        status: t.status || 'success',
        bankName: t.bank_name,
        payerName: t.payer_name,
        notes: (t.notes && !t.notes.includes('Đồng bộ giao dịch thanh toán')) ? t.notes : undefined,
        paidAt: t.paid_at || t.created_at,
        createdAt: t.created_at
      }));
    } catch (err) {
      console.error('Lỗi khi truy vấn payment_transactions từ database:', err);
      return [];
    }
  },

  /**
   * Get all payment transactions across the entire system
   * Strictly reads directly from Supabase payment_transactions table (100% database only)
   */
  async getAllTransactions(): Promise<PaymentTransactionRecord[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('paid_at', { ascending: false });

      if (error) {
        console.error('Supabase getAllTransactions error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((t: any) => ({
        id: t.id,
        bookingId: t.booking_id,
        bookingCode: t.booking_code,
        transactionCode: t.transaction_code,
        amount: Number(t.amount) || 0,
        currency: t.currency || 'VND',
        paymentMethod: (t.payment_method || 'vietqr') as PaymentMethod,
        paymentType: t.payment_type || 'full',
        status: t.status || 'success',
        bankName: t.bank_name,
        payerName: t.payer_name,
        notes: (t.notes && !t.notes.includes('Đồng bộ giao dịch thanh toán')) ? t.notes : undefined,
        paidAt: t.paid_at || t.created_at,
        createdAt: t.created_at
      }));
    } catch (err) {
      console.error('Lỗi khi lấy toàn bộ payment_transactions từ database:', err);
      return [];
    }
  }
};
