/**
 * Official Consular & Immigration Travel Guides, Visa Protocols, Luggage Regulations & Insurance Policies Data
 * Compliant with Official Consular Standards (Embassy of Japan, KVAC Korea, Schengen ICAO, Australia Home Affairs, US DS-160, ASEAN Treaty)
 */

export interface VisaGuideItem {
  country: string;
  flag: string;
  category: string;
  visaType: string;
  issuingAuthority: string;
  processingTime: string;
  validity: string;
  personalDocs: string[];
  workDocs: string[];
  financeDocs: string[];
  specialNotes: string;
  officialSource: string;
}

export interface LuggageRuleItem {
  type: string;
  icon: string;
  weightLimit: string;
  dimensions: string;
  allowedItems: string[];
  prohibitedItems: string[];
  notice: string;
}

export interface PolicyItem {
  title: string;
  icon: string;
  badge: string;
  details: string[];
  terms: string;
}

export const VISA_GUIDES_DATA: VisaGuideItem[] = [
  {
    country: 'Nhật Bản (Japan)',
    flag: '🇯🇵',
    category: 'Đông Bắc Á',
    visaType: 'Thị thực Du lịch Lưu trú Ngắn hạn (Single Entry / Đoàn Chỉ Định)',
    issuingAuthority: 'Đại sứ quán / Tổng Lãnh sự quán Nhật Bản tại Việt Nam & Trung tâm VFS Global',
    processingTime: 'Tối thiểu 08 ngày làm việc (kể từ ngày tiếp nhận hồ sơ hợp lệ)',
    validity: '03 tháng kể từ ngày cấp (Nhập cảnh 01 lần, thời gian lưu trú tối đa 15 ngày)',
    personalDocs: [
      'Hộ chiếu gốc còn hạn trên 6 tháng tính đến ngày kết thúc chuyến đi, còn ít nhất 2 trang trống và có chữ ký của người mang hộ chiếu.',
      '01 Tờ khai xin cấp thị thực (Visa Application Form) có dán ảnh 4.5cm x 4.5cm nền trắng, chụp chính diện trong vòng 6 tháng gần nhất, không đội mũ, không đeo kính râm.',
      'Căn cước công dân (bản sao photo rõ nét hai mặt).',
      'Giấy tờ xác nhận quan hệ thân nhân: Giấy đăng ký kết hôn, Giấy khai sinh của con (nếu đi cùng gia đình).'
    ],
    workDocs: [
      'Đối với cán bộ/nhân viên: Hợp đồng lao động (hoặc Quyết định bổ nhiệm/tuyển dụng) + Đơn xin nghỉ phép đi du lịch có xác nhận và mộc đỏ của cơ quan + Bảng lương/Sao kê lương 3 tháng gần nhất.',
      'Đối với chủ doanh nghiệp: Giấy chứng nhận đăng ký kinh doanh (bản sao công chứng) + Tờ khai nộp thuế 3 tháng gần nhất.',
      'Đối với người đã nghỉ hưu: Quyết định hưởng chế độ hưu trí / Thẻ hưu trí / Sổ lĩnh lương hưu.',
      'Đối với học sinh/sinh viên: Thẻ học sinh/sinh viên hoặc Giấy xác nhận đang theo học của nhà trường + Đơn xin nghỉ phép.'
    ],
    financeDocs: [
      'Giấy xác nhận số dư tài khoản tiền gửi tiết kiệm tối thiểu 100.000.000 VNĐ - 150.000.000 VNĐ / người (thời hạn gửi từ 3 tháng trở lên).',
      'Bản sao sổ tiết kiệm có đối chiếu bản gốc.',
      'Giấy tờ sở hữu tài sản bổ trợ (nếu có để củng cố hồ sơ): Giấy chứng nhận quyền sử dụng đất (Sổ hồng/Sổ đỏ), Giấy đăng ký xe ô tô (Cavet).'
    ],
    specialNotes: 'Khách hàng đăng ký tour trọn gói của WebTravel được nộp theo diện Đoàn Đại Lý Chỉ Định (Tỷ lệ đậu 99.2%, không cần phỏng vấn, rút ngắn thời gian thẩm định).',
    officialSource: 'Bộ Ngoại giao Nhật Bản (MOFA) & ĐSQ Nhật Bản tại Hà Nội'
  },
  {
    country: 'Hàn Quốc (South Korea)',
    flag: '🇰🇷',
    category: 'Đông Bắc Á',
    visaType: 'Thị thực Du lịch Cá nhân / Theo Đoàn (C-3-9)',
    issuingAuthority: 'Trung tâm Đăng ký Thị thực Hàn Quốc (KVAC) - Tổng Lãnh sự quán Hàn Quốc',
    processingTime: '11 - 16 ngày làm việc (không tính Thứ 7, Chủ Nhật và ngày Lễ)',
    validity: '03 tháng kể từ ngày cấp (Thời gian lưu trú tối đa 15 - 30 ngày)',
    personalDocs: [
      'Hộ chiếu gốc còn hạn trên 6 tháng tính từ ngày nhập cảnh.',
      '01 Đơn xin cấp visa Hàn Quốc dán ảnh 3.5cm x 4.5cm chuẩn quốc tế nền trắng, chụp trong 3 tháng.',
      'Căn cước công dân gắn chip (bản sao công chứng) + Giấy xác nhận thông tin cư trú mẫu CT07.',
      'Giấy khai sinh / Đăng ký kết hôn (nếu đi cùng gia đình) được dịch thuật công chứng tư pháp.'
    ],
    workDocs: [
      'Hợp đồng lao động (bản dịch công chứng tiếng Anh/tiếng Hàn).',
      'Đơn xin nghỉ phép đi du lịch có mộc đỏ xác nhận của công ty.',
      'Bảo hiểm xã hội: Ảnh chụp màn hình quá trình đóng BHXH trên ứng dụng VssID (thể hiện rõ mã số BHXH và quá trình đóng tối thiểu 6 tháng).',
      'Sao kê tài khoản ngân hàng nhận lương 3 - 6 tháng gần nhất có mộc tròn ngân hàng.'
    ],
    financeDocs: [
      'Sổ tiết kiệm gốc và Giấy xác nhận số dư tài khoản tiết kiệm tối thiểu 100.000.000 VNĐ (ngày gửi trước ngày nộp hồ sơ tối thiểu 1 tháng, kỳ hạn gửi từ 3 tháng trở lên).',
      'Miễn chứng minh tài chính đối với: Du khách có Hộ khẩu thường trú tại Hà Nội, Đà Nẵng, TP.HCM trên 1 năm hoặc đã từng nhập cảnh các nước thuộc khối OECD trong vòng 3 năm gần nhất.'
    ],
    specialNotes: 'WebTravel hỗ trợ khai form điện tử KVAC, dịch thuật công chứng trọn gói và nộp hồ sơ theo diện bảo lãnh lữ hành ưu tiên.',
    officialSource: 'Bộ Tư pháp Hàn Quốc & KVAC Vietnam'
  },
  {
    country: 'Châu Âu (Khối Schengen - 27 Quốc Gia)',
    flag: '🇪🇺',
    category: 'Châu Âu',
    visaType: 'Thị thực Ngắn hạn Khối Schengen (Schengen Tourist Visa Type C)',
    issuingAuthority: 'Đại sứ quán / Lãnh sự quán các nước thành viên (Pháp, Ý, Đức, Thụy Sĩ...) qua VFS / TLScontact / BLS',
    processingTime: '15 - 21 ngày làm việc (có thể kéo dài tới 30 - 45 ngày vào mùa cao điểm)',
    validity: 'Cấp theo lịch trình tour thực tế (Lưu trú tối đa 90 ngày trong chu kỳ 180 ngày)',
    personalDocs: [
      'Hộ chiếu gốc được cấp trong vòng 10 năm trở lại đây, còn hạn ít nhất 3 tháng sau ngày rời khỏi Schengen và còn tối thiểu 2 trang trống.',
      '02 ảnh 3.5cm x 4.5cm chuẩn sinh trắc học ICAO (khuôn mặt chiếm 70-80% diện tích ảnh, phông nền trắng đồng nhất).',
      'Hộ chiếu cũ có các visa tiên tiến (Nhật, Hàn, Mỹ, Anh, Úc...) nếu có.',
      'Tờ khai xin thị thực Schengen điền đầy đủ và ký tên trùng khớp chữ ký trên hộ chiếu.',
      'Giấy xác nhận cư trú CT07, Đăng ký kết hôn, Giấy khai sinh (dịch thuật công chứng tiếng Anh hoặc tiếng Pháp).'
    ],
    workDocs: [
      'Đối với nhân viên: HĐLĐ + Đơn xin nghỉ phép nêu rõ thời gian đi + Bảng lương/Sao kê tài khoản lương 6 tháng gần nhất.',
      'Đối với doanh nghiệp: Giấy phép ĐKKD + Tờ khai và biên lai nộp thuế điện tử 3 tháng gần nhất + Sao kê tài khoản doanh nghiệp 3 tháng.',
      'Đối với hưu trí: Quyết định nghỉ hưu + Sổ hưu / Sao kê tài khoản nhận lương hưu 3 tháng gần nhất.'
    ],
    financeDocs: [
      'Sao kê tài khoản thanh toán cá nhân có phát sinh giao dịch thường xuyên trong 3 - 6 tháng gần nhất (Số dư khả dụng duy trì tối thiểu từ 200.000.000 VNĐ - 300.000.000 VNĐ / người).',
      'Sổ tiết kiệm bản gốc và Giấy xác nhận số dư.',
      'Giấy tờ chứng minh quyền sở hữu tài sản cố định: Giấy chứng nhận quyền sử dụng đất, nhà ở, hợp đồng mua bán căn hộ, cavet xe ô tô.'
    ],
    specialNotes: 'Bắt buộc phải có Bảo hiểm Du lịch Quốc tế với mức trách nhiệm tối thiểu 30.000 EUR (WebTravel đã mua trọn gói kèm trong giá tour). Khách hàng bắt buộc phải có mặt tại Trung tâm VFS/TLS để lấy dấu vân tay sinh trắc học.',
    officialSource: 'Quy định Thị thực Cộng đồng Châu Âu (Visa Code EU Regulation)'
  },
  {
    country: 'Úc (Australia)',
    flag: '🇦🇺',
    category: 'Châu Úc',
    visaType: 'Thị thực Du lịch Tự Túc / Theo Đoàn (Visitor Visa Subclass 600 - Tourist Stream)',
    issuingAuthority: 'Bộ Nội vụ Úc (Department of Home Affairs) & Trung tâm VFS Global',
    processingTime: '03 - 04 tuần làm việc kể từ ngày hoàn tất sinh trắc học',
    validity: '01 năm đến 03 năm (Cho phép nhập cảnh 01 hoặc nhiều lần, mỗi lần lưu trú tối đa 03 tháng)',
    personalDocs: [
      'Bản scan màu toàn bộ các trang của Hộ chiếu gốc (kể cả các trang trống và trang có dấu xuất nhập cảnh).',
      'Ảnh thẻ 4.5cm x 3.5cm file mềm chất lượng cao phông nền trắng, chụp trong vòng 6 tháng.',
      'Bản scan CCCD, Giấy khai sinh, Giấy đăng ký kết hôn, Giấy xác nhận thông tin cư trú CT07.',
      'Thư mời hoặc Lịch trình chi tiết chuyến đi du lịch do WebTravel cung cấp.'
    ],
    workDocs: [
      'Hợp đồng lao động / Quyết định bổ nhiệm + Đơn xin nghỉ phép có dấu mộc công ty.',
      'Sao kê tài khoản nhận lương qua ngân hàng 6 tháng gần nhất có mộc giáp lai.',
      'Chủ doanh nghiệp: Giấy phép kinh doanh + Báo cáo thuế 6 tháng gần nhất.'
    ],
    financeDocs: [
      'Sao kê tài khoản ngân hàng cá nhân thể hiện nguồn thu nhập minh bạch trong 6 tháng gần nhất.',
      'Xác nhận số dư tiền gửi tiết kiệm tối thiểu 150.000.000 VNĐ - 200.000.000 VNĐ.',
      'Giấy tờ chứng minh tài sản sở hữu: Sổ đỏ, hợp đồng mua bán bất động sản, xe ô tô, chứng khoán.'
    ],
    specialNotes: 'Visa Úc là thị thực điện tử (e-Visa), được cấp thông qua hệ thống ImmiAccount và lưu trữ trực tuyến trên cổng VEVO. Đương đơn chỉ cần mang hộ chiếu gốc và thư cấp visa (Visa Grant Notice) khi làm thủ tục bay.',
    officialSource: 'Department of Home Affairs, Australian Government'
  },
  {
    country: 'Hoa Kỳ (United States - Mỹ)',
    flag: '🇺🇸',
    category: 'Châu Mỹ',
    visaType: 'Thị thực Không Định cư Du lịch / Công tác (B1/B2 Non-Immigrant Visa)',
    issuingAuthority: 'Đại sứ quán Hoa Kỳ tại Hà Nội & Tổng Lãnh sự quán Hoa Kỳ tại TP. Hồ Chí Minh',
    processingTime: 'Biết kết quả ngay sau buổi phỏng vấn trực tiếp (Nhận hộ chiếu dán visa sau 2 - 3 ngày làm việc)',
    validity: '01 năm (Nhập cảnh nhiều lần, thời gian lưu trú mỗi lần do Sĩ quan Hải quan CBP quyết định tại sân bay Mỹ, thông thường tối đa 6 tháng)',
    personalDocs: [
      'Hộ chiếu gốc còn hạn trên 6 tháng tính từ ngày dự kiến rời khỏi Hoa Kỳ và có ít nhất 1 trang trống.',
      'Trang xác nhận tờ khai điện tử DS-160 có mã vạch (Confirmation Page).',
      '01 ảnh 5cm x 5cm nền trắng chuẩn Mỹ chụp trong vòng 6 tháng (chụp rõ hai tai, không đeo kính).',
      'Biên nhận đóng phí xét duyệt visa (185 USD) và Giấy hẹn phỏng vấn (Appointment Confirmation).'
    ],
    workDocs: [
      'Hồ sơ chứng minh công việc vững chắc tại Việt Nam: HĐLĐ, Bảng lương, Quyết định bổ nhiệm, Giấy phép kinh doanh, Báo cáo thuế (mang theo bản gốc khi đi phỏng vấn).'
    ],
    financeDocs: [
      'Sổ tiết kiệm, Sao kê tài khoản ngân hàng, Giấy tờ sở hữu nhà đất, tài sản (mang bản gốc để chứng minh sự ràng buộc tài chính tại Việt Nam khi Viên chức Lãnh sự yêu cầu xuất trình).'
    ],
    specialNotes: 'Chìa khóa quyết định đậu visa Mỹ là sự trung thực trong tờ khai DS-160 và phong thái tự tin khi trả lời phỏng vấn trực tiếp. WebTravel có chuyên viên luyện phỏng vấn 1-1 chuyên sâu cho từng bộ hồ sơ.',
    officialSource: 'U.S. Department of State - Consular Affairs'
  },
  {
    country: 'Đông Nam Á (Khối ASEAN: Thái Lan, Singapore, Malaysia, Bali...)',
    flag: '🌴',
    category: 'Đông Nam Á',
    visaType: 'Miễn Thị Thực Đơn Phương & Đa Phương Theo Hiệp Định ASEAN',
    issuingAuthority: 'Cơ quan Quản lý Xuất Nhập Cảnh các nước thành viên (ICA Singapore, Immigration Malaysia, Thai Immigration...)',
    processingTime: 'Nhập cảnh tức thì tại sân bay quốc tế (Không cần xin visa trước)',
    validity: 'Lưu trú miễn thị thực từ 14 ngày đến 30 ngày (Tùy theo quy định của từng quốc gia thành viên)',
    personalDocs: [
      'Hộ chiếu gốc còn hiệu lực sử dụng tối thiểu trên 6 tháng tính đến ngày nhập cảnh.',
      'Vé máy bay khứ hồi hoặc vé máy bay đi tiếp quốc gia thứ ba.',
      'Xác nhận đặt phòng khách sạn hoặc Thư mời của đối tác du lịch bảo lãnh.',
      'Tờ khai nhập cảnh điện tử: Khai báo Singapore Arrival Card (SGAC) trước 3 ngày bay đối với Singapore, Malaysia Digital Arrival Card (MDAC) đối với Malaysia.'
    ],
    workDocs: [
      'Không yêu cầu chứng minh công việc.'
    ],
    financeDocs: [
      'Khuyến nghị mang theo tối thiểu 500 - 700 USD hoặc tiền mặt tương đương / Thẻ tín dụng quốc tế để xuất trình nếu Cục Hải quan kiểm tra ngẫu nhiên khả năng chi trả.'
    ],
    specialNotes: 'Khách hàng chỉ cần mang hộ chiếu hợp lệ và hành lý để khởi hành ngay cùng WebTravel.',
    officialSource: 'Hiệp hội các Quốc gia Đông Nam Á (ASEAN Framework Agreement on Visa Exemption)'
  }
];

