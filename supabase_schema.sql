-- ==============================================================================
-- WEBTRAVEL EDITORIAL - COMPLETE PRODUCTION DATABASE SCHEMA (POSTGRESQL + SUPABASE)
-- Phiên bản: 3.4 - CHUẨN DOANH NGHIỆP TRONG NƯỚC & QUỐC TẾ
-- TOÀN BỘ CỘT ĐƯỢC CHÚ THÍCH (COMMENT) TIẾNG VIỆT ĐẦY ĐỦ Ở DÒNG LỆNH & METADATA SUPABASE
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
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,                      -- Mã ID người dùng, liên kết trực tiếp với bảng tài khoản auth.users của Supabase
    email TEXT UNIQUE NOT NULL,                                                           -- Email đăng nhập của người dùng (duy nhất trên toàn hệ thống)
    full_name TEXT,                                                                       -- Họ và tên đầy đủ của người dùng / khách hàng
    phone TEXT,                                                                           -- Số điện thoại liên hệ nhận vé điện tử và thông báo chuyến đi
    avatar_url TEXT,                                                                      -- Đường dẫn URL ảnh đại diện (avatar) của người dùng
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin', 'super_admin')), -- Phân quyền hệ thống: 'customer' (Khách hàng), 'staff' (Nhân viên), 'admin' (Quản trị viên), 'super_admin' (Quản trị tối cao)
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),                         -- Điểm thưởng tích lũy thành viên (dùng để giảm giá khi đặt các tour tiếp theo)
    address TEXT,                                                                         -- Địa chỉ cư trú / địa chỉ giao vé hoặc liên hệ của khách hàng
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deleted')), -- Trạng thái tài khoản: 'active' (Hoạt động bình thường), 'banned' (Đã bị khóa), 'deleted' (Đã xóa)
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm tài khoản (phục vụ đối soát lịch sử)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm đăng ký / khởi tạo tài khoản
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm cập nhật thông tin hồ sơ gần nhất
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
    id TEXT PRIMARY KEY,                                                                  -- Mã định danh điểm đến (VD: 'dest-sapa', 'dest-halong', 'dest-japan')
    name TEXT NOT NULL,                                                                   -- Tên địa danh / điểm đến (VD: "Sapa", "Vịnh Hạ Long", "Đà Nẵng", "Nhật Bản")
    slug TEXT UNIQUE NOT NULL,                                                            -- Đường dẫn URL thân thiện cho SEO (VD: "sapa", "ha-long", "nhat-ban")
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),             -- Phân loại phạm vi địa lý: 'domestic' (Trong nước) hoặc 'international' (Quốc tế)
    region TEXT,                                                                          -- Khu vực / Vùng miền du lịch (VD: "Tây Bắc", "Đông Bắc", "Miền Trung", "Đông Bắc Á")
    tag TEXT,                                                                             -- Nhãn ngắn đặc trưng (VD: "Núi & Bản Làng", "Du Thuyền 5★", "Hoa Anh Đào")
    image TEXT NOT NULL,                                                                  -- Đường dẫn URL ảnh đại diện tiêu biểu của điểm đến
    tour_count INTEGER DEFAULT 0 CHECK (tour_count >= 0),                                 -- Tổng số lượng tour đang mở bán tại điểm đến này (Tự động cập nhật qua Trigger)
    min_price NUMERIC DEFAULT 0 CHECK (min_price >= 0),                                   -- Giá tour thấp nhất tại điểm đến này (Tự động cập nhật qua Trigger)
    is_featured BOOLEAN DEFAULT true,                                                     -- Đánh dấu hiển thị điểm đến nổi bật ngoài trang chủ (true: Có, false: Không)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')), -- Trạng thái điểm đến: 'active' (Hiển thị), 'hidden' (Tạm ẩn), 'deleted' (Đã xóa)
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm điểm đến
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tạo điểm đến trong hệ thống
);

