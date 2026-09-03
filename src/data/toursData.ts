import { Tour } from '../types/tour.types';

/**
 * Danh Sách Tour Du Lịch Dự Phòng (Fallback Seed Data)
 * Đảm bảo hệ thống luôn tìm kiếm và hiển thị dữ liệu mượt mà kể cả khi mạng chậm.
 */
export const TOURS_DATA: Tour[] = [
  {
    id: 'tour-01',
    code: 'WT-HALONG-3N2D-01',
    sku: 'WT1001',
    slug: 'kham-pha-di-san-ha-long-du-thuyen-5-sao',
    title: 'Khám Phá Di Sản Hạ Long - Du Thuyền 5 Sao Ambassador Signature',
    shortTitle: 'Hà Nội - Du Thuyền Hạ Long 5★',
    destination: 'Hạ Long',
    category: 'domestic',
    travelStyle: 'package',
    theme: 'beach',
    type: 'Nghỉ Dưỡng & Du Thuyền 5★',
    departureFrom: 'Hà Nội',
    seatsLeft: 12,
    departureSchedule: 'Thứ 3 & Thứ 7 hàng tuần',
    availableDates: ['15/09/2026', '22/09/2026', '29/09/2026', '05/10/2026'],
    departureDates: [
      { date: '2026-09-15', seats: 12, priceAdult: 4590000, priceChild: 3442500, priceToddler: 2295000, priceInfant: 500000, singleRoomSurcharge: 1500000, label: 'Chuyến Gần Nhất' },
      { date: '2026-09-22', seats: 8, priceAdult: 4590000, priceChild: 3442500, priceToddler: 2295000, priceInfant: 500000, singleRoomSurcharge: 1500000, label: null },
      { date: '2026-09-29', seats: 4, priceAdult: 4890000, priceChild: 3667500, priceToddler: 2445000, priceInfant: 500000, singleRoomSurcharge: 1500000, label: 'Sắp Hết Chỗ' },
      { date: '2026-10-05', seats: 15, priceAdult: 4590000, priceChild: 3442500, priceToddler: 2295000, priceInfant: 500000, singleRoomSurcharge: 1500000, label: null }
    ],
    durationDays: 3,
    durationNights: 2,
    priceAdult: 4590000,
    priceChild: 3442500,
    priceToddler: 2295000,
    priceInfant: 500000,
    singleRoomSurcharge: 1500000,
    originalPrice: 5990000,
    discountPercent: 23,
    isFlashSale: true,
    tier: 'luxury',
    tierName: 'Dòng Luxury 5 Sao',
    hotelTier: 'Du Thuyền 5★',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '88/100',
    esgScore: '92/100',
    hotelSpecs: {
      hotelName: 'Du Thuyền 5 Sao Ambassador Signature',
      roomType: 'Deluxe Balcony Cabin (Ban công riêng ngắm vịnh)',
      inclusions: ['Bể sục Jacuzzi bốn mùa ngoài trời', 'Buffet hải sản tôm hùm thượng hạng', 'Phòng tập Gym & Spa view biển', 'Trà chiều Hoàng Hôn phong cách Âu']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', title: 'Du thuyền 5★ Ambassador' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', title: 'Vịnh di sản Hạ Long' },
      { url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80', title: 'Bình minh trên biển' }
    ],
    inclusionsList: [
      'Xe Limousine 9 chỗ đưa đón khứ hồi Hà Nội - Hạ Long',
      '2 đêm nghỉ phòng Deluxe Balcony trên Du thuyền 5 sao',
      'Toàn bộ 05 bữa ăn thượng hạng theo chương trình (có Buffet tôm hùm)',
      'Vé tham quan các danh thắng và phí bảo hiểm du lịch 100.000.000đ/vụ',
      'Thuyền Kayak và dụng cụ câu mực đêm'
    ],
    exclusionsList: [
      'Chi phí đồ uống cá nhân ngoài thực đơn',
      'Dịch vụ Spa & Massage trên du thuyền',
      'Tiền tip cho hướng dẫn viên và thủy thủ đoàn (tùy tâm)'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Hoàn 100% tiền vé (Miễn phí hủy)' },
      { condition: 'Hủy từ 07 đến 14 ngày trước khởi hành', fee: 'Phí hủy 25% giá tour' },
      { condition: 'Hủy từ 03 đến 06 ngày trước khởi hành', fee: 'Phí hủy 50% giá tour' },
      { condition: 'Hủy dưới 72 giờ trước khởi hành', fee: 'Không hoàn tiền (100% phí)' }
    ],
    faqs: [
      { q: 'Trẻ em 3 tuổi có được miễn phí không?', a: 'Trẻ dưới 5 tuổi được miễn phí vé tour cơ bản, phụ thu vé tham quan vịnh và bảo hiểm là 500.000đ, ngủ chung giường với bố mẹ.' },
      { q: 'Đi du thuyền có bị say sóng không?', a: 'Du thuyền 5 sao có tải trọng lớn và trang bị hệ thống cân bằng điện tử hiện đại, chạy trong vùng vịnh kín gió nên lướt rất êm ái, hoàn toàn không say sóng.' }
    ],
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Bán Chạy Nhất',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      'Trải nghiệm nghỉ đêm trên du thuyền chuẩn 5 sao sang trọng nhất Vịnh Hạ Long',
      'Thưởng thức đại tiệc Buffet tôm hùm không giới hạn cùng nhạc sống Acoustic',
      'Chèo thuyền Kayak khám phá Hang Sửng Sốt và Đảo Ti Tốp tuyệt mỹ',
      'Xe Limousine VIP đưa đón tận nơi từ trung tâm Hà Nội'
    ],
    itinerary: [
      { day: 1, title: 'Hà Nội - Vịnh Hạ Long - Check-in Du Thuyền 5★ Ambassador', meals: 'Trưa, Tối', hotel: 'Du Thuyền Ambassador 5★', activities: '08:00 Xe Limousine đón quý khách tại Hà Nội khởi hành đi Hạ Long. 12:00 Làm thủ tục check-in lên du thuyền, thưởng thức đồ uống chào mừng. 13:00 Dùng bữa trưa buffet hải sản thượng hạng trong lúc du thuyền lướt qua Hòn Trống Mái. Chiều chèo kayak tại Hang Luồn và tắm biển tại Đảo Ti Tốp.' },
      { day: 2, title: 'Khám Phá Hang Sửng Sốt - Làng Chài Cửa Vạn - Hoàng Hôn Vịnh', meals: 'Sáng, Trưa, Tối', hotel: 'Du Thuyền Ambassador 5★', activities: '06:30 Tập Thái Cực Quyền (Taichi) đón bình minh trên boong tàu. 08:00 Thăm Hang Sửng Sốt - hang động rộng và đẹp nhất vịnh. Chiều tham quan làng ngọc trai và trải nghiệm lớp học nấu món ăn truyền thống Việt Nam.' },
      { day: 3, title: 'Chào Bình Minh Vịnh Di Sản - Trở Về Hà Nội', meals: 'Sáng, Trưa nhẹ', hotel: 'Kết thúc tour', activities: '07:00 Ăn sáng nhẹ ngắm bình minh. 09:30 Làm thủ tục trả phòng và thưởng thức bữa trưa sớm trên tàu. 11:30 Cập bến Tuần Châu, xe đưa đoàn về lại điểm hẹn tại Hà Nội.' }
    ],
    isAllInclusive: true,
    status: 'published',
    isActive: true
  },
  {
    id: 'tour-02',
    code: 'WT-SAPA-3N2D-02',
    sku: 'WT1002',
    slug: 'tuyet-tac-mua-lua-chin-sapa-dinh-thieng-fansipan',
    title: 'Tuyệt Tác Mùa Lúa Chín Sapa - Đỉnh Thiêng Fansipan 5 Sao Hotel de la Coupole',
    shortTitle: 'Hà Nội - Sapa - Fansipan 5★',
    destination: 'Sapa',
    category: 'domestic',
    travelStyle: 'package',
    theme: 'heritage',
    type: 'Văn Hóa & Nghỉ Dưỡng 5★',
    departureFrom: 'Hà Nội',
    seatsLeft: 18,
    departureSchedule: 'Thứ 6 hàng tuần',
    availableDates: ['18/09/2026', '25/09/2026', '02/10/2026'],
    departureDates: [
      { date: '2026-09-18', seats: 18, priceAdult: 3890000, priceChild: 2917500, priceToddler: 1945000, priceInfant: 400000, singleRoomSurcharge: 1200000, label: 'Chuyến Gần Nhất' },
      { date: '2026-09-25', seats: 10, priceAdult: 3890000, priceChild: 2917500, priceToddler: 1945000, priceInfant: 400000, singleRoomSurcharge: 1200000, label: null },
      { date: '2026-10-02', seats: 15, priceAdult: 3890000, priceChild: 2917500, priceToddler: 1945000, priceInfant: 400000, singleRoomSurcharge: 1200000, label: null }
    ],
    durationDays: 3,
    durationNights: 2,
    priceAdult: 3890000,
    priceChild: 2917500,
    priceToddler: 1945000,
    priceInfant: 400000,
    singleRoomSurcharge: 1200000,
    originalPrice: 4990000,
    discountPercent: 22,
    isFlashSale: false,
    tier: 'luxury',
    tierName: 'Dòng Luxury 5 Sao',
    hotelTier: 'Hotel de la Coupole 5★',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '95/100',
    esgScore: '88/100',
    hotelSpecs: {
      hotelName: 'Hotel de la Coupole - MGallery Sapa',
      roomType: 'Classic Room View Thung Lũng Mường Hoa',
      inclusions: ['Hồ bơi nước ấm Le Grand Bassin lộng lẫy', 'Bữa sáng Buffet chuẩn Pháp thượng hạng', 'Vị trí đối diện ga tàu hỏa leo núi Mường Hoa']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80', title: 'Ruộng bậc thang Sapa' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', title: 'Đỉnh Fansipan' }
    ],
    inclusionsList: [
      'Xe Universe du lịch cao cấp đưa đón khứ hồi Hà Nội - Sapa',
      '2 đêm nghỉ khách sạn 5 sao MGallery chuẩn quốc tế',
      'Vé cáp treo Fansipan khứ hồi + Tàu hỏa leo núi Mường Hoa',
      'Các bữa ăn đặc sản Tây Bắc theo chương trình',
      'Bảo hiểm du lịch mức đền bù tối đa 100.000.000đ'
    ],
    exclusionsList: [
      'Vé tàu hỏa lên đỉnh Fansipan chặng cuối',
      'Đồ uống phát sinh trong bữa ăn',
      'Chi phí tắm lá thuốc người Dao Đỏ'
    ],
    refundPolicy: [
      { condition: 'Hủy trước 10 ngày khởi hành', fee: 'Hoàn 100% tiền vé' },
      { condition: 'Hủy từ 05 đến 09 ngày trước khởi hành', fee: 'Phí hủy 30% giá tour' },
      { condition: 'Hủy dưới 05 ngày trước khởi hành', fee: 'Không hoàn tiền (100% phí)' }
    ],
    faqs: [
      { q: 'Thời tiết Sapa mùa lúa chín thế nào?', a: 'Mùa lúa chín từ tháng 9 - 10 thời tiết se lạnh nhẹ ban đêm và nắng vàng ấm áp ban ngày, rất lý tưởng để săn ảnh và ngắm cảnh.' }
    ],
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Nổi Bật',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      'Chinh phục Nóc Nhà Đông Dương Fansipan bằng cáp treo 3 dây kỷ lục thế giới',
      'Nghỉ dưỡng 5 sao đẳng cấp quốc tế tại kiệt tác kiến trúc Pháp MGallery',
      'Check-in Thung Lũng Mường Hoa và Bản Cát Cát rực rỡ sắc màu thổ cẩm'
    ],
    itinerary: [
      { day: 1, title: 'Hà Nội - Cao Tốc Lào Cai - Sapa - Bản Cát Cát', meals: 'Trưa, Tối', hotel: 'Hotel de la Coupole 5★', activities: '06:30 Khởi hành từ Hà Nội theo cao tốc Nội Bài - Lào Cai. 12:30 Tới Sapa, dùng bữa trưa đặc sản vùng cao. Chiều dạo bước thăm Bản Cát Cát, ngắm guồng nước và suối Mường Hoa.' },
      { day: 2, title: 'Chinh Phục Đỉnh Thiêng Fansipan - Đèo Ô Quy Hồ - Cầu Kính Rồng Mây', meals: 'Sáng, Trưa, Tối', hotel: 'Hotel de la Coupole 5★', activities: 'Sáng trải nghiệm tàu hỏa leo núi Mường Hoa và cáp treo lên đỉnh Fansipan (3.143m). Chiều ngắm hoàng hôn rực rỡ tại Đèo Ô Quy Hồ - một trong Tứ Đại Đỉnh Đèo.' },
      { day: 3, title: 'Check-in Nhà Thờ Đá Sapa - Mua Sắm Đặc Sản - Hà Nội', meals: 'Sáng, Trưa', hotel: 'Kết thúc tour', activities: 'Dùng điểm tâm buffet tại khách sạn, tự do mua sắm hạt dẻ, mật ong rừng, thịt trâu gác bếp. 13:30 Lên xe về lại Hà Nội, kết thúc chuyến đi.' }
    ],
    isAllInclusive: true,
    status: 'published',
    isActive: true
  },
  {
    id: 'tour-03',
    code: 'WT-JAPAN-6N5D-03',
    sku: 'WT1003',
    slug: 'cung-duong-vang-nhat-ban-tokyo-phu-si-kyoto-osaka',
    title: 'Cung Đường Vàng Nhật Bản: Tokyo - Núi Phú Sĩ - Kyoto - Osaka 6N5Đ',
    shortTitle: 'Nhật Bản 6N5Đ Cung Đường Vàng',
    destination: 'Nhật Bản',
    category: 'international',
    travelStyle: 'package',
    theme: 'heritage',
    type: 'Tour Quốc Tế Cao Cấp',
    departureFrom: 'Hà Nội / TP.HCM',
    seatsLeft: 10,
    departureSchedule: 'Thứ 7 hàng tuần',
    availableDates: ['10/10/2026', '24/10/2026', '15/11/2026'],
    departureDates: [
      { date: '2026-10-10', seats: 10, priceAdult: 28900000, priceChild: 24565000, priceToddler: 17340000, priceInfant: 3000000, singleRoomSurcharge: 6000000, label: 'Chuyến Gần Nhất' },
      { date: '2026-10-24', seats: 6, priceAdult: 28900000, priceChild: 24565000, priceToddler: 17340000, priceInfant: 3000000, singleRoomSurcharge: 6000000, label: 'Sắp Hết Chỗ' },
      { date: '2026-11-15', seats: 12, priceAdult: 29900000, priceChild: 25415000, priceToddler: 17940000, priceInfant: 3000000, singleRoomSurcharge: 6000000, label: null }
    ],
    durationDays: 6,
    durationNights: 5,
    priceAdult: 28900000,
    priceChild: 24565000,
    priceToddler: 17340000,
    priceInfant: 3000000,
    singleRoomSurcharge: 6000000,
    originalPrice: 32900000,
    discountPercent: 12,
    isFlashSale: true,
    tier: 'luxury',
    tierName: 'Dòng Luxury 5 Sao',
    hotelTier: 'Khách sạn 4-5★ Nhật Bản',
    starRating: 5,
    starCategory: 'luxury',
    leiScore: '98/100',
    esgScore: '95/100',
    hotelSpecs: {
      hotelName: 'Hệ thống khách sạn 4-5 sao Tokyo, Kyoto & Onsen Resort Phú Sĩ',
      roomType: 'Twin / Double Standard Room',
      inclusions: ['Trải nghiệm tắm suối khoáng nóng Onsen truyền thống', 'Thưởng thức bò Kobe nướng teppanyaki trứ danh']
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', title: 'Tokyo Skytree' },
      { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', title: 'Núi Phú Sĩ' }
    ],
    inclusionsList: [
      'Vé máy bay khứ hồi Vietnam Airlines bao gồm 46kg hành lý ký gửi',
      'Khách sạn 4 sao tiêu chuẩn Nhật Bản (2 người/phòng)',
      'Phí làm Visa nhập cảnh Nhật Bản trọn gói',
      'Vé tàu siêu tốc Shinkansen 1 chặng',
      'Toàn bộ bữa ăn chất lượng theo lịch trình gồm lẩu Shabu Shabu & Bò Kobe',
      'Bảo hiểm du lịch quốc tế hạn mức 1.000.000.000đ/người'
    ],
    exclusionsList: [
      'Hộ chiếu còn hạn trên 6 tháng',
      'Tiền tip quy định cho HDV & Lái xe: 40 USD/khách/toàn tour',
      'Chi tiêu mua sắm cá nhân'
    ],
    refundPolicy: [
      { condition: 'Trước khi nộp hồ sơ xin Visa', fee: 'Hoàn 100% trừ phí visa 1.500.000đ' },
      { condition: 'Sau khi đã có kết quả Visa', fee: 'Phí hủy 50% tổng giá trị tour' },
      { condition: 'Dưới 07 ngày trước khởi hành', fee: 'Không hoàn tiền (100% phí)' }
    ],
    faqs: [
      { q: 'Thủ tục xin Visa Nhật Bản cần những gì?', a: 'Quý khách chỉ cần chuẩn bị Hộ chiếu gốc còn hạn trên 6 tháng, 2 ảnh 4.5x4.5 nền trắng, CCCD và chứng minh tài chính cơ bản. WebTravel hỗ trợ hoàn thiện hồ sơ trọn gói.' }
    ],
    rating: 4.95,
    reviewsCount: 87,
    badge: 'Tour Quốc Tế Hot',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    highlights: [
      'Bay thẳng hàng không 5 sao Vietnam Airlines / All Nippon Airways',
      'Trải nghiệm tàu siêu tốc Shinkansen tốc độ 320km/h biểu tượng Nhật Bản',
      'Thưởng ngoạn Núi Phú Sĩ linh thiêng và Làng cổ Oshino Hakkai',
      'Check-in Chùa Vàng Kinkaku-ji và Cổng trời ngàn cột Fushimi Inari'
    ],
    itinerary: [
      { day: 1, title: 'Hà Nội / TP.HCM - Sân Bay Narita - Tokyo', meals: 'Ăn trên máy bay, Tối', hotel: 'Khách sạn 4★ Tokyo', activities: 'Đáp chuyến bay đi Tokyo. Hướng dẫn viên đón đoàn, di chuyển về nhận phòng khách sạn.' },
      { day: 2, title: 'Khám Phá Thủ Đô Tokyo - Chùa Cổ Asakusa Kannon - Tháp Tokyo Skytree', meals: 'Sáng, Trưa, Tối', hotel: 'Khách sạn 4★ Tokyo', activities: 'Chiêm bái Chùa cổ Asakusa Kannon cổ kính nhất Tokyo, dạo phố Nakamise, ngắm tháp Skytree và mua sắm tại phố điện tử Akihabara.' },
      { day: 3, title: 'Tokyo - Núi Phú Sĩ Trạm 5 - Làng Cổ Oshino Hakkai - Tắm Suối Nóng Onsen', meals: 'Sáng, Trưa, Tối', hotel: 'Resort Onsen Phú Sĩ 4★', activities: 'Lên trạm 5 Núi Phú Sĩ ngắm tuyết trắng, dạo quanh làng cổ ngắm cá koi và thư giãn ngâm bồn khoáng nóng Onsen khoáng chất.' },
      { day: 4, title: 'Trải Nghiệm Tàu Siêu Tốc Shinkansen - Cố Đô Kyoto - Chùa Vàng Kinkaku-ji', meals: 'Sáng, Trưa, Tối', hotel: 'Khách sạn 4★ Kyoto', activities: 'Trải nghiệm tàu Shinkansen. Thăm Chùa Vàng rực rỡ soi bóng trên hồ nước và Rừng trúc Sagano thanh tịnh.' },
      { day: 5, title: 'Kyoto - Cổng Trời Fushimi Inari - Osaka - Lâu Đài Osaka - Phố Shinsaibashi', meals: 'Sáng, Trưa, Tối', hotel: 'Khách sạn 4★ Osaka', activities: 'Check-in hàng ngàn cổng Torii đỏ rực tại Đền Fushimi Inari. Chiều tham quan Lâu Đài Osaka và thỏa sức mua sắm tại Dotonbori.' },
      { day: 6, title: 'Sân Bay Quốc Tế Kansai - Việt Nam', meals: 'Sáng, Ăn trên máy bay', hotel: 'Kết thúc tour', activities: 'Xe đưa đoàn ra sân bay làm thủ tục đáp chuyến bay về lại Việt Nam. Chia tay và hẹn gặp lại.' }
    ],
    isAllInclusive: true,
    status: 'published',
    isActive: true
  }
];

