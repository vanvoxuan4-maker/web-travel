import React, { useState, useEffect } from 'react';
import { Tour, TourTier, ItineraryDay } from '../../types/tour.types';

interface AddTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTour: (tour: Tour) => Promise<void>;
}

const SAMPLE_IMAGES = [
  { name: '🌴 Vịnh Hạ Long', url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85' },
  { name: '⛰️ Sapa / Fansipan', url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏯 Đà Nẵng / Hội An', url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏖️ Phú Quốc Resort', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85' },
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

const getCleanDestKeyword = (dest: string): string => {
  if (!dest || !dest.trim()) return 'TOUR';
  const firstSegment = dest.split(/[-–,/]/)[0].trim();
  const clean = removeVietnameseTones(firstSegment)
    .replace(/^(TP\.?|THANH PHO|TINH|VINH|DAO|QUAN|KHU)\s+/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return clean || 'TOUR';
};

const generateStyle1TourCode = (dest: string, days: number, nights: number): string => {
  const keyword = getCleanDestKeyword(dest);
  return `WT-${keyword}-${days}N${nights}D`;
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
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState('');
  const [departureFrom, setDepartureFrom] = useState('Hà Nội / TP.HCM');
  const [category, setCategory] = useState<'domestic' | 'international'>('domestic');
  const [tourType, setTourType] = useState('Nghỉ Dưỡng & Biển Đảo');
  const [durationDays, setDurationDays] = useState(4);
  const [durationNights, setDurationNights] = useState(3);

  // STEP 2: Hotel Standard & Multi-Tier Pricing
  const [tier, setTier] = useState<TourTier>('standard');
  const [hotelName, setHotelName] = useState('Hệ thống Khách sạn & Resort 4★ cao cấp');
  const [roomType, setRoomType] = useState('Phòng Deluxe / Superior (2 khách/phòng, view đẹp)');
  const [priceAdult, setPriceAdult] = useState(6500000);
  const [priceChild, setPriceChild] = useState(4900000); // 75%
  const [priceInfant, setPriceInfant] = useState(500000);
  const [singleRoomSurcharge, setSingleRoomSurcharge] = useState(2200000);
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
  const [departureDatesStr, setDepartureDatesStr] = useState('15/09/2026, 22/09/2026, 29/09/2026, 06/10/2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger auto-code on initial open
  useEffect(() => {
    if (!code) {
      setCode(generateStyle1TourCode(destination || 'VIETNAM', durationDays, durationNights));
    }
  }, []);

  // Sync nights when days change
  const handleDaysChange = (newDays: number) => {
    const validDays = Math.max(1, newDays);
    const validNights = Math.max(0, validDays - 1);
    setDurationDays(validDays);
    setDurationNights(validNights);
    setCode(generateStyle1TourCode(destination, validDays, validNights));

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

  // Auto-calculate Child, Infant & Single Surcharge on Adult Price change
  const handleAdultPriceChange = (val: string | number) => {
    const cleanStr = val.toString().replace(/[^\d]/g, '');
    const num = Math.max(0, Number(cleanStr) || 0);
    setPriceAdult(num);
    // 75% for Child
    setPriceChild(Math.round(num * 0.75));
    // 35% for Single Room Surcharge
    setSingleRoomSurcharge(Math.round(num * 0.35));
  };

  // Fast Quick-Template Fill
  const handleLoadTemplate = (type: 'beach' | 'mountain' | 'heritage') => {
    if (type === 'beach') {
      setTitle('Tour Nha Trang - Biển Xanh Vịnh Ngọc 4N3Đ (Resort 5 Sao)');
      setDestination('Nha Trang');
      setCode(generateStyle1TourCode('Nha Trang', 4, 3));
      setCategory('domestic');
      setTourType('Nghỉ Dưỡng & Biển Đảo');
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
      setTitle('Tour Sapa - Fansipan - Bản Cát Cát 3N2Đ (Khách Sạn 4-5 Sao)');
      setDestination('Sapa');
      setCode(generateStyle1TourCode('Sapa', 3, 2));
      setCategory('domestic');
      setTourType('Mạo Hiểm & Khám Phá');
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
      setTitle('Tour Đà Nẵng - Cố Đô Huế - Phố Cổ Hội An 4N3Đ');
      setDestination('Đà Nẵng');
      setCode(generateStyle1TourCode('Đà Nẵng', 4, 3));
      setCategory('domestic');
      setTourType('Văn Hóa & Di Sản');
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const starRating = tier === 'luxury' ? 5 : tier === 'standard' ? 4 : 3;
      const hotelTier = tier === 'luxury' ? 'Resort 5★' : tier === 'standard' ? 'Khách Sạn 4★' : 'Khách Sạn 3★';
      const tierName = tier === 'luxury' ? 'Dòng Luxury' : tier === 'standard' ? 'Dòng Tiêu Chuẩn' : 'Dòng Tiết Kiệm';

      const datesArr = departureDatesStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const departureDatesObj = datesArr.map((d, idx) => ({
        date: d,
        seats: seatsLeft,
        priceAdult,
        priceChild,
        priceInfant,
        singleRoomSurcharge,
        label: idx === 0 ? 'Chuyến Gần Nhất' : null
      }));

      const highlightsArr = highlights
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const finalCode = code.trim() || generateStyle1TourCode(destination, durationDays, durationNights);

      const newTourObj: Tour = {
        id: `tour-${Date.now()}`,
        code: finalCode.toUpperCase(),
        sku: `WT${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        shortTitle: title.trim(),
        destination: destination.trim() || 'Điểm đến nổi tiếng',
        category,
        type: tourType,
        departureFrom: departureFrom.trim(),
        seatsLeft,
        departureSchedule: 'Định kỳ hàng tuần',
        availableDates: datesArr.length > 0 ? datesArr : ['15/09/2026', '22/09/2026'],
        departureDates: departureDatesObj,
        durationDays,
        durationNights,
        priceAdult,
        priceChild,
        priceToddler: Math.round(priceAdult * 0.5),
        priceInfant,
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
          { url: SAMPLE_IMAGES[0].url, title: 'Phong cảnh hành trình' }
        ],
        inclusionsList: inclusions,
        exclusionsList: exclusions,
        refundPolicy: [
          { condition: 'Hủy trước 7 ngày khởi hành', fee: 'Hoàn 100% tiền vé' },
          { condition: 'Hủy trước 3 - 5 ngày', fee: 'Hoàn 50% tiền vé' },
          { condition: 'Hủy dưới 24h trước giờ đi', fee: 'Không hoàn tiền' }
        ],
        faqs: [
          { q: 'Tour bao gồm những bữa ăn nào?', a: 'Đã bao gồm toàn bộ bữa ăn chính theo lịch trình và buffet sáng tại khách sạn.' },
          { q: 'Điểm tập trung xuất phát ở đâu?', a: `Đoàn tập trung tại điểm hẹn ở ${departureFrom} có xe Limousine đón tận nơi.` }
        ],
        rating: 5.0,
        reviewsCount: 1,
        image,
        highlights: highlightsArr.length > 0 ? highlightsArr : ['Trải nghiệm nghỉ dưỡng đẳng cấp', 'Lịch trình phong phú, ẩm thực đặc sắc'],
        badge: badge.trim() || 'Mới Ra Mắt',
        itinerary: itineraryDays,
        isActive: true
      };

      await onAddTour(newTourObj);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '1080px',
          width: '94vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Studio Top Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.15rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: '#047857',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '20px',
                  letterSpacing: '0.04em'
                }}
              >
                TOUR CREATION STUDIO
              </span>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                Khởi Tạo Tour Lữ Hành Mới
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Thiết lập toàn bộ thông tin giá vé, khách sạn, lịch trình chi tiết và xuất bản tour
            </p>
          </div>

          {/* Quick Template Buttons & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem 0.4rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', padding: '0 0.4rem' }}>
                Nạp Mẫu Nhanh:
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#b91c1c',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.5rem'
              }}
              title="Đóng cửa sổ"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* 4-Step Toolbar */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0.65rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { num: 1, title: '1. Tuyến Đi & Thời Lượng', icon: 'fa-map-location-dot', desc: 'Tên tour, điểm đến, mã tour' },
              { num: 2, title: '2. Khách Sạn & Bảng Giá', icon: 'fa-hotel', desc: 'Sao, phòng, giá lớn/trẻ em' },
              { num: 3, title: '3. Lịch Trình Chi Tiết', icon: 'fa-route', desc: 'Chặng đi, khách sạn, ảnh & bullets' },
              { num: 4, title: '4. Ảnh Bìa & Lịch Đi', icon: 'fa-rocket', desc: 'Chọn ảnh, tag & xuất bản' }
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isPassed = currentStep > step.num;

              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isCurrent ? '#047857' : isPassed ? '#ecfdf5' : '#ffffff',
                    color: isCurrent ? '#ffffff' : isPassed ? '#047857' : '#64748b',
                    border: isCurrent ? '1.5px solid #047857' : isPassed ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    boxShadow: isCurrent ? '0 4px 12px rgba(4, 120, 87, 0.25)' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isCurrent ? 'rgba(255,255,255,0.2)' : isPassed ? '#d1fae5' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {isPassed ? <i className="fa-solid fa-check"></i> : step.num}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: isCurrent ? 0.9 : 0.75, whiteSpace: 'nowrap' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FULL-WIDTH SPACIOUS FORM BODY */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1 }}>
            
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Tên Tour Du Lịch Đầy Đủ (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tour Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình Tràng An 4N3Đ"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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

                {/* Destination & Auto Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Điểm Đến Chính (Destination) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hà Nội / Hạ Long / Ninh Bình"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setCode(generateStyle1TourCode(e.target.value, durationDays, durationNights));
                      }}
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
                        Mã Tour Chuẩn Kiểu 1 (Tour Code)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCode(generateStyle1TourCode(destination || 'VIETNAM', durationDays, durationNights))}
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

                {/* Departure From & Category & Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
                      Phân Loại Tour
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
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="domestic">🇻🇳 Trong Nước</option>
                      <option value="international">✈️ Quốc Tế</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Loại Hình Trải Nghiệm
                    </label>
                    <select
                      value={tourType}
                      onChange={(e) => setTourType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Nghỉ Dưỡng & Biển Đảo">🌴 Nghỉ Dưỡng &amp; Biển Đảo</option>
                      <option value="Văn Hóa & Di Sản">🏯 Văn Hóa &amp; Di Sản</option>
                      <option value="Mạo Hiểm & Khám Phá">⛰️ Mạo Hiểm &amp; Khám Phá</option>
                      <option value="Gia Đình & Trẻ Nhỏ">👨‍👩‍👧‍👦 Gia Đình &amp; Trẻ Nhỏ</option>
                    </select>
                  </div>
                </div>

                {/* Duration Days & Nights */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setDurationNights(n);
                        setCode(generateStyle1TourCode(destination, durationDays, n));
                      }}
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
            )}

            {/* STEP 2: Hotel Standard & Multi-Tier Pricing */}
            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Hotel Standard & Room Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Hạng Sao Cam Kết Của Tour (Bộ lọc tìm kiếm) *
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as TourTier)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="luxury">👑 5★ Luxury Resort (Toàn bộ 5 sao)</option>
                      <option value="standard">⭐ 4★ Phổ Thông (Tiêu chuẩn 4 sao)</option>
                      <option value="budget">🏷️ 3★ Tiết Kiệm (Tiêu chuẩn 3 sao)</option>
                    </select>
                  </div>

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
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Multi-hotel guidance banner */}
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <i className="fa-solid fa-hotel" style={{ color: '#2563eb', fontSize: '1.2rem' }}></i>
                  <div style={{ fontSize: '0.84rem', color: '#1e40af' }}>
                    <strong>🏨 Thiết lập khách sạn từng đêm:</strong> Tên khách sạn &amp; hạng sao riêng cho từng đêm (Ví dụ: <em>Đêm 1 ở Hà Nội 4★, Đêm 2 ở Du Thuyền 5★, Đêm 3 ở Ninh Bình 4★...</em>) sẽ được nhập trực tiếp tại <strong>Bước 3 (Lịch Trình Chi Tiết)</strong> tương ứng theo từng ngày.
                  </div>
                </div>

                {/* Multi-tier Pricing Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-calculator" style={{ color: '#047857', fontSize: '1.1rem' }}></i>
                    <span>Bảng Giá Vé Đa Tầng (Tự Động Tính Theo Độ Tuổi)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.3fr 1.1fr 1.3fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#047857', marginBottom: '0.35rem' }}>
                        Giá Người Lớn (12t+) *
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
                      <span style={{ fontSize: '0.74rem', color: '#047857', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                        = {priceAdult ? priceAdult.toLocaleString('vi-VN') : 0} VNĐ
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        Giá Trẻ Em (2–11t) ⚡
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
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        * Tự tính = 75% vé lớn ({priceChild ? priceChild.toLocaleString('vi-VN') : 0} VNĐ)
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        Em Bé (&lt;2t)
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
                        = {priceInfant ? priceInfant.toLocaleString('vi-VN') : 0} VNĐ
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        Phụ Thu Phòng Đơn
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
                        * Tự tính = 35% vé lớn ({singleRoomSurcharge ? singleRoomSurcharge.toLocaleString('vi-VN') : 0} VNĐ)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Initial Capacity */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Số Lượng Chỗ Mở Bán Cho Mỗi Chuyến Ban Đầu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={seatsLeft}
                    onChange={(e) => setSeatsLeft(Number(e.target.value))}
                    style={{
                      width: '220px',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Itinerary & Services (4-Row Professional Day Card) */}
            {currentStep === 3 && (
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
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.5
                    }}
                  />
                </div>

                {/* Day-by-Day Itinerary Cards */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-calendar-days" style={{ color: '#047857', fontSize: '1.1rem' }}></i>
                    <span>Lịch Trình Chi Tiết Từng Ngày ({itineraryDays.length} Ngày)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {itineraryDays.map((item, idx) => {
                      const bulletsStr = item.details && item.details.length > 0
                        ? item.details.join('\n')
                        : [item.morning, item.afternoon, item.evening].filter(Boolean).join('\n');

                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* SECTION 1: Chặng đi & Bữa ăn */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1rem', marginBottom: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '6px', marginRight: '0.4rem', fontWeight: 900 }}>
                                  NGÀY {item.day}
                                </span>
                                Tiêu đề chặng đi (Route Title) *
                              </label>
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].title = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                placeholder="Ví dụ: Tp. Hồ Chí Minh – Hà Nội"
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '8px',
                                  border: '1.5px solid #cbd5e1',
                                  fontSize: '0.92rem',
                                  fontWeight: 700,
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                                🍽️ Bữa ăn trong ngày *
                              </label>
                              <input
                                type="text"
                                value={item.meals || ''}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].meals = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                placeholder="Ăn trưa, tối / Sáng buffet, trưa, tối"
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '8px',
                                  border: '1.5px solid #cbd5e1',
                                  fontSize: '0.9rem',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>

                          {/* SECTION 2: Khách sạn & Hạng sao đêm nay */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.8fr 1.2fr',
                              gap: '1rem',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '10px',
                              padding: '0.75rem 1rem',
                              marginBottom: '0.85rem'
                            }}
                          >
                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#047857', marginBottom: '0.2rem' }}>
                                🏨 Khách sạn lưu trú đêm {item.day}:
                              </label>
                              <input
                                type="text"
                                value={item.hotel || ''}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].hotel = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                placeholder="VD: Khách sạn 4★ Silk Path Hà Nội / Vinpearl Resort..."
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #a7f3d0',
                                  fontSize: '0.86rem',
                                  fontWeight: 600,
                                  background: '#ffffff',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#047857', marginBottom: '0.2rem' }}>
                                ⭐ Hạng sao đêm {item.day}:
                              </label>
                              <select
                                value={item.hotelStar ?? (item.day === itineraryDays.length ? 0 : 4)}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].hotelStar = Number(e.target.value);
                                  setItineraryDays(updated);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #a7f3d0',
                                  fontSize: '0.86rem',
                                  fontWeight: 700,
                                  background: '#ffffff',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <option value={5}>👑 5 Sao (Luxury)</option>
                                <option value={4}>⭐ 4 Sao (Cao Cấp)</option>
                                <option value={3}>🏷️ 3 Sao (Tiêu Chuẩn)</option>
                                <option value={0}>🚌 Không ở KS (Đêm cuối / Trên xe)</option>
                              </select>
                            </div>
                          </div>

                          {/* SECTION 3: Hoạt động chính & Ảnh thắng cảnh */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '1rem', marginBottom: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.2rem' }}>
                                🎯 Hoạt động chính tóm tắt (Hiển thị đầu Popup):
                              </label>
                              <input
                                type="text"
                                value={item.activities || ''}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].activities = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                placeholder="VD: Tham quan trung tâm thủ đô Hà Nội"
                                style={{
                                  width: '100%',
                                  padding: '0.55rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.86rem',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.2rem' }}>
                                🖼️ Link ảnh thắng cảnh Ngày {item.day}:
                              </label>
                              <input
                                type="url"
                                value={item.image || ''}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[idx].image = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                placeholder="https://images.unsplash.com/photo-... (để trống sẽ dùng ảnh tour)"
                                style={{
                                  width: '100%',
                                  padding: '0.55rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.84rem',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>

                          {/* SECTION 4: Chi tiết các gạch đầu dòng • */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                              📝 Chi tiết hoạt động chuyến đi (Mỗi dòng 1 gạch đầu dòng • trên Popup):
                            </label>
                            <textarea
                              rows={4}
                              value={bulletsStr}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                const updated = [...itineraryDays];
                                updated[idx].details = lines;
                                setItineraryDays(updated);
                              }}
                              placeholder="Bay ra Hà Nội.&#10;Tham quan Hoàng thành Thăng Long, Văn Miếu – Quốc Tử Giám.&#10;Buổi tối tự do dạo phố cổ Hà Nội.&#10;Nghỉ đêm tại Hà Nội."
                              style={{
                                width: '100%',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.86rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                                lineHeight: 1.45,
                                fontFamily: 'inherit'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#047857', marginBottom: '0.4rem' }}>
                      <i className="fa-solid fa-circle-check"></i> ĐÃ BAO GỒM (Mỗi dòng 1 mục)
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
              </div>
            )}

            {/* STEP 4: Media, Schedules & Settings */}
            {currentStep === 4 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Image URL & Presets */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Link Ảnh Bìa Đại Diện (Image URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
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
                  {/* Quick Image Pickers */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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

                {/* Badge & Departure Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Nhãn Tag Tiếp Thị (Badge)
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Hot / Mới Ra Mắt / Giờ Chót"
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
                      Các Ngày Khởi Hành Ban Đầu (cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={departureDatesStr}
                      onChange={(e) => setDepartureDatesStr(e.target.value)}
                      placeholder="15/09/2026, 22/09/2026, 29/09/2026"
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
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '1.75rem', color: '#047857' }}></i>
                  <div>
                    <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>
                      Mọi thông số tour đã sẵn sàng để xuất bản!
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                      Bấm nút <strong>"Xuất Bản Tour Lên Hệ Thống"</strong> ở bên dưới để lưu và mở bán tour trên website ngay lập tức.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Studio Footer Navigation */}
          <div
            style={{
              padding: '1.25rem 2.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Bước Trước
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Hủy Bỏ
              </button>

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
                  <span>Tiếp Theo: Bước {currentStep + 1}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 2.25rem',
                    background: '#047857',
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
        </form>
      </div>
    </div>
  );
};
