export type AdminTab = 'overview' | 'bookings' | 'tours' | 'customers' | 'coupons';

export interface BookingRecord {
  id: string;
  bookingCode: string;
  userId?: string;
  customerName: string;
  phone: string;
  email?: string;
  customerAddress?: string;
  customerNotes?: string;
  tourId?: string;
  tourTitle: string;
  tourImage?: string;
  departureDate: string;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  infantsCount: number;
  singleRoomsCount?: number;
  paxCount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  couponCode?: string;
  couponDiscount?: number;
  status: 'confirmed' | 'deposit' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  role: 'super_admin' | 'admin' | 'staff' | 'customer';
  status: 'active' | 'banned' | 'deleted';
  joinedDate: string;
}

export interface CouponRecord {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  usageCount: number;
  expiryDate: string;
  status: 'active' | 'expired';
}

export interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}
