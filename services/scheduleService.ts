import { supabase } from './supabaseClient';
import {
  ClassEvent,
  SupabaseScheduleRow,
  ScheduleData,
  WeekSchedule,
  ClassItem,
} from '../types';
import {
  getCachedSchedule,
  setCachedSchedule,
  isCacheValid,
} from './cacheManager';
import { transformSupabaseToClassEvents } from './transformers';
import { ERROR_MESSAGES } from '../constants/errorMessages';

// Re-export ERROR_MESSAGES for backward compatibility
export { ERROR_MESSAGES };

/**
 * Fetches schedule data for a specific group and week with cache-first strategy
 * @param groupId - The group identifier
 * @param weekId - The week identifier
 * @returns Promise resolving to array of ClassEvent objects
 * @throws Error with user-friendly message if fetch fails and no cache available
 */
/**
 * Znajduje najbliższy dostępny tydzień w bazie na podstawie daty
 * @param availableWeeks - Dostępne klucze tygodni z bazy (np. ["735", "736", "737"])
 * @param targetDate - Data dla której szukamy tygodnia
 * @returns Klucz najbliższego tygodnia lub pierwszy dostępny
 */
function findClosestWeek(availableWeeks: string[], targetDate: Date): string {
  if (availableWeeks.length === 0) {
    throw new Error('No weeks available');
  }
  
  // Na razie zwróć pierwszy dostępny tydzień
  // TODO: Można by parsować week_label i znaleźć najbliższy
  return availableWeeks[0];
}

export async function fetchScheduleForWeek(
  groupId: number,
  weekId?: number
): Promise<ClassEvent[]> {
  try {
    // Step 1: Check cache first (tylko jeśli mamy weekId)
    const cachedData = weekId ? getCachedSchedule(groupId, weekId) : null;
    
    // Step 2: If offline, use cache immediately
    if (!navigator.onLine) {
      if (cachedData) {
        console.log('Offline mode: using cached data');
        return cachedData;
      }
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }
    
    // Step 3: Fetch from Supabase to check if we need fresh data
    console.log('🔍 Fetching from Supabase:', { groupId, weekId });
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('group_id', groupId)
      .single();

    console.log('📊 Supabase response:', { data: !!data, error, groupId });

    if (error) {
      // Network error - fallback to cache if available
      if (cachedData) {
        console.warn('Supabase fetch failed, using cache:', error);
        return cachedData;
      }
      throw new Error(ERROR_MESSAGES.FETCH_FAILED);
    }

    if (!data) {
      throw new Error(ERROR_MESSAGES.INVALID_GROUP);
    }

    const scheduleRow = data as SupabaseScheduleRow;
    
    const availableWeeks = scheduleRow.data?.weeks ? Object.keys(scheduleRow.data.weeks) : [];
    
    console.log('📋 Schedule row:', {
      group_id: scheduleRow.group_id,
      group_name: scheduleRow.group_name,
      hasData: !!scheduleRow.data,
      hasWeeks: !!scheduleRow.data?.weeks,
      availableWeeks
    });

    if (availableWeeks.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_DATA);
    }

    // Jeśli nie podano weekId lub nie ma danych dla tego tygodnia, użyj pierwszego dostępnego
    let actualWeekKey: string;
    if (!weekId || !scheduleRow.data.weeks[weekId.toString()]) {
      actualWeekKey = availableWeeks[0];
      console.log('🔄 Using first available week:', actualWeekKey);
    } else {
      actualWeekKey = weekId.toString();
    }

    // Step 4: Validate cache against server timestamp
    const actualWeekId = parseInt(actualWeekKey, 10);
    const actualCachedData = getCachedSchedule(groupId, actualWeekId);
    
    if (actualCachedData && isCacheValid(groupId, actualWeekId, scheduleRow.updated_at)) {
      console.log('✅ Using valid cache for week', actualWeekId);
      return actualCachedData;
    }

    // Step 5: Extract week data from JSON
    const weekData = scheduleRow.data.weeks[actualWeekKey];
    
    console.log('🗓️ Week data for week', actualWeekKey, ':', !!weekData);
    
    if (!weekData) {
      console.warn('⚠️ No data for week', actualWeekKey);
      throw new Error(ERROR_MESSAGES.NO_DATA);
    }

    // Step 6: Transform data to ClassEvent format
    const events: ClassEvent[] = [];
    
    for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
      if (Array.isArray(classItems) && classItems.length > 0) {
        const dayEvents = await transformSupabaseToClassEvents(
          classItems,
          dayName,
          scheduleRow.group_name
        );
        events.push(...dayEvents);
      }
    }

    // Step 7: Cache the fresh data
    setCachedSchedule(groupId, actualWeekId, events, scheduleRow.updated_at);

    return events;
  } catch (error) {
    // Final fallback to cache on any error
    const cachedData = getCachedSchedule(groupId, weekId);
    if (cachedData) {
      console.warn('Error fetching schedule, using cache:', error);
      return cachedData;
    }

    // Re-throw if it's already a user-friendly error
    if (error instanceof Error && Object.values(ERROR_MESSAGES).some(msg => msg === error.message)) {
      throw error;
    }

    // Generic error for unexpected issues
    console.error('Unexpected error in fetchScheduleForWeek:', error);
    throw new Error(ERROR_MESSAGES.FETCH_FAILED);
  }
}