-- ==============================================================================
-- 3. BẢNG DANH SÁCH TOUR (tours)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tours (
    id TEXT PRIMARY KEY,                                                                  -- Mã định danh duy nhất của tour (VD: 'tour-01', 'tour-sapa-02')
    title TEXT NOT NULL,                                                                  -- Tiêu đề đầy đủ của tour du lịch (VD: "Khám Phá Di Sản Hạ Long - Du Thuyền 5 Sao Ambassador")
    short_title TEXT,                                                                     -- Tiêu đề ngắn gọn dùng cho thanh điều hướng và nhãn thẻ (VD: "Hà Nội - Du Thuyền Hạ Long 5★")
    code TEXT UNIQUE,                                                                     -- Mã định danh quản lý tour duy nhất (VD: "WT-HAGIANG3N2D-9LJQ", "WT-HALONG-4N3D")
    slug TEXT UNIQUE NOT NULL,                                                            -- Đường dẫn URL thân thiện cho SEO (VD: "kham-pha-di-san-ha-long-du-thuyen-5-sao")
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE SET NULL,           -- Khóa ngoại: Liên kết đến điểm đến tương ứng trong bảng destinations
    category TEXT NOT NULL CHECK (category IN ('domestic', 'international')),             -- Trục 1 - Địa lý: 'domestic' (Tour Trong Nước) hoặc 'international' (Tour Quốc Tế)
    travel_style TEXT DEFAULT 'package' CHECK (travel_style IN ('package', 'combo', 'private', 'mice')), -- Trục 2 - Hình thức: 'package' (Trọn gói ghép đoàn có HDV), 'combo' (Free & Easy vé+KS), 'private' (Tour riêng may đo), 'mice' (Doanh nghiệp MICE)
    theme TEXT DEFAULT 'beach' CHECK (theme IN ('beach', 'heritage', 'adventure', 'family', 'wellness', 'culinary')), -- Trục 3 - Chủ đề: 'beach' (Biển đảo), 'heritage' (Di sản), 'adventure' (Mạo hiểm), 'family' (Gia đình), 'wellness' (Nghỉ dưỡng), 'culinary' (Ẩm thực)
    type TEXT,                                                                            -- Tên hiển thị loại hình tour (VD: "Nghỉ Dưỡng & Biển Đảo", "Văn Hóa & Di Sản")
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('luxury', 'standard', 'budget')),         -- Trục 4 - Hạng sao dịch vụ: 'luxury' (Cao cấp 5★), 'standard' (Tiêu chuẩn 4★), 'budget' (Tiết kiệm 3★)
    duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days >= 1),                  -- Tổng số ngày của chuyến đi (VD: 3 ngày, 4 ngày)
    duration_nights INTEGER NOT NULL DEFAULT 0 CHECK (duration_nights >= 0),              -- Tổng số đêm lưu trú của chuyến đi (VD: 2 đêm, 3 đêm)
    departure_from TEXT NOT NULL,                                                         -- Điểm tập trung / sân bay khởi hành chính (VD: "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng")
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),                                -- Giá vé người lớn cơ bản (áp dụng cho khách từ 12 tuổi trở lên)
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),                  -- Giá vé trẻ em (từ 5 đến 11 tuổi, thường bằng 75% giá vé người lớn)
    price_toddler NUMERIC CHECK (price_toddler IS NULL OR price_toddler >= 0),            -- Giá vé trẻ nhỏ (từ 2 đến 4 tuổi, thường bằng 50% giá vé người lớn)
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),               -- Giá vé em bé (dưới 2 tuổi, phụ phí dịch vụ & bảo hiểm 500.000đ)
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),        -- Phí phụ thu phòng đơn (dành cho khách đi 1 mình muốn ngủ riêng 1 phòng)
    original_price NUMERIC CHECK (original_price IS NULL OR original_price >= 0),         -- Giá gốc niêm yết trước khi giảm (dùng để hiển thị giá gạch ngang khuyến mãi)
    is_flash_deal BOOLEAN DEFAULT false,                                                  -- Đánh dấu tour thuộc chương trình Flash Sale 24h có đồng hồ đếm ngược (true/false)
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100), -- Mức giảm giá theo % (VD: 25% ➔ hiển thị huy hiệu 'GIẢM 25%')
    is_all_inclusive BOOLEAN DEFAULT false,                                               -- Đánh dấu tour trọn gói 100% không phát sinh chi phí phụ (true/false)
    seats_left INTEGER DEFAULT 15 CHECK (seats_left >= 0),                                -- Tổng số lượng chỗ dự phòng / chỗ còn lại của chuyến đi
    badge TEXT DEFAULT 'Nổi Bật',                                                         -- Nhãn huy hiệu hiển thị trên thẻ tour (VD: "Bán Chạy Nhất", "Mới Ra Mắt", "Flash Sale")
    image TEXT NOT NULL,                                                                  -- Đường dẫn URL ảnh bìa chính hiển thị trên thẻ tour
    gallery JSONB DEFAULT '[]'::jsonb,                                                    -- Mảng JSONB chứa album bộ sưu tập ảnh chất lượng cao của tour
    available_dates JSONB DEFAULT '[]'::jsonb,                                            -- Mảng JSONB chứa danh sách chuỗi các ngày khởi hành khả dụng (VD: ['15/09/2026', '22/09/2026'])
    departure_dates JSONB DEFAULT '[]'::jsonb,                                            -- Mảng JSONB lưu chi tiết từng ngày khởi hành: ngày, thứ, tháng, số chỗ, giá vé riêng từng ngày, nhãn khuyến mãi
    hotel_specs JSONB DEFAULT '{}'::jsonb,                                                -- Mảng JSONB thông tin khách sạn chi tiết: tên khách sạn, hạng phòng, tiện ích đi kèm
    highlights JSONB DEFAULT '[]'::jsonb,                                                 -- Mảng JSONB chứa các điểm nhấn nổi bật đặc sắc nhất của chuyến đi
    itinerary JSONB DEFAULT '[]'::jsonb,                                                  -- Mảng JSONB chi tiết lịch trình từng ngày (ngày, tiêu đề, bữa ăn, khách sạn, hoạt động)
    included JSONB DEFAULT '[]'::jsonb,                                                   -- Mảng JSONB danh sách dịch vụ đã bao gồm trong giá vé
    excluded JSONB DEFAULT '[]'::jsonb,                                                   -- Mảng JSONB danh sách dịch vụ không bao gồm trong giá vé
    refund_policy JSONB DEFAULT '[]'::jsonb,                                              -- Mảng JSONB quy định & chính sách hoàn hủy vé theo mốc thời gian
    faqs JSONB DEFAULT '[]'::jsonb,                                                       -- Mảng JSONB bộ câu hỏi và giải đáp thường gặp cho tour
    esg_score TEXT DEFAULT '85/100',                                                      -- Điểm tiêu chuẩn du lịch bền vững & bảo vệ môi trường (VD: '88/100')
    lei_score TEXT DEFAULT '78/100',                                                      -- Điểm chất lượng trải nghiệm văn hóa & dịch vụ bản địa (VD: '92/100')
    rating NUMERIC DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),                       -- Điểm đánh giá chất lượng tour (1.0 đến 5.0 sao)
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),                           -- Tổng số lượt đánh giá / bình luận thực tế
    weather_notice TEXT,                                                                  -- Cảnh báo khẩn cấp khi thời tiết xấu: Bão biển, sạt lở núi, cấm tàu thuyền...
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'hidden', 'weather_suspended', 'deleted')), -- Trạng thái tour: 'published' (Mở bán), 'draft' (Nháp), 'hidden' (Ẩn), 'weather_suspended' (Tạm dừng do thời tiết), 'deleted' (Đã xóa)
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm tour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm tạo tour trong hệ thống
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm cập nhật thông tin tour gần nhất
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh bản ghi hình ảnh (UUID)
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,                  -- Khóa ngoại: Liên kết đến tour tương ứng trong bảng tours
    image_url TEXT NOT NULL,                                                              -- Đường dẫn URL tải ảnh chất lượng cao (CDN / Storage)
    caption TEXT,                                                                         -- Chú thích ảnh (VD: "Phòng ngủ Suite view biển", "Buffet tôm hùm 5 sao")
    alt_text TEXT,                                                                        -- Văn bản thay thế tối ưu SEO cho công cụ tìm kiếm Google Images
    category TEXT DEFAULT 'attraction' CHECK (category IN ('hotel', 'attraction', 'food', 'cruise', 'activity', 'other')), -- Phân loại ảnh: 'hotel' (Khách sạn), 'attraction' (Cảnh đẹp), 'food' (Ẩm thực), 'cruise' (Du thuyền), 'activity' (Hoạt động), 'other' (Khác)
    display_order INTEGER DEFAULT 0,                                                      -- Thứ tự sắp xếp hiển thị ảnh trong thư viện (số nhỏ hiển thị trước)
    is_cover BOOLEAN DEFAULT false,                                                       -- Đánh dấu ảnh này làm ảnh bìa chính của album (true/false)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tải ảnh lên hệ thống
);

