import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface HeroGalleryProps {
  tour: Tour;
}

export const HeroGallery: React.FC<HeroGalleryProps> = ({ tour }) => {
  const images = tour.gallery && tour.gallery.length > 0 
    ? tour.gallery 
    : [{ url: tour.image, title: tour.title }];

  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="detail-gallery-container">
      {/* Featured Main Image Showcase */}
      <div className="gallery-main-img-wrap">
        <img 
          id="gallery-main-display"
          src={images[activeIdx]?.url || tour.image} 
          alt={images[activeIdx]?.title || tour.title} 
        />
        <div className="gallery-main-caption">
          <span id="gallery-caption-text">
            <i className="fa-solid fa-camera" style={{ marginRight: '0.4rem', color: 'var(--accent-mint)' }}></i>
            {images[activeIdx]?.title || tour.title}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
            {activeIdx + 1} / {images.length} Ảnh
          </span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="gallery-thumbs-row">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`gallery-thumb-item ${idx === activeIdx ? 'active' : ''}`}
              onClick={() => setActiveIdx(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Xem ảnh: ${img.title || `Ảnh ${idx + 1}`}`}
            >
              <img src={img.url} alt={img.title || tour.title} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
