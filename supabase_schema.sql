-- ==============================================================================
-- WEBTRAVEL EDITORIAL - COMPLETE PRODUCTION DATABASE SCHEMA (POSTGRESQL + SUPABASE)
-- Phiên bản: 4.0 - CHUẨN ENTERPRISE TOÀN DIỆN (FULL CONSTRAINTS, RLS, TRIGGERS & SEED DATA)
-- ==============================================================================
-- Hướng dẫn: Copy toàn bộ nội dung file này và Dán (Paste) vào Supabase SQL Editor
-- Sau đó nhấn nút [ RUN ] để khởi tạo hệ thống bảng, phân quyền bảo mật & dữ liệu mẫu.
-- ==============================================================================

-- 1. BẬT EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. HÀM HỖ TRỢ XÁC THỰC QUYỀN HẠN (SECURITY HELPER FUNCTIONS)
-- ==============================================================================
-- NOTE: is_admin() phải được tạo SAU bảng profiles
-- Placeholder tạm thời để các đối tượng khác có thể tham chiếu; sẽ REPLACE đầy đủ sau.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN false; -- Placeholder; xem phần thay thế cuối phần khai báo bảng
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 3. BẢNG HỒ SƠ NGƯỜI DÙNG & PHÂN QUYỀN (profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,                      -- Mã ID người dùng, liên kết auth.users
    email TEXT UNIQUE NOT NULL,                                                           -- Email đăng nhập
    full_name TEXT,                                                                       -- Họ và tên đầy đủ
    phone TEXT,                                                                           -- Số điện thoại liên hệ
    avatar_url TEXT,                                                                      -- URL ảnh đại diện
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin', 'super_admin')), -- Phân quyền
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),                         -- Điểm thưởng tích lũy
    address TEXT,                                                                         -- Địa chỉ cư trú
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deleted')), -- Trạng thái tài khoản
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Ngày đăng ký
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Ngày cập nhật gần nhất
);

-- Trigger tự động tạo profile khi đăng ký tài khoản mới qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone, address)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'customer'),
        NULLIF(new.raw_user_meta_data->>'phone', ''),
        NULLIF(new.raw_user_meta_data->>'address', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        address = COALESCE(NULLIF(EXCLUDED.address, ''), public.profiles.address),
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger đồng bộ email profiles khi user đổi email
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
-- ** THAY THẾ is_admin() ĐẦY ĐỦ SAU KHI BẢNG profiles ĐÃ TỒN TẠI **
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'super_admin', 'staff')
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 4. BẢNG ĐIỂM ĐẾN DU LỊCH (destinations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.destinations (
    id TEXT PRIMARY KEY,                                                                  -- Mã điểm đến (VD: 'dest-sapa', 'dest-japan')
    name TEXT NOT NULL,                                                                   -- Tên địa danh (VD: "Sapa", "Nhật Bản")
    slug TEXT UNIQUE NOT NULL,                                                            -- URL slug SEO
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),             -- 'domestic' (Trong nước) / 'international' (Quốc tế)
    region TEXT,                                                                          -- Vùng miền (VD: "Tây Bắc", "Đông Bắc Á")
    tag TEXT,                                                                             -- Nhãn ngắn đặc trưng (VD: "Núi & Bản Làng")
    image TEXT NOT NULL,                                                                  -- URL ảnh đại diện tiêu biểu
    tour_count INTEGER DEFAULT 0 CHECK (tour_count >= 0),                                 -- Tổng số lượng tour (tự động cập nhật)
    min_price NUMERIC DEFAULT 0 CHECK (min_price >= 0),                                   -- Giá tour thấp nhất (tự động cập nhật)
    is_featured BOOLEAN DEFAULT true,                                                     -- Hiển thị nổi bật trang chủ
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')), -- Trạng thái
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tạo
);

-- ==============================================================================
-- 5. BẢNG DANH SÁCH TOUR (tours)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tours (
    id TEXT PRIMARY KEY,                                                                  -- Mã tour (VD: 'tour-01', 'tour-sapa-02')
    title TEXT NOT NULL,                                                                  -- Tiêu đề đầy đủ
    short_title TEXT,                                                                     -- Tiêu đề ngắn gọn
    code TEXT UNIQUE,                                                                     -- Mã quản lý tour (VD: "WT-HALONG-4N3D")
    slug TEXT UNIQUE NOT NULL,                                                            -- Slug SEO
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE SET NULL,           -- Khóa ngoại liên kết điểm đến
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),             -- Địa lý: domestic / international
    travel_style TEXT DEFAULT 'package' CHECK (travel_style IN ('package', 'combo', 'private', 'mice')), -- Hình thức tour
    theme TEXT DEFAULT 'beach' CHECK (theme IN ('beach', 'heritage', 'adventure', 'family', 'wellness', 'culinary')), -- Chủ đề
    type TEXT,                                                                            -- Tên hiển thị loại hình
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('luxury', 'standard', 'budget')),         -- Hạng sao dịch vụ
    duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days >= 1),                  -- Số ngày
    duration_nights INTEGER NOT NULL DEFAULT 0 CHECK (duration_nights >= 0),              -- Số đêm
    departure_from TEXT NOT NULL,                                                         -- Điểm xuất phát (Hà Nội, TP.HCM...)
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),                                -- Giá vé người lớn (>= 12 tuổi)
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),                  -- Giá vé trẻ em (5-11 tuổi)
    price_toddler NUMERIC CHECK (price_toddler IS NULL OR price_toddler >= 0),            -- Giá vé trẻ nhỏ (2-4 tuổi)
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),               -- Giá vé em bé (< 2 tuổi)
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),        -- Phụ thu phòng đơn
    original_price NUMERIC CHECK (original_price IS NULL OR original_price >= 0),         -- Giá niêm yết trước giảm
    is_flash_deal BOOLEAN DEFAULT false,                                                  -- Tour Flash Sale
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100), -- Mức giảm %
    is_all_inclusive BOOLEAN DEFAULT false,                                               -- Tour trọn gói 100%
    seats_left INTEGER DEFAULT 15 CHECK (seats_left >= 0),                                -- Số chỗ dự phòng
    badge TEXT DEFAULT 'Nổi Bật',                                                         -- Huy hiệu (VD: "Bán Chạy", "5 Sao")
    image TEXT NOT NULL,                                                                  -- Ảnh bìa chính
    gallery JSONB DEFAULT '[]'::jsonb,                                                    -- Album ảnh
    available_dates JSONB DEFAULT '[]'::jsonb,                                            -- Mảng ngày mở bán dạng chuỗi
    departure_dates JSONB DEFAULT '[]'::jsonb,                                            -- Chi tiết từng ngày (ngày, giá, số chỗ)
    hotel_specs JSONB DEFAULT '{}'::jsonb,                                                -- Thông tin khách sạn cam kết
    highlights JSONB DEFAULT '[]'::jsonb,                                                 -- Điểm nhấn tour
    itinerary JSONB DEFAULT '[]'::jsonb,                                                  -- Lịch trình chi tiết từng ngày
    included JSONB DEFAULT '[]'::jsonb,                                                   -- Dịch vụ bao gồm
    excluded JSONB DEFAULT '[]'::jsonb,                                                   -- Dịch vụ không bao gồm
    refund_policy JSONB DEFAULT '[]'::jsonb,                                              -- Chính sách hoàn hủy
    faqs JSONB DEFAULT '[]'::jsonb,                                                       -- Câu hỏi thường gặp
    esg_score TEXT DEFAULT '85/100',                                                      -- Điểm du lịch bền vững
    lei_score TEXT DEFAULT '78/100',                                                      -- Điểm trải nghiệm văn hóa
    rating NUMERIC DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),                       -- Điểm đánh giá (1-5 sao)
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),                           -- Số lượt review
    weather_notice TEXT,                                                                  -- Cảnh báo thời tiết đặc biệt
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'hidden', 'weather_suspended', 'deleted')), -- Trạng thái tour
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm tạo
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm cập nhật
);

