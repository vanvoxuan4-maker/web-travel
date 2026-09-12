import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TOURS_DATA } from '../data/toursData';
import { Tour, DepartureDate } from '../types/tour.types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { couponService } from '../services/couponService';
import { tourService } from '../services/tourService';
import { bookingService, getBookingUiStatus, PaymentTransactionRecord } from '../services/bookingService';
import { updateTourInventory } from '../utils/inventoryManager';
import { AdminTab, BookingRecord, CustomerRecord, StaffRecord, CouponRecord, ActionFeedback } from './admin.types';
import { UserRole } from '../auth/auth.types';
import { useAuth, hasPermission, canAssignRole, isTabAllowed } from '../auth';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopbar } from './components/AdminTopbar';
import { OverviewModule } from './modules/OverviewModule';
import { BookingsModule } from './modules/BookingsModule';
import { PaymentsModule } from './modules/PaymentsModule';
import { ToursModule } from './modules/ToursModule';
import { CustomersModule } from './modules/CustomersModule';
import { StaffModule } from './modules/StaffModule';
import { CouponsModule } from './modules/CouponsModule';
import { AccountModule } from './modules/AccountModule';
import { EditPriceModal } from './modals/EditPriceModal';
import { AddTourModal } from './modals/AddTourModal';
import { AddCouponModal } from './modals/AddCouponModal';
import { EditCouponModal } from './modals/EditCouponModal';
import { IdleWarningModal } from './components/IdleWarningModal';
import { useAdminIdleTimeout } from '../hooks/useAdminIdleTimeout';

const VALID_TABS: AdminTab[] = ['overview', 'bookings', 'payments', 'tours', 'customers', 'staff', 'coupons', 'profile'];

