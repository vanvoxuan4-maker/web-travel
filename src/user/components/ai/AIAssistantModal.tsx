import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TOURS_DATA } from '../../../data/toursData';
import { formatCurrencyVND, escapeHTML } from '../../../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendedTourId?: string;
}

const QUICK_SUGGESTIONS = [
  '🏖️ Tour biển nghỉ dưỡng cho gia đình',
  '💰 Có 5 - 8 triệu nên đi tour nào?',
  '⛰️ Tour Sapa leo Fansipan có gì hot?',
  '🌸 Tour Nhật Bản có cần visa không?'
];

export const AIAssistantModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ Lý Du Lịch WebTravel AI. Tôi có thể giúp bạn tìm kiếm hành trình theo ngân sách, sở thích hoặc giải đáp thắc mắc về visa và lịch trình.'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (textToSend?: string) => {
    const rawText = textToSend || inputVal;
    if (!rawText.trim()) return;

    // Security: Input Sanitization against Prompt Injection & XSS (AGENTS.md Rule 7)
    const cleanUserText = escapeHTML(rawText.trim());

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: cleanUserText
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // AI Response Engine based on TOURS_DATA
    setTimeout(() => {
      const lower = rawText.toLowerCase();
      let reply = '';
      let matchTourId: string | undefined = undefined;

      if (lower.includes('biển') || lower.includes('phú quốc') || lower.includes('nghỉ dưỡng')) {
        const t = TOURS_DATA.find(x => x.id === 'tour-phuquoc-03');
        reply = `Bạn có thể tham khảo **${t?.title}** (${t?.durationDays}N${t?.durationNights}Đ). Tour chuẩn Vinpearl Resort 5★, bao gồm vé Cáp treo Hòn Thơm và cano 4 đảo lặn ngắm san hô. Giá chỉ từ ${formatCurrencyVND(t?.priceAdult || 0)}/khách.`;
        matchTourId = t?.id;
      } else if (lower.includes('sapa') || lower.includes('núi') || lower.includes('fansipan') || lower.includes('leo núi')) {
        const t = TOURS_DATA.find(x => x.id === 'tour-sapa-02');
        reply = `Hành trình khám phá **${t?.title}** đang là lựa chọn hàng đầu! Bạn sẽ được chinh phục nóc nhà Đông Dương Fansipan bằng cáp treo 3 dây, nghỉ khách sạn 4★ view thung lũng Mường Hoa. Giá chỉ từ ${formatCurrencyVND(t?.priceAdult || 0)}/khách.`;
        matchTourId = t?.id;
      } else if (lower.includes('hạ long') || lower.includes('du thuyền') || lower.includes('ninh bình') || lower.includes('bái đính')) {
        const t = TOURS_DATA.find(x => x.id === 'tour-halong-01');
        reply = `Hành trình di sản **${t?.title}** có 1 đêm nghỉ dưỡng trên Du thuyền 5 sao đẳng cấp quốc tế, tập Thái Cực Quyền ngắm bình minh trên vịnh và chèo thuyền Tràng An. Giá trọn gói vé máy bay ${formatCurrencyVND(t?.priceAdult || 0)}/khách.`;
        matchTourId = t?.id;
      } else if (lower.includes('nhật') || lower.includes('japan') || lower.includes('tokyo') || lower.includes('visa')) {
        const t = TOURS_DATA.find(x => x.id === 'tour-japan-04');
        reply = `Với **${t?.title}**, đại lý hỗ trợ trọn gói thủ tục Visa Nhật Bản với tỷ lệ đậu >99%. Tour bay hàng không 4-5 sao Vietnam Airlines/ANA, trải nghiệm tàu Shinkansen và tắm Onsen Núi Phú Sĩ. Giá trọn gói ${formatCurrencyVND(t?.priceAdult || 0)}/khách.`;
        matchTourId = t?.id;
      } else if (lower.includes('thái') || lower.includes('bangkok') || lower.includes('pattaya') || lower.includes('tiết kiệm')) {
        const t = TOURS_DATA.find(x => x.id === 'tour-thailand-05');
        reply = `Tour **${t?.title}** có giá cực tốt chỉ ${formatCurrencyVND(t?.priceAdult || 0)}/khách (5N4Đ). Khách mang hộ chiếu Việt Nam được miễn visa nhập cảnh 30 ngày. Đã bao gồm vé xem show Alcazar và đảo Coral!`;
        matchTourId = t?.id;
      } else if (lower.includes('5 triệu') || lower.includes('8 triệu') || lower.includes('ngân sách')) {
        reply = `Với ngân sách từ 3 – 8 triệu/người, bạn có các lựa chọn cực hot:\n1. **Tour Sapa Fansipan 4★**: Từ 3.200.000 ₫\n2. **Tour Biển Phú Quốc 5★**: Từ 5.490.000 ₫\n3. **Tour Thái Lan Bangkok - Pattaya**: Từ 7.590.000 ₫ trọn gói vé bay!`;
      } else {
        reply = `Cảm ơn bạn đã hỏi! WebTravel hiện có các tuyến tour cao cấp khởi hành hàng tuần tại Hạ Long, Sapa, Phú Quốc, Nhật Bản và Thái Lan với dịch vụ trọn gói chuẩn 4–5 sao. Bạn muốn tìm hành trình Trong Nước hay Quốc Tế?`;
      }

      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: reply,
          recommendedTourId: matchTourId
        }
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className="ai-chat-trigger-btn"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          background: 'linear-gradient(135deg, #059669, #047857)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '0.85rem 1.4rem',
          fontSize: '0.95rem',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          transition: 'transform 0.2s'
        }}
        aria-label="Mở Trợ lý AI"
      >
        <i className="fa-solid fa-wand-magic-sparkles"></i>
        <span>Trợ Lý Du Lịch AI</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="ai-chat-card"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '380px',
            maxWidth: '90vw',
            height: '520px',
            maxHeight: '75vh',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #111827, #1e293b)', color: '#ffffff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-robot" style={{ color: '#fff' }}></i>
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>WebTravel AI Concierge</strong>
                <span style={{ fontSize: '0.72rem', color: '#10b981' }}>● Trực tuyến 24/7</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.sender === 'user' ? 'var(--accent-forest)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5
                }}
              >
                <div>{msg.text}</div>
                {msg.recommendedTourId && (
                  <Link
                    to={`/tour/${msg.recommendedTourId}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.6rem',
                      background: '#ecfdf5',
                      color: '#047857',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    <i className="fa-solid fa-arrow-right"></i> Xem chi tiết tour này
                  </Link>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '0.6rem 0.9rem', borderRadius: '14px', fontSize: '0.8rem', color: '#64748b' }}>
                <i className="fa-solid fa-circle-notch fa-spin"></i> AI đang phân tích dữ liệu...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div style={{ padding: '0.5rem 0.75rem', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  color: '#334155'
                }}
                onClick={() => handleSend(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ padding: '0.75rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi (ngân sách, điểm đến...)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)' }}
              aria-label="Gửi câu hỏi"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
