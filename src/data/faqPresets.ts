import { FAQItem } from '../types/tour.types';

export interface FAQPreset {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  faqs: FAQItem[];
}

export const FAQ_PRESETS: FAQPreset[] = [
  {
    id: 'general',
    name: 'Gói Phổ Thông (General Package)',
    shortName: 'Phổ Thông',
    icon: 'fa-solid fa-compass',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    description: 'Bộ câu hỏi tiêu chuẩn về bữa ăn, điểm tập trung, đồ dùng và giấy tờ tùy thân.',
    faqs: [
      {
        q: 'Tour đã bao gồm những bữa ăn nào?',
        a: 'Giá tour đã bao gồm 100% các bữa ăn chính theo đúng lịch trình và buffet sáng tiêu chuẩn quốc tế hàng ngày tại khách sạn lưu trú.'
      },
      {
        q: 'Điểm tập trung xuất phát và đưa đón ở đâu?',
        a: 'Đoàn tập trung tại điểm hẹn trung tâm hoặc sân bay. Xe du lịch Limousine cao cấp sẽ đón quý khách đúng giờ theo thông báo của Trưởng đoàn.'
      },
      {
        q: 'Cần chuẩn bị những giấy tờ tùy thân gì khi đi tour?',
        a: 'Quý khách vui lòng mang theo Căn cước công dân (CCCD) hoặc Hộ chiếu còn hạn trên 6 tháng. Đối với trẻ em dưới 14 tuổi chưa có CCCD cần mang theo bản trích lục Giấy khai sinh công chứng.'
      },
      {
        q: 'Quy định về hành lý cá nhân khi tham gia tour?',
        a: 'Mỗi khách được mang 1 kiện hành lý xách tay (dưới 7kg) và 1 kiện hành lý ký gửi tiêu chuẩn (20kg). Quý khách nên chuẩn bị trang phục gọn nhẹ và giày thể thao đi bộ thoải mái.'
      }
    ]
  },
  {
    id: 'international',
    name: 'Gói Quốc Tế (International Tour)',
    shortName: 'Tour Quốc Tế',
    icon: 'fa-solid fa-plane-departure',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    description: 'Bộ câu hỏi về thủ tục Visa, đổi ngoại tệ, kết nối SIM/Wifi và hải quan.',
    faqs: [
      {
        q: 'Thủ tục xin Visa được công ty hỗ trợ như thế nào?',
        a: 'Công ty sẽ đồng hành hướng dẫn hoàn thiện hồ sơ Visa trọn gói từ A-Z, dịch thuật công chứng và đại diện nộp hồ sơ lên Lãnh sự quán cho quý khách.'
      },
      {
        q: 'Tôi nên đổi ngoại tệ và chuẩn bị tiền mặt ở đâu?',
        a: 'Quý khách nên đổi sẵn một lượng tiền mặt địa phương tại các ngân hàng/tiệm vàng uy tín trước ngày đi, kết hợp mang theo thẻ thanh toán quốc tế (Visa/Mastercard).'
      },
      {
        q: 'Có được tặng kèm SIM 4G hoặc bộ phát Wifi không?',
        a: 'Quý khách được hỗ trợ mua SIM Data 4G tốc độ cao hoặc thuê bộ phát Wifi quốc tế không giới hạn dung lượng với mức giá ưu đãi đặc quyền.'
      },
      {
        q: 'Thời gian tập trung tại sân bay trước giờ bay bao lâu?',
        a: 'Đối với các chuyến bay quốc tế, đoàn sẽ tập trung tại sân bay trước giờ khởi hành tối thiểu 3 tiếng để làm thủ tục check-in và xuất nhập cảnh chu đáo.'
      }
    ]
  },
  {
    id: 'beach_cruise',
    name: 'Gói Biển Đảo & Du Thuyền (Beach / Cruise)',
    shortName: 'Biển Đảo / Du Thuyền',
    icon: 'fa-solid fa-anchor',
    badgeBg: '#f0fdfa',
    badgeColor: '#0f766e',
    description: 'Bộ câu hỏi về hoạt động tắm biển, chèo kayak, say sóng và dịch vụ trên tàu.',
    faqs: [
      {
        q: 'Đi du thuyền hoặc tàu biển có bị say sóng không?',
        a: 'Các dòng du thuyền và tàu cao tốc hiện đại đều có hệ thống cân bằng giảm lắc. Hướng dẫn viên luôn trang bị sẵn thuốc say sóng thảo dược và gừng tươi phục vụ miễn phí.'
      },
      {
        q: 'Các hoạt động tắm biển, lặn ngắm san hô và chèo Kayak có an toàn không?',
        a: 'Toàn bộ hoạt động dưới nước đều được trang bị áo phao cứu sinh chuẩn quốc tế và có đội ngũ cứu hộ chuyên nghiệp giám sát 100% thời gian.'
      },
      {
        q: 'Trên du thuyền có sóng điện thoại và Wifi không?',
        a: 'Khu vực nhà hàng và sảnh chính du thuyền có trang bị Wifi vệ tinh. Khi tàu di chuyển qua các vùng vịnh sâu, sóng di động có thể chập chờn đôi lúc.'
      }
    ]
  },
  {
    id: 'trekking_adventure',
    name: 'Gói Mạo Hiểm & Trekking (Adventure / Nature)',
    shortName: 'Trekking & Mạo Hiểm',
    icon: 'fa-solid fa-mountain',
    badgeBg: '#fefce8',
    badgeColor: '#a16207',
    description: 'Bộ câu hỏi về yêu cầu thể lực, trang phục dã ngoại và hỗ trợ y tế sơ cấp cứu.',
    faqs: [
      {
        q: 'Cung đường trekking có đòi hỏi thể lực cao không?',
        a: 'Lộ trình được thiết kế ở mức độ vừa phải (Moderate), phù hợp với người có sức khỏe bình thường. Đoàn có porter (người hỗ trợ) khuân vác hành lý và dẫn đường.'
      },
      {
        q: 'Cần chuẩn bị trang phục và giày dép như thế nào?',
        a: 'Quý khách nên mang giày leo núi có độ bám gai tốt, quần áo co giãn nhanh khô, gậy trekking, áo mưa bộ, thuốc chống côn trùng và đèn pin cá nhân.'
      },
      {
        q: 'Đoàn có trang bị y tế và sơ cấp cứu không?',
        a: 'Hướng dẫn viên được đào tạo chứng chỉ sơ cấp cứu chuyên nghiệp và luôn mang theo túi y tế dã ngoại đầy đủ các loại thuốc men cơ bản.'
      }
    ]
  }
];

export const DEFAULT_FAQS: FAQItem[] = FAQ_PRESETS[0].faqs;
