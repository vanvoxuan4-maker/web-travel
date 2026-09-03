import React, { useState, useEffect } from 'react';
import { Tour, TourTier, ItineraryDay, TravelStyle, TourTheme, DepartureDate, RefundPolicyItem, FAQItem } from '../../types/tour.types';
import { REFUND_POLICY_PRESETS, DEFAULT_REFUND_POLICY } from '../../data/policyPresets';
import { FAQ_PRESETS, DEFAULT_FAQS } from '../../data/faqPresets';

const getThemeLabel = (t: TourTheme): string => {
  switch (t) {
    case 'beach': return '🌴 Biển Đảo & Du Thuyền';
    case 'heritage': return '🏯 Văn Hóa & Di Sản';
    case 'adventure': return '⛰️ Mạo Hiểm & Trekking';
    case 'family': return '👨‍👩‍👧‍👦 Gia Đình & Trẻ Nhỏ';
    case 'wellness': return '🧘 Nghỉ Dưỡng & Spa';
    case 'culinary': return '🍜 Ẩm Thực & Rượu Vang';
    default: return 'Khám Phá';
  }
};

export const computeDayOfWeek = (dateStr: string): string => {
  try {
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[d.getDay()] || 'T2';
    }
  } catch {}
  return 'T2';
};

export const computeMonthLabel = (dateStr: string): string => {
  try {
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      return `Tháng ${parseInt(parts[1], 10)} ${parts[2]}`;
    }
  } catch {}
  return 'Tháng 9 2026';
};

export const HOLIDAY_PRESETS = [
  { label: '🎉 Lễ 30/4 - 1/5', date: '30/04/2026', surchargePercent: 30 },
  { label: '🇻🇳 Quốc Khánh 2/9', date: '02/09/2026', surchargePercent: 25 },
  { label: '🎄 Giáng Sinh', date: '24/12/2026', surchargePercent: 20 },
  { label: '🎆 Tết Dương Lịch', date: '01/01/2027', surchargePercent: 25 },
  { label: '🌸 Tết Nguyên Đán', date: '28/01/2027', surchargePercent: 35 }
];

interface AddTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTour: (tour: Tour) => Promise<void>;
}

