/** galleryManager.js - Gallery thumbnail switcher. */
export function initGalleryManager() {
  const mainImg = document.getElementById('gallery-main-display');
  const captionText = document.getElementById('gallery-caption-text');
  document.querySelectorAll('.gallery-thumb-item').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      document.querySelectorAll('.gallery-thumb-item').forEach(t => t.classList.remove('active'));
      const item = e.currentTarget;
      item.classList.add('active');
      const url = item.getAttribute('data-url');
      const title = item.getAttribute('data-title');

      if (mainImg) {
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = url;
          mainImg.style.opacity = '1';
        }, 150);
      }
      if (captionText) captionText.textContent = title;
    });
  });
}