export const AdminPortal: React.FC = () => {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab mặc định theo vai trò: Admin/SuperAdmin -> 'overview', Staff -> 'bookings'
  const defaultTab: AdminTab = isTabAllowed(user?.role, 'overview') ? 'overview' : 'bookings';

  const tabFromUrl = searchParams.get('tab') as AdminTab | null;
  const initialTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) && isTabAllowed(user?.role, tabFromUrl)
      ? tabFromUrl
      : defaultTab;
  const [activeTab, setActiveTabState] = useState<AdminTab>(initialTab);

  // --- Admin Idle Timeout (30 min idle → 60s warning → auto sign-out) ---
  // Only activates for privileged roles (admin, staff, super_admin).
  // Customer accounts are intentionally excluded to avoid disrupting UX.
  const isPrivilegedRole =
    user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'staff';
  const { showWarning: showIdleWarning, countdown: idleCountdown, extendSession } =
    useAdminIdleTimeout({
      idleMinutes: 30, // 30 phút không thao tác → hiện cảnh báo nhập mật khẩu
      warningCountdownSeconds: 60,
      enabled: isPrivilegedRole,
      onSignOut: signOut,
    });

  // Chuyển tab có kiểm tra thẩm quyền RBAC
  const setActiveTab = useCallback((newTab: AdminTab) => {
    if (!isTabAllowed(user?.role, newTab)) {
      setActionFeedback({
        type: 'error',
        message: 'Bạn không có quyền truy cập vào phân hệ này!'
      });
      return;
    }
    setActiveTabState(newTab);
    setSearchParams(newTab === defaultTab ? {} : { tab: newTab });
  }, [user?.role, defaultTab, setSearchParams]);

  // Route Guard: Nếu cố tình sửa URL query ?tab=... thành tab không có quyền -> Chặn & redirect
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab | null;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      if (!isTabAllowed(user?.role, tabParam)) {
        setActiveTabState(defaultTab);
        setSearchParams(defaultTab === 'overview' ? {} : { tab: defaultTab });
        setActionFeedback({
          type: 'error',
          message: `Bạn không có quyền truy cập phân hệ "${tabParam}". Đã chuyển hướng về trang làm việc.`
        });
      } else if (tabParam !== activeTab) {
        setActiveTabState(tabParam);
      }
    } else if (!tabParam && activeTab !== defaultTab) {
      if (!isTabAllowed(user?.role, activeTab)) {
        setActiveTabState(defaultTab);
      }
    }
  }, [searchParams, activeTab, user?.role, defaultTab, setSearchParams]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  // Live Database States
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [tours, setTours] = useState<Tour[]>(TOURS_DATA);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isAddTourOpen, setIsAddTourOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);

  // Fetch real data from Supabase
  const loadDatabaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // 1. Fetch Real Customers
        const profileRows = await profileService.getAllProfiles();
        if (profileRows && profileRows.length > 0) {
          const mappedCustomers: CustomerRecord[] = profileRows.map((p) => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Khách Hàng',
            email: p.email,
            phone: p.phone || 'Chưa cập nhật',
            address: p.address || 'Chưa cập nhật',
            points: p.loyalty_points || 0,
            role: p.role || 'customer',
            status: p.status || 'active',
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Mới'
          }));
          setCustomers(mappedCustomers);
        }

        // 2. Fetch Real Bookings
        const { data: bookingRows, error: bookingErr } = await supabase
          .from('bookings')
          .select('*, tour:tours(title)')
          .order('created_at', { ascending: false });

        if (!bookingErr && bookingRows && bookingRows.length > 0) {
          const mappedBookings: BookingRecord[] = bookingRows.map((b: any) => {
            const adults = Number(b.adults_count || b.adult_count) || 1;
            const children = Number(b.children_count || b.child_count) || 0;
            const toddlers = Number(b.toddlers_count) || 0;
            const infants = Number(b.infants_count || b.infant_count) || 0;
            const totalPax = adults + children + toddlers + infants;
            const totalAmt = Number(b.total_amount) || 0;
            const uiStatus = getBookingUiStatus({
              bookingStatus: b.booking_status,
              paymentStatus: b.payment_status,
              paidAmount: b.paid_amount,
              totalAmount: b.total_amount
            });

            const paidAmt = Number(b.paid_amount) || (uiStatus === 'confirmed' ? totalAmt : uiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0);

            return {
              id: b.booking_code || b.id,
              bookingCode: b.booking_code || b.id,
              userId: b.user_id,
              customerName: b.customer_name || 'Khách hàng',
              phone: b.customer_phone || '',
              email: b.customer_email || '',
              customerAddress: b.customer_address || '',
              customerNotes: b.customer_notes || '',
              tourId: b.tour_id,
              tourTitle: b.tour_title || b.tour?.title || b.tour_id,
              tourImage: b.tour_image,
              departureDate: b.departure_date ? (b.departure_date.includes('-') ? new Date(b.departure_date).toLocaleDateString('vi-VN') : b.departure_date) : 'Đang xếp lịch',
              adultsCount: adults,
              childrenCount: children,
              toddlersCount: toddlers,
              infantsCount: infants,
              singleRoomsCount: b.single_rooms_count || 0,
              paxCount: totalPax,
              totalAmount: totalAmt,
              paidAmount: paidAmt,
              paymentMethod: b.payment_method || 'vietqr',
              paymentStatus: b.payment_status || 'pending',
              bookingStatus: b.booking_status || 'pending',
              couponCode: b.coupon_code,
              couponDiscount: b.coupon_discount,
              status: uiStatus,
              createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString('vi-VN') : 'Hôm nay',
              rawCreatedAt: b.created_at || new Date().toISOString()
            };
          });
          setBookings(mappedBookings);
        } else {
          // Read from LocalStorage fallback when Supabase has no records or fails
          try {
            const localBookings = JSON.parse(localStorage.getItem('webtravel_local_bookings') || '[]');
            if (localBookings.length > 0) {
              setBookings(localBookings.map((b: any) => {
                const adults = Number(b.adultsCount) || 1;
                const children = Number(b.childrenCount) || 0;
                const toddlers = Number(b.toddlersCount) || 0;
                const infants = Number(b.infantsCount) || 0;
                const totalPax = adults + children + toddlers + infants;
                const totalAmt = Number(b.totalAmount) || 0;

                const uiStatus = getBookingUiStatus({
                  bookingStatus: b.bookingStatus,
                  paymentStatus: b.paymentStatus,
                  paidAmount: b.paidAmount,
                  totalAmount: b.totalAmount
                });

                const paidAmt = Number(b.paidAmount) || (uiStatus === 'confirmed' ? totalAmt : uiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0);

                return {
                  id: b.bookingCode || b.id,
                  bookingCode: b.bookingCode || b.id,
                  userId: b.userId,
                  customerName: b.customerName || 'Khách hàng',
                  phone: b.customerPhone || '',
                  email: b.customerEmail || '',
                  customerAddress: b.customerAddress || '',
                  customerNotes: b.customerNotes || '',
                  tourId: b.tourId,
                  tourTitle: b.tourTitle || b.tourId,
                  tourImage: b.tourImage,
                  departureDate: b.departureDate || 'Đang xếp lịch',
                  adultsCount: adults,
                  childrenCount: children,
                  toddlersCount: toddlers,
                  infantsCount: infants,
                  singleRoomsCount: b.singleRoomsCount || 0,
                  paxCount: totalPax,
                  totalAmount: totalAmt,
                  paidAmount: paidAmt,
                  paymentMethod: b.paymentMethod || 'vietqr',
                  paymentStatus: b.paymentStatus || 'pending',
                  bookingStatus: b.bookingStatus || 'pending',
                  couponCode: b.couponCode,
                  couponDiscount: b.couponDiscount,
                  status: uiStatus,
                  createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
                  rawCreatedAt: b.createdAt || new Date().toISOString()
                };
              }));
            }
          } catch (e) {
            console.warn('Cannot read local bookings in AdminPortal:', e);
          }
        }

        // 3. Fetch Real Coupons
        const couponRows = await couponService.getAllCoupons();
        if (couponRows && couponRows.length > 0) {
          const mappedCoupons: CouponRecord[] = couponRows.map((cp) => {
            const isPct = (cp.discount_percent || 0) > 0;
            const isActive = cp.is_active !== false;
            const isExpired = cp.expires_at ? new Date(cp.expires_at).getTime() < Date.now() : false;
            return {
              code: cp.code,
              description: cp.description || '',
              discountType: isPct ? 'percentage' : 'fixed',
              value: isPct ? cp.discount_percent! : Number(cp.discount_amount) || 0,
              minOrderValue: Number(cp.min_order_value) || 0,
              usageLimit: cp.usage_limit ?? 100,
              usageCount: cp.used_count || 0,
              expiryDate: cp.expires_at ? new Date(cp.expires_at).toLocaleDateString('vi-VN') : 'Không giới hạn',
              rawExpiryDate: cp.expires_at || '',
              isActive: isActive,
              status: !isActive ? 'inactive' : isExpired ? 'expired' : 'active'
            };
          });
          setCoupons(mappedCoupons);
        }

        // 4. Fetch Real Tours
        const loadedTours = await tourService.getAllTours();
        if (loadedTours) {
          setTours(loadedTours);
        }
      }

      // 5. Fetch Real Payment Transactions
      try {
        const txList = await bookingService.getAllTransactions();
        setTransactions(txList);
      } catch (txErr) {
        console.warn('Error loading transactions in AdminPortal:', txErr);
      }
    } catch (err: any) {
      console.error('Error loading Supabase data in AdminPortal:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`admin_bookings_sync_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadDatabaseData();
        }
      )
      .subscribe();

    const broadcastChannel = supabase
      .channel('webtravel_realtime_bookings')
      .on('broadcast', { event: 'booking_updated' }, () => {
        loadDatabaseData();
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
      supabase?.removeChannel(broadcastChannel);
    };
  }, [loadDatabaseData]);

  // Flash feedback auto dismiss
  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  // Handler: Customer Role (Staff, Admin, Customer)
  const handleRoleChange = async (customerId: string, newRole: UserRole) => {
    if (!canAssignRole(user?.role, newRole)) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền phân quyền vai trò này.' });
      return;
    }
    const result = await profileService.updateUserRole(customerId, newRole);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật vai trò' });
      return;
    }
    setCustomers(customers.map((c) => (c.id === customerId ? { ...c, role: newRole } : c)));
    const roleLabel = newRole === 'admin' ? 'QUẢN TRỊ VIÊN' : newRole === 'staff' ? 'NHÂN VIÊN' : 'KHÁCH HÀNG';
    setActionFeedback({ type: 'success', message: `Đã cập nhật vai trò thành công: ${roleLabel}` });
  };

  // Handler: Customer Ban/Unban
  const handleToggleCustomerStatus = async (customerId: string, currentStatus: 'active' | 'banned' | 'deleted') => {
    if (!hasPermission(user?.role, 'customer:ban')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền khóa hoặc mở khóa tài khoản thành viên.' });
      return;
    }
    if (user?.id === customerId && currentStatus === 'active') {
      setActionFeedback({ type: 'error', message: 'Bạn không thể tự khóa tài khoản của chính mình để tránh mất quyền quản trị.' });
      return;
    }
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const result = await profileService.updateUserStatus(customerId, newStatus);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật trạng thái tài khoản' });
      return;
    }
    setCustomers(customers.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)));
    setActionFeedback({
      type: 'success',
      message:
        newStatus === 'banned'
          ? 'Đã khóa tài khoản thành công! Người dùng sẽ nhận được thông báo giải thích lý do khi đăng nhập.'
          : 'Đã mở khóa tài khoản thành công! Người dùng có thể tiếp tục sử dụng hệ thống bình thường.'
    });
  };

  // Handler: Booking status
  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => {
    if (!hasPermission(user?.role, 'booking:approve')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền duyệt hoặc cập nhật đơn hàng.' });
      return;
    }
    try {
      const paymentStatus = newStatus === 'confirmed' ? 'paid' : newStatus === 'deposit' ? 'partially_paid' : newStatus === 'cancelled' ? 'refunded' : 'pending';
      const bookingStatus = newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'pending';
      
      const currentBooking = bookings.find(b => b.id === bookingId || b.bookingCode === bookingId);
      const totalAmt = currentBooking ? currentBooking.totalAmount : 0;
      const paidAmt = newStatus === 'confirmed' ? totalAmt : newStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0;

      const res = await bookingService.updateBookingAdminStatus(bookingId, newStatus);
      if (!res.success) {
        setActionFeedback({
          type: 'error',
          message: `Không thể lưu trạng thái vào database: ${res.error || 'Lỗi cập nhật'}`
        });
        return;
      }

      setBookings(bookings.map((b) => (b.id === bookingId || b.bookingCode === bookingId ? { ...b, status: newStatus, paymentStatus, bookingStatus, paidAmount: paidAmt } : b)));
      
      // Auto refresh transactions ledger
      bookingService.getAllTransactions().then(setTransactions).catch(() => {});

      const statusLabel = newStatus === 'confirmed' ? 'Đã Thanh Toán 100%' : newStatus === 'deposit' ? 'Đã Cọc 50%' : newStatus === 'pending' ? 'Chờ Duyệt' : 'Đã Hủy';
      setActionFeedback({ type: 'success', message: `Đã cập nhật trạng thái đơn ${bookingId} ➔ ${statusLabel}` });
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi cập nhật đơn hàng' });
    }
  };

  // Handler: Save Price
  const handleSavePrice = async (tourId: string, newPrice: number) => {
    if (!hasPermission(user?.role, 'tour:edit_price')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền chỉnh sửa giá tour.' });
      return;
    }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('tours').update({ price_adult: newPrice }).eq('id', tourId);
      }
      setTours(tours.map((t) => (t.id === tourId ? { ...t, priceAdult: newPrice } : t)));
      setActionFeedback({ type: 'success', message: 'Đã cập nhật giá tour mới thành công!' });
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi lưu giá mới' });
    }
  };

  // Handler: Add Tour (Permission guarded)
  const handleAddTour = async (newTour: Tour) => {
    if (!hasPermission(user?.role, 'tour:create')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền thêm tour mới.' });
      return;
    }
    const result = await tourService.createTour(newTour);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi thêm tour vào database' });
      return;
    }
    setTours([newTour, ...tours]);
    setActionFeedback({ type: 'success', message: 'Đã thêm tour mới thành công vào hệ thống!' });
  };

  // Handler: Full Save / Edit Tour
  const handleSaveTour = async (updatedTour: Tour) => {
    if (!hasPermission(user?.role, 'tour:edit')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền chỉnh sửa tour.' });
      return;
    }
    const result = await tourService.updateTour(updatedTour);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật tour' });
      return;
    }
    setTours(tours.map((t) => (t.id === updatedTour.id ? updatedTour : t)));
    setActionFeedback({ type: 'success', message: `Đã cập nhật thông tin tour "${updatedTour.title}" thành công!` });
  };

  // Handler: Update Schedule Dates & Capacity
  const handleUpdateSchedule = async (tourId: string, updatedDates: DepartureDate[]) => {
    if (!hasPermission(user?.role, 'tour:manage_schedule')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền cập nhật lịch khởi hành.' });
      return;
    }
    const datesStr = updatedDates.map((d) => d.date);
    const totalSeats = updatedDates.reduce((sum, d) => sum + (d.seats || 0), 0);
    const targetTour = tours.find((t) => t.id === tourId);

    if (targetTour) {
      const updatedObj = {
        ...targetTour,
        departureDates: updatedDates,
        availableDates: datesStr,
        seatsLeft: totalSeats > 0 ? totalSeats : targetTour.seatsLeft
      };
      updateTourInventory(tourId, updatedDates);
      const result = await tourService.updateTour(updatedObj);
      if (!result.success) {
        setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật lịch trình' });
        return;
      }
      setTours(tours.map((t) => (t.id === tourId ? updatedObj : t)));
    }

    setActionFeedback({ type: 'success', message: 'Đã cập nhật lịch khởi hành và số chỗ thành công!' });
  };

  // Handler: Toggle Active / Inactive
  const handleToggleTourActive = async (tourId: string, currentStatus: boolean) => {
    if (!hasPermission(user?.role, 'tour:toggle_active')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền mở hoặc tạm dừng bán tour.' });
      return;
    }
    const newStatus = !currentStatus;
    const targetTour = tours.find((t) => t.id === tourId);
    if (targetTour) {
      const result = await tourService.updateTour({ ...targetTour, isActive: newStatus });
      if (!result.success) {
        setActionFeedback({ type: 'error', message: result.error || 'Lỗi thay đổi trạng thái tour' });
        return;
      }
      setTours(tours.map((t) => (t.id === tourId ? { ...t, isActive: newStatus } : t)));
    }
    setActionFeedback({
      type: 'success',
      message: newStatus ? 'Đã kích hoạt mở bán tour!' : 'Đã tạm dừng nhận khách / ẩn tour khỏi website!'
    });
  };

  // Handler: Delete Tour (Super Admin only)
  const handleDeleteTour = async (tourId: string) => {
    if (!hasPermission(user?.role, 'tour:delete')) {
      setActionFeedback({ type: 'error', message: 'Chỉ Super Admin mới có quyền xóa tour khỏi hệ thống!' });
      return;
    }
    const result = await tourService.deleteTour(tourId);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi xóa tour' });
      return;
    }
    setTours(tours.filter((t) => t.id !== tourId));
    setActionFeedback({ type: 'success', message: 'Đã xóa tour thành công khỏi hệ thống!' });
  };

  // Handler: Add Coupon
  const handleAddCoupon = async (newCoupon: CouponRecord) => {
    if (!hasPermission(user?.role, 'coupon:create')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền tạo voucher mới.' });
      return;
    }
    const result = await couponService.createCoupon({
      code: newCoupon.code,
      description: newCoupon.description,
      discount_amount: newCoupon.discountType === 'fixed' ? newCoupon.value : 0,
      discount_percent: newCoupon.discountType === 'percentage' ? newCoupon.value : 0,
      min_order_value: newCoupon.minOrderValue || 0,
      usage_limit: newCoupon.usageLimit || 100,
      expires_at: newCoupon.rawExpiryDate || undefined
    });
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi tạo voucher' });
      return;
    }
    setCoupons([newCoupon, ...coupons]);
    setActionFeedback({ type: 'success', message: `Đã tạo voucher thành công: ${newCoupon.code}` });
  };

  // Handler: Update Coupon
  const handleUpdateCoupon = async (updatedCoupon: CouponRecord) => {
    if (!hasPermission(user?.role, 'coupon:edit')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền chỉnh sửa voucher.' });
      return;
    }
    const result = await couponService.updateCoupon(updatedCoupon.code, {
      description: updatedCoupon.description,
      discount_amount: updatedCoupon.discountType === 'fixed' ? updatedCoupon.value : 0,
      discount_percent: updatedCoupon.discountType === 'percentage' ? updatedCoupon.value : 0,
      min_order_value: updatedCoupon.minOrderValue || 0,
      usage_limit: updatedCoupon.usageLimit || 100,
      expires_at: updatedCoupon.rawExpiryDate || null,
      is_active: updatedCoupon.isActive
    });
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật voucher' });
      return;
    }
    setCoupons((prev) => prev.map((c) => (c.code === updatedCoupon.code ? updatedCoupon : c)));
    setActionFeedback({ type: 'success', message: `Đã cập nhật thông tin voucher ${updatedCoupon.code} thành công!` });
  };

  // Handler: Toggle Coupon Active / Inactive (Hide / Unhide)
  const handleToggleCouponActive = async (code: string, currentStatus: boolean) => {
    if (!hasPermission(user?.role, 'coupon:toggle_active')) {
      setActionFeedback({ type: 'error', message: 'Bạn không có quyền ẩn hoặc mở lại voucher.' });
      return;
    }
    const nextStatus = !currentStatus;
    const result = await couponService.toggleCouponActive(code, nextStatus);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi đổi trạng thái voucher' });
      return;
    }
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          return {
            ...c,
            isActive: nextStatus,
            status: !nextStatus
              ? 'inactive'
              : c.rawExpiryDate && new Date(c.rawExpiryDate).getTime() < Date.now()
              ? 'expired'
              : 'active'
          };
        }
        return c;
      })
    );
    setActionFeedback({
      type: 'success',
      message: nextStatus
        ? `Đã kích hoạt lại voucher ${code}. Khách hàng có thể sử dụng.`
        : `Đã ẩn voucher ${code}. Khách hàng sẽ không thể áp dụng mã này.`
    });
  };

  // Handler: Delete Coupon (Super Admin only)
  const handleDeleteCoupon = async (code: string) => {
    if (!hasPermission(user?.role, 'coupon:delete')) {
      setActionFeedback({ type: 'error', message: 'Chỉ Tổng Quản Trị (Super Admin) mới có quyền xóa voucher!' });
      return;
    }
    const result = await couponService.deleteCoupon(code);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi khi xóa voucher' });
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    setActionFeedback({ type: 'success', message: `Đã xóa vĩnh viễn voucher ${code} khỏi hệ thống!` });
  };

  // Handler: Hard Delete Bookings (Super Admin & Admin only)
  const handleDeleteBookings = async (bookingIds: string[]): Promise<{ success: boolean; error?: string }> => {
    if (!hasPermission(user?.role, 'booking:delete')) {
      setActionFeedback({ type: 'error', message: 'Chỉ Quản Trị Viên (Admin / Super Admin) mới có quyền xóa cứng đơn hàng!' });
      return { success: false, error: 'Bạn không có quyền xóa đơn hàng.' };
    }

    try {
      let failCount = 0;
      let lastError = '';
      for (const bId of bookingIds) {
        const res = await bookingService.deleteBooking(bId);
        if (!res.success) {
          failCount++;
          lastError = res.error || 'Lỗi xóa đơn';
        }
      }

      if (failCount > 0 && failCount === bookingIds.length) {
        setActionFeedback({ type: 'error', message: `Không thể xóa đơn hàng: ${lastError}` });
        return { success: false, error: lastError };
      }

      // Cập nhật lại state bookings trong AdminPortal
      setBookings((prev) =>
        prev.filter((b) => !bookingIds.includes(b.id) && !bookingIds.includes(b.bookingCode))
      );

      // Tự động làm mới danh sách đối soát giao dịch
      bookingService.getAllTransactions().then(setTransactions).catch(() => {});

      const successCount = bookingIds.length - failCount;
      const msg =
        bookingIds.length === 1
          ? `Đã xóa cứng vĩnh viễn đơn hàng ${bookingIds[0]} khỏi hệ thống!`
          : `Đã xóa cứng vĩnh viễn ${successCount} đơn hàng đã chọn khỏi hệ thống!`;

      setActionFeedback({ type: 'success', message: msg });
      return { success: true };
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi khi xóa đơn hàng' });
      return { success: false, error: err?.message };
    }
  };

  // Filtered lists by search query
  const filteredBookings = bookings.filter(
    (b) =>
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tourTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pureCustomers = customers.filter((c) => c.role === 'customer');
  const staffMembers = customers.filter((c) => c.role !== 'customer') as StaffRecord[];

  const filteredCustomers = pureCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredStaff = staffMembers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.employeeCode && s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#f8fafc',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookingsCount={bookings.length}
        paymentsCount={transactions.length}
        toursCount={tours.length}
        customersCount={pureCustomers.length}
        staffCount={staffMembers.length}
        pendingBookingsCount={pendingCount}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <AdminTopbar
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoading={isLoading}
          onRefresh={loadDatabaseData}
          onOpenAddTour={() => setIsAddTourOpen(true)}
          onOpenAddCoupon={() => setIsAddCouponOpen(true)}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {/* Action Flash Feedback Message */}
        {actionFeedback && (
          <div
            style={{
              padding: '0.75rem 2rem',
              background: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: actionFeedback.type === 'success' ? '#047857' : '#b91c1c',
              borderBottom: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className={`fa-solid ${actionFeedback.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Scrollable View Content Body */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'overview' && isTabAllowed(user?.role, 'overview') && (
            <OverviewModule
              bookings={bookings}
              tours={tours}
              customersCount={customers.length}
              onNavigateToBookings={() => setActiveTab('bookings')}
              onApproveBooking={(id) => handleStatusChange(id, 'confirmed')}
              onConfirmFullPayment={(id) => handleStatusChange(id, 'confirmed')}
            />
          )}

          {activeTab === 'bookings' && isTabAllowed(user?.role, 'bookings') && (
            <BookingsModule
              bookings={filteredBookings}
              onStatusChange={handleStatusChange}
              onDeleteBookings={handleDeleteBookings}
              canDelete={hasPermission(user?.role, 'booking:delete')}
            />
          )}

          {activeTab === 'payments' && isTabAllowed(user?.role, 'payments') && (
            <PaymentsModule
              transactions={transactions}
              onRefresh={async () => {
                setIsLoadingTransactions(true);
                try {
                  const txList = await bookingService.getAllTransactions();
                  setTransactions(txList);
                } finally {
                  setIsLoadingTransactions(false);
                }
              }}
              isLoading={isLoadingTransactions}
            />
          )}

          {activeTab === 'tours' && isTabAllowed(user?.role, 'tours') && (
            <ToursModule
              tours={tours}
              onOpenAddTour={() => setIsAddTourOpen(true)}
              onOpenEditPrice={(t) => setEditingTour(t)}
              onSaveTour={handleSaveTour}
              onUpdateSchedule={handleUpdateSchedule}
              onToggleTourActive={handleToggleTourActive}
              onDeleteTour={handleDeleteTour}
            />
          )}

          {activeTab === 'customers' && isTabAllowed(user?.role, 'customers') && (
            <CustomersModule
              customers={filteredCustomers}
              bookings={bookings}
              onRoleChange={handleRoleChange}
              onToggleStatus={handleToggleCustomerStatus}
              onCustomerUpdated={(updated) => {
                setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                setActionFeedback({
                  type: 'success',
                  message: `Đã cập nhật thông tin khách hàng ${updated.name} thành công!`
                });
              }}
            />
          )}

          {activeTab === 'staff' && isTabAllowed(user?.role, 'staff') && (
            <StaffModule
              staff={filteredStaff}
              onRoleChange={handleRoleChange}
              onToggleStatus={handleToggleCustomerStatus}
            />
          )}

          {activeTab === 'coupons' && isTabAllowed(user?.role, 'coupons') && (
            <CouponsModule
              coupons={coupons}
              onOpenAddCoupon={() => setIsAddCouponOpen(true)}
              onEditCoupon={(cp) => setEditingCoupon(cp)}
              onToggleActive={handleToggleCouponActive}
              onDeleteCoupon={handleDeleteCoupon}
            />
          )}

          {activeTab === 'profile' && isTabAllowed(user?.role, 'profile') && (
            <AccountModule />
          )}

          {/* Access Denied Guard Fallback */}
          {!isTabAllowed(user?.role, activeTab) && (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1.5rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #fee2e2',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  marginBottom: '1rem'
                }}
              >
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontWeight: 800, fontSize: '1.2rem' }}>
                Khu Vực Giới Hạn Quyền Truy Cập
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Tài khoản của bạn ({user?.role === 'staff' ? 'Nhân Viên Vận Hành' : user?.role}) không có thẩm quyền truy cập phân hệ này.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(defaultTab)}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
              >
                Quay Về Trang Làm Việc
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 3. MODALS */}
      {editingTour && (
        <EditPriceModal
          tour={editingTour}
          onClose={() => setEditingTour(null)}
          onSavePrice={handleSavePrice}
        />
      )}

      {isAddTourOpen && (
        <AddTourModal
          isOpen={isAddTourOpen}
          onClose={() => setIsAddTourOpen(false)}
          onAddTour={handleAddTour}
        />
      )}

      {isAddCouponOpen && (
        <AddCouponModal
          isOpen={isAddCouponOpen}
          onClose={() => setIsAddCouponOpen(false)}
          onAddCoupon={handleAddCoupon}
        />
      )}

      {editingCoupon && (
        <EditCouponModal
          coupon={editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onSaveCoupon={handleUpdateCoupon}
        />
      )}

      {/* Idle session warning — shown after 30 minutes of inactivity.
          Requires password re-entry to unlock, preventing strangers from bypassing. */}
      {showIdleWarning && (
        <IdleWarningModal
          countdown={idleCountdown}
          idleMinutes={30}
          userEmail={user?.email ?? ''}
          onExtend={extendSession}
          onSignOut={signOut}
        />
      )}
    </div>
  );
};