-- Trigger tự động đồng bộ thống kê cho bảng destinations
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
-- 6. BẢNG THƯ VIỆN HÌNH ẢNH TOUR (tour_images)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tour_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    alt_text TEXT,
    category TEXT DEFAULT 'attraction' CHECK (category IN ('hotel', 'attraction', 'food', 'cruise', 'activity', 'other')),
    display_order INTEGER DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. BẢNG BIẾN THỂ GÓI DỊCH VỤ TOUR (tour_variants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tour_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,                                                           -- VD: "Gói Tiêu Chuẩn 3★", "Gói VIP 5★ Vinpearl"
    departure_city TEXT,
    hotel_star INTEGER DEFAULT 3 CHECK (hotel_star BETWEEN 1 AND 5),
    flight_included BOOLEAN DEFAULT true,
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),
    price_toddler NUMERIC CHECK (price_toddler IS NULL OR price_toddler >= 0),
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),
    benefits JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. BẢNG LỊCH KHỞI HÀNH & QUẢN LÝ CHỖ TRỐNG (departure_dates)
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
-- 9. BẢNG MÃ GIẢM GIÁ & KHUYẾN MÃI (coupons)
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
-- 10. BẢNG ĐƠN ĐẶT TOUR (bookings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL,                                                    -- Mã đơn: 'WT-20260824-001'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,                       -- Khóa ngoại tài khoản thành viên
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,                 -- Chặn xóa tour đang có đơn
    variant_id UUID REFERENCES public.tour_variants(id) ON DELETE SET NULL,
    tour_title TEXT NOT NULL,                                                             -- Lưu cứng tiêu đề tour đối soát
    departure_date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_address TEXT,
    customer_notes TEXT,
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 1),
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
    toddlers_count INTEGER NOT NULL DEFAULT 0 CHECK (toddlers_count >= 0),
    infants_count INTEGER NOT NULL DEFAULT 0 CHECK (infants_count >= 0),
    single_rooms_count INTEGER NOT NULL DEFAULT 0 CHECK (single_rooms_count >= 0),
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'failed', 'refunded')),
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger quản lý trừ / hoàn ghế tự động
CREATE OR REPLACE FUNCTION public.fn_manage_departure_seats()
RETURNS TRIGGER AS $$
DECLARE
    total_pax INTEGER;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.booking_status != 'cancelled') THEN
        total_pax := NEW.adults_count + NEW.children_count + COALESCE(NEW.toddlers_count, 0) + NEW.infants_count;
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
        total_pax := OLD.adults_count + OLD.children_count + COALESCE(OLD.toddlers_count, 0) + OLD.infants_count;
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

-- Trigger tự động tăng / hoàn số lượt dùng coupon
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

-- Trigger tích lũy điểm thưởng thành viên (Loyalty Points: 1 điểm mỗi 100.000 VNĐ)
CREATE OR REPLACE FUNCTION public.fn_manage_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    points_to_add INTEGER;
    points_to_sub INTEGER;
BEGIN
    -- Khi đơn hàng chuyển sang 'completed' -> Tích điểm cho khách có tài khoản
    IF (TG_OP = 'UPDATE' AND OLD.booking_status != 'completed' AND NEW.booking_status = 'completed' AND NEW.user_id IS NOT NULL) THEN
        points_to_add := FLOOR(NEW.total_amount / 100000);
        IF points_to_add > 0 THEN
            UPDATE public.profiles
            SET loyalty_points = loyalty_points + points_to_add,
                updated_at = now()
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    -- Nếu đơn đã completed mà bị hủy/hoàn -> Trừ lại điểm đã cộng
    IF (TG_OP = 'UPDATE' AND OLD.booking_status = 'completed' AND NEW.booking_status IN ('cancelled', 'refunded') AND OLD.user_id IS NOT NULL) THEN
        points_to_sub := FLOOR(OLD.total_amount / 100000);
        IF points_to_sub > 0 THEN
            UPDATE public.profiles
            SET loyalty_points = GREATEST(0, loyalty_points - points_to_sub),
                updated_at = now()
            WHERE id = OLD.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_manage_loyalty_points ON public.bookings;
CREATE TRIGGER trg_manage_loyalty_points
    AFTER UPDATE OF booking_status ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.fn_manage_loyalty_points();

-- ==============================================================================
-- 11. BẢNG LỊCH SỬ GIAO DỊCH THANH TOÁN (payment_transactions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_code TEXT NOT NULL,
    transaction_code TEXT UNIQUE NOT NULL,
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

-- Trigger tự động đồng bộ số tiền đã thanh toán và cập nhật trạng thái đơn hàng
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
-- 12. BẢNG YÊU CẦU TỰ THIẾT KẾ TOUR (custom_tour_requests)
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
-- 13. BẢNG YÊU CẦU TƯ VẤN & LIÊN HỆ (contact_inquiries)
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
-- 14. BẢNG TOUR YÊU THÍCH (wishlists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tour_id)
);

