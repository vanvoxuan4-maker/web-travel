/** hotelAndPolicies.js - FAQs accordion, service accordion, scroll-spy tabs. */
export function initHotelAndPolicies() {
  // 3. FAQs Accordion Toggle
  document.querySelectorAll('.faq-header-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-faq');
      const body = document.getElementById(`faq-body-${idx}`);
      const chevron = e.currentTarget.querySelector('.faq-chevron');

      if (body) {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        if (chevron) {
          chevron.className = isHidden ? 'fa-solid fa-chevron-up faq-chevron' : 'fa-solid fa-chevron-down faq-chevron';
        }
      }
    });
  });

  // 4. Service Accordion Toggle (Inclusions & Exclusions)
  document.querySelectorAll('.service-accordion-header').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.service-accordion-card');
      const targetId = e.currentTarget.getAttribute('data-target');
      const body = document.getElementById(targetId);

      if (card && body) {
        const isOpen = card.classList.contains('open');
        if (isOpen) {
          card.classList.remove('open');
          body.style.display = 'none';
        } else {
          card.classList.add('open');
          body.style.display = 'block';
        }
      }
    });
  });

  // 5. Sticky Tabs Active State Tracking on Scroll
  const tabLinks = document.querySelectorAll('.detail-tab-link');
  const sections = ['section-schedule', 'section-highlights', 'section-hotel', 'section-itinerary', 'section-services', 'section-policy', 'section-faqs'];

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom >= 160) {
          currentSectionId = id;
        }
      }
    });

    if (currentSectionId) {
      tabLinks.forEach(link => {
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });
}