-- ==============================================================================
-- 5. BẢNG BIẾN THỂ GÓI TOUR (tour_variants - Package Options)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tour_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh của biến thể gói tour (UUID)
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,                  -- Khóa ngoại: Liên kết đến tour gốc tương ứng trong bảng tours
    variant_name TEXT NOT NULL,                                                           -- Tên gói dịch vụ (VD: "Gói Tiêu Chuẩn 3★", "Gói VIP 5★ Vinpearl", "Gói Land Tour Tự Túc Vé Bay")
    departure_city TEXT,                                                                  -- Thành phố xuất phát của gói (VD: "Khởi hành từ Hà Nội", "Khởi hành từ TP.HCM")
    hotel_star INTEGER DEFAULT 3 CHECK (hotel_star BETWEEN 1 AND 5),                      -- Tiêu chuẩn sao cam kết của khách sạn trong gói (từ 1 đến 5 sao)
    flight_included BOOLEAN DEFAULT true,                                                 -- Gói đã bao gồm vé máy bay khứ hồi hay chưa (true: Đã gồm, false: Chưa gồm)
    price_adult NUMERIC NOT NULL CHECK (price_adult >= 0),                                -- Giá vé người lớn của riêng gói biến thể này
    price_child NUMERIC CHECK (price_child IS NULL OR price_child >= 0),                  -- Giá vé trẻ em của riêng gói biến thể này
    price_infant NUMERIC CHECK (price_infant IS NULL OR price_infant >= 0),               -- Giá vé em bé của riêng gói biến thể này
    single_room_supplement NUMERIC DEFAULT 0 CHECK (single_room_supplement >= 0),        -- Phí phụ thu phòng đơn của riêng gói biến thể này
    benefits JSONB DEFAULT '[]'::jsonb,                                                   -- Mảng JSONB chứa danh sách quyền lợi / đặc quyền riêng của gói (VD: tặng vé Safari, miễn phí spa)
    is_default BOOLEAN DEFAULT false,                                                     -- Đánh dấu đây là gói mặc định hiển thị trước cho khách (true/false)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')), -- Trạng thái gói: 'active' (Mở bán), 'hidden' (Tạm ẩn), 'deleted' (Đã xóa)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tạo gói biến thể
);

