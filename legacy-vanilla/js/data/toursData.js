/**
 * Base Mock Database for Travel Tours & Destinations
 * Enhanced with Professional Metadata (Tour Codes, SKU, Departure City, Seat Inventory, Star Rating Tiers, Hotel Specifications, ESG/LEI Ratings, Gallery & Inclusions)
 */
export const TOURS_DATA = [
  {
    id: 'tour-halong-01',
    code: 'WT-HL01',
    sku: 'NDSGN102',
    title: 'Hà Nội - Nghỉ Dưỡng Du Thuyền Hạ Long Cao Cấp - Ninh Bình - Bái Đính - Tràng An - Tuyệt Tịnh Cốc',
    shortTitle: 'Hà Nội - Du Thuyền Hạ Long 5★ - Ninh Bình Tràng An',
    destination: 'Hà Nội - Vịnh Hạ Long - Ninh Bình',
    category: 'domestic',
    type: 'Nghỉ Dưỡng & Di Sản',
    departureFrom: 'TP. Hồ Chí Minh / Hà Nội',
    seatsLeft: 5,
    departureSchedule: 'Thứ 5 & Chủ Nhật hàng tuần',
    availableDates: ['10/09/2026', '24/09/2026', '08/10/2026', '22/10/2026', '12/11/2026', '26/11/2026', '10/12/2026', '24/12/2026'],
    departureDates: [
      {
        date: '10/09/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 9 2026',
        sku: 'NDSGN9919-001-100926VN-D-7',
        seats: 9,
        priceAdult: 12290000,
        priceChild: 9217500,
        priceToddler: 6145000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: null,
        transport: {
          outbound: { date: '10/09/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '13/09/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '24/09/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 9 2026',
        sku: 'NDSGN9919-002-240926VN-D-7',
        seats: 5,
        priceAdult: 12290000,
        priceChild: 9217500,
        priceToddler: 6145000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: '🏷️ Giữ Giá Tốt',
        transport: {
          outbound: { date: '24/09/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '27/09/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '08/10/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 10 2026',
        sku: 'NDSGN9919-003-081026VN-D-7',
        seats: 7,
        priceAdult: 12590000,
        priceChild: 9442500,
        priceToddler: 6295000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: null,
        transport: {
          outbound: { date: '08/10/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '11/10/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '22/10/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 10 2026',
        sku: 'NDSGN9919-004-221026VN-D-7',
        seats: 3,
        priceAdult: 13290000,
        priceChild: 9967500,
        priceToddler: 6645000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: '🎉 Dịp Lễ 20/10',
        transport: {
          outbound: { date: '22/10/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '25/10/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '12/11/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 11 2026',
        sku: 'NDSGN9919-005-121126VN-D-7',
        seats: 8,
        priceAdult: 11990000,
        priceChild: 8992500,
        priceToddler: 5995000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: '🏷️ Early Bird Mùa Thu',
        transport: {
          outbound: { date: '12/11/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '15/11/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '26/11/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 11 2026',
        sku: 'NDSGN9919-006-261126VN-D-7',
        seats: 6,
        priceAdult: 12290000,
        priceChild: 9217500,
        priceToddler: 6145000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: null,
        transport: {
          outbound: { date: '26/11/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '29/11/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '10/12/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 12 2026',
        sku: 'NDSGN9919-007-101226VN-D-7',
        seats: 8,
        priceAdult: 12290000,
        priceChild: 9217500,
        priceToddler: 6145000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: null,
        transport: {
          outbound: { date: '10/12/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '13/12/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      },
      {
        date: '24/12/2026',
        dayOfWeek: 'T5',
        monthLabel: 'Tháng 12 2026',
        sku: 'NDSGN9919-008-241226VN-D-7',
        seats: 4,
        priceAdult: 13990000,
        priceChild: 10492500,
        priceToddler: 6995000,
        priceInfant: 500000,
        singleRoomSurcharge: 3500000,
        label: '🎄 Giáng Sinh & Năm Mới',
        transport: {
          outbound: { date: '24/12/2026', time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
          inbound: { date: '27/12/2026', time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
        }
      }
    ],
    durationDays: 4,
    durationNights: 3,
    priceAdult: 13590000,
    priceChild: 10190000,
    priceInfant: 2038000,
    tier: 'luxury',
    tierName: 'Dòng Cao Cấp',
    hotelTier: 'Du Thuyền 5★ & KS 4-5★',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '76/100 (Chèo thuyền Tràng An, Tập Thái Cực Quyền & Khám phá Ẩm thực Bắc Bộ)',
    esgScore: '84/100 (Bảo tồn hệ sinh thái Di sản Vịnh Hạ Long & Du lịch xanh bền vững)',
    hotelSpecs: {
      hotelName: '1 Đêm Du Thuyền 5★ Paradise Elegance Hạ Long + Khách sạn 4-5★ Hà Nội & Ninh Bình',
      roomType: 'Cabin Deluxe Ocean Balcony / Phòng Deluxe Mountain View (2 khách/phòng)',
      inclusions: [
        'Trọn gói 1 đêm ngủ trên Du thuyền 5 sao chuẩn quốc tế có ban công riêng',
        'Buffet hải sản cao cấp trên du thuyền & tiệc Sunset Party hoàng hôn',
        'Tập Thái Cực Quyền (Tai Chi) buổi sáng ngắm bình minh trên vịnh',
        'Lớp học làm món Việt truyền thống & Chèo thuyền Kayak Hang Luồn',
        'Khách sạn 4 sao trung tâm tại Hà Nội và Ninh Bình (2 người/phòng)'
      ]
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85', title: 'Du Thuyền 5 Sao Vịnh Hạ Long' },
      { url: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1200&q=85', title: 'Quần Thể Danh Thắng Tràng An' },
      { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85', title: 'Hoàng Thành Thăng Long & Văn Miếu' },
      { url: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=1200&q=85', title: 'Quần Thể Chùa Bái Đính Ninh Bình' },
      { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=85', title: 'Tuyệt Tịnh Cốc - Động Am Tiên' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi (bao gồm hành lý xách tay 12kg + ký gửi 23kg)',
      'Xe du lịch máy lạnh Limousine cao cấp đưa đón tham quan suốt tuyến',
      '01 đêm nghỉ dưỡng trên Du thuyền 5 sao đẳng cấp quốc tế (Cabin riêng có ban công)',
      '02 đêm khách sạn 4-5 sao trung tâm Hà Nội và Ninh Bình (2 khách/phòng)',
      'Toàn bộ các bữa ăn chất lượng theo chương trình (Buffet hải sản du thuyền, Chả cá Lã Vọng, Dê núi Ninh Bình)',
      'Vé tham quan tất cả các điểm danh thắng (Vịnh Hạ Long, Tràng An, Bái Đính, Văn Miếu, Tuyệt Tịnh Cốc)',
      'Thuyền nan tham quan danh thắng Tràng An & Xe điện Chùa Bái Đính',
      'Hoạt động chèo thuyền Kayak, tiệc Sunset Party & Lớp học Thái Cực Quyền',
      'Hướng dẫn viên chuyên nghiệp, am hiểu văn hóa bản địa phục vụ đoàn',
      'Bảo hiểm du lịch nội địa cao cấp bảo vệ tối đa 100.000.000 ₫/vụ',
      'Nước uống tinh khiết 02 chai/người/ngày và nón du lịch cao cấp'
    ],
    exclusionsList: [
      'Chi phí cá nhân ngoài chương trình (Đồ uống minibar, giặt ủi, spa)',
      'Phụ thu phòng đơn (nếu yêu cầu ở 1 mình/phòng riêng)',
      'Tiền Bồi dưỡng (Tips) cho hướng dẫn viên và tài xế (tùy tâm)',
      'Hóa đơn thuế VAT (nếu có yêu cầu xuất hóa đơn công ty)'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
      { condition: 'Hủy từ 08 đến 14 ngày trước khởi hành', fee: 'Phí hủy 30% tổng giá trị tour' },
      { condition: 'Hủy từ 04 đến 07 ngày trước khởi hành', fee: 'Phí hủy 50% tổng giá trị tour' },
      { condition: 'Hủy dưới 03 ngày hoặc vắng mặt', fee: 'Phí hủy 100% tổng giá trị tour' }
    ],
    faqs: [
      { q: 'Tour đã bao gồm vé máy bay khứ hồi chưa?', a: 'Đã bao gồm 100% vé máy bay khứ hồi kèm hành lý ký gửi 23kg và xách tay 12kg của các hãng hàng không tiêu chuẩn (Vietnam Airlines / Bamboo Airways).' },
      { q: 'Phòng trên du thuyền có ban công riêng view biển không?', a: 'Có. Toàn bộ cabin tiêu chuẩn được bố trí ban công riêng hướng vịnh, cửa kính panorama view ngắm trọn cảnh biển đảo Hạ Long.' },
      { q: 'Người ăn chay hoặc có dị ứng thực phẩm có được phục vụ riêng không?', a: 'Có. Quý khách chỉ cần ghi chú trong form đặt tour, đầu bếp trên du thuyền và nhà hàng sẽ chuẩn bị thực đơn chay/kiêng riêng biệt chu đáo.' },
      { q: 'Đi 1 mình có phải chịu thêm phụ thu phòng đơn không?', a: 'Mặc định hệ thống sẽ hỗ trợ ghép phòng Twin với khách cùng giới trong đoàn không tính phí. Trường hợp muốn ở phòng riêng 1 mình, mức phụ thu là 800.000 ₫/đêm.' }
    ],
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Vietravel Signature',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    highlights: [
      'Trọn vẹn 1 đêm trải nghiệm Du Thuyền 5 Sao sang trọng giữa lòng di sản Vịnh Hạ Long',
      'Ngồi thuyền nan truyền thống luồn qua các hang động kỳ ảo tại Quần thể Tràng An (UNESCO)',
      'Viếng Chùa Bái Đính - Quần thể tâm linh lớn nhất Đông Nam Á với tượng Phật bằng đồng dát vàng',
      'Check-in Động Am Tiên (Tuyệt Tịnh Cốc) huyền bí nép mình giữa thung lũng đá vôi',
      'Khám phá chiều sâu ngàn năm văn hiến: Hoàng Thành Thăng Long & Văn Miếu Quốc Tử Giám',
      'Thưởng thức ẩm thực tinh hoa Bắc Bộ: Tiệc hải sản du thuyền, Dê núi Ninh Bình, Chả cá Lã Vọng'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Tp. Hồ Chí Minh – Hà Nội',
        meals: 'Ăn trưa, tối',
        mainActivity: 'Tham quan trung tâm Hà Nội',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
        imageCaption: 'Văn Miếu – Quốc Tử Giám Hà Nội',
        photos: [
          { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80', caption: 'Văn Miếu – Quốc Tử Giám' },
          { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80', caption: 'Hoàng Thành Thăng Long' },
          { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', caption: 'Dạo Phố Cổ 36 Phố Phường' }
        ],
        bulletPoints: [
          'Bay ra Hà Nội.',
          'Tham quan Hoàng thành Thăng Long, Văn Miếu – Quốc Tử Giám.',
          'Buổi tối tự do dạo phố cổ Hà Nội.',
          '<strong>Nghỉ đêm tại Hà Nội.</strong>'
        ],
        morning: 'Quý khách tập trung tại sân bay Tân Sơn Nhất, làm thủ tục đáp chuyến bay đi Hà Nội. Xe và HDV đón đoàn tại sân bay Nội Bài, đưa về trung tâm thành phố.',
        afternoon: 'Tham quan Hoàng Thành Thăng Long - Di sản văn hóa thế giới, tiếp tục viếng Văn Miếu - Quốc Tử Giám (Trường đại học đầu tiên của Việt Nam).',
        evening: 'Dùng bữa tối với đặc sản Chả cá Lã Vọng nức tiếng. Tự do dạo bộ ngắm Hồ Hoàn Kiếm, Cầu Thê Húc, khám phá chợ đêm phố cổ 36 Phố Phường. Nghỉ đêm tại khách sạn 4 sao Hà Nội.'
      },
      {
        day: 2,
        title: 'Hà Nội – Hạ Long – Ngủ đêm trên du thuyền',
        meals: 'Ăn sáng, trưa, tối',
        mainActivity: 'Trải nghiệm Du thuyền 5 Sao Vịnh Hạ Long',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
        imageCaption: 'Du Thuyền 5 Sao Vịnh Hạ Long',
        photos: [
          { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80', caption: 'Du Thuyền 5 Sao Vịnh Hạ Long' },
          { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', caption: 'Kỳ Quan Hang Sửng Sốt' },
          { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', caption: 'Chèo Thuyền Kayak & Đảo Ti Tốp' }
        ],
        bulletPoints: [
          'Khởi hành đi Hạ Long, lên Du thuyền 5 sao nhận phòng.',
          'Dùng bữa trưa buffet hải sản thượng hạng ngắm cảnh vịnh.',
          'Tham quan Hang Sửng Sốt, tắm biển và chèo kayak tại Đảo Ti Tốp.',
          'Tiệc Sunset Party hoàng hôn, lớp học làm nem cuốn truyền thống.',
          '<strong>Nghỉ đêm trên du thuyền 5 sao.</strong>'
        ],
        morning: 'Dùng buffet sáng tại khách sạn. Khởi hành đi Quảng Ninh qua cung đường cao tốc hiện đại. 11h30 đến bến Tuần Châu, làm thủ tục lên Du thuyền 5 Sao thưởng thức Welcome Drink.',
        afternoon: 'Dùng bữa trưa buffet hải sản thượng hạng trong lúc du thuyền lướt nhẹ qua Vịnh Bái Tử Long. Buổi chiều tham quan Hang Sửng Sốt - hang động đẹp và rộng nhất vịnh, sau đó tắm biển và leo đỉnh ngắm toàn cảnh Vịnh tại Đảo Ti Tốp.',
        evening: 'Tham gia tiệc Sunset Party ngắm hoàng hôn buông xuống mặt vịnh, tham gia lớp học làm món nem cuốn truyền thống. Dùng bữa tối lãng mạn trên du thuyền. Tối trải nghiệm câu mực đêm. Nghỉ đêm trên du thuyền 5 sao.'
      },
      {
        day: 3,
        title: 'Hạ Long – Ninh Bình',
        meals: 'Ăn sáng, trưa, tối',
        mainActivity: 'Khám phá Quần thể Tràng An & Tuyệt Tịnh Cốc',
        image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=600&q=80',
        imageCaption: 'Quần Thể Danh Thắng Tràng An',
        photos: [
          { url: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=600&q=80', caption: 'Thuyền Nan Danh Thắng Tràng An' },
          { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', caption: 'Tuyệt Tịnh Cốc - Động Am Tiên' },
          { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', caption: 'Ẩm Thực Dê Núi Ninh Bình' }
        ],
        bulletPoints: [
          'Tập Thái Cực Quyền đón bình minh trên boong tàu, chèo thuyền Kayak Hang Luồn.',
          'Di chuyển về Ninh Bình, ngồi thuyền nan khám phá Quần thể danh thắng Tràng An.',
          'Tham quan Tuyệt Tịnh Cốc (Động Am Tiên) nép mình giữa hồ nước xanh biếc.',
          'Thưởng thức đặc sản Dê núi Ninh Bình, dạo phố cổ Hoa Lư.',
          '<strong>Nghỉ đêm tại Ninh Bình.</strong>'
        ],
        morning: 'Đón bình minh tuyệt đẹp trên boong tàu với bài tập Thái Cực Quyền (Tai Chi) nhẹ nhàng. Chèo thuyền Kayak khám phá Hang Luồn. Làm thủ tục trả phòng, dùng bữa trưa sớm trước khi du thuyền cập bến.',
        afternoon: 'Xe đón đoàn khởi hành về Ninh Bình. Đến Quần thể danh thắng Tràng An, quý khách ngồi thuyền nan xuôi dòng sông Sào Khê trong vắt, len lỏi qua các hang động thạch nhũ kỳ bí và phim trường Kong: Skull Island. Tiếp tục tham quan Tuyệt Tịnh Cốc (Động Am Tiên).',
        evening: 'Thưởng thức bữa tối đặc sản Dê núi Ninh Bình, Cơm cháy sốt thịt dê, Rượu Kim Sơn. Tự do dạo chơi Phố Cổ Hoa Lư về đêm lung linh ánh đèn lồng. Nghỉ đêm tại resort/khách sạn 4 sao Ninh Bình.'
      },
      {
        day: 4,
        title: 'Ninh Bình – Nội Bài – Tp. Hồ Chí Minh',
        meals: 'Ăn sáng, trưa',
        mainActivity: 'Chiêm bái Chùa Bái Đính & Mua sắm đặc sản',
        image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=600&q=80',
        imageCaption: 'Quần Thể Chùa Bái Đính',
        photos: [
          { url: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=600&q=80', caption: 'Quần Thể Chùa Bái Đính' },
          { url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80', caption: 'Tượng Phật & Điện Tam Thế' },
          { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80', caption: 'Mua Sắm Đặc Sản Cơm Cháy' }
        ],
        bulletPoints: [
          'Đi xe điện tham quan Quần thể Chùa Bái Đính lớn nhất Đông Nam Á.',
          'Chiêm bái Hành lang 500 vị La Hán, Điện Tam Thế, Tượng Phật dát vàng.',
          'Mua sắm đặc sản Cơm cháy Ninh Bình, mắm tép Gia Viễn làm quà.',
          'Xe đưa đoàn ra sân bay Nội Bài, đáp chuyến bay trở về TP.HCM.',
          '<strong>Kết thúc chuyến đi.</strong>'
        ],
        morning: 'Dùng bữa sáng tại khách sạn. Xe điện đưa đoàn tham quan Quần thể Chùa Bái Đính - ngôi chùa nổi tiếng với nhiều kỷ lục châu Á (Hành lang 500 vị La Hán bằng đá xanh, tượng Phật Di Lặc bằng đồng lớn nhất).',
        afternoon: 'Dùng bữa trưa tại nhà hàng địa phương. Đoàn tự do mua sắm đặc sản mắm tép Gia Viễn, cơm cháy Ninh Bình làm quà cho người thân.',
        evening: 'Xe đưa quý khách về sân bay Quốc tế Nội Bài, HDV hỗ trợ làm thủ tục lên chuyến bay trở về TP.HCM (hoặc điểm xuất phát). Kết thúc chuyến hành trình di sản miền Bắc đáng nhớ!'
      }
    ]
  },
  {
    id: 'tour-sapa-02',
    code: 'WT-SP02',
    sku: 'NDSGN103',
    title: 'Khám Phá Sapa - Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Moana',
    shortTitle: 'Khám Phá Sapa - Chinh Phục Fansipan',
    destination: 'Sapa, Lào Cai',
    category: 'domestic',
    type: 'Khám Phá & Núi Cao',
    departureFrom: 'Hà Nội',
    seatsLeft: 5,
    departureSchedule: 'Thứ 6 hàng tuần',
    availableDates: ['12/09/2026', '19/09/2026', '26/09/2026', '10/10/2026', '24/10/2026'],
    departureDates: [
      { date: '12/09/2026', seats: 5, priceAdult: 3200000, priceChild: 2400000, priceToddler: 1600000, priceInfant: 500000, label: null },
      { date: '19/09/2026', seats: 2, priceAdult: 3450000, priceChild: 2587500, priceToddler: 1725000, priceInfant: 500000, label: '⚡ Cuối Tuần Cao Điểm' },
      { date: '26/09/2026', seats: 8, priceAdult: 2990000, priceChild: 2242500, priceToddler: 1495000, priceInfant: 500000, label: '🏷️ Early Bird Ưu Đãi' },
      { date: '10/10/2026', seats: 0, priceAdult: 3200000, priceChild: 2400000, priceToddler: 1600000, priceInfant: 500000, label: '❌ Đã Hết Chỗ' },
      { date: '24/10/2026', seats: 6, priceAdult: 3600000, priceChild: 2700000, priceToddler: 1800000, priceInfant: 500000, label: '🎉 Mùa Lúa Chín Sapa' }
    ],
    durationDays: 3,
    durationNights: 2,
    priceAdult: 3200000,
    priceChild: 2400000,
    priceToddler: 1600000,
    priceInfant: 500000,
    tier: 'standard',
    tierName: 'Dòng Tiêu Chuẩn',
    hotelTier: 'Khách Sạn 4★',
    starRating: 4,
    starCategory: 'standard',
    leiScore: '89/100 (Trekking Bản Cát Cát & Thưởng thức Lẩu cá Hồi Sapa)',
    esgScore: '86/100 (Thúc đẩy kinh tế cộng đồng người H’Mông & Dao Đỏ)',
    hotelSpecs: {
      hotelName: 'Pistachio Hotel Sapa 4★ (Hoặc tương đương)',
      roomType: 'Phòng Deluxe Mountain View (2 khách/phòng)',
      inclusions: ['Buffet sáng 50+ món', 'Bể bơi vô cực bốn mùa ngắm thung lũng Mường Hoa', 'Miễn phí phòng Gym']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=1200&q=85', title: 'Thung Lũng Mường Hoa Sapa' },
      { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85', title: 'Đỉnh Fansipan Nóc Nhà Đông Dương' }
    ],
    inclusionsList: [
      'Xe giường nằm cao cấp khứ hồi Hà Nội - Sapa máy lạnh',
      'Khách sạn 4 sao Pistachio Sapa (2 khách/phòng, ở trung tâm)',
      'Vé cáp treo Fansipan 3 dây hiện đại khứ hồi chinh phục Đỉnh núi',
      'Các bữa ăn chính đặc sản Sapa (Lẩu cá hồi, thắng cố, lợn mán)',
      'Vé tham quan Bản Cát Cát & Tổ hợp sống ảo Moana Sapa',
      'Hướng dẫn viên am hiểu văn hóa bản địa theo đoàn',
      'Bảo hiểm du lịch bảo vệ tối đa 50.000.000 ₫/vụ'
    ],
    exclusionsList: [
      'Vé tàu hỏa leo núi Mường Hoa & Tàu đỉnh Fansipan',
      'Chi phí mua sắm cá nhân, đồ uống ngoài thực đơn',
      'Phụ thu phòng đơn riêng'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
      { condition: 'Hủy từ 08 đến 14 ngày', fee: 'Phí hủy 30% giá tour' },
      { condition: 'Hủy dưới 07 ngày', fee: 'Phí hủy 100% giá tour' }
    ],
    faqs: [
      { q: 'Cáp treo Fansipan có an toàn cho người cao tuổi không?', a: 'Hệ thống cáp treo Fansipan 3 dây đạt chuẩn an toàn quốc tế, vận hành rất êm ái, phù hợp cho cả trẻ nhỏ và người cao tuổi.' }
    ],
    rating: 4.8,
    reviewsCount: 95,
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=800&q=80',
    highlights: ['Đi Cáp treo Fansipan 3 dây hiện đại', 'Check-in Bản Cát Cát', 'Thưởng thức Lẩu cá Hồi & Thắng cố'],
    itinerary: [
      { day: 1, title: 'Hà Nội - Sapa - Bản Cát Cát', morning: 'Xe đưa đoàn lên Sapa.', afternoon: 'Trekking bản Cát Cát.', evening: 'Thưởng thức ẩm thực Sapa, chợ đêm.', activities: 'Di chuyển lên Sapa, thăm bản Cát Cát.' },
      { day: 2, title: 'Chinh phục Đỉnh Fansipan 3.143m', morning: 'Cáp treo lên đỉnh Fansipan.', afternoon: 'Ngắm thung lũng Mường Hoa.', evening: 'Tự do dạo thị trấn Sapa.', activities: 'Chinh phục Fansipan, ngắm cảnh núi rừng.' },
      { day: 3, title: 'Moana Sapa - Hà Nội', morning: 'Check-in Moana.', afternoon: 'Mua sắm đặc sản.', evening: 'Xe đưa về lại Hà Nội.', activities: 'Check-in Moana và trở về Hà Nội.' }
    ]
  },
  {
    id: 'tour-phuquoc-03',
    code: 'WT-PQ03',
    sku: 'NDSGN104',
    title: 'Thiên Đường Biển Đảo Phú Quốc - Cáp Treo Hòn Thơm - Cano 4 Đảo',
    shortTitle: 'Thiên Đường Nghỉ Dưỡng Phú Quốc 5★',
    destination: 'Phú Quốc, Kiên Giang',
    category: 'domestic',
    type: 'Nghỉ Dưỡng Biển Đảo',
    departureFrom: 'TP.HCM / Hà Nội',
    seatsLeft: 2,
    departureSchedule: 'Thứ 4 & Thứ 7 hàng tuần',
    availableDates: ['15/09/2026', '22/09/2026', '29/09/2026', '14/10/2026', '28/10/2026'],
    departureDates: [
      { date: '15/09/2026', seats: 2, priceAdult: 5800000, priceChild: 4350000, priceToddler: 2900000, priceInfant: 500000, label: '⚡ Sắp Hết Chỗ' },
      { date: '22/09/2026', seats: 7, priceAdult: 5490000, priceChild: 4117500, priceToddler: 2745000, priceInfant: 500000, label: '🏷️ Early Bird -5%' },
      { date: '29/09/2026', seats: 8, priceAdult: 5800000, priceChild: 4350000, priceToddler: 2900000, priceInfant: 500000, label: null },
      { date: '14/10/2026', seats: 0, priceAdult: 5800000, priceChild: 4350000, priceToddler: 2900000, priceInfant: 500000, label: '❌ Đã Hết Chỗ' },
      { date: '28/10/2026', seats: 6, priceAdult: 6390000, priceChild: 4792500, priceToddler: 3195000, priceInfant: 500000, label: '🎉 Mùa Biển Đẹp Nhất' }
    ],
    durationDays: 4,
    durationNights: 3,
    priceAdult: 5800000,
    priceChild: 4350000,
    priceToddler: 2900000,
    priceInfant: 500000,
    tier: 'luxury',
    tierName: 'Dòng Cao Cấp',
    hotelTier: 'Vinpearl Resort 5★',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '95/100 (Cáp treo Hòn Thơm & Cano lặn ngắm san hô 4 đảo)',
    esgScore: '90/100 (Bảo tồn rạn san hô tự nhiên đảo Mây Rút)',
    hotelSpecs: {
      hotelName: 'Vinpearl Resort & Spa Phú Quốc 5★ (Hoặc tương đương)',
      roomType: 'Phòng Deluxe Ocean Front (2 khách/phòng)',
      inclusions: ['Buffet sáng quốc tế trọn gói', 'Bãi biển riêng & Bể bơi bãi biển 5.000m²', 'Xe điện đưa đón VinWonders']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=85', title: 'Bãi Biển Phú Quốc Xanh Mát' }
    ],
    inclusionsList: [
      'Khách sạn Vinpearl Resort 5 sao cao cấp (2 khách/phòng)',
      'Vé cáp treo vượt biển Sun World Hòn Thơm & Công viên nước Aquatopia',
      'Tour Cano 4 Đảo lặn ngắm san hô tự nhiên + Quay Sup Flycam',
      'Các bữa ăn chính buffet & đặc sản hải sản biển đảo',
      'Xe điện nội khu đưa đón Grand World & Chợ đêm',
      'Hướng dẫn viên chuyên nghiệp & Bảo hiểm du lịch 100.000.000 ₫'
    ],
    exclusionsList: [
      'Vé máy bay khứ hồi (Tùy chọn đại lý đặt hộ trong phần ngân sách)',
      'Vé VinWonders & Vinpearl Safari',
      'Chi phí giặt ủi và chi tiêu cá nhân'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
      { condition: 'Hủy từ 08 đến 14 ngày', fee: 'Phí hủy 30% giá tour' },
      { condition: 'Hủy dưới 07 ngày', fee: 'Phí hủy 100% giá tour' }
    ],
    faqs: [
      { q: 'Tour cano có kèm kính lặn và áo phao không?', a: 'Đã bao gồm trọn gói áo phao cao cấp, kính lặn chuyên dụng và hướng dẫn viên lặn kèm bảo hiểm an toàn.' }
    ],
    rating: 4.9,
    reviewsCount: 164,
    badge: 'Relaxation',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    highlights: ['Cáp treo vượt biển dài nhất thế giới', 'Cano lặn ngắm san hô 4 đảo', 'Check-in Sunset Sanato'],
    itinerary: [
      { day: 1, title: 'TP.HCM / Hà Nội - Phú Quốc - Grand World', morning: 'Đáp chuyến bay đến Phú Quốc.', afternoon: 'Dạo chơi Grand World.', evening: 'Xem show Tinh hoa Việt Nam.', activities: 'Nhận phòng, dạo Grand World.' },
      { day: 2, title: 'Tour Cano 4 Đảo - Lặn Ngắm San Hô', morning: 'Cano ra đảo Mây Rút, Móng Tay.', afternoon: 'Lặn ngắm san hô, chụp ảnh flycam.', evening: 'Thưởng thức hải sản Hàm Ninh.', activities: 'Cano 4 đảo, lặn san hô.' },
      { day: 3, title: 'Sun World Hòn Thơm - Thị Trấn Địa Trung Hải', morning: 'Cáp treo Hòn Thơm.', afternoon: 'Vui chơi công viên nước.', evening: 'Ngắm hoàng hôn Cầu Hôn Kiss Bridge.', activities: 'Cáp treo Hòn Thơm, Cầu Hôn.' },
      { day: 4, title: 'Chợ Đêm Phú Quốc - Tạm Biệt Phú Quốc', morning: 'Tắm biển Bãi Sao.', afternoon: 'Mua đặc sản rượu sim, hồ tiêu.', evening: 'Ra sân bay về lại điểm xuất phát.', activities: 'Mua sắm đặc sản và ra sân bay.' }
    ]
  },
  {
    id: 'tour-japan-04',
    code: 'WT-JP04',
    sku: 'NDSGN105',
    title: 'Tour Nhật Bản: Tokyo - Mount Fuji - Kyoto - Osaka Mùa Thu',
    shortTitle: 'Tour Nhật Bản Cung Đường Vàng',
    destination: 'Nhật Bản (Tokyo - Phú Sĩ - Kyoto - Osaka)',
    category: 'international',
    type: 'Văn Hóa & Cảnh Quan',
    departureFrom: 'Hà Nội / TP.HCM',
    seatsLeft: 4,
    departureSchedule: 'Khởi hành ngày 15 & 28 hàng tháng',
    availableDates: ['15/09/2026', '28/09/2026', '15/10/2026', '28/10/2026'],
    departureDates: [
      { date: '15/09/2026', seats: 4, priceAdult: 31900000, priceChild: 23925000, priceToddler: 15950000, priceInfant: 500000, label: null },
      { date: '28/09/2026', seats: 2, priceAdult: 33500000, priceChild: 25125000, priceToddler: 16750000, priceInfant: 500000, label: '⚡ Gần Hết Chỗ' },
      { date: '15/10/2026', seats: 6, priceAdult: 30900000, priceChild: 23175000, priceToddler: 15450000, priceInfant: 500000, label: '🏷️ Đặt Sớm Tiết Kiệm' },
      { date: '28/10/2026', seats: 0, priceAdult: 34900000, priceChild: 26175000, priceToddler: 17450000, priceInfant: 500000, label: '🍁 Cao Điểm Lá Đỏ' }
    ],
    durationDays: 6,
    durationNights: 5,
    priceAdult: 31900000,
    priceChild: 23925000,
    priceToddler: 15950000,
    priceInfant: 500000,
    tier: 'standard',
    tierName: 'Dòng Tiêu Chuẩn',
    hotelTier: 'Khách Sạn 4★ & Onsen',
    starRating: 4,
    starCategory: 'standard',
    leiScore: '96/100 (Tắm Onsen Núi Phú Sĩ & Trải nghiệm Tàu Shinkansen)',
    esgScore: '94/100 (Giao thông xanh chuẩn Nhật Bản)',
    hotelSpecs: {
      hotelName: 'Khách sạn Daiwa Roynet Tokyo 4★ & Onsen Resort Phú Sĩ',
      roomType: 'Phòng Standard Twin/Double (2 khách/phòng)',
      inclusions: ['Buffet sáng kiểu Nhật & Á', 'Tắm Onsen khoáng nóng tự nhiên Núi Phú Sĩ', 'Miễn phí Wifi & Trà đạo']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85', title: 'Cổng Đền Fushimi Inari Kyoto' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi thẳng hàng không 4-5 sao (Vietnam Airlines / ANA)',
      'Khách sạn 4 sao tiêu chuẩn Nhật Bản (2 khách/phòng)',
      'Trải nghiệm Tàu siêu tốc Shinkansen 300km/h',
      'Đêm trải nghiệm Tắm khoáng nóng Onsen truyền thống Núi Phú Sĩ',
      'Toàn bộ các bữa ăn theo chương trình (Lẩu Shabu Shabu, Bò Wagyu, Sushi)',
      'Thủ tục Visa nhập cảnh Nhật Bản trọn gói',
      'Bảo hiểm du lịch quốc tế bảo vệ tối đa 1.000.000.000 ₫'
    ],
    exclusionsList: [
      'Hộ chiếu còn hạn trên 6 tháng',
      'Tiền Tips cho HDV và tài xế địa phương (7 USD/người/ngày)',
      'Chi phí mua sắm cá nhân tại các trung tâm thương mại'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 30 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
      { condition: 'Hủy từ 15 đến 29 ngày', fee: 'Phí hủy 50% giá tour' },
      { condition: 'Hủy dưới 15 ngày', fee: 'Phí hủy 100% giá tour' }
    ],
    faqs: [
      { q: 'Thủ tục visa Nhật Bản có khó không?', a: 'Đại lý hỗ trợ trọn gói hồ sơ thủ tục visa du lịch Nhật Bản với tỷ lệ đạt trên 99%.' }
    ],
    rating: 4.95,
    reviewsCount: 210,
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    highlights: ['Trải nghiệm Tàu Shinkansen siêu tốc', 'Tắm Onsen khoáng nóng Núi Phú Sĩ', 'Ghé thăm Cổng Torii Fushimi Inari'],
    itinerary: [
      { day: 1, title: 'TP.HCM / Hà Nội - Tokyo', morning: 'Đáp chuyến bay đi Tokyo.', afternoon: 'Nhận phòng khách sạn.', evening: 'Dạo phố Shibuya.', activities: 'Bay đến Tokyo, ngắm ngã tư Shibuya.' },
      { day: 2, title: 'Tokyo City Tour - Núi Phú Sĩ', morning: 'Thăm Chùa Asakusa Kannon.', afternoon: 'Di chuyển đi Phú Sĩ.', evening: 'Trải nghiệm tắm khoáng nóng Onsen.', activities: 'City tour Tokyo và tắm Onsen.' },
      { day: 3, title: 'Núi Phú Sĩ - Làng Cổ Oshino Hakkai', morning: 'Check-in Trạm số 5 Phú Sĩ.', afternoon: 'Thăm làng cổ Oshino Hakkai.', evening: 'Tàu Shinkansen đến Nagoya.', activities: 'Khám phá Phú Sĩ và tàu Shinkansen.' },
      { day: 4, title: 'Kyoto - Cố Đô Ngàn Năm', morning: 'Thăm Rừng trúc Arashiyama.', afternoon: 'Viếng Đền Fushimi Inari.', evening: 'Dạo phố cổ Gion Kyoto.', activities: 'Khám phá cố đô Kyoto.' },
      { day: 5, title: 'Osaka - Lâu Đài Osaka - Dotonbori', morning: 'Thăm Lâu đài Osaka.', afternoon: 'Mua sắm Shinsaibashi.', evening: 'Ẩm thực phố Dotonbori.', activities: 'Thăm Lâu đài Osaka và Dotonbori.' },
      { day: 6, title: 'Osaka - Việt Nam', morning: 'Mua sắm Rinku Outlet.', afternoon: 'Ra sân bay Kansai.', evening: 'Đáp chuyến bay về Việt Nam.', activities: 'Mua sắm và về nước.' }
    ]
  },
  {
    id: 'tour-thailand-05',
    code: 'WT-TH05',
    sku: 'NDSGN106',
    title: 'Tour Thái Lan: Bangkok - Pattaya - Đảo Coral - Show Alcazar',
    shortTitle: 'Khám Phá Xứ Sở Chùa Vàng Thái Lan',
    destination: 'Thái Lan (Bangkok - Pattaya)',
    category: 'international',
    type: 'Tiết Kiệm & Trải Nghiệm',
    departureFrom: 'TP.HCM / Hà Nội',
    seatsLeft: 8,
    departureSchedule: 'Thứ 4 hàng tuần',
    availableDates: ['10/09/2026', '17/09/2026', '24/09/2026', '08/10/2026', '22/10/2026'],
    departureDates: [
      { date: '10/09/2026', seats: 8, priceAdult: 7990000, priceChild: 5992500, priceToddler: 3995000, priceInfant: 500000, label: null },
      { date: '17/09/2026', seats: 3, priceAdult: 7590000, priceChild: 5692500, priceToddler: 3795000, priceInfant: 500000, label: '🏷️ Flash Deal Giảm Sâu' },
      { date: '24/09/2026', seats: 2, priceAdult: 8290000, priceChild: 6217500, priceToddler: 4145000, priceInfant: 500000, label: '⚡ Cuối Tuần' },
      { date: '08/10/2026', seats: 0, priceAdult: 7990000, priceChild: 5992500, priceToddler: 3995000, priceInfant: 500000, label: '❌ Đã Hết Chỗ' },
      { date: '22/10/2026', seats: 6, priceAdult: 8690000, priceChild: 6517500, priceToddler: 4345000, priceInfant: 500000, label: '🎉 Lễ Hội Loy Krathong' }
    ],
    durationDays: 5,
    durationNights: 4,
    priceAdult: 7990000,
    priceChild: 5992500,
    priceToddler: 3995000,
    priceInfant: 500000,
    tier: 'budget',
    tierName: 'Dòng Tiết Kiệm',
    hotelTier: 'Khách Sạn 3★',
    starRating: 3,
    starCategory: 'budget',
    leiScore: '87/100 (Dạo thuyền Sông Chao Phraya & Xem Alcazar Show)',
    esgScore: '82/100 (Du lịch biển đảo bảo vệ môi trường)',
    hotelSpecs: {
      hotelName: 'Khách sạn Bangkok Centre 3★ & Pattaya Sea View 3★',
      roomType: 'Phòng Standard City View (2 khách/phòng)',
      inclusions: ['Buffet sáng hàng ngày', 'Xe đưa đón máy lạnh đời mới', 'Hướng dẫn viên tiếng Việt suốt tuyến']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=85', title: 'Chùa Phật Vàng Bangkok' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi bao gồm hành lý xách tay & ký gửi',
      'Khách sạn 3-4 sao tiêu chuẩn trung tâm Bangkok & Pattaya',
      'Tàu cao tốc ra Đảo Coral tắm biển & Thưởng thức buffet lẩu Suki',
      'Vé xem Đại nhạc hội Alcazar Show hoành tráng',
      'Vé dạo thuyền trên dòng sông Chao Phraya ngắm cá nổi',
      'Hướng dẫn viên tiếng Việt chu đáo phục vụ đoàn suốt tuyến',
      'Bảo hiểm du lịch quốc tế bảo vệ 200.000.000 ₫'
    ],
    exclusionsList: [
      'Tiền Bồi dưỡng (Tips) bắt buộc cho HDV & Lái xe Thái Lan (5 USD/ngày)',
      'Phụ thu phòng đơn',
      'Chi phí mua sắm cá nhân tại IconSiam & King Power'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 20 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
      { condition: 'Hủy từ 10 đến 19 ngày', fee: 'Phí hủy 50% giá tour' },
      { condition: 'Hủy dưới 10 ngày', fee: 'Phí hủy 100% giá tour' }
    ],
    faqs: [
      { q: 'Đi Thái Lan có cần xin visa trước không?', a: 'Khách mang hộ chiếu Việt Nam được miễn thị thực (visa) nhập cảnh Thái Lan tối đa 30 ngày.' }
    ],
    rating: 4.75,
    reviewsCount: 180,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    highlights: ['Dạo thuyền trên dòng sông Chao Phraya', 'Vui chơi biển Đảo Coral Pattaya', 'Show Alcazar hoành tráng'],
    itinerary: [
      { day: 1, title: 'Việt Nam - Bangkok - Pattaya', morning: 'Đáp sân bay Suvarnabhumi.', afternoon: 'Di chuyển đi Pattaya.', evening: 'Thăm Chợ nổi 4 miền.', activities: 'Đến Bangkok, đi Pattaya.' },
      { day: 2, title: 'Đảo Coral - Núi Phật Vàng Khao Chi Chan', morning: 'Tàu cao tốc ra Đảo Coral.', afternoon: 'Thăm Núi Phật Vàng 24k.', evening: 'Xem Alcazar Show.', activities: 'Đảo Coral, Alcazar Show.' },
      { day: 3, title: 'Pattaya - Bangkok - Chùa Phật Vàng', morning: 'Về lại Bangkok.', afternoon: 'Viếng Chùa Wat Traimit.', evening: 'Thuyền sông Chao Phraya.', activities: 'Viếng Chùa Vàng, dạo sông.' },
      { day: 4, title: 'Shopping IconSiam - Show Nhạc Nước', morning: 'Thăm trại rắn hoàng gia.', afternoon: 'Mua sắm tại IconSiam.', evening: 'Xem nhạc nước hoành tráng.', activities: 'Shopping IconSiam.' },
      { day: 5, title: 'Bangkok - Việt Nam', morning: 'Mua sắm King Power.', afternoon: 'Ra sân bay Suvarnabhumi.', evening: 'Về lại Việt Nam.', activities: 'Mua sắm và về nước.' }
    ]
  }
];
