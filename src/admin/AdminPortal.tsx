import React, { useState, useEffect, useCallback } from 'react';
import { TOURS_DATA } from '../data/toursData';
import { Tour, DepartureDate } from '../types/tour.types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { couponService } from '../services/couponService';
import { tourService } from '../services/tourService';
import { AdminTab, BookingRecord, CustomerRecord, CouponRecord, ActionFeedback } from './admin.types';
import { UserRole } from '../auth/auth.types';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopbar } from './components/AdminTopbar';
import { OverviewModule } from './modules/OverviewModule';
import { BookingsModule } from './modules/BookingsModule';
import { ToursModule } from './modules/ToursModule';
import { CustomersModule } from './modules/CustomersModule';
import { CouponsModule } from './modules/CouponsModule';
import { EditPriceModal } from './modals/EditPriceModal';
import { AddTourModal } from './modals/AddTourModal';
import { AddCouponModal } from './modals/AddCouponModal';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  // Live Database States
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [tours, setTours] = useState<Tour[]>(TOURS_DATA);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isAddTourOpen, setIsAddTourOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);

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
          const mappedBookings: BookingRecord[] = bookingRows.map((b: any) => ({
            id: b.booking_code || b.id,
            customerName: b.customer_name,
            phone: b.customer_phone,
            customerAddress: b.customer_address,
            tourTitle: b.tour?.title || b.tour_id,
            departureDate: b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : 'Đang xếp lịch',
            paxCount: (b.adult_count || 1) + (b.child_count || 0) + (b.infant_count || 0),
            totalAmount: Number(b.total_amount) || 0,
            status: (b.booking_status as any) || 'pending',
            createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString('vi-VN') : 'Hôm nay'
          }));
          setBookings(mappedBookings);
        }

        // 3. Fetch Real Coupons
        const couponRows = await couponService.getAllCoupons();
        if (couponRows && couponRows.length > 0) {
          const mappedCoupons: CouponRecord[] = couponRows.map((cp) => ({
            code: cp.code,
            discountType: (cp.discount_percent || 0) > 0 ? 'percentage' : 'fixed',
            value: (cp.discount_percent || 0) > 0 ? cp.discount_percent! : Number(cp.discount_amount) || 0,
            usageCount: cp.used_count || 0,
            expiryDate: cp.expires_at ? new Date(cp.expires_at).toLocaleDateString('vi-VN') : 'Không giới hạn',
            status: cp.is_active ? 'active' : 'expired'
          }));
          setCoupons(mappedCoupons);
        }

        // 4. Fetch Real Tours
        const loadedTours = await tourService.getAllTours();
        if (loadedTours && loadedTours.length > 0) {
          setTours(loadedTours);
        }
      }
    } catch (err: any) {
      console.error('Error loading Supabase data in AdminPortal:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
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
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const result = await profileService.updateUserStatus(customerId, newStatus);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi cập nhật trạng thái' });
      return;
    }
    setCustomers(customers.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)));
    setActionFeedback({
      type: 'success',
      message: newStatus === 'banned' ? 'Đã khóa tài khoản thành viên' : 'Đã mở khóa tài khoản thành viên'
    });
  };

  // Handler: Booking status
  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('bookings').update({ booking_status: newStatus }).eq('booking_code', bookingId);
      }
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      setActionFeedback({ type: 'success', message: `Đã cập nhật trạng thái đơn ${bookingId} ➔ ${newStatus}` });
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi cập nhật đơn hàng' });
    }
  };

  // Handler: Save Price
  const handleSavePrice = async (tourId: string, newPrice: number) => {
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

  // Handler: Add Tour
  const handleAddTour = async (newTour: Tour) => {
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

  // Handler: Delete Tour
  const handleDeleteTour = async (tourId: string) => {
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
    const result = await couponService.createCoupon({
      code: newCoupon.code,
      discount_amount: newCoupon.discountType === 'fixed' ? newCoupon.value : 0,
      discount_percent: newCoupon.discountType === 'percentage' ? newCoupon.value : 0
    });
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.error || 'Lỗi tạo voucher' });
      return;
    }
    setCoupons([newCoupon, ...coupons]);
    setActionFeedback({ type: 'success', message: `Đã tạo voucher thành công: ${newCoupon.code}` });
  };

  // Filtered lists by search query
  const filteredBookings = bookings.filter(
    (b) =>
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tourTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
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
        toursCount={tours.length}
        customersCount={customers.length}
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
          {activeTab === 'overview' && (
            <OverviewModule
              bookings={bookings}
              tours={tours}
              customersCount={customers.length}
              onNavigateToBookings={() => setActiveTab('bookings')}
              onApproveBooking={(id) => handleStatusChange(id, 'confirmed')}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsModule
              bookings={filteredBookings}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'tours' && (
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

          {activeTab === 'customers' && (
            <CustomersModule
              customers={filteredCustomers}
              onRoleChange={handleRoleChange}
              onToggleStatus={handleToggleCustomerStatus}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsModule
              coupons={coupons}
              onOpenAddCoupon={() => setIsAddCouponOpen(true)}
            />
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
    </div>
  );
};
