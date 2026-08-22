import { useState, useMemo } from 'react';
import { TOURS_DATA } from '../data/toursData';
import { Tour, TravelStyle, TourTheme } from '../types/tour.types';

export function useTourFilter(sourceTours?: Tour[]) {
  const [keyword, setKeyword] = useState('');
  const [departure, setDeparture] = useState('all');
  const [category, setCategory] = useState<'all' | 'domestic' | 'international'>('all');
  const [travelStyle, setTravelStyle] = useState<'all' | TravelStyle>('all');
  const [theme, setTheme] = useState<'all' | TourTheme>('all');
  const [starTier, setStarTier] = useState<'all' | 'budget' | 'standard' | 'luxury'>('all');

  const tourList = sourceTours && sourceTours.length > 0 ? sourceTours : TOURS_DATA;

  const filteredTours = useMemo(() => {
    return tourList.filter((tour: Tour) => {
      // Exclude inactive / hidden tours from public filter
      if (tour.isActive === false) return false;

      const matchKeyword = !keyword.trim() || 
        tour.title.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        tour.destination.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        tour.code.toLowerCase().includes(keyword.toLowerCase().trim());

      const matchDeparture = departure === 'all' || 
        tour.departureFrom.toLowerCase().includes(departure.toLowerCase());

      const matchCategory = category === 'all' || tour.category === category;

      const matchStyle = travelStyle === 'all' || tour.travelStyle === travelStyle;

      const matchTheme = theme === 'all' || tour.theme === theme;

      const matchTier = starTier === 'all' || 
        (tour.starCategory || tour.tier) === starTier;

      return matchKeyword && matchDeparture && matchCategory && matchStyle && matchTheme && matchTier;
    });
  }, [tourList, keyword, departure, category, travelStyle, theme, starTier]);

  return {
    keyword,
    setKeyword,
    departure,
    setDeparture,
    category,
    setCategory,
    travelStyle,
    setTravelStyle,
    theme,
    setTheme,
    starTier,
    setStarTier,
    filteredTours
  };
}
