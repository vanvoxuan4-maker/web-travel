export type AdminTab = 'overview' | 'bookings' | 'payments' | 'tours' | 'customers' | 'staff' | 'coupons' | 'logs' | 'profile';

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
  rawCreatedAt?: string;
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
  avatarUrl?: string;
}

export interface StaffRecord {
  id: string;
  userId?: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  identityCard?: string;
  department: string;
  position: string;
  role: 'super_admin' | 'admin' | 'staff';
  status: 'active' | 'banned' | 'resigned';
  hireDate?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  joinedDate?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AuditLogCategory = 'booking' | 'payment' | 'tour' | 'staff' | 'customer' | 'coupon' | 'system' | 'auth';

export interface AuditLogRecord {
  id: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  actionCategory: AuditLogCategory;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CouponRecord {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  usageLimit?: number;
  usageCount: number;
  expiryDate: string;
  rawExpiryDate?: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'expired';
}

export interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}
