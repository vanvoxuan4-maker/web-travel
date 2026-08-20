import { openBookingModal } from '../tools/bookingModal.js';

/**
 * Hero Background Travel Banner Carousel - WebTravel Editorial
 * Dynamically cross-fades full hero background image behind main title & search widget
 */
export function initHeroSlider() {
  const sliderContainer = document.getElementById('hero-slider');
  if (!sliderContainer) return;

  const slidesData = [
    {
      id: 'slide-halong',
      tourId: 'tour-halong-01',
      badge: '🔥 HOT DEAL MÙA HÈ',
      badgeStyle: 'badge-emerald',
      title: 'Khám Phá Thế Giới Theo Cách Của Bạn',
      offer: 'Vịnh Hạ Long: Du Thuyền 5 Sao Sang Trọng - Giảm 1.000.000 ₫ & Tặng Sunset Party tầng thượng',
      ctaText: 'Săn Deal Hạ Long 5★',
      image: './src/assets/images/banner_halong.png'
    },
    {
      id: 'slide-japan',
      tourId: 'tour-japan-04',
      badge: '🍂 MÙA THU NHẬT BẢN 2026',
      badgeStyle: 'badge-gold',
      title: 'Sắc Vàng Rực Rỡ Thu Cố Đồ Nhật Bản',
      offer: 'Tokyo - Phú Sĩ - Kyoto - Osaka: Miễn phí Visa & Tắm Onsen khoáng nóng Núi Phú Sĩ',
      ctaText: 'Khám Phá Nhật Bản',
      image: './src/assets/images/banner_japan.png'
    },
    {
      id: 'slide-phuquoc',
      tourId: 'tour-phuquoc-03',
      badge: '🏝️ LUXURY RESORT 5★',
      badgeStyle: 'badge-emerald',
      title: 'Thiên Đường Biển Đảo Phú Quốc & Hòn Thơm',
      offer: 'Nghỉ dưỡng Vinpearl 5★ - Tặng vé cáp treo Sun World & Xe điện đón Grand World',
      ctaText: 'Đặt Tour Phú Quốc',
      image: './src/assets/images/banner_phuquoc.png'
    }
  ];

  let currentIndex = 0;
  let autoPlayTimer = null;

  const bgSlides = document.querySelectorAll('.hero-bg-slide');
  const badgeEl = document.getElementById('hero-slide-badge');
  const offerEl = document.getElementById('hero-slide-offer');
  const ctaTextEl = document.getElementById('hero-cta-text');
  const ctaBtn = document.getElementById('hero-slide-cta');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  function updateSlide(index) {
    if (index < 0) index = slidesData.length - 1;
    if (index >= slidesData.length) index = 0;
    currentIndex = index;

    const data = slidesData[currentIndex];

    // 1. Cross-fade Background Slides
    bgSlides.forEach((slide, idx) => {
      if (idx === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // 2. Update Content Text & Badges smoothly
    if (badgeEl) {
      badgeEl.textContent = data.badge;
      badgeEl.className = `hero-promo-badge badge ${data.badgeStyle}`;
    }

    if (offerEl) {
      offerEl.style.opacity = '0';
      setTimeout(() => {
        offerEl.textContent = data.offer;
        offerEl.style.opacity = '1';
      }, 200);
    }

    if (ctaTextEl) {
      ctaTextEl.textContent = data.ctaText;
    }

    if (ctaBtn) {
      ctaBtn.setAttribute('data-tour-id', data.tourId);
    }

    // 3. Update Dots Active State
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      updateSlide(currentIndex + 1);
    }, 6000);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  }

  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateSlide(currentIndex - 1);
      startAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateSlide(currentIndex + 1);
      startAutoPlay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      updateSlide(idx);
      startAutoPlay();
    });
  });

  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      const tourId = e.currentTarget.getAttribute('data-tour-id') || slidesData[currentIndex].tourId;
      openBookingModal(tourId);
    });
  }

  // Pause autoplay on mouse hover over hero section
  sliderContainer.addEventListener('mouseenter', stopAutoPlay);
  sliderContainer.addEventListener('mouseleave', startAutoPlay);

  startAutoPlay();
}
