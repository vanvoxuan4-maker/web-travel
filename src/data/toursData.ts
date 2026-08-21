import { Tour } from '../types/tour.types';

/**
 * Danh Sách Tour Du Lịch Cao Cấp (Flagship Tours Database)
 * Được cấu trúc chuẩn đa khách sạn theo từng ngày, bảng giá đa tầng và hình ảnh chất lượng cao.
 */
export const TOURS_DATA: Tour[] = [
  {
    id: 'tour-halong-01',
    code: 'WT-HALONG-4N3D',
    sku: 'WT1001',
    title: 'Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình Tràng An 4N3Đ',
    shortTitle: 'Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình',
    destination: 'Hà Nội - Vịnh Hạ Long - Ninh Bình',
    category: 'domestic',
    type: 'Nghỉ Dưỡng & Di Sản',
    departureFrom: 'TP. Hồ Chí Minh / Hà Nội',
    seatsLeft: 9,
    departureSchedule: 'Thứ 5 & Chủ Nhật hàng tuần',
    availableDates: ['10/09/2026', '24/09/2026', '08/10/2026', '22/10/2026'],
    departureDates: [
      {
        date: '10/09/2026',
        seats: 9,
        priceAdult: 8990000,
        priceChild: 6742500,
        priceToddler: 4495000,
        priceInfant: 500000,
        singleRoomSurcharge: 2800000,
        label: '🔥 Bán Chạy Nhất'
      },
      {
        date: '24/09/2026',
        seats: 6,
        priceAdult: 8990000,
        priceChild: 6742500,
        priceToddler: 4495000,
        priceInfant: 500000,
        singleRoomSurcharge: 2800000,
        label: '🏷️ Giữ Giá Tốt'
      }
    ],
    durationDays: 4,
    durationNights: 3,
    priceAdult: 8990000,
    priceChild: 6742500,
    priceToddler: 4495000,
    priceInfant: 500000,
    tier: 'luxury',
    tierName: 'Dòng Luxury 5 Sao',
    hotelTier: 'Du Thuyền 5★ & Khách Sạn 4★',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '94/100',
    esgScore: '91/100',
    hotelSpecs: {
      hotelName: 'Du Thuyền 5★ Hạ Long & Silk Path Hà Nội',
      roomType: 'Phòng Deluxe Ban Công Hướng Vịnh',
      inclusions: ['Buffet hải sản sundeck', 'Sunset party', 'Tắm hồ bơi vô cực']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85', title: 'Du thuyền Hạ Long' },
      { url: 'https://images.unsplash.com/photo-1599708153386-62bf3f03577d?auto=format&fit=crop&w=1200&q=85', title: 'Hà Nội nghìn năm văn hiến' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85', title: 'Tràng An Ninh Bình' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi + 20kg hành lý ký gửi',
      '01 đêm nghỉ dưỡng trên Du thuyền 5★ cao cấp',
      '02 đêm khách sạn 4-5★ trung tâm Hà Nội & Ninh Bình',
      'Toàn bộ bữa ăn theo chương trình (Buffet sundeck & đặc sản dê Ninh Bình)',
      'Xe Limousine VIP đưa đón tận nơi suốt tuyến',
      'Vé tham quan trọn gói: Vịnh Hạ Long, Tràng An, Chùa Bái Đính',
      'Bảo hiểm du lịch quốc tế quyền lợi 1.000.000.000 VNĐ'
    ],
    exclusionsList: [
      'Chi phí cá nhân ngoài chương trình (giặt ủi, minibar, spa)',
      'Tiền TIP cho HDV và tài xế (không bắt buộc)',
      'Thuế VAT 8% (nếu yêu cầu xuất hóa đơn)'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 10 ngày khởi hành', fee: 'Hoàn 100% chi phí' },
      { condition: 'Hủy trước 5 - 9 ngày', fee: 'Hoàn 50% chi phí' },
      { condition: 'Hủy dưới 3 ngày', fee: 'Không hoàn phí' }
    ],
    faqs: [
      { q: 'Phòng du thuyền có ban công riêng không?', a: 'Tất cả các phòng đều là hạng Deluxe có ban công riêng nhìn trực diện ra vịnh biển.' },
      { q: 'Trẻ em có được tính suất giường riêng không?', a: 'Trẻ em dưới 11 tuổi ngủ chung giường với bố mẹ, nếu cần giường phụ có thể đăng ký phụ thu.' }
    ],
    rating: 4.95,
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85',
    highlights: [
      'Trải nghiệm ngủ đêm trên du thuyền 5 sao đẳng cấp giữa vịnh di sản',
      'Chèo thuyền kayak khám phá Hang Luồn và tắm biển đảo Titop',
      'Thưởng thức tiệc Sunset Party ngắm hoàng hôn vịnh biển rực rỡ',
      'Ngồi thuyền nan ngắm quần thể danh thắng Tràng An Tuyệt Tịnh Cốc'
    ],
    badge: '🔥 Flash Sale 30%',
    itinerary: [
      {
        day: 1,
        title: 'Tp. Hồ Chí Minh – Hà Nội – Khám Phá Phố Cổ 36 Phố Phường',
        meals: 'Ăn trưa đặc sản, tối bún chả',
        hotel: 'Silk Path Hotel 4★ Hà Nội',
        hotelStar: 4,
        activities: 'Tham quan trung tâm thủ đô Hà Nội & Dạo phố cổ',
        image: 'https://images.unsplash.com/photo-1599708153386-62bf3f03577d?auto=format&fit=crop&w=800&q=80',
        details: [
          'Đáp chuyến bay sáng đến sân bay Nội Bài, xe Limousine đón đoàn.',
          'Tham quan Hoàng thành Thăng Long, Văn Miếu – Quốc Tử Giám.',
          'Dạo quanh Hồ Gươm, viếng Đền Ngọc Sơn và Cầu Thê Húc.',
          'Buổi tối tự do thưởng thức cà phê trứng và kem Tràng Tiền.',
          'Nghỉ đêm tại khách sạn 4★ trung tâm phố cổ Hà Nội.'
        ]
      },
      {
        day: 2,
        title: 'Hà Nội – Hạ Long – Trải Nghiệm Du Thuyền 5 Sao',
        meals: 'Ăn sáng buffet, trưa hải sản, tối tiệc Sunset',
        hotel: 'Du Thuyền 5★ Vịnh Hạ Long',
        hotelStar: 5,
        activities: 'Khám phá Vịnh Hạ Long & Tiệc hoàng hôn sundeck',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
        details: [
          'Khởi hành đi Hạ Long qua tuyến cao tốc Hà Nội - Hải Phòng mới.',
          'Làm thủ tục lên du thuyền 5★, thưởng thức đồ uống chào mừng.',
          'Dùng bữa trưa buffet hải sản trong khi tàu lướt qua hàng ngàn đảo đá.',
          'Chèo kayak Hang Luồn và tắm biển tại bãi cát đảo Titop.',
          'Tham gia tiệc Sunset Party cocktail trên sundeck tầng thượng.',
          'Nghỉ đêm trong cabin sang trọng view vịnh biển.'
        ]
      },
      {
        day: 3,
        title: 'Hạ Long – Ninh Bình – Tràng An – Chùa Bái Đính',
        meals: 'Ăn sáng buffet, trưa cơm cháy dê núi, tối',
        hotel: 'Emeralda Resort Ninh Bình 4★',
        hotelStar: 4,
        activities: 'Thuyền nan Tràng An & Chiêm bái Chùa Bái Đính',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        details: [
          'Tập Thái Cực Quyền đón bình minh trên boong tàu.',
          'Tham quan Hang Sửng Sốt - hang động đẹp nhất Vịnh Hạ Long.',
          'Di chuyển về Ninh Bình, check-in Emeralda Resort mang đậm kiến trúc làng quê Bắc Bộ.',
          'Ngồi thuyền nan xuôi dòng sông Sào Khê khám phá Quần thể Tràng An.',
          'Viếng Chùa Bái Đính linh thiêng chiêm bái Đại Tượng Phật bằng đồng.',
          'Nghỉ đêm thư giãn tại resort có hồ bơi sân vườn.'
        ]
      },
      {
        day: 4,
        title: 'Ninh Bình – Nội Bài – Tp. Hồ Chí Minh',
        meals: 'Ăn sáng buffet, trưa nhẹ đặc sản',
        hotel: 'Kết thúc hành trình (Trở về)',
        hotelStar: 0,
        activities: 'Mua sắm đặc sản làm quà & Tiễn sân bay Nội Bài',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
        details: [
          'Ăn sáng buffet tại resort, tự do dạo vườn chụp ảnh.',
          'Mua sắm đặc sản cơm cháy Ninh Bình, mắm tép Gia Viễn.',
          'Xe đưa đoàn ra sân bay Nội Bài làm thủ tục bay về lại điểm đón ban đầu.',
          'HDV chia tay đoàn và hẹn gặp lại trong những chuyến đi tiếp theo.'
        ]
      }
    ],
    isActive: true
  },
  {
    id: 'tour-danang-02',
    code: 'WT-DANANG-4N3D',
    sku: 'WT1002',
    title: 'Đà Nẵng - Cố Đô Huế - Phố Cổ Hội An - Bà Nà Hills 4N3Đ',
    shortTitle: 'Đà Nẵng - Huế - Hội An - Bà Nà Hills',
    destination: 'Đà Nẵng - Huế - Hội An',
    category: 'domestic',
    type: 'Văn Hóa & Di Sản',
    departureFrom: 'TP. Hồ Chí Minh / Hà Nội',
    seatsLeft: 12,
    departureSchedule: 'Thứ 4 & Thứ 7 hàng tuần',
    availableDates: ['15/09/2026', '29/09/2026', '12/10/2026', '26/10/2026'],
    departureDates: [
      {
        date: '15/09/2026',
        seats: 12,
        priceAdult: 6490000,
        priceChild: 4867500,
        priceToddler: 3245000,
        priceInfant: 500000,
        singleRoomSurcharge: 2100000,
        label: '✨ Deal Hot Tuần'
      },
      {
        date: '29/09/2026',
        seats: 8,
        priceAdult: 6490000,
        priceChild: 4867500,
        priceToddler: 3245000,
        priceInfant: 500000,
        singleRoomSurcharge: 2100000,
        label: null
      }
    ],
    durationDays: 4,
    durationNights: 3,
    priceAdult: 6490000,
    priceChild: 4867500,
    priceToddler: 3245000,
    priceInfant: 500000,
    tier: 'standard',
    tierName: 'Dòng Tiêu Chuẩn 4-5 Sao',
    hotelTier: 'Khách Sạn 4★ & 5★ Liên Tuyến',
    starRating: 4,
    starCategory: 'standard',
    leiScore: '92/100',
    esgScore: '90/100',
    hotelSpecs: {
      hotelName: 'Four Points Danang 4★ & Silk Path Huế 5★',
      roomType: 'Phòng Deluxe City & Sea View',
      inclusions: ['Buffet sáng 5 sao', 'Hồ bơi vô cực', 'Trà chiều']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85', title: 'Cố Đô Huế' },
      { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=85', title: 'Phố Cổ Hội An' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi Vietjet/Vietnam Airlines',
      '01 đêm Four Points by Sheraton Danang 4★ biển Mỹ Khê',
      '01 đêm Silk Path Grand Hotel Huế 5★ phong cách hoàng gia',
      '01 đêm Almanity Hoi An Wellness Resort 4★',
      'Vé cáp treo Bà Nà Hills & Cầu Vàng nổi tiếng',
      'Du thuyền ca Huế trên sông Hương thả hoa đăng'
    ],
    exclusionsList: [
      'Vé bảo tàng tượng sáp Bà Nà Hills',
      'Chi phí cá nhân và đồ uống trong các bữa ăn'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 7 ngày', fee: 'Hoàn 100%' },
      { condition: 'Hủy trước 3 - 6 ngày', fee: 'Hoàn 50%' }
    ],
    faqs: [
      { q: 'Vé tour đã có vé cáp treo Bà Nà Hills chưa?', a: 'Giá tour đã bao gồm vé cáp treo khứ hồi và buffet trưa tại Bà Nà Hills.' }
    ],
    rating: 4.9,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85',
    highlights: [
      'Check-in Cầu Vàng lơ lửng giữa mây ngàn Bà Nà Hills',
      'Dạo bước phố cổ Hội An lung linh sắc màu đèn lồng và thả hoa đăng',
      'Tham quan Đại Nội Huế nguy nga và nghe ca Huế trên sông Hương',
      'Tắm biển Mỹ Khê - một trong những bãi biển quyến rũ nhất hành tinh'
    ],
    badge: '🔥 Bán Chạy',
    itinerary: [
      {
        day: 1,
        title: 'Đón Khách Đà Nẵng – Bán Đảo Sơn Trà – Biển Mỹ Khê',
        meals: 'Ăn trưa mì Quảng, tối hải sản Mỹ Khê',
        hotel: 'Four Points by Sheraton Danang 4★',
        hotelStar: 4,
        activities: 'Viếng Chùa Linh Ứng & Tắm biển Mỹ Khê',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
        details: [
          'Xe đón tại sân bay Đà Nẵng, viếng Chùa Linh Ứng Bãi Bụt.',
          'Nhận phòng tại Four Points by Sheraton 4★ view biển.',
          'Tắm biển Mỹ Khê và thưởng thức tiệc hải sản tươi sống.',
          'Xem Cầu Rồng phun lửa và phun nước (tối cuối tuần).'
        ]
      },
      {
        day: 2,
        title: 'Đà Nẵng – Đèo Hải Vân – Cố Đô Huế Hoàng Gia',
        meals: 'Ăn sáng buffet, trưa cung đình, tối đặc sản Huế',
        hotel: 'Silk Path Grand Hotel Hue 5★',
        hotelStar: 5,
        activities: 'Chinh phục Đèo Hải Vân & Viếng Đại Nội Huế',
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
        details: [
          'Khởi hành đi Huế qua Đèo Hải Vân - Thiên hạ đệ nhất hùng quan.',
          'Check-in Silk Path Grand Huế 5★ mang phong cách quý tộc.',
          'Tham quan Ngọ Môn, Điện Thái Hòa, Tử Cấm Thành tại Đại Nội.',
          'Du thuyền rồng nghe ca Huế ngọt ngào trên dòng sông Hương.'
        ]
      },
      {
        day: 3,
        title: 'Huế – Lăng Khải Định – Phố Cổ Hội An Đèn Lồng',
        meals: 'Ăn sáng buffet 5★, trưa, tối cao lầu Hội An',
        hotel: 'Almanity Hoi An Wellness Resort 4★',
        hotelStar: 4,
        activities: 'Thả hoa đăng sông Hoài & Phố cổ Hội An',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        details: [
          'Viếng Lăng Khải Định với nghệ thuật ghép sành sứ đỉnh cao.',
          'Di chuyển về Hội An, nhận phòng tại Almanity Resort 4★.',
          'Dạo bước Chùa Cầu, Nhà cổ Tấn Ký, Hội quán Phúc Kiến.',
          'Thả hoa đăng trên sông Hoài và thưởng thức cao lầu, bánh mì Phượng.'
        ]
      },
      {
        day: 4,
        title: 'Bà Nà Hills Cầu Vàng – Tiễn Sân Bay Đà Nẵng',
        meals: 'Ăn sáng buffet, trưa buffet Bà Nà',
        hotel: 'Kết thúc tour (Trở về)',
        hotelStar: 0,
        activities: 'Khám phá Làng Pháp & Check-in Cầu Vàng',
        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
        details: [
          'Cáp treo lên đỉnh Bà Nà Hills, check-in Cầu Vàng kỳ ảo.',
          'Thưởng thức buffet quốc tế hơn 100 món tại Làng Pháp.',
          'Mua sắm đặc sản Đà Nẵng (chả bò, tré, bánh khô mè).',
          'Xe tiễn đoàn ra sân bay Đà Nẵng đáp chuyến bay về lại điểm xuất phát.'
        ]
      }
    ],
    isActive: true
  },
  {
    id: 'tour-phuquoc-03',
    code: 'WT-PHUQUOC-3N2D',
    sku: 'WT1003',
    title: 'Thiên Đường Nghỉ Dưỡng Phú Quốc 5★ - Sunset Town - Cáp Treo Hòn Thơm 3N2Đ',
    shortTitle: 'Phú Quốc 5★ - Cáp Treo Hòn Thơm',
    destination: 'Phú Quốc',
    category: 'domestic',
    type: 'Nghỉ Dưỡng & Biển Đảo',
    departureFrom: 'TP. Hồ Chí Minh / Hà Nội',
    seatsLeft: 7,
    departureSchedule: 'Thứ 6 hàng tuần',
    availableDates: ['18/09/2026', '25/09/2026', '09/10/2026', '23/10/2026'],
    departureDates: [
      {
        date: '18/09/2026',
        seats: 7,
        priceAdult: 5490000,
        priceChild: 4117500,
        priceToddler: 2745000,
        priceInfant: 500000,
        singleRoomSurcharge: 1800000,
        label: '👑 Resort 5 Sao'
      }
    ],
    durationDays: 3,
    durationNights: 2,
    priceAdult: 5490000,
    priceChild: 4117500,
    priceToddler: 2745000,
    priceInfant: 500000,
    tier: 'luxury',
    tierName: 'Dòng Luxury 5 Sao',
    hotelTier: 'Resort 5★ Biển Riêng',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '96/100',
    esgScore: '93/100',
    hotelSpecs: {
      hotelName: 'Vinpearl Resort & Spa Phú Quốc 5★',
      roomType: 'Phòng Deluxe Hướng Biển',
      inclusions: ['Buffet sáng 5 sao', 'Xe điện đưa đón', 'Bãi biển riêng tư']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85', title: 'Hoàng hôn Phú Quốc' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi Vietjet/Bamboo Airways',
      '02 đêm nghỉ dưỡng tại Vinpearl Resort 5★',
      'Vé cáp treo vượt biển 3 dây Hòn Thơm dài nhất thế giới',
      'Xe Limousine VIP đưa đón trọn hành trình',
      'Bảo hiểm du lịch 1.000.000.000 VNĐ'
    ],
    exclusionsList: [
      'Vé vui chơi VinWonders & Safari (nếu có nhu cầu mua thêm)'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 7 ngày', fee: 'Hoàn 100%' }
    ],
    faqs: [
      { q: 'Khách sạn có bãi biển riêng không?', a: 'Resort có bãi biển riêng dài hơn 1km với cát trắng mịn và làn nước trong xanh.' }
    ],
    rating: 4.98,
    reviewsCount: 184,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85',
    highlights: [
      'Nghỉ dưỡng tại Vinpearl Resort 5 sao chuẩn quốc tế',
      'Trải nghiệm cáp treo 3 dây vượt biển dài nhất thế giới sang Hòn Thơm',
      'Ngắm hoàng hôn lãng mạn tại Thị trấn Hoàng Hôn (Sunset Town)',
      'Thưởng thức hải sản tươi sống tại Làng chài Hàm Ninh'
    ],
    badge: '🌴 Siêu Phẩm Biển',
    itinerary: [
      {
        day: 1,
        title: 'Đón Bay Phú Quốc – Sunset Sanato – Sunset Town',
        meals: 'Ăn trưa gỏi cá trích, tối hải sản nướng',
        hotel: 'Vinpearl Resort & Spa Phú Quốc 5★',
        hotelStar: 5,
        activities: 'Check-in Sunset Town & Ngắm hoàng hôn bãi biển',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        details: [
          'Xe đón tại sân bay Phú Quốc, ăn trưa đặc sản gỏi cá trích.',
          'Check-in Vinpearl Resort & Spa 5★, nghỉ ngơi thư giãn.',
          'Check-in Cầu Hôn (Kiss Bridge) và Thị trấn Hoàng Hôn mang phong cách Địa Trung Hải.',
          'Thưởng thức show diễn thực cảnh Kiss of the Sea hoành tráng.'
        ]
      },
      {
        day: 2,
        title: 'Cáp Treo Hòn Thơm – Công Viên Nước Aquatopia – Bãi Sao',
        meals: 'Ăn sáng buffet 5★, trưa buffet Hòn Thơm, tối',
        hotel: 'Vinpearl Resort & Spa Phú Quốc 5★',
        hotelStar: 5,
        activities: 'Cáp treo vượt biển & Vui chơi công viên nước',
        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
        details: [
          'Trải nghiệm cáp treo vượt biển ngắm toàn cảnh quần đảo An Thới.',
          'Vui chơi công viên nước Aquatopia với hơn 20 trò chơi hiện đại.',
          'Tắm biển tại Bãi Sao - bờ cát trắng mịn như kem.',
          'Nghỉ đêm thứ 2 tại Vinpearl Resort 5★.'
        ]
      },
      {
        day: 3,
        title: 'Dinh Cậu – Chợ Đêm Phú Quốc – Tiễn Sân Bay',
        meals: 'Ăn sáng buffet, trưa nhẹ đặc sản',
        hotel: 'Kết thúc tour (Trở về)',
        hotelStar: 0,
        activities: 'Mua sắm ngọc trai, tiêu Phú Quốc & Tiễn bay',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
        details: [
          'Viếng Dinh Cậu linh thiêng cầu bình an.',
          'Tham quan cơ sở nuôi cấy ngọc trai và nhà thùng nước mắm truyền thống.',
          'Xe đưa đoàn ra sân bay Phú Quốc, kết thúc chuyến nghỉ dưỡng thiên đường.'
        ]
      }
    ],
    isActive: true
  },
  {
    id: 'tour-sapa-04',
    code: 'WT-SAPA-3N2D',
    sku: 'WT1004',
    title: 'Tour Sapa - Fansipan Huyền Thoại - Bản Cát Cát - Đèo Ô Quy Hồ 3N2Đ',
    shortTitle: 'Sapa - Fansipan - Bản Cát Cát',
    destination: 'Sapa - Lào Cai',
    category: 'domestic',
    type: 'Mạo Hiểm & Khám Phá',
    departureFrom: 'Hà Nội / TP.HCM',
    seatsLeft: 10,
    departureSchedule: 'Thứ 6 hàng tuần',
    availableDates: ['11/09/2026', '18/09/2026', '25/09/2026', '02/10/2026'],
    departureDates: [
      {
        date: '11/09/2026',
        seats: 10,
        priceAdult: 4890000,
        priceChild: 3667500,
        priceToddler: 2445000,
        priceInfant: 500000,
        singleRoomSurcharge: 1600000,
        label: '🍂 Mùa Lúa Chín'
      }
    ],
    durationDays: 3,
    durationNights: 2,
    priceAdult: 4890000,
    priceChild: 3667500,
    priceToddler: 2445000,
    priceInfant: 500000,
    tier: 'standard',
    tierName: 'Dòng Tiêu Chuẩn 4-5 Sao',
    hotelTier: 'Khách Sạn 4★ View Thung Lũng',
    starRating: 4,
    starCategory: 'standard',
    leiScore: '90/100',
    esgScore: '89/100',
    hotelSpecs: {
      hotelName: 'Pao\'s Sapa Leisure Hotel 4★ / MGallery 5★',
      roomType: 'Phòng Superior View Thung Lũng Mường Hoa',
      inclusions: ['Buffet sáng', 'Hồ bơi nước ấm 4 mùa', 'View săn mây']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85', title: 'Sapa mùa lúa chín' }
    ],
    inclusionsList: [
      'Xe Limousine Dcar đón trả tận nơi tại Hà Nội',
      '02 đêm khách sạn 4★ cao cấp view thung lũng',
      'Vé cáp treo Fansipan khứ hồi',
      'Thưởng thức lẩu cá tầm cá hồi tươi sống Sapa',
      'Bảo hiểm du lịch trọn gói'
    ],
    exclusionsList: [
      'Vé tàu hỏa leo núi Mường Hoa'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 7 ngày', fee: 'Hoàn 100%' }
    ],
    faqs: [
      { q: 'Lên đỉnh Fansipan thời tiết có lạnh không?', a: 'Nhiệt độ trên đỉnh thường thấp hơn chân núi 8-10 độ C, bạn nên chuẩn bị áo ấm và găng tay.' }
    ],
    rating: 4.88,
    reviewsCount: 76,
    image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=85',
    highlights: [
      'Chinh phục Nóc nhà Đông Dương Fansipan 3.143m ngắm biển mây bồng bềnh',
      'Khám phá văn hóa độc đáo người H\'Mông tại Bản Cát Cát thơ mộng',
      'Ngắm hoàng hôn tuyệt đẹp trên Đèo Ô Quy Hồ hùng vĩ',
      'Thưởng thức ẩm thực Tây Bắc đặc sắc: Lẩu cá hồi, thịt trâu gác bếp'
    ],
    badge: '⛰️ Mùa Mây Sapa',
    itinerary: [
      {
        day: 1,
        title: 'Hà Nội – Cao Tốc Lào Cai – Sapa – Bản Cát Cát',
        meals: 'Ăn trưa cơm lam, tối lẩu cá tầm nóng',
        hotel: 'Pao\'s Sapa Leisure Hotel 4★',
        hotelStar: 4,
        activities: 'Check-in Sapa & Khám phá Bản Cát Cát',
        image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=800&q=80',
        details: [
          'Xe Limousine đón tại Hà Nội di chuyển êm ái lên Sapa.',
          'Nhận phòng tại Pao\'s Sapa 4★ view thung lũng Mường Hoa.',
          'Tham quan Bản Cát Cát, chụp ảnh thác Tiên Sa và guồng nước gỗ.',
          'Buổi tối dạo Nhà Thờ Đá Sapa và chợ đêm náo nhiệt.'
        ]
      },
      {
        day: 2,
        title: 'Cáp Treo Fansipan 3.143m – Cổng Trời Ô Quy Hồ',
        meals: 'Ăn sáng buffet, trưa, tối ẩm thực Tây Bắc',
        hotel: 'Hotel de la Coupole - MGallery 5★',
        hotelStar: 5,
        activities: 'Chinh phục Đỉnh Fansipan & Săn mây Ô Quy Hồ',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        details: [
          'Cáp treo Fansipan chiêm bái Đại Tượng Phật A Di Đà bằng đồng.',
          'Chạm tay vào cột mốc Fansipan 3.143m ngắm biển mây đại ngàn.',
          'Ngắm hoàng hôn tại Cổng Trời Ô Quy Hồ - một trong Tứ Đại Đỉnh Đèo.',
          'Nghỉ đêm tại Hotel de la Coupole 5★ phong cách Pháp lãng mạn.'
        ]
      },
      {
        day: 3,
        title: 'Núi Hàm Rồng – Mua Đặc Sản – Trở Về Hà Nội',
        meals: 'Ăn sáng buffet 5★, trưa đặc sản',
        hotel: 'Kết thúc tour (Trở về)',
        hotelStar: 0,
        activities: 'Ngắm toàn cảnh thị xã Sapa & Về lại Hà Nội',
        image: 'https://images.unsplash.com/photo-1599708153386-62bf3f03577d?auto=format&fit=crop&w=800&q=80',
        details: [
          'Tham quan KDL Núi Hàm Rồng ngắm toàn cảnh thị xã Sapa trong sương.',
          'Mua sắm đặc sản nấm hương, mận tam hoa, thịt trâu gác bếp.',
          'Xe Limousine đưa đoàn về lại điểm hẹn ban đầu tại Hà Nội an toàn.'
        ]
      }
    ],
    isActive: true
  }
];
