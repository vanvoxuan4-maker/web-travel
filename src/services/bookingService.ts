import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface BookingPayload {
  bookingCode: string;
  userId?: string;
  tourId: string;
  tourTitle: string;
  departureDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  customerNotes?: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  singleRoomsCount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: 'vietqr' | 'momo' | 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
  paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
}

const LOCAL_BOOKINGS_KEY = 'webtravel_local_bookings';

export const bookingService = {
  /**
   * Save a new booking to Supabase or localStorage
   */
  async createBooking(booking: BookingPayload): Promise<{ success: boolean; data?: any; error?: string }> {
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
              infants_count: booking.infantsCount,
              single_rooms_count: booking.singleRoomsCount,
              total_amount: booking.totalAmount,
              coupon_code: booking.couponCode || null,
              payment_method: booking.paymentMethod,
              payment_status: booking.paymentStatus,
              booking_status: booking.bookingStatus,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Supabase booking insert error:', error);
          // Fallback to local storage as safety guarantee
          this.saveToLocalStorage(booking);
          return { success: true, data: booking };
        }

        // Also save to local storage for instant offline access
        this.saveToLocalStorage(booking);
        return { success: true, data };
      } catch (err: any) {
        console.error('Failed to create booking in Supabase:', err);
        this.saveToLocalStorage(booking);
        return { success: true, data: booking };
      }
    }

    // 2. Fallback to LocalStorage
    this.saveToLocalStorage(booking);
    return { success: true, data: booking };
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
            bookingCode: data.booking_code,
            tourId: data.tour_id,
            tourTitle: data.tour_title,
            departureDate: data.departure_date,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            customerAddress: data.customer_address,
            customerNotes: data.customer_notes,
            adultsCount: data.adults_count,
            childrenCount: data.children_count,
            infantsCount: data.infants_count,
            singleRoomsCount: data.single_rooms_count,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            bookingStatus: data.booking_status
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
