import { TOURS_DATA } from '../data/toursData';
import { DepartureDate } from '../types/tour.types';

const INVENTORY_STORAGE_KEY = 'webtravel_tours_inventory_v1';
let inMemoryStore: Record<string, Record<string, number>> | null = null;

/**
 * Initialize and get the inventory store from localStorage or initial defaults
 */
function getInventoryStore(): Record<string, Record<string, number>> {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Cannot read inventory from localStorage:', e);
    }
  } else if (inMemoryStore) {
    return inMemoryStore;
  }

  // Generate initial default inventory from TOURS_DATA
  const initialStore: Record<string, Record<string, number>> = {};
  TOURS_DATA.forEach(tour => {
    initialStore[tour.id] = {};
    if (tour.departureDates && tour.departureDates.length > 0) {
      tour.departureDates.forEach(dep => {
        initialStore[tour.id][dep.date] = dep.seats !== undefined ? dep.seats : (tour.seatsLeft || 5);
      });
    } else {
      const dates = tour.availableDates || ['12/09/2026', '19/09/2026', '26/09/2026', '10/10/2026'];
      dates.forEach((dStr, idx) => {
        let seats = tour.seatsLeft || 5;
        if (idx === 1) seats = 2;
        if (idx === 2) seats = 8;
        if (idx === 3) seats = 0;
        if (idx === 4) seats = 6;
        initialStore[tour.id][dStr] = seats;
      });
    }
  });

  saveInventoryStore(initialStore);
  return initialStore;
}

function saveInventoryStore(store: Record<string, Record<string, number>>): void {
  inMemoryStore = store;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('Cannot save inventory to localStorage:', e);
    }
  }
}

/**
 * Get remaining seats for a specific tour and departure date
 */
export function getRemainingSeats(tourId: string, date: string): number {
  const store = getInventoryStore();
  if (store[tourId] && store[tourId][date] !== undefined) {
    return store[tourId][date];
  }
  return 5; // Default fallback
}

/**
 * Get adult price for a specific tour on a given departure date
 */
export function getDatePrice(tourId: string, date: string, tourObj?: any): number {
  const tour = tourObj || TOURS_DATA.find(t => t.id === tourId);
  if (!tour) return 13590000;
  if (tour.departureDates && tour.departureDates.length > 0) {
    const matched = tour.departureDates.find((d: any) => d.date === date);
    if (matched && matched.priceAdult) {
      return matched.priceAdult;
    }
  }
  return tour.priceAdult || 13590000;
}

/**
 * Get promotional/holiday label for a specific tour departure date
 */
export function getDateLabel(tourId: string, date: string, tourObj?: any): string | null {
  const tour = tourObj || TOURS_DATA.find(t => t.id === tourId);
  if (!tour || !tour.departureDates) return null;
  const matched = tour.departureDates.find((d: any) => d.date === date);
  return matched ? matched.label : null;
}

export interface DateDetailResult extends DepartureDate {
  dayOfWeek: string;
  monthLabel: string;
  sku: string;
  priceAdult: number;
  priceChild: number;
  priceToddler: number;
  priceInfant: number;
  singleRoomSurcharge: number;
  seats: number;
}

/**
 * Get comprehensive departure date object with transport and price breakdown
 */
export function getDateDetails(tourId: string, date: string, tourObj?: any): DateDetailResult | null {
  const tour = tourObj || TOURS_DATA.find(t => t.id === tourId);
  if (!tour) return null;
  
  let matched: DepartureDate | undefined = undefined;
  if (tour.departureDates && tour.departureDates.length > 0) {
    matched = tour.departureDates.find((d: any) => d.date === date);
  }

  const priceAdult = (matched && matched.priceAdult) || tour.priceAdult || 5800000;
  const priceChild = (matched && matched.priceChild) || Math.round(priceAdult * 0.75);
  const priceToddler = (matched && matched.priceToddler) || Math.round(priceAdult * 0.5);
  const priceInfant = (matched && matched.priceInfant) || tour.priceInfant || 500000;
  const singleRoomSurcharge = (matched && matched.singleRoomSurcharge) || 800000;
  const seats = getRemainingSeats(tourId, date);

  return {
    date: date,
    dayOfWeek: matched && matched.dayOfWeek ? matched.dayOfWeek : 'T5',
    monthLabel: matched && matched.monthLabel ? matched.monthLabel : 'Tháng 9 2026',
    sku: matched && matched.sku ? matched.sku : (tour.sku ? `${tour.sku}-001-${date.replace(/\//g, '')}VN` : `WT-${tour.code || '01'}`),
    priceAdult,
    priceChild,
    priceToddler,
    priceInfant,
    singleRoomSurcharge,
    seats,
    label: matched ? matched.label : null,
    transport: matched && matched.transport ? matched.transport : {
      outbound: { date: date, time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN' },
      inbound: { date: date, time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN' }
    }
  };
}

/**
 * Deduct seats from inventory when booking is confirmed
 */
export function deductSeats(tourId: string, date: string, count: number): boolean {
  const store = getInventoryStore();
  if (!store[tourId]) store[tourId] = {};
  const current = store[tourId][date] !== undefined ? store[tourId][date] : 5;
  const newCount = Math.max(0, current - count);
  store[tourId][date] = newCount;
  saveInventoryStore(store);
  return true;
}

/**
 * Reset inventory back to defaults (for testing purposes)
 */
export function resetInventory(): Record<string, Record<string, number>> {
  inMemoryStore = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(INVENTORY_STORAGE_KEY);
  }
  return getInventoryStore();
}