export const LUGGAGE_RULES_DATA: LuggageRuleItem[] = [
  {
    type: 'Hành Lý Xách Tay (Carry-On Baggage)',
    icon: 'fa-solid fa-briefcase',
    weightLimit: '01 kiện 07kg - 12kg (Vietnam Airlines: 12kg, Vietjet/Bamboo/Quốc tế: 07kg - 10kg)',
    dimensions: 'Kích thước tối đa: 56cm (dài) x 36cm (rộng) x 23cm (cao) [Tổng 3 chiều ≤ 115cm]',
    allowedItems: [
      'Trang phục cá nhân, áo ấm, khăn choàng, gối cổ du lịch.',
      'Thiết bị điện tử giá trị cao: Laptop, máy tính bảng, máy ảnh, điện thoại thông minh, dây sạc.',
      'Pin sạc dự phòng (Power Bank dung lượng dưới 20.000mAh / 100Wh - 160Wh) - BẮT BUỘC để trong hành lý xách tay, KHÔNG ĐƯỢC để trong hành lý ký gửi.',
      'Giấy tờ tùy thân gốc (Hộ chiếu, CCCD, vé máy bay), tiền mặt, thẻ ngân hàng, trang sức quý giá.',
      'Thuốc men thiết yếu kèm đơn thuốc có chỉ định của bác sĩ.'
    ],
    prohibitedItems: [
      'Chất lỏng, gel, bình xịt có dung tích mỗi bình vượt quá 100ml trên các chuyến bay quốc tế (tất cả các chai lọ dưới 100ml phải đựng trong túi nhựa trong suốt có khóa zip, tổng dung tích không quá 1 lít).',
      'Dao kéo, dao rọc giấy, kéo cắt móng tay có đầu nhọn, gậy bóng chày, gậy gôn, đồ vật kim loại sắc nhọn.',
      'Bật lửa ga, diêm quẹt, vật liệu dễ bắt cháy.'
    ],
    notice: 'Tiêu chuẩn xách tay áp dụng nghiêm ngặt tại cửa kiểm tra an ninh sân bay (Security Check) và cửa ra máy bay (Boarding Gate).'
  },
  {
    type: 'Hành Lý Ký Gửi (Checked Baggage)',
    icon: 'fa-solid fa-suitcase-rolling',
    weightLimit: '01 - 02 kiện tiêu chuẩn 20kg - 23kg / kiện (Bay đường dài Châu Âu/Mỹ: 02 kiện 23kg)',
    dimensions: 'Tổng kích thước 3 chiều (Dài + Rộng + Cao) không vượt quá 158cm (62 inch)',
    allowedItems: [
      'Quần áo, giày dép, đồ lưu niệm, đồ dùng sinh hoạt.',
      'Chất lỏng trên 100ml (rượu vang có tem nhãn niêm phong, nước hoa, dầu gội, mỹ phẩm đóng chai bọc chống sốc kỹ càng).',
      'Thực phẩm khô đã qua chế biến, đóng gói hút chân không có nhãn mác xuất xứ rõ ràng.',
      'Dụng cụ thể thao, chân máy ảnh (Tripod), gậy trekking leo núi.'
    ],
    prohibitedItems: [
      'TUYỆT ĐỐI KHÔNG để pin sạc dự phòng, pin Lithium-ion rời, thuốc lá điện tử trong hành lý ký gửi (nguy cơ cháy nổ trong khoang hàng).',
      'Không để tiền mặt, vàng bạc, đá quý, tài liệu mật hoặc đồ vật có giá trị vô giá trong kiện ký gửi.',
      'Bình xịt khí nén, bình gas du lịch, pháo sáng, hóa chất ăn mòn, chất độc hại.'
    ],
    notice: 'Khuyến nghị: Luôn dán Thẻ Tên (Baggage Tag) có ghi rõ Họ tên + Số điện thoại quốc tế + Email lên quai vali và sử dụng ổ khóa số tiêu chuẩn an ninh TSA Hoa Kỳ.'
  }
];