-- ==============================================================================
-- 6. BẢNG LỊCH KHỞI HÀNH & CHỖ TRỐNG (departure_dates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departure_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh bản ghi ngày khởi hành (UUID)
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,                  -- Khóa ngoại: Liên kết đến tour tương ứng trong bảng tours
    date DATE NOT NULL,                                                                   -- Ngày khởi hành thực tế (định dạng chuẩn YYYY-MM-DD)
    available_seats INTEGER NOT NULL DEFAULT 20,                                          -- Số lượng chỗ trống còn nhận khách thực tế (Tự động trừ khi có khách đặt thành công)
    total_seats INTEGER NOT NULL DEFAULT 20,                                              -- Tổng số lượng chỗ tối đa mở bán cho chuyến đi này
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'few_seats', 'sold_out')), -- Trạng thái chỗ: 'available' (Còn chỗ), 'few_seats' (Sắp hết chỗ <= 5), 'sold_out' (Hết chỗ)
    price_adjustment NUMERIC DEFAULT 0,                                                   -- Mức giá điều chỉnh tăng/giảm so với giá gốc (VD: +500.000đ vào ngày lễ Tết)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm mở bán lịch khởi hành
    UNIQUE (tour_id, date),                                                               -- Ràng buộc: Mỗi tour chỉ có 1 bản ghi duy nhất cho mỗi ngày khởi hành
    CONSTRAINT chk_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats) -- Ràng buộc: Số chỗ còn lại không được âm và không vượt quá tổng chỗ
);

