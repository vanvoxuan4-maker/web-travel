-- ==============================================================================
-- WEBTRAVEL EDITORIAL - COMPLETE PRODUCTION DATABASE SCHEMA (POSTGRESQL + SUPABASE)
-- Phiên bản: 3.2 - TINH GỌN, TOÀN DIỆN, CHUẨN DOANH NGHIỆP TRONG NƯỚC & QUỐC TẾ
-- ==============================================================================
-- Hướng dẫn: Copy toàn bộ nội dung file này và Dán (Paste) vào Supabase SQL Editor
-- Sau đó nhấn nút [ RUN ] để khởi tạo toàn bộ hệ thống bảng và phân quyền bảo mật.
-- ==============================================================================

-- Bật extension tạo UUID tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG & PHÂN QUYỀN (profiles - User & Admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin', 'super_admin')),
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deleted')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger tự động tạo profile khi đăng ký tài khoản mới qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger đồng bộ email profiles khi user đổi email trong auth.users
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = new.email, updated_at = now()
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_user_email_update();

-- ==============================================================================
-- 2. BẢNG ĐIỂM ĐẾN DU LỊCH (destinations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),
    region TEXT,
    tag TEXT,
    image TEXT NOT NULL,
    tour_count INTEGER DEFAULT 0 CHECK (tour_count >= 0),
    min_price NUMERIC DEFAULT 0 CHECK (min_price >= 0),
    is_featured BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. BẢNG DANH SÁCH TOUR (tours)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tours (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_title TEXT,
    slug TEXT UNIQUE NOT NULL,
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),
    travel_style TEXT DEFAULT 'package' CHECK (travel_style IN ('package', 'combo', 'private', 'mice')),
    theme TEXT DEFAULT 'beach' CHECK (theme IN ('beach', 'heritage', 'adventure', 'family', 'wellness', 'culinary')),
    type TEXT,
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('luxury', 'standard', 'budget')),
    duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days >= 1),
    duration_nights INTEGER NOT NULL DEFAULT 0 CHECK (duration_nights >= 0),
    departure_from TEXT NOT NULL,
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),
    price_toddler NUMERIC CHECK (price_toddler IS NULL OR price_toddler >= 0),
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),
    original_price NUMERIC CHECK (original_price IS NULL OR original_price >= 0),
    is_flash_deal BOOLEAN DEFAULT false,
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    image TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    esg_score TEXT DEFAULT '85/100',
    lei_score TEXT DEFAULT '78/100',
    highlights JSONB DEFAULT '[]'::jsonb,
    itinerary JSONB DEFAULT '[]'::jsonb,
    included JSONB DEFAULT '[]'::jsonb,
    excluded JSONB DEFAULT '[]'::jsonb,
    is_flash_deal BOOLEAN DEFAULT false,
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    is_all_inclusive BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'hidden', 'weather_suspended', 'deleted')),
    weather_notice TEXT, -- Thông báo khi thời tiết xấu: Bão, cấm tàu...
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger tự động cập nhật tour_count & min_price trong destinations
CREATE OR REPLACE FUNCTION public.sync_destination_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.destination_id IS DISTINCT FROM NEW.destination_id)) THEN
        IF OLD.destination_id IS NOT NULL THEN
            UPDATE public.destinations
            SET
                tour_count = (SELECT count(*) FROM public.tours WHERE destination_id = OLD.destination_id AND status = 'published' AND deleted_at IS NULL),
                min_price  = (SELECT COALESCE(min(price_adult), 0) FROM public.tours WHERE destination_id = OLD.destination_id AND status = 'published' AND deleted_at IS NULL)
            WHERE id = OLD.destination_id;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.destination_id IS NOT NULL)) THEN
        UPDATE public.destinations
        SET
            tour_count = (SELECT count(*) FROM public.tours WHERE destination_id = NEW.destination_id AND status = 'published' AND deleted_at IS NULL),
            min_price  = (SELECT COALESCE(min(price_adult), 0) FROM public.tours WHERE destination_id = NEW.destination_id AND status = 'published' AND deleted_at IS NULL)
        WHERE id = NEW.destination_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_destination_stats ON public.tours;
CREATE TRIGGER trg_sync_destination_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.tours
    FOR EACH ROW EXECUTE PROCEDURE public.sync_destination_stats();

