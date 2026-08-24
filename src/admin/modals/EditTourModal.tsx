import React, { useState, useEffect } from 'react';
import { Tour, TourTier, ItineraryDay, TravelStyle, TourTheme, DepartureDate } from '../../types/tour.types';
import { computeDayOfWeek, computeMonthLabel, HOLIDAY_PRESETS, generateStyle1TourCode } from './AddTourModal';

const getThemeLabel = (t: TourTheme): string => {
  switch (t) {
    case 'beach': return '🌴 Biển Đảo & Du Thuyền';
    case 'heritage': return '🏯 Văn Hóa & Di Sản';
    case 'adventure': return '⛰️ Mạo Hiểm & Trekking';
    case 'family': return '👨‍👩‍👧‍👦 Gia Đình & Trẻ Em';
    case 'wellness': return '🧘 Nghỉ Dưỡng & Spa';
    case 'culinary': return '🍜 Ẩm Thực & Rượu Vang';
    default: return 'Khám Phá';
  }
};

interface EditTourModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTour: (updatedTour: Tour) => Promise<void>;
}

const SAMPLE_IMAGES = [
  { name: '🌴 Vịnh Hạ Long', url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85' },
  { name: '⛰️ Sapa / Fansipan', url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏯 Đà Nẵng / Hội An', url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85' },
  { name: '🏖️ Phú Quốc Resort', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85' },
  { name: '✈️ Bangkok / Thái Lan', url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=85' }
];

export const EditTourModal: React.FC<EditTourModalProps> = ({
  tour,
  isOpen,
  onClose,
  onSaveTour
}) => {
  if (!isOpen || !tour) return null;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Basic Information
  const [title, setTitle] = useState(tour.title);
  const [code, setCode] = useState(tour.code);
  const [destination, setDestination] = useState(tour.destination);
  const [departureFrom, setDepartureFrom] = useState(tour.departureFrom || 'TP. Hồ Chí Minh / Hà Nội');
  const [category, setCategory] = useState<'domestic' | 'international'>(tour.category || 'domestic');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>(tour.travelStyle || 'package');
  const [theme, setTheme] = useState<TourTheme>(tour.theme || 'beach');
  const [durationDays, setDurationDays] = useState(tour.durationDays || 4);
  const [durationNights, setDurationNights] = useState(tour.durationNights || 3);

  // STEP 2: Hotel Standard & 4 Age Tiers Pricing
  const [tier, setTier] = useState<TourTier>(tour.tier || 'standard');
  const [hotelName, setHotelName] = useState(tour.hotelSpecs?.hotelName || 'Khách sạn tiêu chuẩn 4 sao');
  const [roomType, setRoomType] = useState(tour.hotelSpecs?.roomType || 'Phòng Deluxe / Superior (2 khách/phòng)');
  const [priceAdult, setPriceAdult] = useState(tour.priceAdult || 6500000);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(tour.originalPrice);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(tour.discountPercent);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(tour.isFlashSale || false);
  const [priceChild, setPriceChild] = useState(tour.priceChild || Math.round((tour.priceAdult || 6500000) * 0.75));
  const [priceToddler, setPriceToddler] = useState(tour.priceToddler || Math.round((tour.priceAdult || 6500000) * 0.5));
  const [priceInfant, setPriceInfant] = useState(tour.priceInfant || 500000);
  const [singleRoomSurcharge, setSingleRoomSurcharge] = useState(
    tour.singleRoomSurcharge || Math.round((tour.priceAdult || 6500000) * 0.35)
  );
  const [seatsLeft, setSeatsLeft] = useState(tour.seatsLeft || 15);

  // STEP 3: Day-by-Day Itinerary (4 sections per day)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(
    tour.itinerary && tour.itinerary.length > 0
      ? tour.itinerary
      : [
          {
            day: 1,
            title: `Ngày 1: Khởi hành đi ${tour.destination}`,
            meals: 'Ăn trưa, tối đặc sản',
            hotel: 'Khách sạn 4★ trung tâm',
            hotelStar: 4,
            activities: 'Tham quan danh thắng địa phương & dạo phố đêm',
            image: tour.image || SAMPLE_IMAGES[0].url,
            details: [
              'Xe và hướng dẫn viên đón đoàn tại điểm hẹn.',
              'Nhận phòng khách sạn, nghỉ ngơi.',
              'Thưởng thức ẩm thực đặc sản buổi tối.'
            ]
          }
        ]
  );

  // STEP 4: Media, Badges, Inclusions & Highlights
  const [image, setImage] = useState(tour.image || SAMPLE_IMAGES[0].url);
  const [badge, setBadge] = useState(tour.badge || 'Bán Chạy');
  const [highlights, setHighlights] = useState<string>(
    tour.highlights ? tour.highlights.join('\n') : 'Trải nghiệm du lịch cao cấp\nKhách sạn sang trọng tiện nghi'
  );
  const [inclusions, setInclusions] = useState<string[]>(
    tour.inclusionsList && tour.inclusionsList.length > 0
      ? tour.inclusionsList
      : ['Xe đưa đón đời mới', 'Khách sạn tiêu chuẩn 2 khách/phòng', 'Vé tham quan các điểm']
  );
  const [exclusions, setExclusions] = useState<string[]>(
    tour.exclusionsList && tour.exclusionsList.length > 0
      ? tour.exclusionsList
      : ['Chi phí cá nhân', 'Thuế VAT', 'Tiền tip cho HDV']
  );

  const [departureDatesList, setDepartureDatesList] = useState<DepartureDate[]>(() => {
    if (tour?.departureDates && tour.departureDates.length > 0) {
      return tour.departureDates;
    }
    if (tour?.availableDates && tour.availableDates.length > 0) {
      return tour.availableDates.map((d, idx) => ({
        date: d,
        dayOfWeek: computeDayOfWeek(d),
        monthLabel: computeMonthLabel(d),
        seats: tour.seatsLeft || 15,
        priceAdult: tour.priceAdult || 6500000,
        priceChild: tour.priceChild || Math.round((tour.priceAdult || 6500000) * 0.75),
        priceToddler: tour.priceToddler || Math.round((tour.priceAdult || 6500000) * 0.5),
        priceInfant: 500000,
        singleRoomSurcharge: tour.singleRoomSurcharge || Math.round((tour.priceAdult || 6500000) * 0.35),
        label: idx === 0 ? 'Chuyến Gần Nhất' : null
      }));
    }
    return [];
  });

  const [quickDateInput, setQuickDateInput] = useState('');
  const [quickDateLabel, setQuickDateLabel] = useState('');
  const [quickDatePrice, setQuickDatePrice] = useState<number>(tour?.priceAdult || 6500000);
  const [quickDateSeats, setQuickDateSeats] = useState<number>(15);
  const [dateFormError, setDateFormError] = useState<string | null>(null);

  // New Enterprise Fields: All-Inclusive, Weather Notice, Status & Gallery
  const [isAllInclusive, setIsAllInclusive] = useState(tour?.isAllInclusive || false);
  const [weatherNotice, setWeatherNotice] = useState(tour?.weatherNotice || '');
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden' | 'weather_suspended'>(
    tour?.status || (tour?.isActive === false ? 'hidden' : 'published')
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    tour?.gallery && tour.gallery.length > 0
      ? tour.gallery.map((g) => g.url).filter((u) => u !== tour.image)
      : []
  );
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize initial values if tour prop changes
  useEffect(() => {
    if (tour) {
      setTitle(tour.title);
      setCode(tour.code);
      setDestination(tour.destination);
      setDepartureFrom(tour.departureFrom || 'TP. Hồ Chí Minh / Hà Nội');
      setCategory(tour.category || 'domestic');
      setTravelStyle(tour.travelStyle || 'package');
      setTheme(tour.theme || 'beach');
      setDurationDays(tour.durationDays || 4);
      setDurationNights(tour.durationNights || 3);
      setTier(tour.tier || 'standard');
      setHotelName(tour.hotelSpecs?.hotelName || 'Khách sạn 4★ tiêu chuẩn');
      setRoomType(tour.hotelSpecs?.roomType || 'Phòng Deluxe / Superior (2 khách/phòng)');
      setPriceAdult(tour.priceAdult);
      setOriginalPrice(tour.originalPrice);
      setDiscountPercent(tour.discountPercent);
      setIsFlashSale(tour.isFlashSale || false);
      setPriceChild(tour.priceChild || Math.round(tour.priceAdult * 0.75));
      setPriceToddler(tour.priceToddler || Math.round(tour.priceAdult * 0.5));
      setPriceInfant(tour.priceInfant || 500000);
      setSingleRoomSurcharge(tour.singleRoomSurcharge || Math.round(tour.priceAdult * 0.35));
      setSeatsLeft(tour.seatsLeft || 15);
      setImage(tour.image || SAMPLE_IMAGES[0].url);
      setBadge(tour.badge || 'Bán Chạy');
      setHighlights(tour.highlights ? tour.highlights.join('\n') : '');
      setIsAllInclusive(tour.isAllInclusive || false);
      setWeatherNotice(tour.weatherNotice || '');
      setStatus(tour.status || (tour.isActive === false ? 'hidden' : 'published'));
      if (tour.gallery && tour.gallery.length > 0) {
        setGalleryUrls(tour.gallery.map((g) => g.url).filter((u) => u !== tour.image));
      }
      if (tour.inclusionsList) setInclusions(tour.inclusionsList);
      if (tour.exclusionsList) setExclusions(tour.exclusionsList);
      if (tour.itinerary && tour.itinerary.length > 0) {
        setItineraryDays(tour.itinerary);
      }
      if (tour.departureDates && tour.departureDates.length > 0) {
        setDepartureDatesList(tour.departureDates);
      } else if (tour.availableDates && tour.availableDates.length > 0) {
        setDepartureDatesList(
          tour.availableDates.map((d, idx) => ({
            date: d,
            dayOfWeek: computeDayOfWeek(d),
            monthLabel: computeMonthLabel(d),
            seats: tour.seatsLeft || 15,
            priceAdult: tour.priceAdult || 6500000,
            priceChild: tour.priceChild || Math.round((tour.priceAdult || 6500000) * 0.75),
            priceToddler: tour.priceToddler || Math.round((tour.priceAdult || 6500000) * 0.5),
            priceInfant: 500000,
            singleRoomSurcharge: tour.singleRoomSurcharge || Math.round((tour.priceAdult || 6500000) * 0.35),
            label: idx === 0 ? 'Chuyến Gần Nhất' : null
          }))
        );
      }
    }
  }, [tour]);

  // Helper: Add Single Date
  const handleAddSingleDate = () => {
    setDateFormError(null);
    const dStr = quickDateInput.trim();
    if (!dStr) {
      setDateFormError('Vui lòng nhập hoặc chọn ngày khởi hành (VD: 15/10/2026).');
      return;
    }
    if (departureDatesList.some((d) => d.date === dStr)) {
      setDateFormError(`Ngày ${dStr} đã có trong danh sách.`);
      return;
    }

    const adultP = Number(quickDatePrice) > 0 ? Number(quickDatePrice) : priceAdult;
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
      label: quickDateLabel.trim() || null
    };

    setDepartureDatesList([...departureDatesList, newEntry]);
    setQuickDateInput('');
    setQuickDateLabel('');
  };

  // Helper: Quick Preset Holiday
  const handleQuickAddHoliday = (preset: (typeof HOLIDAY_PRESETS)[0]) => {
    if (departureDatesList.some((d) => d.date === preset.date)) {
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
    HOLIDAY_PRESETS.forEach((preset) => {
      if (!departureDatesList.some((d) => d.date === preset.date)) {
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
    weekendDates.forEach((wDate) => {
      if (!departureDatesList.some((d) => d.date === wDate)) {
        const weekendPrice = Math.round(priceAdult * 1.1);
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
    setDepartureDatesList(
      departureDatesList.map((d) => ({
        ...d,
        priceAdult,
        priceChild: Math.round(priceAdult * 0.75),
        priceToddler: Math.round(priceAdult * 0.5),
        priceInfant: 500000,
        singleRoomSurcharge: Math.round(priceAdult * 0.35)
      }))
    );
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

  // Handle Adult Price change & auto calculate other tiers
  const handleAdultPriceChange = (val: string | number) => {
    const cleanStr = val.toString().replace(/[^\d]/g, '');
    const num = Math.max(0, Number(cleanStr) || 0);
    setPriceAdult(num);
    setPriceChild(Math.round(num * 0.75));
    setPriceToddler(Math.round(num * 0.5));
    setSingleRoomSurcharge(Math.round(num * 0.35));

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

  // Handle Title input change with real-time auto code & destination extraction
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!destination.trim()) {
      setCode(generateStyle1TourCode(newTitle, durationDays, durationNights));
    }
  };

  // Handle Destination input change with real-time auto code update
  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    setCode(generateStyle1TourCode(newDest || title, durationDays, durationNights));
  };

  // Handle Nights change
  const handleNightsChange = (newNights: number) => {
    const validNights = Math.max(0, newNights);
    setDurationNights(validNights);
    setCode(generateStyle1TourCode(destination || title, durationDays, validNights));
  };

  // Day quantity adjustment
  const handleDaysChange = (days: number) => {
    const validDays = Math.max(1, days);
    const validNights = Math.max(0, validDays - 1);
    setDurationDays(validDays);
    setDurationNights(validNights);
    setCode(generateStyle1TourCode(destination || title, validDays, validNights));
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
            'Thưởng thức ẩm thực đặc sản đêm.'
          ]
        });
      }
    } else {
      currentItin.splice(validDays);
    }
    setItineraryDays(currentItin);
  };

  // Submit updated tour
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
      return;
    }
    if (!title.trim()) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const starRating = tier === 'luxury' ? 5 : tier === 'standard' ? 4 : 3;
      const hotelTier = tier === 'luxury' ? 'Resort 5★' : tier === 'standard' ? 'Khách Sạn 4★' : 'Khách Sạn 3★';
      const tierName = tier === 'luxury' ? 'Dòng Luxury' : tier === 'standard' ? 'Dòng Tiêu Chuẩn' : 'Dòng Tiết Kiệm';

      const departureDatesObj: DepartureDate[] = departureDatesList.length > 0
        ? departureDatesList
        : (tour.departureDates || []);

      const datesArr = departureDatesObj.map((d) => d.date);
      const minPriceAdult = Math.min(...departureDatesObj.map((d) => d.priceAdult)) || Number(priceAdult);
      const totalSeatsSum = departureDatesObj.reduce((sum, d) => sum + (d.seats || 0), 0) || Number(seatsLeft);

      const highlightsArr = highlights
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updatedTourObj: Tour = {
        ...tour,
        title: title.trim(),
        shortTitle: title.trim(),
        code: code.trim().toUpperCase(),
        destination: destination.trim(),
        departureFrom: departureFrom.trim(),
        category,
        travelStyle,
        theme,
        type: getThemeLabel(theme),
        tier,
        starCategory: tier,
        starRating,
        hotelTier,
        tierName,
        durationDays: Number(durationDays),
        durationNights: Number(durationNights),
        availableDates: datesArr.length > 0 ? datesArr : tour.availableDates,
        departureDates: departureDatesObj,
        priceAdult: minPriceAdult,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        isFlashSale,
        priceChild: Number(priceChild),
        priceToddler: Number(priceToddler),
        priceInfant: Number(priceInfant),
        singleRoomSurcharge: Number(singleRoomSurcharge),
        seatsLeft: totalSeatsSum,
        image: image.trim() || tour.image,
        badge: badge.trim(),
        hotelSpecs: {
          hotelName: hotelName.trim(),
          roomType: roomType.trim(),
          inclusions: tour.hotelSpecs?.inclusions || ['Buffet sáng', 'Wifi miễn phí']
        },
        itinerary: itineraryDays,
        highlights: highlightsArr.length > 0 ? highlightsArr : tour.highlights,
        inclusionsList: inclusions,
        exclusionsList: exclusions,
        isAllInclusive,
        weatherNotice: weatherNotice.trim() || undefined,
        status,
        isActive: status !== 'hidden',
        gallery: [
          { url: image.trim() || tour.image, title: title.trim() },
          ...galleryUrls.map((u) => ({ url: u, title: title.trim() }))
        ]
      };

      await onSaveTour(updatedTourObj);
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
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                MÃ: {tour.code}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                Chỉnh Sửa Chi Tiết Tour Du Lịch
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
              Cập nhật giá 4 độ tuổi, phụ thu ngày lễ, khách sạn từng đêm và lịch trình chi tiết
            </p>
          </div>
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

      {/* FULLSCREEN FORM BODY */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '2rem 3rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            
            {/* ========================================================================= */}
            {/* TAB 1: THÔNG TIN CHUNG & HÌNH ẢNH */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Tên Tour Lữ Hành Đầy Đủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ví dụ: Tour Hà Nội - Du Thuyền Hạ Long 5★ 4N3Đ"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Điểm Đến Chính *
                    </label>
                    <input
                      type="text"
                      required
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
                        onClick={() => setCode(generateStyle1TourCode(destination || title || 'TOUR', durationDays, durationNights))}
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
                      Huy Hiệu Tiếp Thị (Badge)
                    </label>
                    <select
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
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
                      <option value="🔥 Flash Sale 30%">🔥 Flash Sale 30%</option>
                      <option value="🔥 Bán Chạy">🔥 Bán Chạy</option>
                      <option value="👑 5 Sao Đẳng Cấp">👑 5 Sao Đẳng Cấp</option>
                      <option value="✨ Mới Ra Mắt">✨ Mới Ra Mắt</option>
                      <option value="⭐ Tour Hot">⭐ Tour Hot</option>
                    </select>
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
                      Số Ngày (Days)
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
                      Số Đêm (Nights)
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
                    <i className="fa-solid fa-cloud-sun" style={{ color: '#0284c7', marginRight: '0.35rem' }}></i> Lưu Ý Thời Tiết &amp; Mùa Khởi Hành Đẹp Nhất (Tùy chọn)
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

                {/* Cover Image URL */}
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
                      boxSizing: 'border-box'
                    }}
                  />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Hạng Sao Cam Kết Của Tour *
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

                {/* 4 Age Tiers Pricing Grid */}
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
                      <span style={{ fontSize: '0.74rem', color: '#047857', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                        = {priceAdult ? priceAdult.toLocaleString('vi-VN') : 0} VNĐ
                      </span>
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
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        * Tự tính = 75% vé lớn ({priceChild ? priceChild.toLocaleString('vi-VN') : 0} VNĐ)
                      </span>
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
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        * Tự tính = 50% vé lớn ({priceToddler ? priceToddler.toLocaleString('vi-VN') : 0} VNĐ)
                      </span>
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
                        = {priceInfant ? priceInfant.toLocaleString('vi-VN') : 0} VNĐ (Phí cố định)
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
                        Số Chỗ Mở Bán Cho Mỗi Chuyến
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
                    Điểm Nhấn Hành Trình (Mỗi dòng là 1 điểm nhấn nổi bật)
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
                    <button
                      type="button"
                      onClick={() => handleDaysChange(itineraryDays.length + 1)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Thêm Ngày Mới
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {itineraryDays.map((dayItem, idx) => (
                      <div
                        key={dayItem.day}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Day Header Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.6rem' }}>
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
                          {itineraryDays.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = itineraryDays.filter((_, i) => i !== idx);
                                const reindexed = filtered.map((d, i) => ({ ...d, day: i + 1 }));
                                setItineraryDays(reindexed);
                                setDurationDays(reindexed.length);
                              }}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-trash"></i> Xóa ngày {dayItem.day}
                            </button>
                          )}
                        </div>

                        {/* 1. Title & Meals */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1rem', marginBottom: '0.85rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                              Tiêu Đề Chặng Đi (Ngày {dayItem.day}) *
                            </label>
                            <input
                              type="text"
                              value={dayItem.title}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].title = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="VD: Hà Nội – Hạ Long – Lên Du Thuyền 5 Sao"
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

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                              Bữa Ăn Trong Ngày
                            </label>
                            <input
                              type="text"
                              value={dayItem.meals || ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].meals = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="VD: Ăn sáng buffet, trưa hải sản"
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

                        {/* 2. Hotel per day & Star rating */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1rem', marginBottom: '0.85rem', background: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#166534', marginBottom: '0.25rem' }}>
                              🏨 Khách Sạn Lưu Trú Đêm {dayItem.day}
                            </label>
                            <input
                              type="text"
                              value={dayItem.hotel || ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].hotel = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="VD: Du Thuyền 5★ Hạ Long"
                              style={{
                                width: '100%',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                border: '1.5px solid #86efac',
                                fontSize: '0.88rem',
                                outline: 'none',
                                background: '#ffffff',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#166534', marginBottom: '0.25rem' }}>
                              Hạng Sao Khách Sạn
                            </label>
                            <select
                              value={dayItem.hotelStar ?? 4}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].hotelStar = Number(e.target.value);
                                setItineraryDays(updated);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                border: '1.5px solid #86efac',
                                fontSize: '0.88rem',
                                outline: 'none',
                                background: '#ffffff',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value={5}>⭐⭐⭐⭐⭐ 5 Sao</option>
                              <option value={4}>⭐⭐⭐⭐ 4 Sao</option>
                              <option value={3}>⭐⭐⭐ 3 Sao</option>
                              <option value={0}>Không lưu trú (Về nhà)</option>
                            </select>
                          </div>
                        </div>

                        {/* 3. Main Activity & Photo URL */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '1rem', marginBottom: '0.85rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                              Hoạt Động Nổi Bật Chính
                            </label>
                            <input
                              type="text"
                              value={dayItem.activities || ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].activities = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="VD: Chèo thuyền kayak & Tiệc Sunset"
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

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                              Link Ảnh Thắng Cảnh Ngày Này
                            </label>
                            <input
                              type="url"
                              value={dayItem.image || ''}
                              onChange={(e) => {
                                const updated = [...itineraryDays];
                                updated[idx].image = e.target.value;
                                setItineraryDays(updated);
                              }}
                              placeholder="https://images.unsplash.com/..."
                              style={{
                                width: '100%',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>

                        {/* 4. Details (Multi-line bullet list) */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                            Nội Dung Chi Tiết (Mỗi dòng tự thành 1 gạch đầu dòng • trên Popup Modal)
                          </label>
                          <textarea
                            rows={3}
                            value={dayItem.details ? dayItem.details.join('\n') : ''}
                            onChange={(e) => {
                              const updated = [...itineraryDays];
                              updated[idx].details = e.target.value
                                .split('\n')
                                .map((s) => s.trim())
                                .filter((s) => s.length > 0);
                              setItineraryDays(updated);
                            }}
                            placeholder="Nhập từng dòng mô tả chi tiết..."
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
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
                type="submit"
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
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi Tour'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
