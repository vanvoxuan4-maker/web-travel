import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabaseClient';
import { AppLogger } from '../utils/logger';
import { restoreSeats } from '../utils/inventoryManager';

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
  if (pStatus === 'paid' || bStatus === 'completed') {
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
        const { data, error }: any = await withTimeout(
          supabase
            .from('bookings')
            .insert([
              {
                booking_code: booking.bookingCode,
                user_id: booking.userId || null,
                tour_id: booking.tourId,
                tour_title: booking.tourTitle,
                departure_date: booking.departureDate,
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
          AppLogger.warn('Supabase booking insert trả về lỗi, chuyển sang lưu LocalStorage', {
            action: 'BOOKING_CREATE_SUPABASE_FALLBACK',
            bookingCode: booking.bookingCode,
            error: error.message
          });
          this.saveToLocalStorage(payloadWithTime);
          return { success: true, data: payloadWithTime };
        }

        const savedPayload: BookingPayload = {
          ...payloadWithTime,
          id: data.id
        };
        this.saveToLocalStorage(savedPayload);

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
        this.saveToLocalStorage(payloadWithTime);
        return { success: true, data: payloadWithTime };
      }
    }

    // 2. Fallback to LocalStorage
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
        if (userId) conditions.push(`user_id.eq.${userId}`);
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
                paymentMethod: row.payment_method || 'vietqr',
                paymentStatus: row.payment_status || 'pending',
                bookingStatus: row.booking_status || 'pending',
                createdAt: row.created_at
              });
            }
          });
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
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('id, total_amount, payment_method')
          .eq('booking_code', code)
          .single();

        if (bookingData) {
          const totalAmt = Number(bookingData.total_amount) || 0;
          const paidAmt = paymentStatus === 'paid' ? totalAmt : paymentStatus === 'partially_paid' ? (amount || Math.round(totalAmt * 0.5)) : 0;
          const finalAmount = amount || paidAmt || totalAmt;
          const method = paymentMethod || bookingData.payment_method || 'vietqr';

          // Update booking
          await supabase
            .from('bookings')
            .update({
              payment_status: paymentStatus,
              paid_amount: paidAmt
            })
            .eq('booking_code', code);

          // If paid or partially paid, create payment transaction record
          if (paymentStatus === 'paid' || paymentStatus === 'partially_paid') {
            await supabase
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
          .select('id, total_amount');

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
        const paidAmt = newUiStatus === 'confirmed' ? totalAmt : newUiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0;

        let updateQuery = supabase
          .from('bookings')
          .update({
            booking_status: bookingStatus,
            payment_status: paymentStatus,
            paid_amount: paidAmt
          });

        if (isUuid(code)) {
          updateQuery = updateQuery.or(`booking_code.eq.${code},id.eq.${code}`);
        } else {
          updateQuery = updateQuery.eq('booking_code', code);
        }

        const { error: updateErr } = await updateQuery;

        if (updateErr) {
          console.error('Supabase updateBookingAdminStatus update error:', updateErr);
        } else {
          AppLogger.info('Cập nhật trạng thái đơn hàng thành công trên Supabase', {
            action: 'BOOKING_STATUS_UPDATE',
            bookingCode: code,
            newUiStatus,
            bookingStatus,
            paymentStatus,
            paidAmt
          });
        }
      } catch (err: any) {
        console.error('Supabase updateBookingAdminStatus error:', err);
      }
    }

    // 2. Update LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
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
        const { error } = await supabase
          .from('bookings')
          .update({
            booking_status: 'cancelled',
            payment_status: 'refunded',
            customer_notes: reason ? `[Khách yêu cầu hủy: ${reason}]` : '[Khách yêu cầu hủy]'
          })
          .eq('booking_code', code);

        if (error) {
          console.error('Supabase cancel booking error:', error);
        }
      } catch (err: any) {
        console.warn('Failed to update cancel status in Supabase:', err);
      }
    }

    // 2. Update LocalStorage
    try {
      const localBookings: BookingPayload[] = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
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
            paymentMethod: data.payment_method || 'vietqr',
            paymentStatus: data.payment_status || 'pending',
            bookingStatus: data.booking_status || 'confirmed',
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
          console.warn('Supabase delete booking error:', error);
        }
      } catch (err: any) {
        console.warn('Supabase delete booking exception:', err);
      }
    }

    // Restore seats if found locally
    if (bookingToRestore && bookingToRestore.tourId && bookingToRestore.departureDate) {
      const totalSeats = (bookingToRestore.adultsCount || 1) + 
                         (bookingToRestore.childrenCount || 0) + 
                         (bookingToRestore.toddlersCount || 0);
      restoreSeats(bookingToRestore.tourId, bookingToRestore.departureDate, totalSeats);
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

    // 4. Dispatch real-time update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webtravel_booking_updated', {
        detail: { bookingId: idOrCode, action: 'deleted' }
      }));
    }

    return { success: true };
  }
};