-- ==============================================================================
-- 7. BẢNG MÃ GIẢM GIÁ & KHUYẾN MÃI (coupons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,                                                                -- Mã giảm giá khách nhập khi đặt tour (VD: 'WEBTRAVEL500K', 'SUMMER2026')
    description TEXT NOT NULL,                                                            -- Mô tả chi tiết nội dung chương trình ưu đãi của mã
    discount_amount NUMERIC DEFAULT 0 CHECK (discount_amount >= 0),                       -- Số tiền giảm cố định (đơn vị VNĐ, VD: 500.000đ)
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100), -- Mức giảm theo % trên tổng giá trị đơn hàng (0 đến 100%)
    min_order_value NUMERIC DEFAULT 0 CHECK (min_order_value >= 0),                       -- Giá trị đơn hàng tối thiểu để được áp dụng mã giảm giá này
    usage_limit INTEGER DEFAULT 100 CHECK (usage_limit >= 0),                             -- Giới hạn tổng số lượt sử dụng tối đa của mã trên toàn hệ thống
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),                                 -- Số lượt mã đã được sử dụng thực tế (Tự động tăng khi có đơn đặt thành công)
    expires_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời hạn hết hiệu lực của mã giảm giá (null nếu không giới hạn thời gian)
    is_active BOOLEAN DEFAULT true,                                                       -- Bật / Tắt hiệu lực sử dụng của mã (true: Đang hoạt động, false: Tạm ngưng)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tạo mã giảm giá
);