const SAMPLE_IMAGES = [
  { name: '🌴 Vịnh Hạ Long', url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85' },
  { name: '⛰️ Sapa / Fansipan', url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏯 Đà Nẵng / Hội An', url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏖️ Phú Quốc Resort', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85' },
  { name: '✈️ Bangkok / Thái Lan', url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=85' }
];

const DEFAULT_INCLUSIONS = [
  'Xe du lịch đời mới đưa đón suốt hành trình',
  'Khách sạn tiêu chuẩn (2 khách/phòng, có buffet sáng)',
  'Vé tham quan tất cả các điểm trong chương trình',
  'Hướng dẫn viên chuyên nghiệp, nhiệt tình',
  'Bảo hiểm du lịch mức bồi thường 120.000.000đ/vụ',
  'Nước suối 2 chai 500ml/người/ngày + Khăn lạnh'
];

const DEFAULT_EXCLUSIONS = [
  'Chi phí cá nhân ngoài chương trình (giặt ủi, minibar)',
  'Tiền TIP cho tài xế và hướng dẫn viên (tùy tâm)',
  'Thuế VAT 8% (nếu yêu cầu xuất hóa đơn đỏ)',
  'Phụ thu phòng đơn (nếu khách đi 1 mình muốn ở riêng phòng)'
];

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const POPULAR_DESTINATION_KEYWORDS: { [key: string]: string } = {
  'sapa': 'SAPA',
  'fansipan': 'SAPA',
  'ha long': 'HALONG',
  'halong': 'HALONG',
  'da nang': 'DANANG',
  'danang': 'DANANG',
  'hoi an': 'HOIAN',
  'hoian': 'HOIAN',
  'hue': 'HUE',
  'phu quoc': 'PHUQUOC',
  'phuquoc': 'PHUQUOC',
  'nha trang': 'NHATRANG',
  'nhatrang': 'NHATRANG',
  'da lat': 'DALAT',
  'dalat': 'DALAT',
  'ninh binh': 'NINHBINH',
  'ninhbinh': 'NINHBINH',
  'quy nhon': 'QUYNHON',
  'quynhon': 'QUYNHON',
  'ha noi': 'HANOI',
  'hanoi': 'HANOI',
  'sai gon': 'SAIGON',
  'saigon': 'SAIGON',
  'ho chi minh': 'SAIGON',
  'quang binh': 'QUANGBINH',
  'con dao': 'CONDAO',
  'condao': 'CONDAO',
  'nhat ban': 'JAPAN',
  'japan': 'JAPAN',
  'tokyo': 'TOKYO',
  'osaka': 'OSAKA',
  'kyoto': 'KYOTO',
  'han quoc': 'KOREA',
  'korea': 'KOREA',
  'seoul': 'SEOUL',
  'thai lan': 'THAILAND',
  'thailand': 'THAILAND',
  'bangkok': 'BANGKOK',
  'singapore': 'SINGAPORE',
  'malaysia': 'MALAYSIA',
  'bali': 'BALI'
};

const getCleanDestKeyword = (destOrTitle: string): string => {
  if (!destOrTitle || !destOrTitle.trim()) return 'TOUR';
  const lowerNoTone = removeVietnameseTones(destOrTitle).toLowerCase();
  
  // Check known keywords first
  for (const [k, codeName] of Object.entries(POPULAR_DESTINATION_KEYWORDS)) {
    if (lowerNoTone.includes(k)) {
      return codeName;
    }
  }

  // Otherwise clean string
  const firstSegment = destOrTitle.split(/[-–,/:]/)[0].trim();
  const clean = removeVietnameseTones(firstSegment)
    .replace(/^(TOUR|DU LICH|HANH TRINH|KHAM PHA|TP\.?|THANH PHO|TINH|VINH|DAO|QUAN|KHU)\s+/gi, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return clean || 'TOUR';
};

export const generateRandomAlphanumeric = (length = 4): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const extractSuffixFromCode = (currentCode: string): string => {
  if (!currentCode) return generateRandomAlphanumeric(4);
  const parts = currentCode.split('-');
  if (parts.length >= 3 && parts[parts.length - 1].length >= 3) {
    return parts[parts.length - 1];
  }
  return generateRandomAlphanumeric(4);
};

export const generateStyle1TourCode = (destOrTitle: string, customSuffix?: string): string => {
  const keyword = getCleanDestKeyword(destOrTitle);
  const suffix = customSuffix || generateRandomAlphanumeric(4);
  return `WT-${keyword}-${suffix}`;
};

export const generateSlug = (text: string): string => {
  return removeVietnameseTones(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const AddTourModal: React.FC<AddTourModalProps> = ({
  isOpen,
  onClose,
  onAddTour
}) => {
  // Step state (1 -> 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Basic Info & Route
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [destination, setDestination] = useState('');
  const [departureFrom, setDepartureFrom] = useState('Hà Nội / TP.HCM');
  const [category, setCategory] = useState<'domestic' | 'international'>('domestic');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('package');
  const [theme, setTheme] = useState<TourTheme>('beach');
  const [durationDays, setDurationDays] = useState(4);
  const [durationNights, setDurationNights] = useState(3);
  const [code, setCode] = useState(() => generateStyle1TourCode('TOUR'));

  // STEP 2: Hotel Standard & Multi-Tier Pricing
  const [tier, setTier] = useState<TourTier>('standard');
  const [hotelName, setHotelName] = useState('Hệ thống Khách sạn & Resort 4★ cao cấp');
  const [roomType, setRoomType] = useState('Phòng Deluxe / Superior (2 khách/phòng, view đẹp)');
  const [priceAdult, setPriceAdult] = useState(6500000);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(8500000);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(24);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(false);
  const [priceChild, setPriceChild] = useState(4875000); // 75% (5-11 tuổi)
  const [priceToddler, setPriceToddler] = useState(3250000); // 50% (2-4 tuổi)
  const [priceInfant, setPriceInfant] = useState(500000); // Em bé (<2 tuổi)
  const [singleRoomSurcharge, setSingleRoomSurcharge] = useState(2275000); // 35% phụ thu phòng đơn
  const [seatsLeft, setSeatsLeft] = useState(15);

  // STEP 3: Itinerary (4-row structure per day)
  const [highlights, setHighlights] = useState<string>('Nghỉ đêm tại khách sạn & resort sang trọng có hồ bơi\nThưởng thức ẩm thực đặc sản tươi sống\nXe Limousine đưa đón tận nơi suốt tuyến');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([
    {
      day: 1,
      title: 'Tp. Hồ Chí Minh – Hà Nội',
      meals: 'Ăn trưa, tối',
      hotel: 'Khách sạn Silk Path Hotel 4★ Hà Nội',
      hotelStar: 4,
      activities: 'Tham quan trung tâm thủ đô Hà Nội',
      image: 'https://images.unsplash.com/photo-1599708153386-62bf3f03577d?auto=format&fit=crop&w=800&q=80',
      details: [
        'Bay ra Hà Nội từ sáng sớm.',
        'Tham quan Hoàng thành Thăng Long, Văn Miếu – Quốc Tử Giám.',
        'Buổi tối tự do dạo phố cổ Hà Nội, thưởng thức bún chả.',
        'Nghỉ đêm tại khách sạn 4★ trung tâm Hà Nội.'
      ]
    },
    {
      day: 2,
      title: 'Hà Nội – Hạ Long – Ngủ đêm trên du thuyền',
      meals: 'Ăn sáng, trưa, tối',
      hotel: 'Du Thuyền 5★ Vịnh Hạ Long',
      hotelStar: 5,
      activities: 'Chiêm ngưỡng kỳ quan Vịnh Hạ Long & Tiệc Sunset',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      details: [
        'Khởi hành đi Hạ Long qua cao tốc mới.',
        'Check-in du thuyền 5★, thưởng thức buffet trưa hải sản.',
        'Chèo thuyền kayak Hang Luồn, tắm biển đảo Titop.',
        'Tham gia tiệc Sunset Party trên sundeck & tiệc tối sang trọng.',
        'Nghỉ đêm trên du thuyền 5★ giữa vịnh ngọc.'
      ]
    },
    {
      day: 3,
      title: 'Hạ Long – Ninh Bình – Tràng An Bái Đính',
      meals: 'Ăn sáng, trưa, tối',
      hotel: 'Emeralda Resort Ninh Bình 4★',
      hotelStar: 4,
      activities: 'Khám phá Quần thể danh thắng Tràng An & Chùa Bái Đính',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      details: [
        'Đón bình minh & tập Thái Cực Quyền trên boong tàu.',
        'Tham quan Hang Sửng Sốt kỳ vĩ.',
        'Di chuyển về Ninh Bình, chèo thuyền ngắm Tràng An Tuyệt Tịnh Cốc.',
        'Viếng Chùa Bái Đính linh thiêng.',
        'Thưởng thức đặc sản thịt dê cơm cháy, nghỉ đêm tại resort.'
      ]
    },
    {
      day: 4,
      title: 'Ninh Bình – Nội Bài – Tp. Hồ Chí Minh',
      meals: 'Ăn sáng, trưa',
      hotel: 'Kết thúc tour (Trở về)',
      hotelStar: 0,
      activities: 'Mua sắm quà lưu niệm & Tiễn bay Nội Bài',
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
      details: [
        'Ăn sáng buffet tại resort, tự do dạo vườn chụp ảnh.',
        'Mua sắm đặc sản cơm cháy, mắm tép Gia Viễn.',
        'Xe đưa đoàn ra sân bay Nội Bài đáp chuyến bay về lại Tp. HCM.',
        'Kết thúc chuyến đi, HDV chia tay và hẹn gặp lại.'
      ]
    }
  ]);
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);

  // STEP 4: Media, Schedules & Publish
  const [image, setImage] = useState(SAMPLE_IMAGES[0].url);
  const [badge, setBadge] = useState('Mới Ra Mắt');
  const [departureDatesList, setDepartureDatesList] = useState<DepartureDate[]>([
    {
      date: '15/09/2026',
      dayOfWeek: 'T3',
      monthLabel: 'Tháng 9 2026',
      seats: 15,
      priceAdult: 6500000,
      priceChild: 4875000,
      priceToddler: 3250000,
      priceInfant: 500000,
      singleRoomSurcharge: 2275000,
      label: 'Chuyến Gần Nhất'
    },
    {
      date: '22/09/2026',
      dayOfWeek: 'T3',
      monthLabel: 'Tháng 9 2026',
      seats: 15,
      priceAdult: 6500000,
      priceChild: 4875000,
      priceToddler: 3250000,
      priceInfant: 500000,
      singleRoomSurcharge: 2275000,
      label: null
    },
    {
      date: '29/09/2026',
      dayOfWeek: 'T3',
      monthLabel: 'Tháng 9 2026',
      seats: 15,
      priceAdult: 6500000,
      priceChild: 4875000,
      priceToddler: 3250000,
      priceInfant: 500000,
      singleRoomSurcharge: 2275000,
      label: null
    },
    {
      date: '02/09/2026',
      dayOfWeek: 'T4',
      monthLabel: 'Tháng 9 2026',
      seats: 20,
      priceAdult: 7800000,
      priceChild: 5850000,
      priceToddler: 3900000,
      priceInfant: 500000,
      singleRoomSurcharge: 2730000,
      label: '🇻🇳 Quốc Khánh 2/9'
    }
  ]);

  // Quick Date Form States
  const [quickDateInput, setQuickDateInput] = useState('');
  const [quickDateLabel, setQuickDateLabel] = useState('');
  const [quickDatePrice, setQuickDatePrice] = useState<number>(6500000);
  const [quickDateSeats, setQuickDateSeats] = useState<number>(15);
  const [dateFormError, setDateFormError] = useState<string | null>(null);

  // New Enterprise Fields: All-Inclusive, Weather Notice, Status & Gallery
  const [isAllInclusive, setIsAllInclusive] = useState(false);
  const [weatherNotice, setWeatherNotice] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden' | 'weather_suspended'>('published');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80'
  ]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 4: Cancellation & Refund Policy Presets & Custom List
  const [selectedPolicyPreset, setSelectedPolicyPreset] = useState<string>('standard');
  const [refundPolicyList, setRefundPolicyList] = useState<RefundPolicyItem[]>(() => 
    DEFAULT_REFUND_POLICY.map(r => ({ ...r }))
  );

  const handleSelectPolicyPreset = (presetId: string) => {
    setSelectedPolicyPreset(presetId);
    const found = REFUND_POLICY_PRESETS.find(p => p.id === presetId);
    if (found) {
      setRefundPolicyList(found.rules.map(r => ({ ...r })));
    }
  };

  const handleAddPolicyRule = () => {
    setRefundPolicyList([
      ...refundPolicyList,
      { condition: 'Hủy trước ... ngày khởi hành', fee: 'Hoàn ...% tiền vé' }
    ]);
    setSelectedPolicyPreset('custom');
  };

  const handleUpdatePolicyRule = (index: number, field: 'condition' | 'fee', value: string) => {
    const updated = [...refundPolicyList];
    updated[index][field] = value;
    setRefundPolicyList(updated);
    setSelectedPolicyPreset('custom');
  };

  const handleDeletePolicyRule = (index: number) => {
    if (refundPolicyList.length <= 1) {
      alert('Chính sách cần có tối thiểu 1 điều khoản.');
      return;
    }
    setRefundPolicyList(refundPolicyList.filter((_, i) => i !== index));
    setSelectedPolicyPreset('custom');
  };

  // STEP 4: Frequently Asked Questions (FAQs) Presets & Custom List
  const [selectedFaqPreset, setSelectedFaqPreset] = useState<string>('general');
  const [faqList, setFaqList] = useState<FAQItem[]>(() => 
    DEFAULT_FAQS.map(f => ({ ...f }))
  );

  const handleSelectFaqPreset = (presetId: string) => {
    setSelectedFaqPreset(presetId);
    const found = FAQ_PRESETS.find(p => p.id === presetId);
    if (found) {
      setFaqList(found.faqs.map(f => ({ ...f })));
    }
  };

  const handleAddFaqItem = () => {
    setFaqList([
      ...faqList,
      { q: 'Tiêu đề câu hỏi cần giải đáp?', a: 'Nhập nội dung câu trả lời hướng dẫn chi tiết tại đây...' }
    ]);
    setSelectedFaqPreset('custom');
  };

  const handleUpdateFaqItem = (index: number, field: 'q' | 'a', value: string) => {
    const updated = [...faqList];
    updated[index][field] = value;
    setFaqList(updated);
    setSelectedFaqPreset('custom');
  };

  const handleDeleteFaqItem = (index: number) => {
    setFaqList(faqList.filter((_, i) => i !== index));
    setSelectedFaqPreset('custom');
  };

  // Helper: Add Single Date
  const handleAddSingleDate = () => {
    setDateFormError(null);
    const dStr = quickDateInput.trim();
    if (!dStr) {
      setDateFormError('Vui lòng nhập hoặc chọn ngày khởi hành (VD: 15/10/2026).');
      return;
    }
    if (departureDatesList.some(d => d.date === dStr)) {
      setDateFormError(`Ngày ${dStr} đã có trong danh sách.`);
      return;
    }

    const adultP = Number(quickDatePrice) > 0 ? Number(quickDatePrice) : priceAdult;
    const matchedPreset = HOLIDAY_PRESETS.find(p => p.date === dStr);
    const finalLabel = quickDateLabel.trim() || (matchedPreset ? matchedPreset.label : null);

    const newEntry: DepartureDate = {
      date: dStr,
      dayOfWeek: computeDayOfWeek(dStr),
      monthLabel: computeMonthLabel(dStr),
      seats: Number(quickDateSeats) || 15,
      priceAdult: adultP,
      priceChild: Math.round(adultP * 0.75),
      priceToddler: Math.round(adultP * 0.5),
      priceInfant: 500000,
      singleRoomSurcharge: Math.round(adultP * 0.35),
      label: finalLabel
    };

    setDepartureDatesList([...departureDatesList, newEntry]);
    setQuickDateInput('');
    setQuickDateLabel('');
  };

  // Helper: Quick Preset Holiday
  const handleQuickAddHoliday = (preset: typeof HOLIDAY_PRESETS[0]) => {
    if (departureDatesList.some(d => d.date === preset.date)) {
      return;
    }
    const holidayPrice = Math.round(priceAdult * (1 + preset.surchargePercent / 100));
    const newEntry: DepartureDate = {
      date: preset.date,
      dayOfWeek: computeDayOfWeek(preset.date),
      monthLabel: computeMonthLabel(preset.date),
      seats: 20,
      priceAdult: holidayPrice,
      priceChild: Math.round(holidayPrice * 0.75),
      priceToddler: Math.round(holidayPrice * 0.5),
      priceInfant: 500000,
      singleRoomSurcharge: Math.round(holidayPrice * 0.35),
      label: preset.label
    };
    setDepartureDatesList([...departureDatesList, newEntry]);
  };

  // Helper: Bulk Add All Holidays
  const handleBulkAddAllHolidays = () => {
    const newItems: DepartureDate[] = [];
    HOLIDAY_PRESETS.forEach(preset => {
      if (!departureDatesList.some(d => d.date === preset.date)) {
        const holidayPrice = Math.round(priceAdult * (1 + preset.surchargePercent / 100));
        newItems.push({
          date: preset.date,
          dayOfWeek: computeDayOfWeek(preset.date),
          monthLabel: computeMonthLabel(preset.date),
          seats: 20,
          priceAdult: holidayPrice,
          priceChild: Math.round(holidayPrice * 0.75),
          priceToddler: Math.round(holidayPrice * 0.5),
          priceInfant: 500000,
          singleRoomSurcharge: Math.round(holidayPrice * 0.35),
          label: preset.label
        });
      }
    });
    if (newItems.length > 0) {
      setDepartureDatesList([...departureDatesList, ...newItems]);
    }
  };

  // Helper: Bulk Add 4 Weekends
  const handleBulkAddWeekends = () => {
    const weekendDates = ['09/10/2026', '10/10/2026', '16/10/2026', '17/10/2026', '23/10/2026', '24/10/2026'];
    const newItems: DepartureDate[] = [];
    weekendDates.forEach(wDate => {
      if (!departureDatesList.some(d => d.date === wDate)) {
        const weekendPrice = Math.round(priceAdult * 1.1); // +10% weekend rate
        newItems.push({
          date: wDate,
          dayOfWeek: computeDayOfWeek(wDate),
          monthLabel: computeMonthLabel(wDate),
          seats: 15,
          priceAdult: weekendPrice,
          priceChild: Math.round(weekendPrice * 0.75),
          priceToddler: Math.round(weekendPrice * 0.5),
          priceInfant: 500000,
          singleRoomSurcharge: Math.round(weekendPrice * 0.35),
          label: '⭐ Cuối Tuần'
        });
      }
    });
    setDepartureDatesList([...departureDatesList, ...newItems]);
  };

  // Helper: Sync Base Price to all dates
  const handleSyncBasePriceToAll = () => {
    setDepartureDatesList(departureDatesList.map(d => ({
      ...d,
      priceAdult,
      priceChild: Math.round(priceAdult * 0.75),
      priceToddler: Math.round(priceAdult * 0.5),
      priceInfant: 500000,
      singleRoomSurcharge: Math.round(priceAdult * 0.35)
    })));
  };

  // Helper: Update single date row
  const handleUpdateDateRow = (index: number, updates: Partial<DepartureDate>) => {
    const updated = [...departureDatesList];
    const target = { ...updated[index], ...updates };
    if (updates.priceAdult !== undefined) {
      const p = updates.priceAdult;
      target.priceChild = Math.round(p * 0.75);
      target.priceToddler = Math.round(p * 0.5);
      target.priceInfant = 500000;
      target.singleRoomSurcharge = Math.round(p * 0.35);
    }
    updated[index] = target;
    setDepartureDatesList(updated);
  };

  const handleRemoveDateRow = (index: number) => {
    setDepartureDatesList(departureDatesList.filter((_, idx) => idx !== index));
  };

  // Handle Title input change with real-time auto code & destination extraction
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
    const suffix = extractSuffixFromCode(code);
    const newCode = generateStyle1TourCode(destination || newTitle, suffix);
    setCode(newCode);

    // Auto extract destination if empty
    if (!destination.trim()) {
      const lower = removeVietnameseTones(newTitle).toLowerCase();
      for (const [k] of Object.entries(POPULAR_DESTINATION_KEYWORDS)) {
        if (lower.includes(k)) {
          const capName = k.charAt(0).toUpperCase() + k.slice(1);
          setDestination(capName);
          break;
        }
      }
    }
  };

  // Handle Destination input change with real-time auto code update
  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    const suffix = extractSuffixFromCode(code);
    setCode(generateStyle1TourCode(newDest || title, suffix));
  };

  // Handle Nights change
  const handleNightsChange = (newNights: number) => {
    const validNights = Math.max(0, newNights);
    setDurationNights(validNights);
  };

  // Trigger auto-code on initial open
  useEffect(() => {
    if (!code) {
      setCode(generateStyle1TourCode(destination || 'TOUR'));
    }
  }, []);

  // Sync nights when days change
  const handleDaysChange = (newDays: number) => {
    const validDays = Math.max(1, newDays);
    const validNights = Math.max(0, validDays - 1);
    setDurationDays(validDays);
    setDurationNights(validNights);

    // Auto-adjust itinerary days
    const currentItin = [...itineraryDays];
    if (validDays > currentItin.length) {
      for (let i = currentItin.length + 1; i <= validDays; i++) {
        currentItin.push({
          day: i,
          title: `Ngày ${i}: Khám phá điểm đến`,
          meals: 'Ăn sáng, trưa, tối',
          hotel: i === validDays ? 'Kết thúc hành trình' : 'Khách sạn 4 sao tiêu chuẩn',
          hotelStar: i === validDays ? 0 : 4,
          activities: 'Tham quan và trải nghiệm văn hóa ẩm thực',
          image: SAMPLE_IMAGES[(i - 1) % SAMPLE_IMAGES.length].url,
          details: [
            'Ăn sáng buffet tại khách sạn.',
            'Tham quan danh thắng địa phương nổi tiếng.',
            'Thưởng thức ẩm thực đặc sản đêm.',
            'Tự do sinh hoạt & nghỉ ngơi.'
          ]
        });
      }
    } else {
      currentItin.splice(validDays);
    }
    setItineraryDays(currentItin);
  };

  // Auto-calculate Child, Toddler & Single Surcharge on Adult Price change
  const handleAdultPriceChange = (val: string | number) => {
    const cleanStr = val.toString().replace(/[^\d]/g, '');
    const num = Math.max(0, Number(cleanStr) || 0);
    setPriceAdult(num);
    // 1. Trẻ em (5–11t) = 75% vé lớn
    setPriceChild(Math.round(num * 0.75));
    // 2. Trẻ nhỏ (2–4t) = 50% vé lớn
    setPriceToddler(Math.round(num * 0.5));
    // 3. Phụ thu phòng đơn = 35% vé lớn (tùy chọn)
    setSingleRoomSurcharge(Math.round(num * 0.35));

    // Recalculate discount % if original price exists
    if (originalPrice && originalPrice > num) {
      setDiscountPercent(Math.round(((originalPrice - num) / originalPrice) * 100));
    }
  };

  // Two-way calculation when Original Price changes
  const handleOriginalPriceChange = (val: string | number) => {
    const cleanStr = val.toString().replace(/[^\d]/g, '');
    const num = Math.max(0, Number(cleanStr) || 0);
    setOriginalPrice(num || undefined);
    if (num > priceAdult && num > 0) {
      setDiscountPercent(Math.round(((num - priceAdult) / num) * 100));
    } else {
      setDiscountPercent(undefined);
    }
  };

  // Two-way calculation when Discount % changes
  const handleDiscountPercentChange = (pct: number) => {
    const validPct = Math.min(90, Math.max(0, pct));
    setDiscountPercent(validPct || undefined);
    if (originalPrice && validPct > 0) {
      const calculatedAdult = Math.round(originalPrice * (1 - validPct / 100));
      handleAdultPriceChange(calculatedAdult);
    } else if (priceAdult && validPct > 0) {
      const calculatedOrig = Math.round(priceAdult / (1 - validPct / 100));
      setOriginalPrice(calculatedOrig);
    }
  };

  // Fast Quick-Template Fill
  const handleLoadTemplate = (type: 'beach' | 'mountain' | 'heritage') => {
    setIsSlugManuallyEdited(false);
    if (type === 'beach') {
      const tTitle = 'Tour Nha Trang - Biển Xanh Vịnh Ngọc 4N3Đ (Resort 5 Sao)';
      setTitle(tTitle);
      setSlug(generateSlug(tTitle));
      setDestination('Nha Trang');
      setCode(generateStyle1TourCode('Nha Trang'));
      setCategory('domestic');
      setTravelStyle('package');
      setTheme('beach');
      setTier('luxury');
      setHotelName('Vinpearl Resort & Spa Nha Trang 5★');
      setRoomType('Phòng Deluxe Hướng Biển (2 khách/phòng)');
      handleAdultPriceChange(8900000);
      handleDaysChange(4);
      setItineraryDays([
        { day: 1, title: 'Đón Bay Cam Ranh - Nhận Phòng Resort Vinpearl', meals: 'Ăn trưa hải sản, tối BBQ', hotel: 'Vinpearl Resort & Spa Nha Trang 5★', hotelStar: 5, activities: 'Check-in resort 5★ & Tắm biển bãi riêng', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', details: ['Xe đón tại sân bay Cam Ranh về bến tàu cao tốc.', 'Nhận phòng Deluxe hướng biển tại Vinpearl 5★.', 'Thưởng thức buffet hải sản tươi sống.', 'Tự do dạo biển đêm ngắm vịnh Nha Trang.'] },
        { day: 2, title: 'Vui Chơi VinWonders - Show Nhạc Nước Tata Show', meals: 'Ăn sáng buffet 5★, trưa, tối', hotel: 'Vinpearl Resort & Spa Nha Trang 5★', hotelStar: 5, activities: 'Khu vui chơi giải trí quốc tế VinWonders', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', details: ['Trải nghiệm cáp treo vượt biển dài nhất vịnh.', 'Khám phá thủy cung và công viên nước.', 'Thưởng thức Tata Show đẳng cấp quốc tế.', 'Nghỉ đêm tại Vinpearl Resort 5★.'] },
        { day: 3, title: 'Du Thuyền Ngắm Vịnh Nha Trang - Lặn San Hô Hòn Mun', meals: 'Ăn sáng, trưa trên tàu, tối Gala', hotel: 'Amiana Resort Nha Trang 5★', hotelStar: 5, activities: 'Lặn ngắm san hô & Tắm bùn khoáng nóng I-Resort', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', details: ['Du thuyền tham quan Hòn Mun ngắm san hô.', 'Tắm bùn khoáng nóng thư giãn tại I-Resort.', 'Tiệc Gala Dinner tại nhà hàng ven biển.', 'Nghỉ đêm tại Amiana Resort 5★.'] },
        { day: 4, title: 'Chợ Đầm Mua Đặc Sản - Tiễn Bay Cam Ranh', meals: 'Ăn sáng buffet, trưa nhẹ', hotel: 'Kết thúc tour (Trở về)', hotelStar: 0, activities: 'Mua sắm đặc sản yến sào & tiễn sân bay', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80', details: ['Ăn sáng buffet, check-out resort.', 'Mua sắm yến sào, chả cá Nha Trang.', 'Xe tiễn đoàn ra sân bay Cam Ranh.', 'Kết thúc chuyến hành trình 4N3Đ trọn vẹn.'] }
      ]);
      setImage('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85');
      setBadge('Hot 5 Sao');
    } else if (type === 'mountain') {
      const tTitle = 'Tour Sapa - Fansipan - Bản Cát Cát 3N2Đ (Khách Sạn 4-5 Sao)';
      setTitle(tTitle);
      setSlug(generateSlug(tTitle));
      setDestination('Sapa');
      setCode(generateStyle1TourCode('Sapa'));
      setCategory('domestic');
      setTravelStyle('package');
      setTheme('adventure');
      setTier('standard');
      setHotelName('Pao\'s Sapa Leisure 4★ / MGallery 5★');
      setRoomType('Phòng Superior View Thung Lũng Mường Hoa');
      handleAdultPriceChange(4900000);
      handleDaysChange(3);
      setItineraryDays([
        { day: 1, title: 'Hà Nội – Sapa – Khám Phá Bản Cát Cát', meals: 'Ăn trưa cơm lam, tối lẩu cá tầm', hotel: 'Pao\'s Sapa Leisure Hotel 4★', hotelStar: 4, activities: 'Khám phá văn hóa H\'Mông tại Bản Cát Cát', image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=800&q=80', details: ['Xe Limousine đón tại Hà Nội lên Sapa qua cao tốc.', 'Nhận phòng view thung lũng Mường Hoa.', 'Tham quan Bản Cát Cát, chụp ảnh ruộng bậc thang.', 'Thưởng thức lẩu cá tầm nóng hổi giữa tiết trời se lạnh.'] },
        { day: 2, title: 'Chinh Phục Đỉnh Fansipan 3.143m Nóc Nhà Đông Dương', meals: 'Ăn sáng buffet, trưa, tối Tây Bắc', hotel: 'Hotel de la Coupole - MGallery 5★', hotelStar: 5, activities: 'Cáp treo Fansipan & Trải nghiệm khách sạn MGallery 5★', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', details: ['Cáp treo Fansipan chiêm bái Đại Tượng Phật.', 'Check-in cột mốc 3.143m ngắm biển mây.', 'Check-in Hotel de la Coupole 5★ sang trọng.', 'Thưởng thức ẩm thực Tây Bắc cao cấp.'] },
        { day: 3, title: 'Đèo Ô Quy Hồ – Mua Đặc Sản – Về Hà Nội', meals: 'Ăn sáng buffet 5★, trưa đặc sản', hotel: 'Kết thúc tour (Trở về)', hotelStar: 0, activities: 'Ngắm Tứ Đại Đỉnh Đèo Ô Quy Hồ & Trở về', image: 'https://images.unsplash.com/photo-1599708153386-62bf3f03577d?auto=format&fit=crop&w=800&q=80', details: ['Ăn sáng buffet 5★, ngắm view đèo Ô Quy Hồ.', 'Mua sắm nấm hương, thịt trâu gác bếp, mận tam hoa.', 'Xe đưa đoàn về lại điểm hẹn ban đầu tại Hà Nội.', 'Kết thúc hành trình an toàn.'] }
      ]);
      setImage('https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85');
      setBadge('Bán Chạy');
    } else {
      const tTitle = 'Tour Đà Nẵng - Cố Đô Huế - Phố Cổ Hội An 4N3Đ';
      setTitle(tTitle);
      setSlug(generateSlug(tTitle));
      setDestination('Đà Nẵng');
      setCode(generateStyle1TourCode('Đà Nẵng'));
      setCategory('domestic');
      setTravelStyle('package');
      setTheme('heritage');
      setTier('standard');
      setHotelName('Hệ thống Khách sạn 4★ & 5★ Liên Tuyến');
      setRoomType('Phòng Deluxe City View');
      handleAdultPriceChange(6500000);
      handleDaysChange(4);
      setItineraryDays([
        { day: 1, title: 'Đón Bay Đà Nẵng – Bán Đảo Sơn Trà – Biển Mỹ Khê', meals: 'Ăn trưa mì Quảng, tối hải sản', hotel: 'Four Points by Sheraton Danang 4★', hotelStar: 4, activities: 'Viếng Chùa Linh Ứng Sơn Trà & Tắm biển Mỹ Khê', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80', details: ['Xe đón tại sân bay Đà Nẵng, viếng Chùa Linh Ứng.', 'Nhận phòng tại Four Points by Sheraton 4★.', 'Thưởng thức hải sản tươi sống ven biển Mỹ Khê.', 'Xem Cầu Rồng phun lửa và dạo phố đêm Bạch Đằng.'] },
        { day: 2, title: 'Đà Nẵng – Đèo Hải Vân – Cố Đô Huế', meals: 'Ăn sáng buffet, trưa cung đình, tối', hotel: 'Silk Path Grand Hotel Hue 5★', hotelStar: 5, activities: 'Chinh phục Đèo Hải Vân & Viếng Đại Nội Huế', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80', details: ['Khởi hành đi Huế qua Đèo Hải Vân hùng vĩ.', 'Check-in Silk Path Grand Huế 5★ phong cách hoàng gia.', 'Viếng Ngọ Môn, Điện Thái Hòa tại Đại Nội.', 'Du thuyền sông Hương nghe ca Huế mộc mạc.'] },
        { day: 3, title: 'Huế – Lăng Khải Định – Phố Cổ Hội An', meals: 'Ăn sáng buffet 5★, trưa, tối cao lầu', hotel: 'Almanity Hoi An Wellness Resort 4★', hotelStar: 4, activities: 'Thả hoa đăng trên sông Hoài & Phố cổ đèn lồng', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', details: ['Viếng Lăng Khải Định với kiến trúc tinh xảo.', 'Di chuyển về Hội An, nhận phòng tại Almanity Resort 4★.', 'Dạo phố cổ đèn lồng, Chùa Cầu, Nhà cổ Tấn Ký.', 'Thả hoa đăng cầu may mắn trên sông Hoài.'] },
        { day: 4, title: 'Rừng Dừa Bảy Mẫu – Tiễn Bay Đà Nẵng', meals: 'Ăn sáng buffet, trưa đặc sản', hotel: 'Kết thúc tour (Trở về)', hotelStar: 0, activities: 'Chèo thuyền thúng Rừng Dừa Bảy Mẫu & Tiễn bay', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', details: ['Trải nghiệm múa thuyền thúng vui nhộn tại Rừng Dừa.', 'Mua sắm đặc sản bánh khô mè, chả bò Đà Nẵng.', 'Xe tiễn đoàn ra sân bay Đà Nẵng.', 'Kết thúc chuyến tham quan Di sản Miền Trung.'] }
      ]);
      setImage('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85');
      setBadge('Mới Ra Mắt');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập Tên Tour trước khi xuất bản!');
      setCurrentStep(1);
      return;
    }
    if (!destination.trim()) {
      alert('Vui lòng nhập Điểm Đến Chính ở Tab 1!');
      setCurrentStep(1);
      return;
    }
    if (priceAdult <= 0) {
      alert('Vui lòng nhập Bảng Giá vé người lớn hợp lệ ở Tab 3!');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const starRating = tier === 'luxury' ? 5 : tier === 'standard' ? 4 : 3;
      const hotelTier = tier === 'luxury' ? 'Resort 5★' : tier === 'standard' ? 'Khách Sạn 4★' : 'Khách Sạn 3★';
      const tierName = tier === 'luxury' ? 'Dòng Luxury' : tier === 'standard' ? 'Dòng Tiêu Chuẩn' : 'Dòng Tiết Kiệm';

      const departureDatesObj: DepartureDate[] = departureDatesList.length > 0
        ? departureDatesList
        : [
            {
              date: '15/09/2026',
              dayOfWeek: 'T3',
              monthLabel: 'Tháng 9 2026',
              seats: seatsLeft,
              priceAdult,
              priceChild,
              priceToddler,
              priceInfant,
              singleRoomSurcharge,
              label: 'Chuyến Gần Nhất'
            }
          ];

      const datesArr = departureDatesObj.map((d) => d.date);
      const minPriceAdult = Math.min(...departureDatesObj.map(d => d.priceAdult)) || priceAdult;
      const totalSeatsSum = departureDatesObj.reduce((sum, d) => sum + (d.seats || 0), 0) || seatsLeft;

      const highlightsArr = highlights
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const finalCode = code.trim() || generateStyle1TourCode(destination || title || 'TOUR');

      const finalSlug = slug.trim() || generateSlug(title.trim());
      const newTourObj: Tour = {
        id: `tour-${Date.now()}`,
        code: finalCode.toUpperCase(),
        slug: finalSlug,
        sku: `WT${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        shortTitle: title.trim(),
        destination: destination.trim() || 'Điểm đến nổi tiếng',
        category,
        travelStyle,
        theme,
        type: getThemeLabel(theme),
        departureFrom: departureFrom.trim(),
        seatsLeft: totalSeatsSum,
        departureSchedule: 'Định kỳ hàng tuần',
        availableDates: datesArr.length > 0 ? datesArr : ['15/09/2026', '22/09/2026'],
        departureDates: departureDatesObj,
        durationDays,
        durationNights,
        priceAdult: minPriceAdult,
        priceChild,
        priceToddler,
        priceInfant,
        singleRoomSurcharge,
        originalPrice,
        discountPercent,
        isFlashSale,
        tier,
        tierName,
        hotelTier,
        starRating,
        starCategory: tier,
        leiScore: '92/100',
        esgScore: '89/100',
        hotelSpecs: {
          hotelName: hotelName.trim(),
          roomType: roomType.trim(),
          inclusions: ['Buffet sáng', 'Wifi miễn phí', 'Tiện ích phòng cao cấp']
        },
        gallery: [
          { url: image, title: title.trim() },
          ...galleryUrls.map(u => ({ url: u, title: title.trim() }))
        ],
        inclusionsList: inclusions,
        exclusionsList: exclusions,
        refundPolicy: refundPolicyList,
        faqs: faqList,
        rating: 5.0,
        reviewsCount: 1,
        image,
        highlights: highlightsArr.length > 0 ? highlightsArr : ['Trải nghiệm nghỉ dưỡng đẳng cấp', 'Lịch trình phong phú, ẩm thực đặc sắc'],
        badge: badge.trim() || 'Mới Ra Mắt',
        itinerary: itineraryDays,
        isAllInclusive,
        weatherNotice: weatherNotice.trim() || undefined,
        status,
        isActive: status !== 'hidden'
      };

      await onAddTour(newTourObj);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#f8fafc',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Fullscreen Studio Top Header */}
      <div
        style={{
          padding: '0.85rem 2.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 0.85rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
            }}
          >
            <i className="fa-solid fa-compass" style={{ fontSize: '1.1rem' }}></i>
            <span>WEBTRAVEL STUDIO</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                Khởi Tạo Tour Du Lịch Mới
              </h3>
              {title && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '8px',
                    maxWidth: '380px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {title}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Trình quản trị toàn màn hình: thông tin chung, khách sạn, bảng giá ngày lễ và lịch trình chi tiết
            </p>
          </div>
        </div>

        {/* Quick Template Buttons & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', padding: '0.3rem 0.5rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', padding: '0 0.3rem' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#047857' }}></i> Nạp Mẫu:
            </span>
            <button
              type="button"
              onClick={() => handleLoadTemplate('beach')}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}
              title="Nạp mẫu tour biển đảo 5 sao"
            >
              🌴 Biển 5★
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('mountain')}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}
              title="Nạp mẫu tour Sapa 4 sao"
            >
              ⛰️ Sapa 4★
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('heritage')}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}
              title="Nạp mẫu tour Đà Nẵng - Hội An"
            >
              🏯 Di Sản 4★
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#fee2e2',
              border: 'none',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#b91c1c',
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Đóng Studio"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* 4-Tab Navigation Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1.5px solid #e2e8f0', padding: '0.65rem 2.5rem', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '1440px', margin: '0 auto' }}>
          {[
            { num: 1, title: '1. Thông Tin Chung & Hình Ảnh', icon: 'fa-map-location-dot', desc: 'Tên tour, điểm đến, mã tour, ảnh bìa, badge' },
            { num: 2, title: '2. Khách Sạn & Tiện Nghi Lưu Trú', icon: 'fa-hotel', desc: 'Hạng sao, resort, loại phòng, tiện ích phòng' },
            { num: 3, title: '3. Bảng Giá & Lịch Khởi Hành', icon: 'fa-tags', desc: 'Giá 4 độ tuổi, phụ thu ngày lễ & lịch khởi hành' },
            { num: 4, title: '4. Lịch Trình Chi Tiết & Dịch Vụ', icon: 'fa-route', desc: 'Lịch trình từng ngày, dịch vụ bao gồm & không bao gồm' }
          ].map((tab) => {
            const isCurrent = currentStep === tab.num;
            const isPassed = currentStep > tab.num;

            return (
              <button
                key={tab.num}
                type="button"
                onClick={() => setCurrentStep(tab.num as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  background: isCurrent ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' : isPassed ? '#ecfdf5' : '#f8fafc',
                  color: isCurrent ? '#ffffff' : isPassed ? '#047857' : '#475569',
                  border: isCurrent ? '1.5px solid #047857' : isPassed ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  boxShadow: isCurrent ? '0 6px 16px rgba(4, 120, 87, 0.25)' : 'none',
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isCurrent ? 'rgba(255,255,255,0.2)' : isPassed ? '#d1fae5' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    flexShrink: 0,
                    boxShadow: isCurrent ? 'none' : '0 2px 4px rgba(0,0,0,0.04)'
                  }}
                >
                  {isPassed ? <i className="fa-solid fa-check"></i> : <i className={`fa-solid ${tab.icon}`}></i>}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {tab.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: isCurrent ? 0.9 : 0.75, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN STUDIO BODY */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '2rem 3rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            
            {/* ========================================================================= */}
            {/* TAB 1: THÔNG TIN CHUNG & HÌNH ẢNH */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Tên Tour Du Lịch Đầy Đủ (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tour Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình Tràng An 4N3Đ"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* URL Slug (SEO Friendly) */}
                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-link" style={{ color: '#047857' }}></i> Đường Dẫn Thân Thiện (URL Slug / SEO)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugManuallyEdited(false);
                        setSlug(generateSlug(title));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.75rem',
                        color: '#047857',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Tự động đồng bộ lại từ Tên Tour"
                    >
                      <i className="fa-solid fa-rotate"></i> Đồng bộ theo Tên
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="vd: tour-ha-noi-ha-long-ninh-binh-4n3d"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Xem trước liên kết:</span>
                    <code style={{ background: '#e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#047857', fontWeight: 700 }}>
                      https://webtravel.vn/tour/{slug || generateSlug(title) || 'ten-tour-mau'}
                    </code>
                  </div>
                </div>

                {/* Destination & Auto Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Điểm Đến Chính (Destination) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hà Nội / Hạ Long / Sapa..."
                      value={destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                        Mã Tour Tự Động (Tour Code)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCode(generateStyle1TourCode(destination || title || 'TOUR'))}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.76rem',
                          color: '#047857',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Tự sinh mã
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #047857',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#047857',
                        background: '#f0fdf4',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Departure From & Badge */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Điểm Khởi Hành / Tập Trung
                    </label>
                    <input
                      type="text"
                      value={departureFrom}
                      onChange={(e) => setDepartureFrom(e.target.value)}
                      placeholder="Hà Nội / TP.HCM / Đà Nẵng"
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Nhãn Tag Tiếp Thị (Badge)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        placeholder="Hot / Mới Ra Mắt / Giờ Chót"
                        style={{
                          flex: 1,
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {['🔥 Bán Chạy', '⭐ Hot 5 Sao', '🚀 Mới Ra Mắt'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBadge(b)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.45rem 0.55rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: badge === b ? '#047857' : '#ffffff',
                              color: badge === b ? '#ffffff' : '#475569',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Taxonomy Dimensions: Geo Category, Travel Style & Theme */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.3fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      1. Phạm Vi Địa Lý *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="domestic">🇻🇳 Tour Trong Nước</option>
                      <option value="international">✈️ Tour Quốc Tế</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      2. Hình Thức Đi *
                    </label>
                    <select
                      value={travelStyle}
                      onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="package">🚌 Tour Trọn Gói Ghép Đoàn (Có HDV)</option>
                      <option value="combo">✈️ Combo Free &amp; Easy (Vé + KS)</option>
                      <option value="private">👑 Tour Riêng May Đo / VIP</option>
                      <option value="mice">🏢 Du Lịch Doanh Nghiệp MICE</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      3. Chủ Đề Trải Nghiệm *
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as TourTheme)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="beach">🌴 Biển Đảo &amp; Du Thuyền</option>
                      <option value="heritage">🏯 Văn Hóa &amp; Di Sản</option>
                      <option value="adventure">⛰️ Mạo Hiểm &amp; Trekking</option>
                      <option value="family">👨‍👩‍👧‍👦 Gia Đình &amp; Trẻ Em</option>
                      <option value="wellness">🧘 Nghỉ Dưỡng &amp; Wellness</option>
                      <option value="culinary">🍜 Ẩm Thực &amp; Rượu Vang</option>
                    </select>
                  </div>
                </div>

                {/* Duration Days & Nights */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Thời Lượng: Số Ngày (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={durationDays}
                      onChange={(e) => handleDaysChange(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Thời Lượng: Số Đêm (Nights)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={durationNights}
                      onChange={(e) => handleNightsChange(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Weather Notice & Best Season */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-cloud-sun" style={{ color: '#0284c7', marginRight: '0.35rem' }}></i> Lưu Ý Thời Tiết & Mùa Khởi Hành Đẹp Nhất (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={weatherNotice}
                    onChange={(e) => setWeatherNotice(e.target.value)}
                    placeholder="Ví dụ: Mùa hoa anh đào từ T3-T4 / Mùa biển êm từ T4-T8 / Tháng 10-12 có thể đổi cano sang tàu cao tốc"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Cover Image URL & Presets */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Link Ảnh Bìa Đại Diện (Cover Image URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '0.75rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Chọn nhanh ảnh mẫu phong cảnh:</span>
                    {SAMPLE_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(img.url)}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: image === img.url ? '2px solid #047857' : '1px solid #cbd5e1',
                          background: image === img.url ? '#ecfdf5' : '#ffffff',
                          color: image === img.url ? '#047857' : '#475569',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Album Gallery Images */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-images" style={{ color: '#047857', marginRight: '0.35rem' }}></i> Thư Viện Album Ảnh Phụ (Gallery - Tùy chọn)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="url"
                      placeholder="Dán link ảnh Unsplash/CDN để thêm vào album..."
                      value={newGalleryInput}
                      onChange={(e) => setNewGalleryInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newGalleryInput.trim()) {
                          setGalleryUrls([...galleryUrls, newGalleryInput.trim()]);
                          setNewGalleryInput('');
                        }
                      }}
                      style={{
                        padding: '0.65rem 1.2rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#047857',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Thêm Ảnh
                    </button>
                  </div>
                  {galleryUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {galleryUrls.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '90px', height: '65px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
                          <img src={url} alt="album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setGalleryUrls(galleryUrls.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KHÁCH SẠN & TIỆN NGHI LƯU TRÚ */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Hotel Standard & Room Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Hạng Sao Cam Kết Của Tour (Bộ lọc tìm kiếm) *
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as TourTier)}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="luxury">👑 5★ Luxury Resort (Toàn bộ 5 sao cao cấp)</option>
                      <option value="standard">⭐ 4★ Phổ Thông (Tiêu chuẩn 4 sao sang trọng)</option>
                      <option value="budget">🏷️ 3★ Tiết Kiệm (Tiêu chuẩn 3 sao tiện nghi)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Tên Khách Sạn / Resort Tiêu Chuẩn *
                    </label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      placeholder="VD: Vinpearl Resort & Spa Nha Trang 5★"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Room Type & ESG Scores */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Tiêu Chuẩn Phòng Lưu Trú Chung *
                    </label>
                    <input
                      type="text"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      placeholder="Phòng Deluxe / Superior (2 khách/phòng, view đẹp)"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Chỉ Số Trải Nghiệm (LEI)
                    </label>
                    <input
                      type="text"
                      defaultValue="92/100"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#047857',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#f0fdf4'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Chỉ Số Xanh (ESG)
                    </label>
                    <input
                      type="text"
                      defaultValue="89/100"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#047857',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#f0fdf4'
                      }}
                    />
                  </div>
                </div>

                {/* Hotel Inclusions Checklist */}
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <i className="fa-solid fa-concierge-bell" style={{ color: '#047857' }}></i>
                    <span>Tiện Ích Khách Sạn &amp; Dịch Vụ Phòng Tiêu Chuẩn Bao Gồm:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                      '🍳 Buffet sáng quốc tế hàng ngày',
                      '🏊 Hồ bơi ngoài trời / Vô cực',
                      '🧖 Spa, Sauna & Massage thư giãn',
                      '🏋️ Phòng Gym & Fitness hiện đại',
                      '📶 Wifi tốc độ cao miễn phí',
                      '🍹 Minibar & Nước suối hàng ngày',
                      '☕ Trà & Cà phê miễn phí tại phòng',
                      '🚐 Xe đưa đón sân bay / Bến tàu'
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <i className="fa-solid fa-circle-check" style={{ color: '#047857' }}></i>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-hotel guidance banner */}
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <i className="fa-solid fa-hotel" style={{ color: '#2563eb', fontSize: '1.5rem' }}></i>
                  <div style={{ fontSize: '0.86rem', color: '#1e40af', lineHeight: 1.5 }}>
                    <strong>🏨 Thiết lập khách sạn chi tiết theo từng đêm:</strong> Tên khách sạn &amp; hạng sao riêng cho từng đêm (Ví dụ: <em>Đêm 1 ở Silk Path Hà Nội 4★, Đêm 2 ở Du Thuyền Hạ Long 5★, Đêm 3 ở Emeralda Ninh Bình 4★...</em>) sẽ được nhập và điều chỉnh trực tiếp tại <strong>Tab 4 (Lịch Trình Chi Tiết &amp; Dịch Vụ)</strong> tương ứng theo từng ngày.
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: BẢNG GIÁ & LỊCH KHỞI HÀNH (LỄ TẾT / SỰ KIỆN / CUỐI TUẦN) */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Discount & Promotion Settings */}
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-tags" style={{ color: '#d97706', fontSize: '1rem' }}></i>
                    <span>Chính Sách Giảm Giá &amp; Flash Sale (Tùy Chọn)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.3fr', gap: '1.25rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
                        Giá Gốc Niêm Yết (Trước Giảm)
                      </label>
                      <input
                        type="text"
                        value={originalPrice ? originalPrice.toLocaleString('vi-VN') : ''}
                        onChange={(e) => handleOriginalPriceChange(e.target.value)}
                        placeholder="VD: 8.500.000"
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1.5px solid #fcd34d',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '0.2rem', display: 'block' }}>
                        * Hiển thị gạch ngang (~~{originalPrice ? originalPrice.toLocaleString('vi-VN') : 0} ₫~~)
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
                        Mức Giảm Giá (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={discountPercent || ''}
                        onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                        placeholder="VD: 25"
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1.5px solid #fcd34d',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '0.2rem', display: 'block' }}>
                        * {discountPercent ? `Giảm ${discountPercent}%` : 'Tự động tính 2 chiều'}
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
                        Gắn Huy Hiệu Flash Sale
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          cursor: 'pointer',
                          background: '#ffffff',
                          padding: '0.72rem 0.9rem',
                          borderRadius: '8px',
                          border: '1.5px solid #fcd34d'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isFlashSale}
                          onChange={(e) => setIsFlashSale(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#d97706', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isFlashSale ? '#b45309' : '#64748b' }}>
                          ⚡ Bật Flash Sale 24h
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* All-Inclusive & Publish Status Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '1.25rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #fcd34d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #fcd34d' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 850, color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="fa-solid fa-gem" style={{ color: '#d97706' }}></i> Gói All-Inclusive 100%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#b45309' }}>Trọn gói không phát sinh bất kỳ phí nào</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isAllInclusive}
                        onChange={(e) => setIsAllInclusive(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d97706' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #fcd34d' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 850, color: '#92400e', whiteSpace: 'nowrap' }}>
                        Trạng thái tour:
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          border: '1.5px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: status === 'published' ? '#047857' : status === 'draft' ? '#b45309' : '#64748b',
                          background: status === 'published' ? '#f0fdf4' : status === 'draft' ? '#fefce8' : '#f1f5f9'
                        }}
                      >
                        <option value="published">🟢 Mở Bán Ngay (Published)</option>
                        <option value="draft">🟡 Lưu Bản Nháp (Draft)</option>
                        <option value="hidden">⚪ Tạm Ẩn Tour (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Multi-tier Pricing Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-calculator" style={{ color: '#047857', fontSize: '1.1rem' }}></i>
                    <span>Bảng Giá Vé Đa Tầng Theo 4 Độ Tuổi (Giá Cơ Bản)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    {/* 1. Người Lớn (12t+) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#047857', marginBottom: '0.35rem' }}>
                        1. Người Lớn (12t+) *
                      </label>
                      <input
                        type="text"
                        required
                        value={priceAdult ? priceAdult.toLocaleString('vi-VN') : ''}
                        onChange={(e) => handleAdultPriceChange(e.target.value)}
                        placeholder="VD: 2.850.000"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '2px solid #059669',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#047857',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* 2. Trẻ Em (5-11t) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        2. Trẻ Em (5–11t) ⚡
                      </label>
                      <input
                        type="text"
                        value={priceChild ? priceChild.toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const clean = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
                          setPriceChild(clean);
                        }}
                        placeholder="Tự tính = 75%"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* 3. Trẻ Nhỏ (2-4t) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        3. Trẻ Nhỏ (2–4t) ⚡
                      </label>
                      <input
                        type="text"
                        value={priceToddler ? priceToddler.toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const clean = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
                          setPriceToddler(clean);
                        }}
                        placeholder="Tự tính = 50%"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* 4. Em Bé (<2t) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        4. Em Bé (&lt;2t)
                      </label>
                      <input
                        type="text"
                        value={priceInfant ? priceInfant.toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const clean = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
                          setPriceInfant(clean);
                        }}
                        placeholder="VD: 500.000"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        = {priceInfant ? priceInfant.toLocaleString('vi-VN') : 0} VNĐ (Phí bảo hiểm/thuế)
                      </span>
                    </div>
                  </div>

                  {/* Additional Settings: Single Room Surcharge & Capacity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Phụ Thu Phòng Đơn (Khách tự chọn khi ở riêng 1 người/phòng)
                      </label>
                      <input
                        type="text"
                        value={singleRoomSurcharge ? singleRoomSurcharge.toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const clean = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
                          setSingleRoomSurcharge(clean);
                        }}
                        placeholder="Tự tính = 35%"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        * Mặc định = 35% vé lớn ({singleRoomSurcharge ? singleRoomSurcharge.toLocaleString('vi-VN') : 0} VNĐ)
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Số Chỗ Mở Bán Cho Mỗi Chuyến Ban Đầu
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={seatsLeft}
                        onChange={(e) => setSeatsLeft(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ADVANCED DEPARTURE SCHEDULE & HOLIDAY/EVENT PRICING STUDIO */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #047857',
                    borderRadius: '18px',
                    padding: '1.75rem',
                    boxShadow: '0 8px 24px rgba(4, 120, 87, 0.08)'
                  }}
                >
                  {/* Header & Stats Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 900 }}>
                          SCHEDULE &amp; HOLIDAY PRICING
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                          Lịch Khởi Hành &amp; Bảng Giá Từng Ngày (Lễ Tết / Sự Kiện)
                        </h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                        Thiết lập giá vé và số lượng chỗ ngồi riêng biệt cho từng ngày đi, ngày Lễ 30/4, 2/9, Tết hoặc cuối tuần
                      </p>
                    </div>

                    {/* Quick Stats Pill */}
                    <div style={{ display: 'flex', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Tổng Chuyến</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#047857' }}>{departureDatesList.length}</div>
                      </div>
                      <div style={{ width: '1px', background: '#cbd5e1' }}></div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Khoảng Giá Vé</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                          {departureDatesList.length > 0
                            ? `${Math.min(...departureDatesList.map(d => d.priceAdult)).toLocaleString('vi-VN')}đ`
                            : `${priceAdult.toLocaleString('vi-VN')}đ`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Generator Quick Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#047857' }}></i> Tạo Nhanh:
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkAddAllHolidays}
                      style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #f87171', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Tự động nạp 30/4, 2/9, Noel, Tết Dương/Âm lịch với phụ thu tương ứng"
                    >
                      <span>🎉 + Nạp Các Ngày Đại Lễ Trong Năm</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkAddWeekends}
                      style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Nạp các ngày Thứ Sáu & Thứ Bảy tháng tới với phụ thu cuối tuần"
                    >
                      <span>⭐ + Nạp Chuyến Cuối Tuần (T6-T7)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncBasePriceToAll}
                      style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', fontWeight: 700, marginLeft: 'auto' }}
                      title="Đặt lại tất cả các ngày về giá người lớn chuẩn"
                    >
                      <i className="fa-solid fa-rotate"></i> Đồng Bộ Về Giá Gốc ({priceAdult.toLocaleString('vi-VN')}đ)
                    </button>
                  </div>

                  {/* Add New Single Departure Date Bar */}
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-plus-circle"></i> Thêm Một Ngày Khởi Hành Mới:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1.2fr 0.8fr auto', gap: '0.75rem', alignItems: 'center' }}>
                      {/* Date Input */}
                      <div>
                        <input
                          type="text"
                          value={quickDateInput}
                          onChange={(e) => setQuickDateInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleDate();
                            }
                          }}
                          placeholder="Ngày đi: DD/MM/YYYY (VD: 20/10/2026)"
                          style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Label Input with Preset Chips */}
                      <div>
                        <input
                          type="text"
                          value={quickDateLabel}
                          onChange={(e) => setQuickDateLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleDate();
                            }
                          }}
                          placeholder="Nhãn sự kiện: VD: Lễ 30/4, Cuối Tuần..."
                          style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Adult Price */}
                      <div>
                        <input
                          type="number"
                          step={50000}
                          value={quickDatePrice}
                          onChange={(e) => setQuickDatePrice(Math.max(0, Number(e.target.value) || 0))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleDate();
                            }
                          }}
                          placeholder="Giá vé lớn (VNĐ)"
                          style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 800, color: '#047857', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Seats */}
                      <div>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={quickDateSeats}
                          onChange={(e) => setQuickDateSeats(Math.max(1, Number(e.target.value) || 15))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingleDate();
                            }
                          }}
                          placeholder="Số chỗ"
                          style={{ width: '100%', padding: '0.65rem 0.6rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Add Button */}
                      <div>
                        <button
                          type="button"
                          onClick={handleAddSingleDate}
                          style={{
                            padding: '0.65rem 1.25rem',
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 3px 8px rgba(4, 120, 87, 0.3)'
                          }}
                        >
                          <i className="fa-solid fa-plus"></i> Thêm Chuyến
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Badges */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700 }}>Chọn nhanh ngày Lễ / Sự kiện:</span>
                      {HOLIDAY_PRESETS.map((preset) => (
                        <button
                          key={preset.date}
                          type="button"
                          onClick={() => handleQuickAddHoliday(preset)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0',
                            background: '#ffffff',
                            color: '#065f46',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          {preset.label} ({preset.date})
                        </button>
                      ))}
                    </div>

                    {dateFormError && (
                      <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        ⚠️ {dateFormError}
                      </div>
                    )}
                  </div>

                  {/* List of Scheduled Departure Dates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {departureDatesList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '0.88rem' }}>
                        <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8' }}></i>
                        Chưa có ngày khởi hành nào. Vui lòng thêm ít nhất một ngày khởi hành ở bảng trên.
                      </div>
                    ) : (
                      departureDatesList.map((dep, idx) => {
                        const dayOfWeek = dep.dayOfWeek || computeDayOfWeek(dep.date);
                        const isHoliday = dep.label && (dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh'));
                        const isWeekend = dep.label && dep.label.includes('Cuối Tuần');
                        const isFlash = dep.label && dep.label.includes('Flash');

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.4fr 1.6fr 1.8fr 0.9fr auto',
                              gap: '0.85rem',
                              alignItems: 'center',
                              padding: '0.85rem 1.1rem',
                              borderRadius: '12px',
                              background: isHoliday ? '#fff7ed' : isFlash ? '#fef2f2' : isWeekend ? '#f8fafc' : '#ffffff',
                              border: isHoliday ? '1.5px solid #fed7aa' : isFlash ? '1.5px solid #fecaca' : isWeekend ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              transition: 'all 0.15s'
                            }}
                          >
                            {/* Column 1: Date & Day of Week */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 900,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    background: dayOfWeek === 'CN' || dayOfWeek === 'T7' ? '#fee2e2' : '#f1f5f9',
                                    color: dayOfWeek === 'CN' || dayOfWeek === 'T7' ? '#b91c1c' : '#334155'
                                  }}
                                >
                                  {dayOfWeek === 'CN' ? 'Chủ Nhật' : `Thứ ${dayOfWeek.replace('T', '')}`}
                                </span>
                                <input
                                  type="text"
                                  value={dep.date}
                                  onChange={(e) => handleUpdateDateRow(idx, { date: e.target.value, dayOfWeek: computeDayOfWeek(e.target.value), monthLabel: computeMonthLabel(e.target.value) })}
                                  style={{ width: '105px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', outline: 'none' }}
                                />
                              </div>
                            </div>

                            {/* Column 2: Event Label & Tag */}
                            <div>
                              <input
                                type="text"
                                value={dep.label || ''}
                                onChange={(e) => handleUpdateDateRow(idx, { label: e.target.value || null })}
                                placeholder="Nhãn sự kiện (Lễ 30/4, Giáng Sinh...)"
                                style={{
                                  width: '100%',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '6px',
                                  border: isHoliday ? '1.5px solid #f97316' : '1px solid #cbd5e1',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: isHoliday ? '#c2410c' : isWeekend ? '#1e40af' : '#334155',
                                  background: isHoliday ? '#fffaf5' : '#ffffff',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            {/* Column 3: Adult Price & Quick Percentage Surcharge Modifiers */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <input
                                  type="number"
                                  step={50000}
                                  value={dep.priceAdult}
                                  onChange={(e) => handleUpdateDateRow(idx, { priceAdult: Math.max(0, Number(e.target.value) || 0) })}
                                  style={{
                                    width: '110px',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    border: '1.5px solid #047857',
                                    fontSize: '0.88rem',
                                    fontWeight: 900,
                                    color: '#047857',
                                    outline: 'none'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDateRow(idx, { priceAdult: Math.round(priceAdult * 1.1) })}
                                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}
                                    title="Tăng 10% giá vé"
                                  >
                                    +10%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDateRow(idx, { priceAdult: Math.round(priceAdult * 1.25) })}
                                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontWeight: 800 }}
                                    title="Phụ thu Lễ +25%"
                                  >
                                    +25%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDateRow(idx, { priceAdult })}
                                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
                                    title="Về giá gốc"
                                  >
                                    Gốc
                                  </button>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                Trẻ em: {(dep.priceChild || Math.round(dep.priceAdult * 0.75)).toLocaleString('vi-VN')}đ • Phụ thu phòng: {(dep.singleRoomSurcharge || Math.round(dep.priceAdult * 0.35)).toLocaleString('vi-VN')}đ
                              </div>
                            </div>

                            {/* Column 4: Seats Quota */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={dep.seats}
                                  onChange={(e) => handleUpdateDateRow(idx, { seats: Math.max(1, Number(e.target.value) || 1) })}
                                  style={{ width: '55px', padding: '0.35rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', outline: 'none' }}
                                />
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>chỗ</span>
                              </div>
                            </div>

                            {/* Column 5: Remove Button */}
                            <div style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveDateRow(idx)}
                                style={{ background: '#fee2e2', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Xóa ngày khởi hành này"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: LỊCH TRÌNH CHI TIẾT & DỊCH VỤ ĐI KÈM */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Highlights */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Điểm Nhấn Nổi Bật Chuyến Đi (Mỗi dòng 1 điểm nhấn)
                  </label>
                  <textarea
                    rows={3}
                    value={highlights}
                    onChange={(e) => setHighlights(e.target.value)}
                    placeholder="Nhập các điểm nhấn độc đáo, trải nghiệm sang trọng..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Day-by-Day Itinerary List */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="fa-solid fa-route" style={{ color: '#047857' }}></i>
                      <span>Chi Tiết Lịch Trình Từng Ngày ({durationDays} Ngày {durationNights} Đêm) *</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {itineraryDays.map((dayItem, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Day Header Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                          <span
                            style={{
                              background: '#047857',
                              color: '#ffffff',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.88rem'
                            }}
                          >
                            NGÀY {dayItem.day}
                          </span>
                          <input
                            type="text"
                            required
                            value={dayItem.title}
                            onChange={(e) => {
                              const updated = [...itineraryDays];
                              updated[idx].title = e.target.value;
                              setItineraryDays(updated);
                            }}
                            placeholder="Tiêu đề ngày đi (VD: Ngày 1: Đón bay - Khám phá Hà Nội)"
                            style={{
                              flex: 1,
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* 4 Fields Grid per Day */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                              🍽️ Bữa Ăn
                            </label>
                            <input
                              type="text"
                              value={dayItem.meals}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].meals = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="Ăn sáng, trưa, tối"
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: dayItem.hotelStar === 0 ? '#dc2626' : '#475569' }}>
                                {dayItem.hotelStar === 0 ? '🚫 Lưu Trú (Không ở)' : '🏨 Khách Sạn Lưu Trú'}
                              </label>
                              {dayItem.hotelStar === 0 && (
                                <span style={{ fontSize: '0.7rem', color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecdd3', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                                  Không ở lại
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={dayItem.hotel}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].hotel = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder={dayItem.hotelStar === 0 ? 'Không ở (Kết thúc tour / Trở về)' : 'Tên khách sạn / Resort'}
                              style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                border: dayItem.hotelStar === 0 ? '1.5px dashed #f87171' : '1px solid #cbd5e1',
                                background: dayItem.hotelStar === 0 ? '#fff1f2' : '#ffffff',
                                color: dayItem.hotelStar === 0 ? '#991b1b' : '#0f172a',
                                fontSize: '0.85rem',
                                fontWeight: dayItem.hotelStar === 0 ? 700 : 400,
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                              🎯 Hoạt Động Trọng Tâm
                            </label>
                            <input
                              type="text"
                              value={dayItem.activities}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].activities = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="Hoạt động nổi bật trong ngày"
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                              ⭐ Hạng Sao / Lưu Trú
                            </label>
                            <select
                              value={dayItem.hotelStar !== undefined ? dayItem.hotelStar : 4}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...itineraryDays];
                                updated[idx].hotelStar = val;
                                if (val === 0) {
                                  if (!updated[idx].hotel || updated[idx].hotel?.includes('Khách sạn') || updated[idx].hotel?.includes('Resort')) {
                                    updated[idx].hotel = 'Không ở (Kết thúc tour / Trở về)';
                                  }
                                } else if (val > 0 && updated[idx].hotel?.includes('Không ở')) {
                                  updated[idx].hotel = `Khách sạn ${val} sao tiêu chuẩn`;
                                }
                                setItineraryDays(updated);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                border: dayItem.hotelStar === 0 ? '1.5px solid #f87171' : '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                outline: 'none',
                                background: dayItem.hotelStar === 0 ? '#fff1f2' : '#ffffff',
                                color: dayItem.hotelStar === 0 ? '#dc2626' : '#0f172a',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value={5}>⭐⭐⭐⭐⭐ 5★ Resort</option>
                              <option value={4}>⭐⭐⭐⭐ 4★ Khách sạn</option>
                              <option value={3}>⭐⭐⭐ 3★ Khách sạn</option>
                              <option value={0}>🚫 Không ở (Về)</option>
                            </select>
                          </div>
                        </div>

                        {/* Image URL and Bullet Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                              🖼️ Link Ảnh Minh Họa Chặng Đi
                            </label>
                            <input
                              type="url"
                              value={dayItem.image || ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].image = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="https://..."
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                              📝 Chi Tiết Các Điểm Đến (Mỗi dòng 1 gạch đầu dòng)
                            </label>
                            <textarea
                              rows={3}
                              value={dayItem.details ? dayItem.details.join('\n') : ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].details = e.target.value.split('\n').filter((s) => s.trim());
                                setItineraryDays(updated);
                              }}
                              placeholder="Ghi rõ giờ giấc, điểm tham quan, trải nghiệm..."
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', lineHeight: 1.45, outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#047857', marginBottom: '0.4rem' }}>
                      <i className="fa-solid fa-circle-check"></i> DỊCH VỤ BAO GỒM
                    </label>
                    <textarea
                      rows={5}
                      value={inclusions.join('\n')}
                      onChange={(e) => setInclusions(e.target.value.split('\n').filter((s) => s.trim()))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1.5px solid #a7f3d0',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#f0fdf4',
                        lineHeight: 1.45
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.4rem' }}>
                      <i className="fa-solid fa-circle-xmark"></i> KHÔNG BAO GỒM
                    </label>
                    <textarea
                      rows={5}
                      value={exclusions.join('\n')}
                      onChange={(e) => setExclusions(e.target.value.split('\n').filter((s) => s.trim()))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1.5px solid #fecaca',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#fef2f2',
                        lineHeight: 1.45
                      }}
                    />
                  </div>
                </div>

                {/* STEP 4.2: Quy Định & Điều Kiện Hoàn Hủy Tour (Policy Presets + Interactive Table) */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-shield-halved" style={{ color: '#047857' }}></i>
                        <span>Chính Sách &amp; Quy Định Hoàn Hủy Tour (Cancellation Policy)</span>
                      </h4>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        Chọn nhanh 1 trong các gói mẫu chuẩn quốc tế hoặc tự do tùy chỉnh các mốc hoàn tiền cho tour này
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPolicyRule}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: '#f0fdf4',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Thêm Mốc Hoàn Hủy
                    </button>
                  </div>

                  {/* 4 Policy Presets Quick Select Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {REFUND_POLICY_PRESETS.map((preset) => {
                      const isSelected = selectedPolicyPreset === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPolicyPreset(preset.id)}
                          style={{
                            border: isSelected ? `2px solid ${preset.badgeColor}` : '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            cursor: 'pointer',
                            background: isSelected ? preset.badgeBg : '#ffffff',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isSelected ? preset.badgeColor : '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <i className={preset.icon}></i>
                              {preset.shortName}
                            </span>
                            {isSelected && (
                              <i className="fa-solid fa-circle-check" style={{ color: preset.badgeColor, fontSize: '0.95rem' }}></i>
                            )}
                          </div>
                          <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: preset.badgeBg, color: preset.badgeColor, border: `1px solid ${preset.borderColor}`, marginBottom: '0.35rem' }}>
                            {preset.tag}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                            {preset.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Policy Rules Table */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.65rem 1rem', width: '50%' }}>Thời Điểm Thông Báo Hủy Tour</th>
                          <th style={{ padding: '0.65rem 1rem', width: '40%' }}>Mức Phí Phạt / Hoàn Tiền Áp Dụng</th>
                          <th style={{ padding: '0.65rem 1rem', width: '10%', textAlign: 'center' }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundPolicyList.map((rule, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '0.6rem 1rem' }}>
                              <input
                                type="text"
                                value={rule.condition || ''}
                                onChange={(e) => handleUpdatePolicyRule(rIdx, 'condition', e.target.value)}
                                placeholder="VD: Hủy trước 7 ngày khởi hành"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td style={{ padding: '0.6rem 1rem' }}>
                              <input
                                type="text"
                                value={rule.fee || ''}
                                onChange={(e) => handleUpdatePolicyRule(rIdx, 'fee', e.target.value)}
                                placeholder="VD: Hoàn 100% tiền vé"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: (rule?.fee || '').includes('100%') && !(rule?.fee || '').includes('Phí') ? '#047857' : '#b91c1c',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeletePolicyRule(rIdx)}
                                title="Xóa điều khoản này"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  padding: '0.35rem'
                                }}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* STEP 4.3: Câu Hỏi Thường Gặp (FAQs Management Suite) */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-circle-question" style={{ color: '#047857' }}></i>
                        <span>Bộ Câu Hỏi Thường Gặp (FAQs Management)</span>
                      </h4>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        Nạp nhanh các bộ câu hỏi mẫu phổ biến hoặc tự do bổ sung câu hỏi giải đáp thắc mắc cho tour
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFaqItem}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: '#f0fdf4',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Thêm Câu Hỏi Mới
                    </button>
                  </div>

                  {/* 4 FAQ Presets Quick Select Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {FAQ_PRESETS.map((preset) => {
                      const isSelected = selectedFaqPreset === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectFaqPreset(preset.id)}
                          style={{
                            border: isSelected ? `2px solid ${preset.badgeColor}` : '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            cursor: 'pointer',
                            background: isSelected ? preset.badgeBg : '#ffffff',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isSelected ? preset.badgeColor : '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <i className={preset.icon}></i>
                              {preset.shortName}
                            </span>
                            {isSelected && (
                              <i className="fa-solid fa-circle-check" style={{ color: preset.badgeColor, fontSize: '0.95rem' }}></i>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35 }}>
                            {preset.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* FAQ List Accordion/Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {faqList.map((faq, fIdx) => (
                      <div
                        key={fIdx}
                        style={{
                          background: '#f8fafc',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                          <span style={{ background: '#047857', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                            Q{fIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={faq.q}
                            onChange={(e) => handleUpdateFaqItem(fIdx, 'q', e.target.value)}
                            placeholder="Nhập tiêu đề câu hỏi..."
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              outline: 'none',
                              background: '#ffffff'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteFaqItem(fIdx)}
                            title="Xóa câu hỏi này"
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                          <span style={{ background: '#3b82f6', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                            Trả Lời
                          </span>
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={(e) => handleUpdateFaqItem(fIdx, 'a', e.target.value)}
                            placeholder="Nhập nội dung giải đáp chi tiết cho khách..."
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              lineHeight: 1.45,
                              color: '#334155',
                              outline: 'none',
                              background: '#ffffff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ready Notice */}
                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem', color: '#047857' }}></i>
                  <div>
                    <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.05rem' }}>
                      Mọi thông số tour, bảng giá ngày lễ và lịch trình đã sẵn sàng!
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#047857', marginTop: '0.2rem' }}>
                      Bấm nút <strong>"Xuất Bản Tour Lên Hệ Thống"</strong> ở góc dưới để lưu và mở bán tour trên website ngay lập tức.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Studio Footer */}
        <div
          style={{
            padding: '1rem 2.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.88rem'
              }}
            >
              Hủy Bỏ
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  fontWeight: 800,
                  color: '#334155',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <i className="fa-solid fa-arrow-left"></i> Tab Trước
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
                }}
              >
                <span>Sang Tab Tiếp Theo</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 2.5rem',
                  background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.96rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(4, 120, 87, 0.4)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Đang xuất bản tour...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rocket"></i>
                    <span>Xuất Bản Tour Lên Hệ Thống</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
