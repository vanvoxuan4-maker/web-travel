import { RefundPolicyItem } from '../types/tour.types';

export interface PolicyPreset {
  id: 'standard' | 'flexible' | 'strict_holiday' | 'non_refundable';
  name: string;
  shortName: string;
  tag: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  icon: string;
  description: string;
  rules: RefundPolicyItem[];
}

export const REFUND_POLICY_PRESETS: PolicyPreset[] = [
  {
    id: 'standard',
    name: 'Gói Tiêu Chuẩn (Standard)',
    shortName: 'Tiêu Chuẩn (7 Ngày)',
    tag: 'Phổ biến nhất',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    borderColor: '#a7f3d0',
    icon: 'fa-solid fa-shield-halved',
    description: 'Áp dụng cho đa số tour trọn gói 3N2Đ, 4N3Đ trong nước phổ thông.',
    rules: [
      { condition: 'Hủy trước 7 ngày khởi hành', fee: 'Hoàn 100% tiền vé (Miễn phí hủy)' },
      { condition: 'Hủy từ 3 - 5 ngày trước giờ đi', fee: 'Hoàn 50% tiền vé (Phí phạt 50%)' },
      { condition: 'Hủy dưới 24h trước giờ đi', fee: 'Không hoàn tiền (Phí phạt 100%)' }
    ]
  },
  {
    id: 'flexible',
    name: 'Gói Linh Hoạt (Flexible 48H)',
    shortName: 'Linh Hoạt (48 Giờ)',
    tag: 'City Tour / 1 Ngày',
    badgeBg: '#fefce8',
    badgeColor: '#a16207',
    borderColor: '#fde047',
    icon: 'fa-solid fa-clock-rotate-left',
    description: 'Áp dụng cho City Tour, Tour 1 ngày, vé tham quan hoặc Tour ngắn ngày.',
    rules: [
      { condition: 'Hủy trước 48h khởi hành', fee: 'Hoàn 100% tiền vé (Miễn phí hủy)' },
      { condition: 'Hủy từ 24h - 48h trước giờ đi', fee: 'Hoàn 50% tiền vé (Phí phạt 50%)' },
      { condition: 'Hủy dưới 24h trước giờ đi', fee: 'Không hoàn tiền (Phí phạt 100%)' }
    ]
  },
  {
    id: 'strict_holiday',
    name: 'Gói Lễ Tết & Quốc Tế (Strict / Holiday)',
    shortName: 'Lễ Tết & Quốc Tế',
    tag: 'Bảo vệ cọc vé bay / Visa',
    badgeBg: '#fff1f2',
    badgeColor: '#be123c',
    borderColor: '#fecdd3',
    icon: 'fa-solid fa-plane-lock',
    description: 'Áp dụng cho Tour Tết, Tour Du Thuyền 5★, Tour Quốc Tế (đã cọc vé máy bay và khách sạn).',
    rules: [
      { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Hoàn 70% tiền vé (Phí cọc vé bay 30%)' },
      { condition: 'Hủy từ 7 - 14 ngày trước khởi hành', fee: 'Hoàn 30% tiền vé (Phí phạt 70%)' },
      { condition: 'Hủy dưới 7 ngày trước khởi hành', fee: 'Không hoàn tiền (Phí phạt 100%)' }
    ]
  },
  {
    id: 'non_refundable',
    name: 'Gói Không Hoàn Tiền (Non-Refundable)',
    shortName: 'Không Hoàn Tiền',
    tag: 'Flash Sale Siêu Rẻ',
    badgeBg: '#f8fafc',
    badgeColor: '#475569',
    borderColor: '#cbd5e1',
    icon: 'fa-solid fa-ban',
    description: 'Áp dụng cho Tour Flash Sale giảm giá cực sâu hoặc Xả vé giờ chót.',
    rules: [
      { condition: 'Ngay sau khi đăng ký thành công', fee: 'Không hoàn tiền (Áp dụng giá Flash Sale đặc biệt)' },
      { condition: 'Trường hợp bất khả kháng (Thiên tai / Dịch bệnh)', fee: 'Đổi dời ngày đi miễn phí sang đợt tiếp theo' }
    ]
  }
];

export const DEFAULT_REFUND_POLICY: RefundPolicyItem[] = REFUND_POLICY_PRESETS[0].rules;