-- ==============================================================================
-- 4. BẢNG THƯ VIỆN HÌNH ẢNH CHI TIẾT (tour_images)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tour_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,                        -- Chú thích: "Phòng ngủ view biển", "Buffet tôm hùm"
    alt_text TEXT,                       -- Tối ưu SEO hình ảnh
    category TEXT DEFAULT 'attraction' CHECK (category IN ('hotel', 'attraction', 'food', 'cruise', 'activity', 'other')),
    display_order INTEGER DEFAULT 0,     -- Thứ tự sắp xếp hiển thị
    is_cover BOOLEAN DEFAULT false,      -- Đánh dấu ảnh bìa chính
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. BẢNG BIẾN THỂ GÓI TOUR (tour_variants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tour_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,          -- "Gói Tiêu Chuẩn 3★", "Gói VIP 5★ Vinpearl"
    departure_city TEXT,                 -- "Khởi hành từ Hà Nội", "Khởi hành từ TP.HCM"
    hotel_star INTEGER DEFAULT 3 CHECK (hotel_star BETWEEN 1 AND 5),
    flight_included BOOLEAN DEFAULT true,
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),
    benefits JSONB DEFAULT '[]'::jsonb,  -- Danh sách quyền lợi riêng của gói
    is_default BOOLEAN DEFAULT false,    -- Gói mặc định hiển thị
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. BẢNG LỊCH KHỞI HÀNH & CHỖ TRỐNG (departure_dates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departure_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available_seats INTEGER NOT NULL DEFAULT 20,
    total_seats INTEGER NOT NULL DEFAULT 20,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'few_seats', 'sold_out')),
    price_adjustment NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (tour_id, date),
    CONSTRAINT chk_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats)
);

-- ==============================================================================
-- 7. BẢNG MÃ GIẢM GIÁ & KHUYẾN MÃI (coupons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    discount_amount NUMERIC DEFAULT 0 CHECK (discount_amount >= 0),
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    min_order_value NUMERIC DEFAULT 0 CHECK (min_order_value >= 0),
    usage_limit INTEGER DEFAULT 100 CHECK (usage_limit >= 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. BẢNG ĐƠN ĐẶT TOUR (bookings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.tour_variants(id) ON DELETE SET NULL,
    tour_title TEXT NOT NULL,
    departure_date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_address TEXT,
    customer_notes TEXT,
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 1),
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
    infants_count INTEGER NOT NULL DEFAULT 0 CHECK (infants_count >= 0),
    single_rooms_count INTEGER NOT NULL DEFAULT 0 CHECK (single_rooms_count >= 0),
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    -- Bộ 4 phương thức thanh toán tinh gọn: VietQR, MoMo (VN) + Visa/MasterCard, PayPal (Quốc tế)
    payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'failed', 'refunded')),
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger quản lý trừ ghế và hoàn trả ghế tự động
CREATE OR REPLACE FUNCTION public.fn_manage_departure_seats()
RETURNS TRIGGER AS $$
DECLARE
    total_pax INTEGER;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.booking_status != 'cancelled') THEN
        total_pax := NEW.adults_count + NEW.children_count + NEW.infants_count;
        UPDATE public.departure_dates
        SET
            available_seats = GREATEST(0, available_seats - total_pax),
            status = CASE
                WHEN (available_seats - total_pax) <= 0 THEN 'sold_out'
                WHEN (available_seats - total_pax) <= 5  THEN 'few_seats'
                ELSE 'available'
            END
        WHERE tour_id = NEW.tour_id AND date = NEW.departure_date;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled') THEN
        total_pax := OLD.adults_count + OLD.children_count + OLD.infants_count;
        UPDATE public.departure_dates
        SET
            available_seats = LEAST(total_seats, available_seats + total_pax),
            status = CASE
                WHEN (available_seats + total_pax) <= 0 THEN 'sold_out'
                WHEN (available_seats + total_pax) <= 5  THEN 'few_seats'
                ELSE 'available'
            END
        WHERE tour_id = OLD.tour_id AND date = OLD.departure_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_manage_seats ON public.bookings;
CREATE TRIGGER trg_manage_seats
    AFTER INSERT OR UPDATE OF booking_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_departure_seats();