-- ==============================================================================
-- 15. BẢNG ĐÁNH GIÁ & BÌNH LUẬN TOUR (reviews)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger tự động đồng bộ Rating trung bình và số lượng đánh giá cho Tour
CREATE OR REPLACE FUNCTION public.sync_tour_ratings()
RETURNS TRIGGER AS $$
DECLARE
    target_tour_id TEXT;
    avg_score NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- Xác định tour_id cần cập nhật (DELETE dùng OLD, còn lại dùng NEW)
    IF TG_OP = 'DELETE' THEN
        target_tour_id := OLD.tour_id;
    ELSE
        target_tour_id := NEW.tour_id;
    END IF;

    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0),
        COUNT(*)
    INTO avg_score, total_reviews
    FROM public.reviews
    WHERE tour_id = target_tour_id
      AND status = 'approved'
      AND deleted_at IS NULL;

    UPDATE public.tours
    SET
        rating = avg_score,
        reviews_count = total_reviews,
        updated_at = now()
    WHERE id = target_tour_id;

    -- AFTER ROW trigger: trả về NULL hợp lệ khi không cần modify row
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_tour_ratings ON public.reviews;
CREATE TRIGGER trg_sync_tour_ratings
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.sync_tour_ratings();

-- ==============================================================================
-- 16. BẢNG EMAIL NHẬN BẢN TIN (subscribers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    discount_code TEXT DEFAULT 'WEBTRAVEL500K',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 17. BẢNG THÔNG BÁO HỆ THỐNG (notifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'booking_confirmed', 'payment_success', 'tour_reminder', 'promo')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 18. BẢNG BÀI VIẾT TẠP CHÍ DU LỊCH (blog_posts - Travel Journal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'WebTravel Editorial',
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'travel_tips' CHECK (category IN ('travel_tips', 'destination_guide', 'culinary', 'news', 'culture')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    read_time_minutes INTEGER DEFAULT 5,
    views_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 19. CÁC CHỈ MỤC TĂNG TỐC TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role, status);
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
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(departure_date);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON public.payment_transactions(transaction_code);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tour ON public.reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status, published_at);

-- ==============================================================================
-- 20. CẤU HÌNH PHÂN QUYỀN ROW LEVEL SECURITY (RLS) CHUẨN BẢO MẬT
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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Profiles Read Access" ON public.profiles;
CREATE POLICY "Profiles Read Access" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles Update Access" ON public.profiles;
CREATE POLICY "Profiles Update Access" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. Destinations
DROP POLICY IF EXISTS "Destinations Public Read" ON public.destinations;
CREATE POLICY "Destinations Public Read" ON public.destinations FOR SELECT USING ((status = 'active' AND deleted_at IS NULL) OR public.is_admin());

DROP POLICY IF EXISTS "Destinations Admin Manage" ON public.destinations;
CREATE POLICY "Destinations Admin Manage" ON public.destinations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Tours
DROP POLICY IF EXISTS "Tours Public Read" ON public.tours;
CREATE POLICY "Tours Public Read" ON public.tours FOR SELECT USING ((status != 'deleted' AND deleted_at IS NULL) OR public.is_admin());

DROP POLICY IF EXISTS "Tours Admin Manage" ON public.tours;
CREATE POLICY "Tours Admin Manage" ON public.tours FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Tour Images
DROP POLICY IF EXISTS "Tour Images Public Read" ON public.tour_images;
CREATE POLICY "Tour Images Public Read" ON public.tour_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tour Images Admin Manage" ON public.tour_images;
CREATE POLICY "Tour Images Admin Manage" ON public.tour_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Tour Variants
DROP POLICY IF EXISTS "Tour Variants Public Read" ON public.tour_variants;
CREATE POLICY "Tour Variants Public Read" ON public.tour_variants FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Tour Variants Admin Manage" ON public.tour_variants;
CREATE POLICY "Tour Variants Admin Manage" ON public.tour_variants FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. Departure Dates
DROP POLICY IF EXISTS "Departure Dates Public Read" ON public.departure_dates;
CREATE POLICY "Departure Dates Public Read" ON public.departure_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Departure Dates Admin Manage" ON public.departure_dates;
CREATE POLICY "Departure Dates Admin Manage" ON public.departure_dates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. Coupons
DROP POLICY IF EXISTS "Coupons Public Read Active" ON public.coupons;
CREATE POLICY "Coupons Public Read Active" ON public.coupons FOR SELECT USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > now()) AND used_count < usage_limit)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Coupons Admin Manage" ON public.coupons;
CREATE POLICY "Coupons Admin Manage" ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Bookings
DROP POLICY IF EXISTS "Bookings Insert Public" ON public.bookings;
CREATE POLICY "Bookings Insert Public" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Bookings Read Access" ON public.bookings;
CREATE POLICY "Bookings Read Access" ON public.bookings FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Bookings Update Access" ON public.bookings;
CREATE POLICY "Bookings Update Access" ON public.bookings FOR UPDATE USING (
    public.is_admin() OR (auth.uid() IS NOT NULL AND user_id = auth.uid() AND booking_status = 'pending')
) WITH CHECK (
    public.is_admin() OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Bookings Delete Access" ON public.bookings;
CREATE POLICY "Bookings Delete Access" ON public.bookings FOR DELETE USING (public.is_admin());

-- 9. Payment Transactions
DROP POLICY IF EXISTS "Transactions Insert Public" ON public.payment_transactions;
CREATE POLICY "Transactions Insert Public" ON public.payment_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Transactions Read Access" ON public.payment_transactions;
CREATE POLICY "Transactions Read Access" ON public.payment_transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = payment_transactions.booking_id 
          AND ((auth.uid() IS NOT NULL AND b.user_id = auth.uid()) OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "Transactions Admin Manage" ON public.payment_transactions;
CREATE POLICY "Transactions Admin Manage" ON public.payment_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. Custom Requests & Contact Inquiries
DROP POLICY IF EXISTS "Custom Requests Insert" ON public.custom_tour_requests;
CREATE POLICY "Custom Requests Insert" ON public.custom_tour_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Custom Requests Read" ON public.custom_tour_requests;
CREATE POLICY "Custom Requests Read" ON public.custom_tour_requests FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Custom Requests Admin Manage" ON public.custom_tour_requests;
CREATE POLICY "Custom Requests Admin Manage" ON public.custom_tour_requests FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Contact Inquiries Insert" ON public.contact_inquiries;
CREATE POLICY "Contact Inquiries Insert" ON public.contact_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Contact Inquiries Admin Manage" ON public.contact_inquiries;
CREATE POLICY "Contact Inquiries Admin Manage" ON public.contact_inquiries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 11. Wishlists
DROP POLICY IF EXISTS "Wishlists User Manage" ON public.wishlists;
CREATE POLICY "Wishlists User Manage" ON public.wishlists FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 12. Reviews
DROP POLICY IF EXISTS "Reviews Public Read" ON public.reviews;
CREATE POLICY "Reviews Public Read" ON public.reviews FOR SELECT USING (
    (status = 'approved' AND deleted_at IS NULL) OR public.is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Reviews Public Insert" ON public.reviews;
CREATE POLICY "Reviews Public Insert" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews Admin Manage" ON public.reviews;
CREATE POLICY "Reviews Admin Manage" ON public.reviews FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 13. Subscribers
DROP POLICY IF EXISTS "Subscribers Public Insert" ON public.subscribers;
CREATE POLICY "Subscribers Public Insert" ON public.subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Subscribers Admin Manage" ON public.subscribers;
CREATE POLICY "Subscribers Admin Manage" ON public.subscribers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 14. Notifications
DROP POLICY IF EXISTS "Notifications User Access" ON public.notifications;
CREATE POLICY "Notifications User Access" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Notifications User Update" ON public.notifications;
CREATE POLICY "Notifications User Update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Cho phép hệ thống (service_role / trigger) tạo thông báo mới cho user
DROP POLICY IF EXISTS "Notifications System Insert" ON public.notifications;
CREATE POLICY "Notifications System Insert" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications Admin Manage" ON public.notifications;
CREATE POLICY "Notifications Admin Manage" ON public.notifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 15. Blog Posts
DROP POLICY IF EXISTS "Blog Posts Public Read" ON public.blog_posts;
CREATE POLICY "Blog Posts Public Read" ON public.blog_posts FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Blog Posts Admin Manage" ON public.blog_posts;
CREATE POLICY "Blog Posts Admin Manage" ON public.blog_posts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 21. CẤP QUYỀN TRUY CẬP CHO ROLES DATABASE
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- 22. DỮ LIỆU KHỞI TẠO MẪU TOÀN DIỆN (SEED DATA CHUẨN ĐẦY ĐỦ THUỘC TÍNH)
-- ==============================================================================

-- 1. Mã Giảm Giá
INSERT INTO public.coupons (code, description, discount_amount, discount_percent, min_order_value, usage_limit, used_count, is_active) VALUES
('WEBTRAVEL500K', 'Ưu đãi đăng ký thành viên mới giảm ngay 500k', 500000, 0, 3000000, 500, 0, true),
('SUMMER2026',   'Tri ân mùa du lịch hè 2026 giảm 500k',         500000, 0, 4000000, 200, 0, true),
('VIP1000',      'VIP tri ân khách hàng thân thiết giảm 1 Triệu', 1000000, 0, 8000000, 100, 0, true),
('DISCOUNT10',   'Giảm ngay 10% cho tất cả các gói tour gia đình', 0, 10, 5000000, 300, 0, true)
ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    discount_amount = EXCLUDED.discount_amount,
    discount_percent = EXCLUDED.discount_percent,
    is_active = true;

-- 2. Điểm Đến Xu Hướng
INSERT INTO public.destinations (id, name, slug, category, region, tag, image, is_featured, tour_count, min_price) VALUES
('dest-sapa',     'Sapa',          'sapa',          'domestic',      'Tây Bắc',     'Núi & Bản Làng',  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80', true, 1, 3890000),
('dest-halong',   'Vịnh Hạ Long',  'ha-long',       'domestic',      'Đông Bắc',    'Du Thuyền 5★',    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', true, 1, 4590000),
('dest-danang',   'Đà Nẵng',       'da-nang',       'domestic',      'Miền Trung',  'Biển & Cầu Vàng', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80', true, 1, 4890000),
('dest-phuquoc',  'Phú Quốc',      'phu-quoc',      'domestic',      'Miền Nam',    'Đảo Ngọc Resort', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', true, 1, 5990000),
('dest-japan',    'Nhật Bản',      'nhat-ban',      'international', 'Đông Bắc Á',  'Hoa Anh Đào & Núi Phú Sĩ', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', true, 1, 28900000),
('dest-korea',    'Hàn Quốc',      'han-quoc',      'international', 'Đông Bắc Á',  'Seoul & Đảo Nami','https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1200&q=80', true, 1, 18900000),
('dest-thailand', 'Thái Lan',      'thai-lan',      'international', 'Đông Nam Á',  'Bangkok & Pattaya', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80', true, 1, 7990000),
('dest-europe',   'Châu Âu 5 Nước','chau-au',       'international', 'Tây Âu',      'Pháp - Thụy Sĩ - Ý', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80', true, 1, 68900000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    category = EXCLUDED.category,
    region = EXCLUDED.region;

-- 3. Danh Sách Tour Du Lịch Mẫu Đầy Đủ Tất Cả Thuộc Tính
INSERT INTO public.tours (
    id, title, short_title, code, slug, destination_id, category, travel_style, theme, type, tier,
    duration_days, duration_nights, departure_from, price_adult, price_child, price_toddler, price_infant,
    single_room_supplement, original_price, is_flash_deal, discount_percent, is_all_inclusive, seats_left,
    badge, image, gallery, available_dates, departure_dates, hotel_specs, highlights, itinerary,
    included, excluded, refund_policy, faqs, esg_score, lei_score, rating, reviews_count, weather_notice, status
) VALUES
(
    'tour-01',
    'Khám Phá Di Sản Hạ Long - Du Thuyền 5 Sao Ambassador Signature',
    'Hà Nội - Du Thuyền Hạ Long 5★',
    'WT-HALONG-3N2D-01',
    'kham-pha-di-san-ha-long-du-thuyen-5-sao',
    'dest-halong',
    'domestic',
    'package',
    'beach',
    'Nghỉ Dưỡng & Du Thuyền 5★',
    'luxury',
    3, 2,
    'Hà Nội',
    4590000, 3442500, 2295000, 500000,
    1500000, 5990000, true, 23, true, 12,
    'Bán Chạy Nhất',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    '[
        {"url": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80", "title": "Du thuyền 5★ Ambassador"},
        {"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "title": "Vịnh di sản Hạ Long"},
        {"url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80", "title": "Bình minh trên biển"}
    ]'::jsonb,
    '["15/09/2026", "22/09/2026", "29/09/2026", "05/10/2026"]'::jsonb,
    '[
        {"date": "2026-09-15", "day": "15", "weekday": "Thứ 3", "month": "Tháng 09", "seats": 12, "price": 4590000, "status": "available"},
        {"date": "2026-09-22", "day": "22", "weekday": "Thứ 3", "month": "Tháng 09", "seats": 8, "price": 4590000, "status": "available"},
        {"date": "2026-09-29", "day": "29", "weekday": "Thứ 3", "month": "Tháng 09", "seats": 4, "price": 4890000, "status": "few_seats"},
        {"date": "2026-10-05", "day": "05", "weekday": "Thứ 2", "month": "Tháng 10", "seats": 15, "price": 4590000, "status": "available"}
    ]'::jsonb,
    '{
        "hotelName": "Du Thuyền 5 Sao Ambassador Signature",
        "roomType": "Deluxe Balcony Cabin (Ban công riêng ngắm vịnh)",
        "inclusions": ["Bể sục Jacuzzi bốn mùa ngoài trời", "Buffet hải sản tôm hùm thượng hạng", "Phòng tập Gym & Spa view biển", "Trà chiều Hoàng Hôn phong cách Âu"]
    }'::jsonb,
    '[
        "Trải nghiệm nghỉ đêm trên du thuyền chuẩn 5 sao sang trọng nhất Vịnh Hạ Long",
        "Thưởng thức đại tiệc Buffet tôm hùm không giới hạn cùng nhạc sống Acoustic",
        "Chèo thuyền Kayak khám phá Hang Sửng Sốt và Đảo Ti Tốp tuyệt mỹ",
        "Xe Limousine VIP đưa đón tận nơi từ trung tâm Hà Nội"
    ]'::jsonb,
    '[
        {"day": 1, "title": "Hà Nội - Vịnh Hạ Long - Check-in Du Thuyền 5★ Ambassador", "meals": "Trưa, Tối", "hotel": "Du Thuyền Ambassador 5★", "activities": "08:00 Xe Limousine đón quý khách tại Hà Nội khởi hành đi Hạ Long. 12:00 Làm thủ tục check-in lên du thuyền, thưởng thức đồ uống chào mừng. 13:00 Dùng bữa trưa buffet hải sản thượng hạng trong lúc du thuyền lướt qua Hòn Trống Mái. Chiều chèo kayak tại Hang Luồn và tắm biển tại Đảo Ti Tốp."},
        {"day": 2, "title": "Khám Phá Hang Sửng Sốt - Làng Chài Cửa Vạn - Hoàng Hôn Vịnh", "meals": "Sáng, Trưa, Tối", "hotel": "Du Thuyền Ambassador 5★", "activities": "06:30 Tập Thái Cực Quyền (Taichi) đón bình minh trên boong tàu. 08:00 Thăm Hang Sửng Sốt - hang động rộng và đẹp nhất vịnh. Chiều tham quan làng ngọc trai và trải nghiệm lớp học nấu món ăn truyền thống Việt Nam."},
        {"day": 3, "title": "Chào Bình Minh Vịnh Di Sản - Trở Về Hà Nội", "meals": "Sáng, Trưa nhẹ", "hotel": "Kết thúc tour", "activities": "07:00 Ăn sáng nhẹ ngắm bình minh. 09:30 Làm thủ tục trả phòng và thưởng thức bữa trưa sớm trên tàu. 11:30 Cập bến Tuần Châu, xe đưa đoàn về lại điểm hẹn tại Hà Nội."}
    ]'::jsonb,
    '["Xe Limousine 9 chỗ đưa đón khứ hồi Hà Nội - Hạ Long", "2 đêm nghỉ phòng Deluxe Balcony trên Du thuyền 5 sao", "Toàn bộ 05 bữa ăn thượng hạng theo chương trình (có Buffet tôm hùm)", "Vé tham quan các danh thắng và phí bảo hiểm du lịch 100.000.000đ/vụ", "Thuyền Kayak và dụng cụ câu mực đêm"]'::jsonb,
    '["Chi phí đồ uống cá nhân ngoài thực đơn", "Dịch vụ Spa & Massage trên du thuyền", "Tiền tip cho hướng dẫn viên và thủy thủ đoàn (tùy tâm)"]'::jsonb,
    '[
        {"condition": "Hủy trước 15 ngày khởi hành", "fee": "Hoàn 100% tiền vé (Miễn phí hủy)"},
        {"condition": "Hủy từ 07 đến 14 ngày trước khởi hành", "fee": "Phí hủy 25% giá tour"},
        {"condition": "Hủy từ 03 đến 06 ngày trước khởi hành", "fee": "Phí hủy 50% giá tour"},
        {"condition": "Hủy dưới 72 giờ trước khởi hành", "fee": "Không hoàn tiền (100% phí)"}
    ]'::jsonb,
    '[
        {"q": "Trẻ em 3 tuổi có được miễn phí không?", "a": "Trẻ dưới 5 tuổi được miễn phí vé tour cơ bản, phụ thu vé tham quan vịnh và bảo hiểm là 500.000đ, ngủ chung giường với bố mẹ."},
        {"q": "Đi du thuyền có bị say sóng không?", "a": "Du thuyền 5 sao có tải trọng lớn và trang bị hệ thống cân bằng điện tử hiện đại, chạy trong vùng vịnh kín gió nên lướt rất êm ái, hoàn toàn không say sóng."}
    ]'::jsonb,
    '92/100', '88/100', 4.9, 128, NULL, 'published'
),
(
    'tour-02',
    'Tuyệt Tác Mùa Lúa Chín Sapa - Đỉnh Thiêng Fansipan 5 Sao Hotel de la Coupole',
    'Hà Nội - Sapa - Fansipan 5★',
    'WT-SAPA-3N2D-02',
    'tuyet-tac-mua-lua-chin-sapa-dinh-thieng-fansipan',
    'dest-sapa',
    'domestic',
    'package',
    'heritage',
    'Văn Hóa & Nghỉ Dưỡng 5★',
    'luxury',
    3, 2,
    'Hà Nội',
    3890000, 2917500, 1945000, 400000,
    1200000, 4990000, false, 22, true, 18,
    'Nổi Bật',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    '[
        {"url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80", "title": "Ruộng bậc thang Sapa"},
        {"url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", "title": "Đỉnh Fansipan"}
    ]'::jsonb,
    '["18/09/2026", "25/09/2026", "02/10/2026"]'::jsonb,
    '[
        {"date": "2026-09-18", "day": "18", "weekday": "Thứ 6", "month": "Tháng 09", "seats": 18, "price": 3890000, "status": "available"},
        {"date": "2026-09-25", "day": "25", "weekday": "Thứ 6", "month": "Tháng 09", "seats": 10, "price": 3890000, "status": "available"},
        {"date": "2026-10-02", "day": "02", "weekday": "Thứ 6", "month": "Tháng 10", "seats": 15, "price": 3890000, "status": "available"}
    ]'::jsonb,
    '{
        "hotelName": "Hotel de la Coupole - MGallery Sapa",
        "roomType": "Classic Room View Thung Lũng Mường Hoa",
        "inclusions": ["Hồ bơi nước ấm Le Grand Bassin lộng lẫy", "Bữa sáng Buffet chuẩn Pháp thượng hạng", "Vị trí đối diện ga tàu hỏa leo núi Mường Hoa"]
    }'::jsonb,
    '[
        "Chinh phục Nóc Nhà Đông Dương Fansipan bằng cáp treo 3 dây kỷ lục thế giới",
        "Nghỉ dưỡng 5 sao đẳng cấp quốc tế tại kiệt tác kiến trúc Pháp MGallery",
        "Check-in Thung Lũng Mường Hoa và Bản Cát Cát rực rỡ sắc màu thổ cẩm"
    ]'::jsonb,
    '[
        {"day": 1, "title": "Hà Nội - Cao Tốc Lào Cai - Sapa - Bản Cát Cát", "meals": "Trưa, Tối", "hotel": "Hotel de la Coupole 5★", "activities": "06:30 Khởi hành từ Hà Nội theo cao tốc Nội Bài - Lào Cai. 12:30 Tới Sapa, dùng bữa trưa đặc sản vùng cao. Chiều dạo bước thăm Bản Cát Cát, ngắm guồng nước và suối Mường Hoa."},
        {"day": 2, "title": "Chinh Phục Đỉnh Thiêng Fansipan - Đèo Ô Quy Hồ - Cầu Kính Rồng Mây", "meals": "Sáng, Trưa, Tối", "hotel": "Hotel de la Coupole 5★", "activities": "Sáng trải nghiệm tàu hỏa leo núi Mường Hoa và cáp treo lên đỉnh Fansipan (3.143m). Chiều ngắm hoàng hôn rực rỡ tại Đèo Ô Quy Hồ - một trong Tứ Đại Đỉnh Đèo."},
        {"day": 3, "title": "Check-in Nhà Thờ Đá Sapa - Mua Sắm Đặc Sản - Hà Nội", "meals": "Sáng, Trưa", "hotel": "Kết thúc tour", "activities": "Dùng điểm tâm buffet tại khách sạn, tự do mua sắm hạt dẻ, mật ong rừng, thịt trâu gác bếp. 13:30 Lên xe về lại Hà Nội, kết thúc chuyến đi."}
    ]'::jsonb,
    '["Xe Universe du lịch cao cấp đưa đón khứ hồi", "2 đêm nghỉ khách sạn 5 sao MGallery chuẩn quốc tế", "Vé cáp treo Fansipan khứ hồi + Tàu hỏa leo núi Mường Hoa", "Các bữa ăn đặc sản Tây Bắc theo chương trình", "Bảo hiểm du lịch mức đền bù tối đa 100.000.000đ"]'::jsonb,
    '["Vé tàu hỏa lên đỉnh Fansipan chặng cuối", "Đồ uống phát sinh trong bữa ăn", "Chi phí tắm lá thuốc người Dao Đỏ"]'::jsonb,
    '[
        {"condition": "Hủy trước 10 ngày khởi hành", "fee": "Hoàn 100% tiền vé"},
        {"condition": "Hủy từ 05 đến 09 ngày trước khởi hành", "fee": "Phí hủy 30% giá tour"},
        {"condition": "Hủy dưới 05 ngày trước khởi hành", "fee": "Không hoàn tiền (100% phí)"}
    ]'::jsonb,
    '[
        {"q": "Thời tiết Sapa mùa lúa chín thế nào?", "a": "Mùa lúa chín từ tháng 9 - 10 thời tiết se lạnh nhẹ ban đêm và nắng vàng ấm áp ban ngày, rất lý tưởng để săn ảnh và ngắm cảnh."}
    ]'::jsonb,
    '88/100', '95/100', 5.0, 94, NULL, 'published'
),
(
    'tour-03',
    'Cung Đường Vàng Nhật Bản: Tokyo - Núi Phú Sĩ - Kyoto - Osaka 6N5Đ',
    'Nhật Bản 6N5Đ Cung Đường Vàng',
    'WT-JAPAN-6N5D-03',
    'cung-duong-vang-nhat-ban-tokyo-phu-si-kyoto-osaka',
    'dest-japan',
    'international',
    'package',
    'heritage',
    'Tour Quốc Tế Cao Cấp',
    'luxury',
    6, 5,
    'Hà Nội / TP.HCM',
    28900000, 24565000, 17340000, 3000000,
    6000000, 32900000, true, 12, true, 10,
    'Tour Quốc Tế Hot',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    '[
        {"url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80", "title": "Tokyo Skytree"},
        {"url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80", "title": "Núi Phú Sĩ"}
    ]'::jsonb,
    '["10/10/2026", "24/10/2026", "15/11/2026"]'::jsonb,
    '[
        {"date": "2026-10-10", "day": "10", "weekday": "Thứ 7", "month": "Tháng 10", "seats": 10, "price": 28900000, "status": "available"},
        {"date": "2026-10-24", "day": "24", "weekday": "Thứ 7", "month": "Tháng 10", "seats": 6, "price": 28900000, "status": "available"},
        {"date": "2026-11-15", "day": "15", "weekday": "Chủ Nhật", "month": "Tháng 11", "seats": 12, "price": 29900000, "status": "available"}
    ]'::jsonb,
    '{
        "hotelName": "Hệ thống khách sạn 4-5 sao trung tâm Tokyo, Kyoto & Onsen Resort Phú Sĩ",
        "roomType": "Twin / Double Standard Room",
        "inclusions": ["Trải nghiệm tắm suối khoáng nóng Onsen truyền thống", "Thưởng thức bò Kobe nướng teppanyaki trứ danh"]
    }'::jsonb,
    '[
        "Bay thẳng hàng không 5 sao Vietnam Airlines / All Nippon Airways",
        "Trải nghiệm tàu siêu tốc Shinkansen tốc độ 320km/h biểu tượng Nhật Bản",
        "Thưởng ngoạn Núi Phú Sĩ linh thiêng và Làng cổ Oshino Hakkai",
        "Check-in Chùa Vàng Kinkaku-ji và Cổng trời ngàn cột Fushimi Inari"
    ]'::jsonb,
    '[
        {"day": 1, "title": "Hà Nội / TP.HCM - Sân Bay Narita - Tokyo", "meals": "Ăn trên máy bay, Tối", "hotel": "Khách sạn 4★ Tokyo", "activities": "Đáp chuyến bay đi Tokyo. Hướng dẫn viên đón đoàn, di chuyển về nhận phòng khách sạn."},
        {"day": 2, "title": "Khám Phá Thủ Đô Tokyo - Chùa Cổ Asakusa Kannon - Tháp Tokyo Skytree", "meals": "Sáng, Trưa, Tối", "hotel": "Khách sạn 4★ Tokyo", "activities": "Chiêm bái Chùa cổ Asakusa Kannon cổ kính nhất Tokyo, dạo phố Nakamise, ngắm tháp Skytree và mua sắm tại phố điện tử Akihabara."},
        {"day": 3, "title": "Tokyo - Núi Phú Sĩ Trạm 5 - Làng Cổ Oshino Hakkai - Tắm Suối Nóng Onsen", "meals": "Sáng, Trưa, Tối", "hotel": "Resort Onsen Phú Sĩ 4★", "activities": "Lên trạm 5 Núi Phú Sĩ ngắm tuyết trắng, dạo quanh làng cổ ngắm cá koi và thư giãn ngâm bồn khoáng nóng Onsen khoáng chất."},
        {"day": 4, "title": "Trải Nghiệm Tàu Siêu Tốc Shinkansen - Cố Đô Kyoto - Chùa Vàng Kinkaku-ji", "meals": "Sáng, Trưa, Tối", "hotel": "Khách sạn 4★ Kyoto", "activities": "Trải nghiệm tàu Shinkansen. Thăm Chùa Vàng rực rỡ soi bóng trên hồ nước và Rừng trúc Sagano thanh tịnh."},
        {"day": 5, "title": "Kyoto - Cổng Trời Fushimi Inari - Osaka - Lâu Đài Osaka - Phố Shinsaibashi", "meals": "Sáng, Trưa, Tối", "hotel": "Khách sạn 4★ Osaka", "activities": "Check-in hàng ngàn cổng Torii đỏ rực tại Đền Fushimi Inari. Chiều tham quan Lâu Đài Osaka và thỏa sức mua sắm tại Dotonbori."},
        {"day": 6, "title": "Sân Bay Quốc Tế Kansai - Việt Nam", "meals": "Sáng, Ăn trên máy bay", "hotel": "Kết thúc tour", "activities": "Xe đưa đoàn ra sân bay làm thủ tục đáp chuyến bay về lại Việt Nam. Chia tay và hẹn gặp lại."}
    ]'::jsonb,
    '["Vé máy bay khứ hồi Vietnam Airlines bao gồm 46kg hành lý ký gửi", "Khách sạn 4 sao tiêu chuẩn Nhật Bản (2 người/phòng)", "Phí làm Visa nhập cảnh Nhật Bản trọn gói", "Vé tàu siêu tốc Shinkansen 1 chặng", "Toàn bộ bữa ăn chất lượng theo lịch trình gồm lẩu Shabu Shabu & Bò Kobe", "Bảo hiểm du lịch quốc tế hạn mức 1.000.000.000đ/người"]'::jsonb,
    '["Hộ chiếu còn hạn trên 6 tháng", "Tiền tip quy định cho HDV & Lái xe: 40 USD/khách/toàn tour", "Chi tiêu mua sắm cá nhân"]'::jsonb,
    '[
        {"condition": "Trước khi nộp hồ sơ xin Visa", "fee": "Hoàn 100% trừ phí visa 1.500.000đ"},
        {"condition": "Sau khi đã có kết quả Visa", "fee": "Phí hủy 50% tổng giá trị tour"},
        {"condition": "Dưới 07 ngày trước khởi hành", "fee": "Không hoàn tiền (100% phí)"}
    ]'::jsonb,
    '[
        {"q": "Thủ tục xin Visa Nhật Bản cần những gì?", "a": "Quý khách chỉ cần chuẩn bị Hộ chiếu gốc còn hạn trên 6 tháng, 2 ảnh 4.5x4.5 nền trắng, CCCD và chứng minh tài chính cơ bản. WebTravel hỗ trợ hoàn thiện hồ sơ trọn gói."}
    ]'::jsonb,
    '95/100', '98/100', 4.95, 87, NULL, 'published'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price_adult = EXCLUDED.price_adult,
    status = 'published',
    itinerary = EXCLUDED.itinerary,
    hotel_specs = EXCLUDED.hotel_specs,
    departure_dates = EXCLUDED.departure_dates;

