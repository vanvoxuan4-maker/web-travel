import React, { useState, useEffect } from 'react';
import { 
  VISA_GUIDES_DATA, 
  LUGGAGE_RULES_DATA, 
  POLICIES_DATA, 
  VisaGuideItem 
} from '../../../data/travelGuidesData';

export type TravelGuideTab = 'visa' | 'luggage' | 'policies';

interface TravelGuideModalProps {
  isOpen: boolean;
  initialTab?: TravelGuideTab;
  onClose: () => void;
}

export const TravelGuideModal: React.FC<TravelGuideModalProps> = ({
  isOpen,
  initialTab = 'visa',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TravelGuideTab>(initialTab);
  const [selectedCountry, setSelectedCountry] = useState<VisaGuideItem>(VISA_GUIDES_DATA[0]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      
      {/* Modal Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '920px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              <i className="fa-solid fa-passport"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Cẩm Nang &amp; Hướng Dẫn Hành Trình Chính Thống
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                Quy chuẩn pháp lý từ Đại Sứ Quán, Cục Xuất Nhập Cảnh &amp; Hiệp Hội Hàng Không IATA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1.5px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 1.25rem',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('visa')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'visa' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'visa' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'visa' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-passport"></i> Thủ Tục Visa Chuẩn Lãnh Sự
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('luggage')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'luggage' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'luggage' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'luggage' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-suitcase-rolling"></i> Quy Định Hành Lý Hàng Không
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'policies' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'policies' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'policies' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-shield-halved"></i> Bảo Hiểm 1 Tỷ &amp; Hoàn Hủy
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: 'calc(92vh - 160px)' }}>
          
          {/* 1. TAB VISA (OFFICIAL CONSULAR STANDARDS) */}
          {activeTab === 'visa' && (
            <div>
              {/* Country Selection Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {VISA_GUIDES_DATA.map((item) => (
                  <button
                    key={item.country}
                    type="button"
                    onClick={() => setSelectedCountry(item)}
                    style={{
                      padding: '0.5rem 0.95rem',
                      borderRadius: '30px',
                      border: selectedCountry.country === item.country ? '1.5px solid var(--accent-emerald)' : '1.5px solid #cbd5e1',
                      background: selectedCountry.country === item.country ? '#ecfdf5' : '#ffffff',
                      color: selectedCountry.country === item.country ? '#047857' : '#334155',
                      fontWeight: selectedCountry.country === item.country ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedCountry.country === item.country ? '0 4px 12px rgba(5,150,105,0.15)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{item.flag}</span>
                    <span>{item.country}</span>
                  </button>
                ))}
              </div>

              {/* Selected Country Details Container */}
              <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '1.35rem' }}>
                
                {/* Header Information */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.visaType}</span>
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                        <i className="fa-solid fa-building-columns" style={{ color: 'var(--accent-emerald)' }}></i> Cơ quan xét duyệt: <strong>{selectedCountry.issuingAuthority}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.76rem', background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.7rem', borderRadius: '6px', fontWeight: 700 }}>
                        <i className="fa-regular fa-clock"></i> Xét duyệt: {selectedCountry.processingTime}
                      </span>
                      <span style={{ fontSize: '0.76rem', background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.7rem', borderRadius: '6px', fontWeight: 700 }}>
                        <i className="fa-regular fa-calendar-check"></i> Hiệu lực: {selectedCountry.validity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Categories of Legal Documents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  
                  {/* Category 1: Personal */}
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.86rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-id-card"></i> 1. Hồ Sơ Nhân Thân &amp; Pháp Lý
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.84rem', color: '#334155' }}>
                      {selectedCountry.personalDocs.map((doc, idx) => (
                        <li key={idx} style={{ lineHeight: 1.45 }}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Category 2: Employment */}
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.86rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-briefcase"></i> 2. Hồ Sơ Chứng Minh Công Việc
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.84rem', color: '#334155' }}>
                      {selectedCountry.workDocs.map((doc, idx) => (
                        <li key={idx} style={{ lineHeight: 1.45 }}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Category 3: Financial */}
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.86rem', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-vault"></i> 3. Hồ Sơ Năng Lực Tài Chính &amp; Tài Sản
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.84rem', color: '#334155' }}>
                      {selectedCountry.financeDocs.map((doc, idx) => (
                        <li key={idx} style={{ lineHeight: 1.45 }}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Special Notes & Authority Citation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <i className="fa-solid fa-certificate" style={{ color: '#059669', fontSize: '1.1rem', marginTop: '2px' }}></i>
                    <div style={{ fontSize: '0.83rem', color: '#065f46', lineHeight: 1.45 }}>
                      <strong>Quyền lợi bảo lãnh WebTravel:</strong> {selectedCountry.specialNotes}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    <i className="fa-solid fa-scale-balanced"></i> Căn cứ pháp lý: {selectedCountry.officialSource}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. TAB LUGGAGE */}
          {activeTab === 'luggage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {LUGGAGE_RULES_DATA.map((rule, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                        <i className={rule.icon}></i>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{rule.type}</h3>
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                      {rule.weightLimit}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.83rem', color: '#475569', fontWeight: 600 }}>
                    <i className="fa-solid fa-ruler-combined" style={{ color: 'var(--accent-emerald)' }}></i> {rule.dimensions}
                  </p>

                  {/* Allowed vs Prohibited Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '0.9rem', border: '1px solid #bbf7d0' }}>
                      <h5 style={{ margin: '0 0 0.5rem', color: '#166534', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-circle-check"></i> ĐƯỢC PHÉP MANG THEO:
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.81rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {rule.allowedItems.map((item, i) => (
                          <li key={i} style={{ lineHeight: 1.4 }}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '0.9rem', border: '1px solid #fecaca' }}>
                      <h5 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> CẤM MANG THEO &amp; NGUY HIỂM:
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.81rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {rule.prohibitedItems.map((item, i) => (
                          <li key={i} style={{ lineHeight: 1.4 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: 'var(--accent-emerald)' }}></i> <strong>Lưu ý từ Cục Hàng Không:</strong> {rule.notice}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. TAB POLICIES */}
          {activeTab === 'policies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {POLICIES_DATA.map((policy, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                        <i className={policy.icon}></i>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{policy.title}</h3>
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                      {policy.badge}
                    </span>
                  </div>

                  <ul style={{ margin: '0 0 0.85rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {policy.details.map((detail, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.45 }}>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.79rem', color: '#64748b' }}>
                    <strong>Điều khoản thi hành:</strong> {policy.terms}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}>
          <span style={{ color: '#64748b' }}>
            <i className="fa-solid fa-headset" style={{ color: 'var(--accent-emerald)' }}></i> Tư vấn hồ sơ visa 1-1 miễn phí: <strong>1800 646 888</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
          >
            Đã Hiểu &amp; Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