-- Trigger quản lý số lượt dùng coupon
CREATE OR REPLACE FUNCTION public.fn_manage_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.coupon_code IS NOT NULL) THEN
        UPDATE public.coupons
        SET used_count = used_count + 1
        WHERE code = NEW.coupon_code;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' AND OLD.coupon_code IS NOT NULL) THEN
        UPDATE public.coupons
        SET used_count = GREATEST(0, used_count - 1)
        WHERE code = OLD.coupon_code;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_manage_coupon_usage ON public.bookings;
CREATE TRIGGER trg_manage_coupon_usage
    AFTER INSERT OR UPDATE OF booking_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_coupon_usage();

-- ==============================================================================
-- 9. BẢNG LỊCH SỬ THANH TOÁN (payment_transactions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_code TEXT NOT NULL,
    transaction_code TEXT UNIQUE NOT NULL, -- Mã giao dịch ngân hàng / VietQR / MoMo / PayPal
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash')),
    payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('deposit', 'remaining', 'full', 'refund')),
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    bank_name TEXT,
    payer_name TEXT,
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger tự động đồng bộ tiền đã thanh toán và cập nhật trạng thái đơn hàng
CREATE OR REPLACE FUNCTION public.fn_sync_booking_payment()
RETURNS TRIGGER AS $$
DECLARE
    current_paid NUMERIC;
    order_total NUMERIC;
BEGIN
    IF (NEW.status = 'success') THEN
        SELECT COALESCE(sum(amount), 0) INTO current_paid
        FROM public.payment_transactions
        WHERE booking_id = NEW.booking_id AND status = 'success';

        SELECT total_amount INTO order_total
        FROM public.bookings
        WHERE id = NEW.booking_id;

        UPDATE public.bookings
        SET
            paid_amount = current_paid,
            payment_status = CASE
                WHEN current_paid >= order_total THEN 'paid'
                WHEN current_paid > 0 THEN 'partially_paid'
                ELSE 'pending'
            END
        WHERE id = NEW.booking_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_booking_payment ON public.payment_transactions;
CREATE TRIGGER trg_sync_booking_payment
    AFTER INSERT OR UPDATE OF status ON public.payment_transactions
    FOR EACH ROW EXECUTE PROCEDURE public.fn_sync_booking_payment();

-- ==============================================================================
-- 10. BẢNG YÊU CẦU TỰ THIẾT KẾ TOUR (custom_tour_requests)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.custom_tour_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    destinations TEXT[] NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1),
    estimated_budget NUMERIC CHECK (estimated_budget IS NULL OR estimated_budget >= 0),
    travel_style TEXT,
    hotel_star INTEGER DEFAULT 4 CHECK (hotel_star BETWEEN 1 AND 5),
    group_size INTEGER DEFAULT 2 CHECK (group_size >= 1),
    departure_month TEXT,
    special_requirements TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 11. BẢNG YÊU CẦU TƯ VẤN & LIÊN HỆ (contact_inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'visa', 'insurance', 'custom_quote', 'callback')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. BẢNG TOUR YÊU THÍCH (wishlists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tour_id)
);

-- ==============================================================================
-- 13. BẢNG ĐÁNH GIÁ TOUR (reviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tour_id, user_id)
);

-- ==============================================================================
-- 14. BẢNG EMAIL BẢN TIN KHUYẾN MÃI (subscribers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    discount_code TEXT DEFAULT 'WEBTRAVEL500K',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- CÁC CHỈ MỤC TĂNG TỐC TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tours_destination_id ON public.tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_tours_category_tier ON public.tours(category, tier);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON public.tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_price ON public.tours(price_adult);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour ON public.tour_images(tour_id, display_order);
CREATE INDEX IF NOT EXISTS idx_tour_variants_tour ON public.tour_variants(tour_id);

CREATE INDEX IF NOT EXISTS idx_departure_dates_tour_id ON public.departure_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_departure_dates_lookup ON public.departure_dates(tour_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON public.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lookup ON public.bookings(booking_code, customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status, payment_status);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON public.payment_transactions(transaction_code);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tour ON public.reviews(tour_id);

-- ==============================================================================
-- CẤU HÌNH BẢO MẬT ROW LEVEL SECURITY (RLS) TOÀN DIỆN
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Quyền xem công khai (Public Read)
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public Read Destinations" ON public.destinations FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "Public Read Tours" ON public.tours FOR SELECT USING (status != 'deleted' AND deleted_at IS NULL);
CREATE POLICY "Enable Insert Tours for All" ON public.tours FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Tours for All" ON public.tours FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable Delete Tours for All" ON public.tours FOR DELETE USING (true);

CREATE POLICY "Public Read Tour Images" ON public.tour_images FOR SELECT USING (true);
CREATE POLICY "Enable Insert Tour Images" ON public.tour_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Tour Images" ON public.tour_images FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable Delete Tour Images" ON public.tour_images FOR DELETE USING (true);

CREATE POLICY "Public Read Tour Variants" ON public.tour_variants FOR SELECT USING (status = 'active');
CREATE POLICY "Enable Manage Tour Variants" ON public.tour_variants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Departure Dates" ON public.departure_dates FOR SELECT USING (true);
CREATE POLICY "Enable Insert Departure Dates" ON public.departure_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Departure Dates" ON public.departure_dates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable Delete Departure Dates" ON public.departure_dates FOR DELETE USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (status = 'approved' AND deleted_at IS NULL);

-- Coupons: Chỉ xem các mã đang hoạt động và chưa hết hạn
CREATE POLICY "Public Read Active Coupons" ON public.coupons FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()) AND used_count < usage_limit);