-- 4. Biến Thể Gói Dịch Vụ Mẫu (tour_variants)
INSERT INTO public.tour_variants (id, tour_id, variant_name, departure_city, hotel_star, flight_included, price_adult, price_child, price_infant, single_room_supplement, is_default, status) VALUES
('b1111111-1111-1111-1111-111111111111'::uuid, 'tour-01', 'Gói Du Thuyền Cao Cấp 5★ (Bao Gồm Xe Limousine)', 'Hà Nội', 5, false, 4590000, 3442500, 500000, 1500000, true, 'active'),
('b2222222-2222-2222-2222-222222222222'::uuid, 'tour-01', 'Gói Du Thuyền VIP Tổng Thống (Phòng Suite Ban Công Riêng + Spa)', 'Hà Nội', 5, false, 6890000, 5167500, 800000, 2500000, false, 'active'),
('b3333333-3333-3333-3333-333333333333'::uuid, 'tour-02', 'Gói Tiêu Chuẩn Khách Sạn MGallery 5★', 'Hà Nội', 5, false, 3890000, 2917500, 400000, 1200000, true, 'active'),
('b4444444-4444-4444-4444-444444444444'::uuid, 'tour-03', 'Gói Tour Trọn Gói Bay Vietnam Airlines 4-5★', 'Hà Nội / TP.HCM', 4, true, 28900000, 24565000, 3000000, 6000000, true, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Lịch Khởi Hành & Chỗ Trống (departure_dates)
INSERT INTO public.departure_dates (tour_id, date, available_seats, total_seats, status, price_adjustment) VALUES
('tour-01', '2026-09-15', 12, 20, 'available', 0),
('tour-01', '2026-09-22', 8, 20, 'available', 0),
('tour-01', '2026-09-29', 4, 20, 'few_seats', 300000),
('tour-01', '2026-10-05', 15, 20, 'available', 0),
('tour-02', '2026-09-18', 18, 25, 'available', 0),
('tour-02', '2026-09-25', 10, 25, 'available', 0),
('tour-02', '2026-10-02', 15, 25, 'available', 0),
('tour-03', '2026-10-10', 10, 16, 'available', 0),
('tour-03', '2026-10-24', 6, 16, 'few_seats', 0),
('tour-03', '2026-11-15', 12, 16, 'available', 1000000)
ON CONFLICT (tour_id, date) DO UPDATE SET
    available_seats = EXCLUDED.available_seats,
    total_seats = EXCLUDED.total_seats,
    status = EXCLUDED.status;

-- 6. Bài Viết Tạp Chí Mẫu (blog_posts - Travel Journal)
INSERT INTO public.blog_posts (
    id, title, slug, excerpt, content, cover_image, author_name, destination_id, category, tags, read_time_minutes, views_count, status
) VALUES
(
    'post-01',
    'Cẩm Nang Du Lịch Vịnh Hạ Long Tự Túc 2026: Kinh Nghiệm Đi Du Thuyền 5 Sao',
    'cam-nang-du-lich-vinh-ha-long-tu-tuc-2026',
    'Tổng hợp toàn bộ kinh nghiệm chọn tour du thuyền, thời điểm đẹp nhất trong năm và top những trải nghiệm không thể bỏ lỡ tại kỳ quan thế giới.',
    '# Vịnh Hạ Long - Bản Tình Ca Của Đá Và Nước\n\nVịnh Hạ Long từ lâu đã là niềm tự hào của du lịch Việt Nam với hàng ngàn hòn đảo đá vôi kỳ vĩ...\n\n## 1. Thời điểm lý tưởng nhất\nTừ tháng 9 đến tháng 11 là mùa thu đẹp nhất tại Vịnh Hạ Long, trời trong xanh, ít mưa và nắng nhẹ...\n\n## 2. Trải nghiệm ngủ đêm trên du thuyền\nKhông gì tuyệt vời hơn cảm giác thức dậy giữa lòng di sản, đón ánh bình minh và tập Thái Cực Quyền trên boong tàu...',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    'BTV Hoàng Nam',
    'dest-halong',
    'destination_guide',
    ARRAY['Hạ Long', 'Du Thuyền 5 Sao', 'Kinh Nghiệm Du Lịch'],
    6,
    1450,
    'published'
),
(
    'post-02',
    'Top 5 Món Ăn Đặc Sản Nhất Định Phải Thử Khi Đến Sapa Mùa Lúa Chín',
    'top-5-mon-an-dac-san-sapa-mua-lua-chin',
    'Khám phá ẩm thực Tây Bắc độc đáo: Thắng cố ngựa Mường Khương, cá hồi Ô Quy Hồ tươi rói và thịt trâu gác bếp đậm đà hương vị núi rừng.',
    '# Ẩm Thực Tây Bắc: Đậm Đà Hương Vị Đại Ngàn\n\nKhi tiết trời Sapa se lạnh, còn gì ấm lòng hơn khi quây quần bên nồi lẩu cá hồi hay thưởng thức xiên nướng nóng hổi tại chợ đêm...\n\n1. Cá Hồi & Cá Tầm Ô Quy Hồ\n2. Lợn Mán Cắp Nách Nướng Than Hoa\n3. Thắng Cố & Rượu Ngô Bản Phố\n4. Rau Cải Mèo Xào Thịt Hun Khói',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    'BTV Thanh Thảo',
    'dest-sapa',
    'culinary',
    ARRAY['Sapa', 'Ẩm Thực', 'Đặc Sản Tây Bắc'],
    4,
    980,
    'published'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image = EXCLUDED.cover_image;

-- 7. Đánh Giá Mẫu (reviews) - user_id để NULL vì chưa có auth user thật trong seed
INSERT INTO public.reviews (id, tour_id, user_name, rating, comment, verified_purchase, status) VALUES
(gen_random_uuid(), 'tour-01', 'Nguyễn Văn Hùng (Hà Nội)', 5, 'Chuyến đi Hạ Long trên du thuyền Ambassador vượt ngoài mong đợi! Đồ ăn buffet hải sản tươi ngon ngập tràn tôm hùm, phòng ngủ ban công riêng view ngắm vịnh cực chill. Đội ngũ nhân viên thân thiện và nhiệt tình 10/10.', true, 'approved'),
(gen_random_uuid(), 'tour-01', 'Trần Thị Mai Phương', 5, 'Dịch vụ chuẩn 5 sao, đưa đón limousine đúng giờ và rất thoải mái. Bể bơi bốn mùa trên tàu chụp ảnh sống ảo siêu đẹp. Sẽ ủng hộ WebTravel cho các chuyến đi tiếp theo!', true, 'approved'),
(gen_random_uuid(), 'tour-02', 'Lê Hoàng Long', 5, 'Khách sạn Hotel de la Coupole đẹp như một lâu đài cổ tích giữa lòng Sapa. Cáp treo Fansipan thuận tiện, cả nhà mình có chuyến đi nghỉ dưỡng vô cùng ý nghĩa.', true, 'approved'),
(gen_random_uuid(), 'tour-03', 'Phạm Thùy Linh', 5, 'Tour Nhật Bản 6 ngày của WebTravel hoàn hảo từ đầu đến cuối! Hướng dẫn viên am hiểu văn hóa, lịch trình hợp lý không bị nhồi nhét. Trải nghiệm Shinkansen và ngắm Phú Sĩ là kỷ niệm không thể quên.', true, 'approved')
;

-- 8. Kích hoạt trigger cập nhật lại thống kê các điểm đến và tour sau khi nạp seed data
UPDATE public.tours SET updated_at = now();

-- ==============================================================================
-- 23. KIỂM TRA TỔNG QUAN TÌNH TRẠNG HỆ THỐNG
-- ==============================================================================
SELECT 'Destinations' AS table_name, count(*) AS total_records FROM public.destinations
UNION ALL
SELECT 'Tours' AS table_name, count(*) AS total_records FROM public.tours
UNION ALL
SELECT 'Coupons' AS table_name, count(*) AS total_records FROM public.coupons
UNION ALL
SELECT 'Tour Variants' AS table_name, count(*) AS total_records FROM public.tour_variants
UNION ALL
SELECT 'Departure Dates' AS table_name, count(*) AS total_records FROM public.departure_dates
UNION ALL
SELECT 'Blog Posts' AS table_name, count(*) AS total_records FROM public.blog_posts
UNION ALL
SELECT 'Reviews' AS table_name, count(*) AS total_records FROM public.reviews;
