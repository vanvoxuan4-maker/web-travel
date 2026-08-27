import { useState, useMemo } from 'react';
import { TOURS_DATA } from '../data/toursData';
import { Tour, TravelStyle, TourTheme } from '../types/tour.types';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'duration-asc' | 'newest';
export type DurationFilter = 'all' | '1-3' | '4-6' | '7+';
export type RatingFilter = 'all' | '4+' | '4.5+';

export function useTourFilter(sourceTours?: Tour[]) {
  const [keyword, setKeyword] = useState('');
  const [departure, setDeparture] = useState('all');
  const [category, setCategory] = useState<'all' | 'domestic' | 'international'>('all');
  const [travelStyle, setTravelStyle] = useState<'all' | TravelStyle>('all');
  const [theme, setTheme] = useState<'all' | TourTheme>('all');
  const [starTier, setStarTier] = useState<'all' | 'budget' | 'standard' | 'luxury'>('all');
  // New extended filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50_000_000]);
  const [duration, setDuration] = useState<DurationFilter>('all');
  const [rating, setRating] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const tourList = sourceTours && sourceTours.length > 0 ? sourceTours : TOURS_DATA;

  const filteredTours = useMemo(() => {
    let result = tourList.filter((tour: Tour) => {
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

      // Price range filter
      const tourPrice = tour.priceAdult;
      const matchPrice = tourPrice >= priceRange[0] && tourPrice <= priceRange[1];

      // Duration filter
      const days = tour.durationDays;
      const matchDuration =
        duration === 'all' ||
        (duration === '1-3' && days >= 1 && days <= 3) ||
        (duration === '4-6' && days >= 4 && days <= 6) ||
        (duration === '7+' && days >= 7);

      // Rating filter
      const tourRating = tour.rating ?? 0;
      const matchRating =
        rating === 'all' ||
        (rating === '4+' && tourRating >= 4) ||
        (rating === '4.5+' && tourRating >= 4.5);

      return matchKeyword && matchDeparture && matchCategory && matchStyle && matchTheme && matchTier && matchPrice && matchDuration && matchRating;
    });

    // Apply sort
    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.priceAdult - b.priceAdult);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.priceAdult - a.priceAdult);
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'duration-asc':
        result = [...result].sort((a, b) => a.durationDays - b.durationDays);
        break;
      case 'newest':
        // Use id as proxy for recency (higher id = newer)
        result = [...result].sort((a, b) => b.id.localeCompare(a.id));
        break;
      default:
        break;
    }

    return result;
  }, [tourList, keyword, departure, category, travelStyle, theme, starTier, priceRange, duration, rating, sortBy]);

  // Count active filters (excluding keyword and sortBy)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (departure !== 'all') count++;
    if (category !== 'all') count++;
    if (travelStyle !== 'all') count++;
    if (theme !== 'all') count++;
    if (starTier !== 'all') count++;
    if (duration !== 'all') count++;
    if (rating !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < 50_000_000) count++;
    return count;
  }, [departure, category, travelStyle, theme, starTier, duration, rating, priceRange]);

  const resetAllFilters = () => {
    setKeyword('');
    setDeparture('all');
    setCategory('all');
    setTravelStyle('all');
    setTheme('all');
    setStarTier('all');
    setPriceRange([0, 50_000_000]);
    setDuration('all');
    setRating('all');
    setSortBy('default');
  };

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
    // Extended
    priceRange,
    setPriceRange,
    duration,
    setDuration,
    rating,
    setRating,
    sortBy,
    setSortBy,
    // Helpers
    activeFilterCount,
    resetAllFilters,
    filteredTours,
  };
}