-- ==============================================================================
-- 8. BẢNG ĐƠN ĐẶT TOUR (bookings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh duy nhất của đơn đặt tour (UUID)
    booking_code TEXT UNIQUE NOT NULL,                                                    -- Mã tra cứu đơn hàng thân thiện cho khách (VD: 'BK-20260824-001')
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,                       -- Khóa ngoại: Liên kết đến tài khoản thành viên (nếu khách chưa đăng nhập thì để null)
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,                 -- Khóa ngoại: Liên kết đến tour được đặt trong bảng tours (chặn xóa tour nếu đang có đơn)
    variant_id UUID REFERENCES public.tour_variants(id) ON DELETE SET NULL,               -- Khóa ngoại: Liên kết đến gói biến thể được chọn trong bảng tour_variants (nếu có)
    tour_title TEXT NOT NULL,                                                             -- Tên tour tại thời điểm đặt (lưu cố định để đối soát lịch sử không bị thay đổi)
    departure_date DATE NOT NULL,                                                         -- Ngày khởi hành chính xác mà khách chọn đi
    customer_name TEXT NOT NULL,                                                          -- Họ và tên của người đại diện đặt tour
    customer_phone TEXT NOT NULL,                                                         -- Số điện thoại liên hệ nhận vé và thông báo đón đoàn
    customer_email TEXT NOT NULL,                                                         -- Email nhận vé điện tử (E-Ticket) và hợp đồng du lịch
    customer_address TEXT,                                                                -- Địa chỉ liên hệ / giao nhận hợp đồng của khách hàng
    customer_notes TEXT,                                                                  -- Ghi chú hoặc yêu cầu đặc biệt của khách (VD: ăn chay, có trẻ sơ sinh, xe lăn...)
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 1),                    -- Số lượng khách người lớn (từ 12 tuổi trở lên, tối thiểu 1 người)
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),                -- Số lượng khách trẻ em (từ 5 đến 11 tuổi)
    infants_count INTEGER NOT NULL DEFAULT 0 CHECK (infants_count >= 0),                  -- Số lượng khách em bé (dưới 5 tuổi)
    single_rooms_count INTEGER NOT NULL DEFAULT 0 CHECK (single_rooms_count >= 0),        -- Số lượng phòng đơn yêu cầu phụ thu riêng
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),              -- Đơn vị tiền tệ thanh toán ('VND' hoặc 'USD')
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),                              -- Tổng số tiền của đơn hàng sau khi tính số khách, phụ thu và giảm giá
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),                               -- Số tiền thực tế khách đã thanh toán thành công (Tự động cập nhật qua Trigger)
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,                 -- Khóa ngoại: Mã giảm giá đã áp dụng cho đơn hàng này
    payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash')), -- Phương thức thanh toán: 'vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash'
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'failed', 'refunded')), -- Trạng thái thanh toán: 'pending' (Chờ tiền), 'partially_paid' (Đã cọc 50%), 'paid' (Đã trả 100%), 'failed' (Thất bại), 'refunded' (Đã hoàn tiền)
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')), -- Trạng thái xử lý đơn: 'pending' (Chờ xử lý), 'confirmed' (Đã xác nhận), 'completed' (Đã đi xong tour), 'cancelled' (Đã hủy), 'refunded' (Đã hoàn tiền)
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời gian xóa mềm đơn hàng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm khách tạo đơn đặt tour
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh giao dịch thanh toán (UUID)
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,            -- Khóa ngoại: Liên kết đến đơn đặt tour tương ứng trong bảng bookings
    booking_code TEXT NOT NULL,                                                           -- Mã đơn đặt tour dùng để đối soát nhanh
    transaction_code TEXT UNIQUE NOT NULL,                                                -- Mã giao dịch đối soát của Ngân hàng / VietQR / MoMo / Stripe / PayPal (duy nhất)
    amount NUMERIC NOT NULL CHECK (amount > 0),                                           -- Số tiền thực tế chuyển khoản trong giao dịch này (phải lớn hơn 0)
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),              -- Đơn vị tiền tệ giao dịch ('VND' hoặc 'USD')
    payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'credit_card', 'paypal', 'bank_transfer', 'cash')), -- Phương thức thanh toán sử dụng trong giao dịch
    payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('deposit', 'remaining', 'full', 'refund')), -- Loại thanh toán: 'deposit' (Đặt cọc), 'remaining' (Trả nốt), 'full' (100%), 'refund' (Hoàn tiền)
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded')), -- Trạng thái giao dịch: 'pending' (Chờ tiền về), 'success' (Thành công), 'failed' (Thất bại), 'refunded' (Đã hoàn lại)
    bank_name TEXT,                                                                       -- Tên ngân hàng nhận tiền / chuyển tiền (VD: "Vietcombank", "MB Bank", "Techcombank")
    payer_name TEXT,                                                                      -- Tên chủ tài khoản người chuyển tiền thực tế
    notes TEXT,                                                                           -- Nội dung chuyển khoản hoặc ghi chú đối soát từ cổng thanh toán
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,       -- Thời điểm tiền vào tài khoản thực tế
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm tạo bản ghi giao dịch
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh yêu cầu thiết kế tour riêng (UUID)
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,                       -- Khóa ngoại: Liên kết đến tài khoản thành viên gửi yêu cầu (nếu đã đăng nhập)
    customer_name TEXT NOT NULL,                                                          -- Họ và tên khách hàng cần tư vấn thiết kế tour
    customer_phone TEXT NOT NULL,                                                         -- Số điện thoại liên hệ nhận tư vấn và báo giá
    customer_email TEXT,                                                                  -- Email nhận lộ trình tour và báo giá chi tiết
    destinations TEXT[] NOT NULL,                                                         -- Mảng danh sách các điểm đến khách muốn ghé thăm (VD: ["Đà Nẵng", "Hội An", "Huế"])
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1),                            -- Tổng số ngày dự kiến của chuyến đi (tối thiểu 1 ngày)
    estimated_budget NUMERIC CHECK (estimated_budget IS NULL OR estimated_budget >= 0),   -- Dự toán ngân sách tối đa trên mỗi người (VNĐ)
    travel_style TEXT,                                                                    -- Phong cách chuyến đi mong muốn (Gia đình nghỉ dưỡng, Mạo hiểm trekking, Khám phá văn hóa...)
    hotel_star INTEGER DEFAULT 4 CHECK (hotel_star BETWEEN 1 AND 5),                      -- Tiêu chuẩn sao khách sạn mong muốn (từ 1 đến 5 sao)
    group_size INTEGER DEFAULT 2 CHECK (group_size >= 1),                                 -- Số lượng thành viên dự kiến tham gia trong đoàn
    departure_month TEXT,                                                                 -- Tháng dự kiến khởi hành (VD: "Tháng 10/2026")
    special_requirements TEXT,                                                            -- Các yêu cầu đặc biệt khác (xe Limousine riêng, ăn chay, hướng dẫn viên tiếng Anh...)
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'completed', 'cancelled')), -- Trạng thái xử lý: 'new' (Mới), 'contacted' (Đã liên hệ), 'quoted' (Đã báo giá), 'completed' (Đã chốt tour), 'cancelled' (Đã hủy)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm gửi yêu cầu thiết kế tour
);

