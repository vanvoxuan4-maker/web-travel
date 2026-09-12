import { TOURS_DATA } from '../data/toursData';
import { DepartureDate } from '../types/tour.types';
import { tourService } from '../services/tourService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { toIsoDate } from './formatters';

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
 * Synchronize and update local inventory for a specific tour's departure dates
 * (called when admin saves new schedule or seats in AdminPortal)
 */
export function updateTourInventory(tourId: string, departureDates: DepartureDate[]): void {
  const store = getInventoryStore();
  if (!store[tourId]) store[tourId] = {};
  departureDates.forEach(d => {
    store[tourId][d.date] = d.seats !== undefined ? d.seats : 5;
  });
  saveInventoryStore(store);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webtravel:inventory_updated', {
      detail: { tourId, departureDates }
    }));
  }
}

/**
 * Get remaining seats for a specific tour and departure date
 */
export function getRemainingSeats(tourId: string, date: string, tourObj?: any): number {
  const store = getInventoryStore();
  const isoDate = toIsoDate(date);
  if (store[tourId]) {
    if (store[tourId][isoDate] !== undefined) return store[tourId][isoDate];
    if (store[tourId][date] !== undefined) return store[tourId][date];
  }

  // Fallback: check departureDates directly from tour object or tour cache
  const tour = tourObj || tourService.getTourByIdSync(tourId) || TOURS_DATA.find(t => t.id === tourId);
  if (tour && tour.departureDates && tour.departureDates.length > 0) {
    const matched = tour.departureDates.find((d: any) => toIsoDate(d.date) === isoDate || d.date === date);
    if (matched && matched.seats !== undefined) {
      if (!store[tourId]) store[tourId] = {};
      store[tourId][isoDate] = matched.seats;
      saveInventoryStore(store);
      return matched.seats;
    }
  }

  return tour?.seatsLeft ?? 5; // Default fallback
}

/**
 * Get adult price for a specific tour on a given departure date
 */
export function getDatePrice(tourId: string, date: string, tourObj?: any): number {
  const tour = tourObj || tourService.getTourByIdSync(tourId) || TOURS_DATA.find(t => t.id === tourId);
  if (!tour) return 13590000;
  if (tour.departureDates && tour.departureDates.length > 0) {
    const isoDate = toIsoDate(date);
    const matched = tour.departureDates.find((d: any) => toIsoDate(d.date) === isoDate || d.date === date);
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
  const tour = tourObj || tourService.getTourByIdSync(tourId) || TOURS_DATA.find(t => t.id === tourId);
  if (!tour || !tour.departureDates) return null;
  const isoDate = toIsoDate(date);
  const matched = tour.departureDates.find((d: any) => toIsoDate(d.date) === isoDate || d.date === date);
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
  const tour = tourObj || tourService.getTourByIdSync(tourId) || TOURS_DATA.find(t => t.id === tourId);
  if (!tour) return null;
  
  const isoDate = toIsoDate(date);
  let matched: DepartureDate | undefined = undefined;
  if (tour.departureDates && tour.departureDates.length > 0) {
    matched = tour.departureDates.find((d: any) => toIsoDate(d.date) === isoDate || d.date === date);
  }

  const priceAdult = (matched && matched.priceAdult) || tour.priceAdult || 5800000;
  const priceChild = (matched && matched.priceChild) || Math.round(priceAdult * 0.75);
  const priceToddler = (matched && matched.priceToddler) || Math.round(priceAdult * 0.5);
  const priceInfant = (matched && matched.priceInfant) || tour.priceInfant || 500000;
  const singleRoomSurcharge = (matched && matched.singleRoomSurcharge) || 800000;
  const seats = getRemainingSeats(tourId, date, tour);

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
 * Deduct seats from the local client-side inventory store.
 *
 * Phase 1 (Scalability Patch): Supabase seat deduction is now handled
 * atomically by the DB trigger `fn_manage_departure_seats` (AFTER INSERT on
 * bookings) which uses SELECT FOR UPDATE row-level locking to prevent
 * overbooking race conditions. A separate client-side Supabase UPDATE is no
 * longer needed and would cause double-deduction.
 */
export function deductSeats(tourId: string, date: string, count: number): boolean {
  const store = getInventoryStore();
  if (!store[tourId]) store[tourId] = {};
  const isoDate = toIsoDate(date);
  const current = store[tourId][isoDate] !== undefined
    ? store[tourId][isoDate]
    : (store[tourId][date] !== undefined ? store[tourId][date] : 5);
  const newCount = Math.max(0, current - count);
  store[tourId][isoDate] = newCount;
  store[tourId][date] = newCount;
  saveInventoryStore(store);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webtravel:realtime_seats', {
      detail: { tourId, date: isoDate, seats: newCount }
    }));
  }

  return true;
}

/**
 * Restore seats to the local client-side inventory store.
 *
 * Phase 1 (Scalability Patch): Supabase seat restoration on cancellation is
 * now handled atomically by the DB trigger `fn_manage_departure_seats` (AFTER
 * UPDATE on bookings when booking_status → 'cancelled'). A separate
 * client-side Supabase UPDATE is no longer needed.
 */
