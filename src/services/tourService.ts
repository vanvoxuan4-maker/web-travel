import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Tour, TravelStyle, TourTheme, TourTier } from '../types/tour.types';
import { TOURS_DATA } from '../data/toursData';

const TOURS_CACHE_KEY = 'webtravel_tours_cache_v2';

// In-memory cache for fast reactive access
let cachedTours: Tour[] | null = null;

const notifyListeners = (tours: Tour[]) => {
  cachedTours = tours;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TOURS_CACHE_KEY, JSON.stringify(tours));
      window.dispatchEvent(new CustomEvent('webtravel:tours_updated', { detail: tours }));
    } catch {
      // ignore
    }
  }
};

/**
 * Mapper: Chuyển đổi dữ liệu từ Supabase snake_case sang TypeScript camelCase
 */
export function mapDbTourToTour(row: any): Tour {
  const datesArr = Array.isArray(row.available_dates) ? row.available_dates : ['15/09/2026', '22/09/2026', '29/09/2026'];
  const departureDates = Array.isArray(row.departure_dates) && row.departure_dates.length > 0
    ? row.departure_dates
    : datesArr.map((d: string, idx: number) => ({
        date: d,
        seats: 15,
        priceAdult: Number(row.price_adult) || 0,
        priceChild: Number(row.price_child) || Math.round((Number(row.price_adult) || 0) * 0.75),
        priceToddler: Number(row.price_toddler) || Math.round((Number(row.price_adult) || 0) * 0.5),
        priceInfant: Number(row.price_infant) || 500000,
        singleRoomSurcharge: Number(row.single_room_supplement) || Math.round((Number(row.price_adult) || 0) * 0.35),
        label: idx === 0 ? 'Chuyến Gần Nhất' : null
      }));

  return {
    id: row.id,
    code: row.slug ? `WT-${row.slug.toUpperCase()}` : `WT-${row.id}`,
    sku: `WT${row.id?.replace(/[^\d]/g, '') || '1000'}`,
    title: row.title || '',
    shortTitle: row.short_title || row.title || '',
    destination: row.destination_id?.replace(/^dest-/, '').toUpperCase() || row.short_title || row.title || 'Điểm đến nổi tiếng',
    category: row.category || 'domestic',
    travelStyle: (row.travel_style || 'package') as TravelStyle,
    theme: (row.theme || 'beach') as TourTheme,
    type: row.type || 'Nghỉ Dưỡng & Khám Phá',
    departureFrom: row.departure_from || 'TP. Hồ Chí Minh / Hà Nội',
    seatsLeft: 15,
    departureSchedule: 'Định kỳ hàng tuần',
    availableDates: datesArr,
    departureDates,
    durationDays: Number(row.duration_days) || 1,
    durationNights: Number(row.duration_nights) || 0,
    priceAdult: Number(row.price_adult) || 0,
    priceChild: Number(row.price_child) || Math.round((Number(row.price_adult) || 0) * 0.75),
    priceToddler: Number(row.price_toddler) || Math.round((Number(row.price_adult) || 0) * 0.5),
    priceInfant: Number(row.price_infant) || 500000,
    singleRoomSurcharge: Number(row.single_room_supplement) || Math.round((Number(row.price_adult) || 0) * 0.35),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
    isFlashSale: Boolean(row.is_flash_deal),
    tier: (row.tier || 'standard') as TourTier,
    tierName: row.tier === 'luxury' ? 'Dòng Luxury 5 Sao' : row.tier === 'budget' ? 'Dòng Tiết Kiệm' : 'Dòng Tiêu Chuẩn',
    hotelTier: row.tier === 'luxury' ? 'Khách Sạn / Resort 5★' : 'Khách Sạn 4★',
    starRating: row.tier === 'luxury' ? 5 : row.tier === 'budget' ? 3 : 4,
    starCategory: (row.tier || 'standard') as TourTier,
    leiScore: row.lei_score || '88/100',
    esgScore: row.esg_score || '85/100',
    hotelSpecs: {
      hotelName: 'Khách sạn / Resort tiêu chuẩn cao cấp',
      roomType: 'Phòng Deluxe / Superior (2 khách/phòng)',
      inclusions: ['Buffet sáng', 'Wifi miễn phí', 'Tiện ích phòng cao cấp']
    },
    gallery: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery : [
      { url: row.image, title: row.title }
    ],
    inclusionsList: Array.isArray(row.included) && row.included.length > 0 ? row.included : [
      'Xe du lịch đời mới đưa đón suốt hành trình',
      'Khách sạn tiêu chuẩn (2 khách/phòng, có buffet sáng)',
      'Vé tham quan tất cả các điểm trong chương trình',
      'Hướng dẫn viên chuyên nghiệp, nhiệt tình',
      'Bảo hiểm du lịch mức bồi thường 120.000.000đ/vụ'
    ],
    exclusionsList: Array.isArray(row.excluded) && row.excluded.length > 0 ? row.excluded : [
      'Chi phí cá nhân ngoài chương trình (giặt ủi, minibar)',
      'Tiền TIP cho tài xế và hướng dẫn viên',
      'Thuế VAT 8% (nếu yêu cầu xuất hóa đơn)'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 7 ngày', fee: 'Hoàn 100% tiền vé' },
      { condition: 'Hủy trước 3 - 5 ngày', fee: 'Hoàn 50% tiền vé' }
    ],
    faqs: [
      { q: 'Tour bao gồm những bữa ăn nào?', a: 'Đã bao gồm toàn bộ bữa ăn chính theo lịch trình và buffet sáng tại khách sạn.' }
    ],
    rating: 4.9,
    reviewsCount: 48,
    badge: row.is_flash_deal ? '🔥 Flash Sale' : 'Nổi Bật',
    image: row.image || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85',
    highlights: Array.isArray(row.highlights) && row.highlights.length > 0 ? row.highlights : [
      'Hành trình khám phá thiên nhiên và danh thắng tuyệt đẹp',
      'Trải nghiệm văn hóa & ẩm thực đặc sản bản địa'
    ],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    isActive: row.status !== 'hidden' && row.status !== 'deleted'
  };
}

