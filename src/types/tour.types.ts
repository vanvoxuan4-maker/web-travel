export type TourCategory = 'domestic' | 'international' | 'all';
export type TravelStyle = 'package' | 'combo' | 'private' | 'mice';
export type TourTheme = 'beach' | 'heritage' | 'adventure' | 'family' | 'wellness' | 'culinary';
export type TourTier = 'budget' | 'standard' | 'luxury';

export interface TransportLeg {
  date: string;
  time: string;
  arriveTime: string;
  flightNo: string;
  airline: string;
  from: string;
  to: string;
}

export interface TransportInfo {
  outbound: TransportLeg;
  inbound: TransportLeg;
}

export interface DepartureDate {
  date: string;
  dayOfWeek?: string;
  monthLabel?: string;
  sku?: string;
  seats: number;
  priceAdult: number;
  priceChild?: number;
  priceToddler?: number;
  priceInfant?: number;
  singleRoomSurcharge?: number;
  label: string | null;
  transport?: TransportInfo;
}

export interface HotelSpecs {
  hotelName: string;
  roomType: string;
  inclusions: string[];
}

export interface GalleryItem {
  url: string;
  title: string;
}

export interface RefundPolicyItem {
  condition: string;
  fee: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  meals?: string;
  hotel?: string;
  hotelStar?: number;
  activities?: string;
  image?: string;
  details?: string[];
  morning?: string;
  afternoon?: string;
  evening?: string;
}

export interface Tour {
  id: string;
  code: string;
  slug?: string;
  sku: string;
  title: string;
  shortTitle: string;
  destination: string;
  category: 'domestic' | 'international';
  travelStyle?: TravelStyle; // Hình thức: Tour trọn gói ghép đoàn, Combo, Tour riêng, MICE
  theme?: TourTheme; // Chủ đề: Biển đảo, Di sản, Mạo hiểm, Gia đình, Wellness, Ẩm thực
  type: string; // Tên hiển thị loại hình (VD: "Nghỉ Dưỡng & Biển Đảo")
  departureFrom: string;
  seatsLeft: number;
  departureSchedule: string;
  availableDates: string[];
  departureDates: DepartureDate[];
  durationDays: number;
  durationNights: number;
  priceAdult: number;
  priceChild: number;
  priceToddler: number;
  priceInfant: number;
  singleRoomSurcharge?: number;
  originalPrice?: number;
  discountPercent?: number;
  isFlashSale?: boolean;
  tier: TourTier;
  tierName: string;
  hotelTier: string;
  starRating: number;
  starCategory: TourTier;
  leiScore: string;
  esgScore: string;
  hotelSpecs: HotelSpecs;
  gallery: GalleryItem[];
  inclusionsList: string[];
  exclusionsList: string[];
  refundPolicy: RefundPolicyItem[];
  faqs: FAQItem[];
  rating: number;
  reviewsCount: number;
  badge: string;
  image: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  overview?: string;
  esgDesc?: string;
  leiDesc?: string;
  isAllInclusive?: boolean;
  weatherNotice?: string;
  status?: 'published' | 'draft' | 'hidden' | 'weather_suspended';
  isActive?: boolean;
}

export interface PassengerCounts {
  adults: number;
  children: number;
  toddlers: number;
  infants: number;
}

export interface BookingFormState {
  tourId: string;
  selectedDate: string;
  adults: number;
  children: number;
  toddlers: number;
  infants: number;
  singleRoom: boolean;
  addonInsurance: boolean;
  addonPickup: boolean;
  couponCode: string;
  couponDiscount: number;
  payOption: 'full' | 'deposit';
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  customerNotes: string;
}
