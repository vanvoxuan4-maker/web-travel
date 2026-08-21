export type AdminTab = 'overview' | 'bookings' | 'tours' | 'customers' | 'coupons';

export interface BookingRecord {
  id: string;
  customerName: string;
  phone: string;
  customerAddress?: string;
  tourTitle: string;
  departureDate: string;
  paxCount: number;
  totalAmount: number;
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
