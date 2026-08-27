import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

    // 1. If Supabase is configured, insert to Supabase database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
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
          .single();

        if (error) {
          console.error('Supabase booking insert error:', error);
          this.saveToLocalStorage(payloadWithTime);
          return { success: true, data: payloadWithTime };
        }

        const savedPayload: BookingPayload = {
          ...payloadWithTime,
          id: data.id
        };
        this.saveToLocalStorage(savedPayload);
        return { success: true, data: savedPayload };
      } catch (err: any) {
        console.error('Failed to create booking in Supabase:', err);
        this.saveToLocalStorage(payloadWithTime);
        return { success: true, data: payloadWithTime };
      }
    }

    // 2. Fallback to LocalStorage
    this.saveToLocalStorage(payloadWithTime);
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
                bookingStatus: row.booking_status || 'confirmed',
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
          const finalAmount = amount || Number(bookingData.total_amount) || 0;
          const method = paymentMethod || bookingData.payment_method || 'vietqr';

          // Update booking
          await supabase
            .from('bookings')
            .update({
              payment_status: paymentStatus,
              paid_amount: paymentStatus === 'paid' ? finalAmount : paymentStatus === 'partially_paid' ? Math.round(finalAmount * 0.5) : 0
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
          return {
            ...b,
            paymentStatus,
            paidAmount: paymentStatus === 'paid' ? b.totalAmount : paymentStatus === 'partially_paid' ? Math.round(b.totalAmount * 0.5) : 0
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
          return { ...b, bookingStatus: 'cancelled' as const };
        }
        return b;
      });
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update cancel in localStorage:', e);
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
  }
};