export function restoreSeats(tourId: string, date: string, count: number): boolean {
  if (!tourId || !date || count <= 0) return false;
  const store = getInventoryStore();
  if (!store[tourId]) store[tourId] = {};
  const isoDate = toIsoDate(date);
  const current = store[tourId][isoDate] !== undefined
    ? store[tourId][isoDate]
    : (store[tourId][date] !== undefined ? store[tourId][date] : 0);
  const newCount = current + count;
  store[tourId][isoDate] = newCount;
  store[tourId][date] = newCount;
  saveInventoryStore(store);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webtravel:realtime_seats', {
      detail: { tourId, date: isoDate, seats: newCount }
    }));
  }

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

/**
 * Sync explicit seat allotment directly to Supabase
 */
export async function syncSeatsToSupabase(tourId: string, date: string, seats: number): Promise<boolean> {
  const store = getInventoryStore();
  if (!store[tourId]) store[tourId] = {};
  const isoDate = toIsoDate(date);
  store[tourId][isoDate] = Math.max(0, seats);
  store[tourId][date] = Math.max(0, seats);
  saveInventoryStore(store);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('departure_dates')
        .select('id')
        .eq('tour_id', tourId)
        .eq('date', isoDate)
        .maybeSingle();

      if (!error && data) {
        await supabase
          .from('departure_dates')
          .update({
            available_seats: Math.max(0, seats),
            status: seats <= 0 ? 'sold_out' : seats <= 5 ? 'few_seats' : 'available'
          })
          .eq('id', data.id);
      }
      return true;
    } catch (err) {
      console.warn('Could not sync seats allotment to Supabase:', err);
      return false;
    }
  }

  return true;
}

/**
 * Fetch real-time available seats from Supabase, with local fallback
 */
export async function fetchSeatsFromSupabase(tourId: string, date: string): Promise<number> {
  const isoDate = toIsoDate(date);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('departure_dates')
        .select('available_seats')
        .eq('tour_id', tourId)
        .eq('date', isoDate)
        .maybeSingle();

      if (!error && data && typeof data.available_seats === 'number') {
        const store = getInventoryStore();
        if (!store[tourId]) store[tourId] = {};
        store[tourId][isoDate] = data.available_seats;
        store[tourId][date] = data.available_seats;
        saveInventoryStore(store);
        return data.available_seats;
      }
    } catch (err) {
      console.warn('Could not fetch seats from Supabase:', err);
    }
  }

  return getRemainingSeats(tourId, date);
}

/**
 * Subscribe to Supabase Realtime changes on departure_dates for a specific tourId.
 * Cập nhật inventoryStore ngay khi DB có thay đổi, đồng thời dispatch
 * CustomEvent 'webtravel:realtime_seats' để TourDetailPage / CheckoutPage re-render.
 *
 * @param tourId  ID của tour cần theo dõi
 * @returns Hàm unsubscribe — gọi trong cleanup của useEffect
 */
export function subscribeToSeatUpdates(tourId: string): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}; // no-op khi chưa có Supabase
  }

  const channelName = `departure_seats_${tourId}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'departure_dates',
        filter: `tour_id=eq.${tourId}`
      },
      (payload: any) => {
        const { date, available_seats } = payload.new || {};
        if (!date || available_seats === undefined) return;

        const seatsNum = Number(available_seats);

        // 1. Ghi vào inventoryStore (ghi đè localStorage)
        const store = getInventoryStore();
        if (!store[tourId]) store[tourId] = {};
        store[tourId][date] = seatsNum;
        saveInventoryStore(store);

        // 2. Phát CustomEvent để mọi React component đang mount đều nhận được
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('webtravel:realtime_seats', {
            detail: { tourId, date, seats: seatsNum }
          }));
        }
      }
    )
    .subscribe();

  // Trả về hàm cleanup
  return () => {
    supabase?.removeChannel(channel);
  };
}

/**
 * Fetch toàn bộ số ghế mới nhất từ Supabase cho tất cả ngày của một tour.
 * Gọi 1 lần khi component mount để khởi tạo inventoryStore chính xác từ DB.
 *
 * @param tourId ID của tour cần đồng bộ
 */
export async function syncAllSeatsFromSupabase(tourId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data, error } = await supabase
      .from('departure_dates')
      .select('date, available_seats')
      .eq('tour_id', tourId);

    if (error || !data) return;

    const store = getInventoryStore();
    if (!store[tourId]) store[tourId] = {};

    data.forEach((row: any) => {
      if (row.date && typeof row.available_seats === 'number') {
        store[tourId][row.date] = row.available_seats;
      }
    });

    saveInventoryStore(store);

    // Phát event để trigger re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webtravel:inventory_synced', {
        detail: { tourId }
      }));
    }
  } catch (err) {
    console.warn('syncAllSeatsFromSupabase failed:', err);
  }
}

/**
 * Calculate total available seats left for a tour across all departures
 */
export function getTotalSeatsLeft(tour: any): number {
  if (!tour) return 0;
  if (Array.isArray(tour.departureDates) && tour.departureDates.length > 0) {
    return tour.departureDates.reduce((sum: number, d: any) => sum + (Number(d.seats) || 0), 0);
  }
  return Number(tour.seatsLeft) || 15;
}