export const POLICIES_DATA: PolicyItem[] = [
  {
    title: 'Bảo Hiểm Du Lịch Quốc Tế & Nội Địa Trọn Gói',
    icon: 'fa-solid fa-shield-halved',
    badge: 'Mức bồi thường 1.000.000.000 VNĐ',
    details: [
      'Hạn mức bồi thường tai nạn du lịch tối đa lên tới 1.000.000.000 VNĐ / khách / vụ (Hợp tác cùng Bảo Việt / MSIG Insurance).',
      'Chi trả 100% viện phí, chi phí khám chữa bệnh cấp cứu và nằm viện điều trị tại nước ngoài.',
      'Bồi thường sự cố thất lạc, hư hỏng hoặc chậm trễ hành lý vượt quá 6 tiếng liên tục.',
      'Hỗ trợ khẩn cấp toàn cầu SOS International 24/7 (Đường dây nóng hỗ trợ tiếng Việt trên toàn thế giới).'
    ],
    terms: 'Bảo hiểm tự động có hiệu lực từ thời điểm hoàn tất thủ tục xuất cảnh tại sân bay Việt Nam cho đến thời điểm nhập cảnh trở về nước.'
  },
  {
    title: 'Chính Sách Đổi Ngày & Hoàn Hủy Minh Bạch',
    icon: 'fa-solid fa-rotate-left',
    badge: 'Cam kết chuẩn lữ hành',
    details: [
      'Hủy tour trước 30 ngày khởi hành: Hoàn trả 100% số tiền cọc (chỉ khấu trừ lệ phí visa thực tế nếu cơ quan lãnh sự đã cấp).',
      'Hủy tour từ 15 - 29 ngày trước ngày đi: Phí hủy tương đương 30% tổng giá trị hợp đồng tour.',
      'Hủy tour từ 07 - 14 ngày trước ngày đi: Phí hủy tương đương 50% tổng giá trị hợp đồng tour.',
      'Hỗ trợ chuyển nhượng hợp đồng cho người khác hoặc bảo lưu dời ngày khởi hành miễn phí trước 20 ngày.'
    ],
    terms: 'Trường hợp bất khả kháng (thiên tai, chiến sự, dịch bệnh hoặc bị từ chối cấp visa lãnh sự), WebTravel cam kết hỗ trợ hoàn trả tối đa chi phí chưa sử dụng từ các nhà cung cấp dịch vụ máy bay/khách sạn.'
  },
  {
    title: 'Quy Trình Giữ Chỗ & Thanh Toán Điện Tử VietQR',
    icon: 'fa-solid fa-qrcode',
    badge: 'Chuẩn bảo mật NAPAS247',
    details: [
      'Thanh toán chuyển khoản qua mã động VietQR tự động điền chính xác số tiền và cú pháp mã đơn hàng WT-xxxx.',
      'Hệ thống tự động phát hành Mã Giữ Vé Điện Tử và gửi SMS/Email xác nhận ngay tức thì.',
      'Hoàn toàn miễn phí giao dịch (0% phí chuyển khoản và phí quẹt thẻ).',
      'Cung cấp Hóa đơn Giá trị Gia tăng (VAT điện tử) hợp pháp cho khách hàng cá nhân và doanh nghiệp theo quy định Tổng cục Thuế.'
    ],
    terms: 'Bảo chứng thanh toán trực tiếp qua Ngân hàng TMCP Quân Đội (MBBank) và Cổng thanh toán Quốc gia.'
  }
];