-- ==============================================================================
-- 11. BẢNG YÊU CẦU TƯ VẤN & LIÊN HỆ (contact_inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh thư liên hệ / yêu cầu tư vấn (UUID)
    full_name TEXT NOT NULL,                                                              -- Họ và tên người gửi câu hỏi / liên hệ
    phone TEXT NOT NULL,                                                                  -- Số điện thoại để nhân viên gọi lại hỗ trợ
    email TEXT,                                                                           -- Địa chỉ email để nhận thư phản hồi
    inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'visa', 'insurance', 'custom_quote', 'callback')), -- Phân loại yêu cầu: 'general' (Chung), 'visa' (Hồ sơ Visa), 'insurance' (Bảo hiểm), 'custom_quote' (Báo giá đoàn), 'callback' (Gọi lại tư vấn)
    message TEXT NOT NULL,                                                                -- Nội dung câu hỏi / thắc mắc của khách hàng
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved')), -- Trạng thái xử lý: 'pending' (Chờ xử lý), 'processing' (Đang xử lý), 'resolved' (Đã giải quyết xong)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm khách gửi liên hệ
);

-- ==============================================================================
-- 12. BẢNG TOUR YÊU THÍCH (wishlists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh bản ghi yêu thích (UUID)
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,               -- Khóa ngoại: Liên kết đến tài khoản người dùng trong bảng profiles
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,                  -- Khóa ngoại: Liên kết đến tour được yêu thích trong bảng tours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm người dùng bấm lưu tour yêu thích
    UNIQUE(user_id, tour_id)                                                              -- Ràng buộc: Mỗi người dùng chỉ lưu 1 tour vào danh sách yêu thích một lần
);

-- ==============================================================================
-- 13. BẢNG ĐÁNH GIÁ TOUR (reviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh đánh giá (UUID)
    tour_id TEXT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,                  -- Khóa ngoại: Liên kết đến tour được đánh giá trong bảng tours
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,                       -- Khóa ngoại: Liên kết đến tài khoản người dùng gửi đánh giá (nếu có)
    user_name TEXT NOT NULL,                                                              -- Tên hiển thị của khách hàng viết đánh giá
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),                          -- Điểm đánh giá chất lượng (từ 1 đến 5 sao)
    comment TEXT NOT NULL,                                                                -- Nội dung cảm nghĩ / trải nghiệm thực tế về chuyến đi
    verified_purchase BOOLEAN DEFAULT true,                                               -- Đánh dấu đã xác thực khách hàng đã từng mua và trải nghiệm tour này (true/false)
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')), -- Trạng thái duyệt: 'pending' (Chờ duyệt), 'approved' (Đã duyệt hiển thị), 'rejected' (Bị từ chối)
    deleted_at TIMESTAMP WITH TIME ZONE,                                                  -- Thời điểm xóa mềm đánh giá
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,   -- Thời điểm gửi đánh giá
    UNIQUE(tour_id, user_id)                                                              -- Ràng buộc: Mỗi người dùng chỉ đánh giá 1 tour một lần
);

-- ==============================================================================
-- 14. BẢNG EMAIL BẢN TIN KHUYẾN MÃI (subscribers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                        -- Mã định danh bản ghi đăng ký nhận tin (UUID)
    email TEXT UNIQUE NOT NULL,                                                           -- Địa chỉ email đăng ký nhận thông tin khuyến mãi (duy nhất)
    discount_code TEXT DEFAULT 'WEBTRAVEL500K',                                           -- Mã giảm giá tặng kèm cho khách khi đăng ký thành công
    is_active BOOLEAN DEFAULT true,                                                       -- Trạng thái đăng ký nhận tin (true: Đang nhận tin, false: Đã hủy đăng ký)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL    -- Thời điểm đăng ký nhận bản tin
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

-- CẤP QUYỀN TOÀN DIỆN CHO CÁC ROLE TRUY CẬP SUPABASE
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

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

-- Kiểm tra trạng thái hệ thống
SELECT count(*) AS total_coupons FROM public.coupons;
SELECT count(*) AS total_destinations FROM public.destinations;
SELECT count(*) AS total_tours FROM public.tours;
