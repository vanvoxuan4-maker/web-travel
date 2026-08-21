import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Tour } from '../types/tour.types';
import { TOURS_DATA } from '../data/toursData';

/**
 * Service to fetch and manage tours from Supabase with safe fallback
 */
export const tourService = {
  /**
   * Fetch all tours
   */
  async getAllTours(): Promise<Tour[]> {
    if (!isSupabaseConfigured || !supabase) {
      return TOURS_DATA;
    }

    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('Supabase tours fetch returned empty or error, falling back to local dataset:', error?.message);
        return TOURS_DATA;
      }

      return data as Tour[];
    } catch (err) {
      console.error('Error fetching tours from Supabase:', err);
      return TOURS_DATA;
    }
  },

  /**
   * Get single tour by ID
   */
  async getTourById(id: string): Promise<Tour | undefined> {
    if (!isSupabaseConfigured || !supabase) {
      return TOURS_DATA.find(t => t.id === id);
    }

    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return TOURS_DATA.find(t => t.id === id);
      }

      return data as Tour;
    } catch (err) {
      console.error(`Error fetching tour ${id} from Supabase:`, err);
      return TOURS_DATA.find(t => t.id === id);
    }
  }
};