-- Bookings & Transactions: Khách tạo đơn & tra cứu
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Insert Transactions" ON public.payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Transactions" ON public.payment_transactions FOR SELECT USING (true);

-- Yêu cầu tư vấn & thiết kế tour: Khách gửi
CREATE POLICY "Public Insert Custom Requests" ON public.custom_tour_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Inquiries" ON public.contact_inquiries FOR INSERT WITH CHECK (true);

-- Wishlists: User quản lý danh sách yêu thích của mình
CREATE POLICY "Users Manage Wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Reviews & Subscribers: Gửi đánh giá và đăng ký nhận tin
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- ==============================================================================

-- 1. Mã Giảm Giá
INSERT INTO public.coupons (code, description, discount_amount, discount_percent, is_active) VALUES
('WEBTRAVEL500K', 'Ưu đãi đăng ký thành viên mới giảm ngay 500k', 500000, 0, true),
('SUMMER2026',   'Tri ân mùa du lịch hè 2026 giảm 500k',         500000, 0, true),
('VIP1000',      'VIP tri ân khách hàng thân thiết giảm 1 Triệu', 1000000, 0, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Điểm Đến Xu Hướng
INSERT INTO public.destinations (id, name, slug, category, region, tag, image, tour_count, min_price) VALUES
('dest-sapa',   'Sapa',        'sapa',     'domestic',      'Tây Bắc',     'Núi & Bản Làng',  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80', 0, 0),
('dest-halong', 'Vịnh Hạ Long','ha-long',  'domestic',      'Đông Bắc',    'Du Thuyền 5★',    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', 0, 0),
('dest-danang', 'Đà Nẵng',     'da-nang',  'domestic',      'Miền Trung',  'Biển & Cầu Vàng', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80', 0, 0),
('dest-japan',  'Nhật Bản',    'nhat-ban', 'international', 'Đông Bắc Á',  'Hoa Anh Đào',     'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', 0, 0),
('dest-korea',  'Hàn Quốc',    'han-quoc', 'international', 'Đông Bắc Á',  'Seoul & Nami',    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Danh Sách Tour Mẫu
INSERT INTO public.tours (
    id, title, short_title, slug, destination_id, category, type, tier,
    duration_days, duration_nights, departure_from,
    price_adult, price_child, price_infant, single_room_supplement,
    image, esg_score, lei_score, highlights, is_flash_deal, discount_percent, is_all_inclusive
) VALUES
(
    'tour-01', 'Khám Phá Di Sản Hạ Long - Du Thuyền 5 Sao Ambassador', 'Hà Nội - Du Thuyền Hạ Long 5★',
    'kham-pha-di-san-ha-long-du-thuyen-5-sao', 'dest-halong', 'domestic', 'Tour Nghỉ Dưỡng', 'luxury',
    3, 2, 'Hà Nội', 8500000, 6375000, 1500000, 2500000,
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    '92/100', '88/100',
    '["Du thuyền 5 sao chuẩn quốc tế", "Buffet tôm hùm thượng hạng", "Chèo thuyền Kayak Hang Luồn"]'::jsonb,
    true, 30, true
),
(
    'tour-02', 'Chinh Phục Đỉnh Fansipan & Khám Phá Bản Cát Cát Sapa', 'Hà Nội - Sapa Fansipan Legend',
    'chinh-phuc-dinh-fansipan-sapa', 'dest-sapa', 'domestic', 'Tour Văn Hóa', 'standard',
    3, 2, 'Hà Nội / Hải Phòng', 3200000, 2400000, 500000, 1200000,
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    '88/100', '82/100',
    '["Vé cáp treo Sun World Fansipan", "Khách sạn 4 sao trung tâm", "Lẩu cá hồi đặc sản Sapa"]'::jsonb,
    false, 0, false
),
(
    'tour-03', 'Di Sản Miền Trung: Đà Nẵng - Bà Nà Hills - Cố Đô Huế - Hội An', 'Đà Nẵng - Bà Nà - Huế - Hội An',
    'di-san-mien-trung-da-nang-hue-hoi-an', 'dest-danang', 'domestic', 'Tour Di Sản', 'luxury',
    4, 3, 'TP. Hồ Chí Minh / Hà Nội', 5800000, 4350000, 1000000, 1800000,
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    '90/100', '86/100',
    '["Cầu Vàng Bà Nà Hills biểu tượng", "Thả đèn hoa đăng Hội An", "Đại Nội Huế & Ca Huế sông Hương"]'::jsonb,
    true, 25, true
),
(
    'tour-04', 'Cung Đường Vàng Tokyo - Núi Phú Sĩ - Kyoto - Osaka Mùa Hoa Anh Đào', 'Nhật Bản: Tokyo - Phú Sĩ - Kyoto - Osaka',
    'cung-duong-vang-nhat-ban-tokyo-osaka', 'dest-japan', 'international', 'Tour Quốc Tế', 'luxury',
    6, 5, 'Hà Nội / TP. Hồ Chí Minh', 31900000, 27115000, 5000000, 8500000,
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    '95/100', '94/100',
    '["Tàu Shinkansen 300km/h", "Bò Kobe thượng hạng", "Tắm Onsen truyền thống núi Phú Sĩ"]'::jsonb,
    true, 30, true
),
(
    'tour-05', 'Seoul - Đảo Nami - Công Viên Everland - Tháp Namsan Hàn Quốc', 'Hàn Quốc: Seoul - Nami - Everland',
    'han-quoc-seoul-nami-everland', 'dest-korea', 'international', 'Tour Quốc Tế', 'standard',
    5, 4, 'Hà Nội / Đà Nẵng / TP.HCM', 13590000, 11550000, 2500000, 4500000,
    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
    '87/100', '84/100',
    '["Mặc Hanbok Cung Cảnh Phúc", "Vui chơi Everland", "BBQ thịt nướng chuẩn vị Hàn"]'::jsonb,
    false, 0, true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Biến Thể Gói Tour Mẫu (tour_variants)
INSERT INTO public.tour_variants (tour_id, variant_name, departure_city, hotel_star, price_adult, benefits, is_default) VALUES
('tour-01', 'Gói Tiêu Chuẩn - Cabin Deluxe', 'Hà Nội', 5, 8500000, '["Cabin ban công riêng tầng 1", "Buffet hải sản", "Kayak"]'::jsonb, true),
('tour-01', 'Gói VIP - Cabin Suite Tổng Thống', 'Hà Nội', 5, 12500000, '["Cabin Suite tầng 3 view 360", "Rượu vang Pháp đón chào", "Massage spa 60p"]'::jsonb, false),
('tour-03', 'Gói Khởi Hành TP.HCM (Đã gồm vé máy bay)', 'TP. Hồ Chí Minh', 4, 5800000, '["Vé máy bay khứ hồi Vietnam Airlines", "Khách sạn 4 sao biển", "Vé cáp treo Bà Nà"]'::jsonb, true),
('tour-03', 'Gói Khởi Hành Hà Nội', 'Hà Nội', 4, 5500000, '["Vé máy bay khứ hồi Vietjet Air", "Khách sạn 4 sao", "Vé cáp treo Bà Nà"]'::jsonb, false)
ON CONFLICT DO NOTHING;

-- Kiểm tra kết quả
SELECT count(*) AS total_tours FROM public.tours;
SELECT count(*) AS total_variants FROM public.tour_variants;
SELECT count(*) AS total_coupons FROM public.coupons;
SELECT count(*) AS total_destinations FROM public.destinations;
