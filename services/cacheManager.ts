import { ClassEvent, CacheEntry } from '../types';

const CACHE_KEY_PREFIX = 'schedule_cache';

/**
 * Generates cache key for a specific group and week
 */
function getCacheKey(groupId: number, weekId: number): string {
  return `${CACHE_KEY_PREFIX}_${groupId}_${weekId}`;
}

/**
 * Retrieves cached schedule data for a specific group and week
 * @param groupId - The group identifier
 * @param weekId - The week identifier
 * @returns Cached ClassEvent array or null if not found
 */
export function getCachedSchedule(
  groupId: number,
  weekId: number
): ClassEvent[] | null {
  try {
    const key = getCacheKey(groupId, weekId);
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry = JSON.parse(cached);
    return entry.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Saves schedule data to cache with timestamp
 * @param groupId - The group identifier
 * @param weekId - The week identifier
 * @param data - Array of ClassEvent to cache
 * @param updatedAt - Server timestamp from Supabase
 */
export function setCachedSchedule(
  groupId: number,
  weekId: number,
  data: ClassEvent[],
  updatedAt: string
): void {
  try {
    const key = getCacheKey(groupId, weekId);
    const entry: CacheEntry = {
      data,
      updatedAt,
      cachedAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Checks if cached data is still valid by comparing timestamps
 * @param groupId - The group identifier
 * @param weekId - The week identifier
 * @param serverUpdatedAt - Server timestamp from Supabase
 * @returns true if cache is valid, false otherwise
 */
export function isCacheValid(
  groupId: number,
  weekId: number,
  serverUpdatedAt: string
): boolean {
  try {
    const key = getCacheKey(groupId, weekId);
    const cached = localStorage.getItem(key);

    if (!cached) {
      return false;
    }

    const entry: CacheEntry = JSON.parse(cached);
    const cachedTime = new Date(entry.updatedAt).getTime();
    const serverTime = new Date(serverUpdatedAt).getTime();

    return cachedTime >= serverTime;
  } catch (error) {
    console.error('Error validating cache:', error);
    return false;
  }
}

/**
 * Clears all cached schedule data
 */
export function clearCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    cacheKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