/**
 * Mapper: Chuyển đổi dữ liệu từ TypeScript camelCase sang Supabase snake_case
 */
export function mapTourToDbTour(tour: Tour): any {
  // Only use valid destination_id if matches foreign key pattern, otherwise null to avoid FK error
  const validDestinationId = (tour.destination && tour.destination.startsWith('dest-')) ? tour.destination : null;

  return {
    id: tour.id,
    title: tour.title,
    short_title: tour.shortTitle || tour.title,
    slug: tour.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    destination_id: validDestinationId,
    category: tour.category || 'domestic',
    travel_style: tour.travelStyle || 'package',
    theme: tour.theme || 'beach',
    type: tour.type || 'Khám Phá',
    tier: tour.tier || 'standard',
    duration_days: tour.durationDays || 1,
    duration_nights: tour.durationNights || 0,
    departure_from: tour.departureFrom || 'Hà Nội / TP.HCM',
    price_adult: tour.priceAdult || 0,
    price_child: tour.priceChild || Math.round((tour.priceAdult || 0) * 0.75),
    price_toddler: tour.priceToddler || Math.round((tour.priceAdult || 0) * 0.5),
    price_infant: tour.priceInfant || 500000,
    single_room_supplement: tour.singleRoomSurcharge || 0,
    original_price: tour.originalPrice || null,
    is_flash_deal: Boolean(tour.isFlashSale),
    discount_percent: tour.discountPercent || 0,
    image: tour.image,
    gallery: tour.gallery || [],
    highlights: tour.highlights || [],
    itinerary: tour.itinerary || [],
    included: tour.inclusionsList || [],
    excluded: tour.exclusionsList || [],
    status: tour.isActive === false ? 'hidden' : 'published',
    esg_score: tour.esgScore || '88/100',
    lei_score: tour.leiScore || '85/100'
  };
}

/**
 * Service to fetch and manage tours from Supabase with safe fallback
 */
export const tourService = {
  /**
   * Fetch all tours (from cache -> Supabase -> local fallback)
   */
  async getAllTours(): Promise<Tour[]> {
    if (!isSupabaseConfigured || !supabase) {
      return cachedTours || TOURS_DATA;
    }

    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('Supabase tours fetch returned empty or error, falling back to local dataset:', error?.message);
        return cachedTours || TOURS_DATA;
      }

      const mapped = data.map(mapDbTourToTour);
      notifyListeners(mapped);
      return mapped;
    } catch (err) {
      console.error('Error fetching tours from Supabase:', err);
      return cachedTours || TOURS_DATA;
    }
  },

  /**
   * Get single tour by ID
   */
  async getTourById(id: string): Promise<Tour | undefined> {
    if (cachedTours) {
      const found = cachedTours.find(t => t.id === id);
      if (found) return found;
    }

    if (!isSupabaseConfigured || !supabase) {
      return TOURS_DATA.find(t => t.id === id);
    }

    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return TOURS_DATA.find(t => t.id === id);
      }

      return mapDbTourToTour(data);
    } catch (err) {
      console.error(`Error fetching tour ${id} from Supabase:`, err);
      return TOURS_DATA.find(t => t.id === id);
    }
  },

  /**
   * Insert new tour into Supabase
   */
  async createTour(tour: Tour): Promise<{ success: boolean; error?: string }> {
    // Optimistic update cache
    const currentList = cachedTours || TOURS_DATA;
    notifyListeners([tour, ...currentList.filter(t => t.id !== tour.id)]);

    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const dbPayload = mapTourToDbTour(tour);
      const { error } = await supabase.from('tours').insert([dbPayload]);
      if (error) {
        console.error('Error creating tour in Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi thêm tour' };
    }
  },

  /**
   * Update existing tour in Supabase
   */
  async updateTour(tour: Tour): Promise<{ success: boolean; error?: string }> {
    const currentList = cachedTours || TOURS_DATA;
    notifyListeners(currentList.map(t => t.id === tour.id ? tour : t));

    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const dbPayload = mapTourToDbTour(tour);
      const { error } = await supabase.from('tours').update(dbPayload).eq('id', tour.id);
      if (error) {
        console.error('Error updating tour in Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi cập nhật tour' };
    }
  },

  /**
   * Delete tour from Supabase
   */
  async deleteTour(id: string): Promise<{ success: boolean; error?: string }> {
    const currentList = cachedTours || TOURS_DATA;
    notifyListeners(currentList.filter(t => t.id !== id));

    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase.from('tours').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi xóa tour' };
    }
  }
};
