import { useState, useMemo } from 'react';
import { TOURS_DATA } from '../data/toursData';
import { Tour } from '../types/tour.types';

export function useTourFilter() {
  const [keyword, setKeyword] = useState('');
  const [departure, setDeparture] = useState('all');
  const [category, setCategory] = useState<'all' | 'domestic' | 'international'>('all');
  const [starTier, setStarTier] = useState<'all' | 'budget' | 'standard' | 'luxury'>('all');

  const filteredTours = useMemo(() => {
    return TOURS_DATA.filter((tour: Tour) => {
      const matchKeyword = !keyword.trim() || 
        tour.title.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        tour.destination.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        tour.code.toLowerCase().includes(keyword.toLowerCase().trim());

      const matchDeparture = departure === 'all' || 
        tour.departureFrom.toLowerCase().includes(departure.toLowerCase());

      const matchCategory = category === 'all' || tour.category === category;

      const matchTier = starTier === 'all' || 
        (tour.starCategory || tour.tier) === starTier;

      return matchKeyword && matchDeparture && matchCategory && matchTier;
    });
  }, [keyword, departure, category, starTier]);

  return {
    keyword,
    setKeyword,
    departure,
    setDeparture,
    category,
    setCategory,
    starTier,
    setStarTier,
    filteredTours
  };
}
