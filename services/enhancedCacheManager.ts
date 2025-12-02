import { storage, getJSON, setJSON } from './storage';

/**
 * Enhanced Cache Manager with TTL, LRU eviction, and metadata tracking
 * Implements intelligent cache management for the UniSchedule application
 */

// Cache configuration interface
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes (optional)
  priority: 'low' | 'medium' | 'high' | 'critical'; // Eviction priority
}

// Enhanced cache entry with metadata
export interface EnhancedCacheEntry<T> {
  data: T;
  timestamp: number; // When cached (Date.now())
  ttl: number; // TTL in milliseconds
  lastAccessed: number; // For LRU tracking
  size: number; // Approximate size in bytes
  priority: 'low' | 'medium' | 'high' | 'critical';
  serverTimestamp?: string; // Server's updated_at field
  version: number; // Cache format version
  key: string; // Cache key for reference
}

// Cache metadata for tracking overall cache state
export interface CacheMetadata {
  totalSize: number;
  entryCount: number;
  lastEviction?: number;
  hits?: number;
  misses?: number;
}

// Cache statistics interface
export interface CacheStatistics {
  totalSize: number;
  entryCount: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  lastEviction?: number;
}

// Cache health check result
export interface CacheHealthCheck {
  healthy: boolean;
  totalEntries: number;
  corruptedEntries: number;
  corruptedKeys: string[];
  issues: string[];
}

// Old cache format for migration
interface OldCacheEntry {
  data: any;
  timestamp?: number;
  // Old format may not have all fields
}

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  SCHEDULE: 30 * 60 * 1000, // 30 minutes
  FACULTIES: 24 * 60 * 60 * 1000, // 24 hours
  MAJORS: 12 * 60 * 60 * 1000, // 12 hours
  GROUPS: 6 * 60 * 60 * 1000, // 6 hours
  SELECTED_GROUP: Infinity, // Never expires
};

// Priority levels for eviction
export const CACHE_PRIORITY = {
  CRITICAL: 'critical' as const,
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const,
};

const CACHE_VERSION = 1;
const METADATA_KEY = 'enhanced_cache_metadata';
const CACHE_KEY_PREFIX = 'enhanced_cache_';

/**
 * Enhanced Cache Manager class
 * Provides TTL-based caching with LRU eviction and metadata tracking
 */
export class EnhancedCacheManager {
  private metadata: CacheMetadata = {
    totalSize: 0,
    entryCount: 0,
    hits: 0,
    misses: 0,
  };
  private metadataLoaded: Promise<void>;

  constructor() {
    this.metadataLoaded = this.loadMetadata();
  }

  /**
   * Load cache metadata from storage
   * Validates and repairs corrupted metadata
   */
  private async loadMetadata(): Promise<void> {
    try {
      const stored = await getJSON<CacheMetadata>(METADATA_KEY);
      if (stored) {
        // Validate and sanitize metadata
        this.metadata = {
          totalSize: this.sanitizeNumber(stored.totalSize, 0),
          entryCount: this.sanitizeNumber(stored.entryCount, 0),
          hits: this.sanitizeNumber(stored.hits, 0),
          misses: this.sanitizeNumber(stored.misses, 0),
          lastEviction: stored.lastEviction,
        };

        // If metadata was corrupted, recalculate it
        if (stored.totalSize !== this.metadata.totalSize || 
            stored.entryCount !== this.metadata.entryCount) {
          console.warn('Corrupted metadata detected, recalculating...');
          await this.recalculateMetadata();
        }
      }
    } catch (error) {
      console.error('Error loading cache metadata:', error);
      // Reset to safe defaults
      this.metadata = {
        totalSize: 0,
        entryCount: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * Sanitize a number value, replacing NaN/Infinity with default
   */
  private sanitizeNumber(value: any, defaultValue: number): number {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return Math.max(0, num);
  }

  /**
   * Get data from cache
   * Updates lastAccessed timestamp for LRU tracking
   */
  async get<T>(key: string): Promise<T | null> {
    await this.metadataLoaded;
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await getJSON<EnhancedCacheEntry<T>>(cacheKey);

      if (!entry) {
        // Track cache miss
        await this.trackMiss();
        return null;
      }

      // Track cache hit
      await this.trackHit();

      // Update lastAccessed for LRU tracking
      entry.lastAccessed = Date.now();
      await setJSON(cacheKey, entry);

      return entry.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      await this.trackMiss();
      return null;
    }
  }

  /**
   * Get data from cache with stale-while-revalidate pattern
   * Returns stale data immediately while triggering background refresh if online
   * 
   * @param key - Cache key
   * @param refreshFn - Function to fetch fresh data
   * @returns Cached data (may be stale) or null if not cached
   */
  async getWithRevalidate<T>(
    key: string,
    refreshFn: () => Promise<T>
  ): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await getJSON<EnhancedCacheEntry<T>>(cacheKey);

      if (!entry) {
        return null;
      }

      // Update lastAccessed for LRU tracking
      entry.lastAccessed = Date.now();
      await setJSON(cacheKey, entry);

      const now = Date.now();
      const age = now - entry.timestamp;
      const isStale = age > entry.ttl;

      // If stale and online, trigger background refresh
      if (isStale && this.isOnline()) {
        this.refreshInBackground(key, refreshFn, entry.ttl, entry.priority);
      }

      return entry.data;
    } catch (error) {
      console.error('Error reading from cache with revalidate:', error);
      return null;
    }
  }

  /**
   * Refresh cache entry in the background without blocking
   * Uses setTimeout to ensure it doesn't block the UI
   */
  private refreshInBackground<T>(
    key: string,
    refreshFn: () => Promise<T>,
    ttl: number,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    // Use setTimeout to ensure this runs asynchronously
    setTimeout(async () => {
      try {
        console.log(`Background refresh triggered for cache key: ${key}`);
        const freshData = await refreshFn();
        
        // Update cache with fresh data
        await this.set(key, freshData, { ttl, priority });
        console.log(`Background refresh completed for cache key: ${key}`);
      } catch (error) {
        console.error(`Background refresh failed for cache key: ${key}`, error);
      }
    }, 0);
  }

  /**
   * Check if the device is online
   * Uses navigator.onLine for offline detection
   */
  private isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Set data in cache with configuration
   * Handles quota exceeded errors with LRU eviction
   * Includes enhanced error logging for cache operations
   */
  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    await this.metadataLoaded;
    try {
      const cacheKey = this.getCacheKey(key);
      
      // Check if entry already exists to update metadata correctly
      const existingEntry = await getJSON<EnhancedCacheEntry<any>>(cacheKey);
      const existingSize = existingEntry?.size || 0;
      
      const now = Date.now();
      const size = await this.calculateSize(data);

      const entry: EnhancedCacheEntry<T> = {
        data,
        timestamp: now,
        ttl: config.ttl,
        lastAccessed: now,
        size,
        priority: config.priority,
        version: CACHE_VERSION,
        key,
      };

      // Try to set the cache entry
      try {
        await setJSON(cacheKey, entry);
        // Update metadata: if replacing, subtract old size first
        const sizeChange = existingEntry ? size - existingSize : size;
        const countChange = existingEntry ? 0 : 1;
        await this.updateMetadata(sizeChange, countChange);
      } catch (error: any) {
        // Handle QuotaExceededError gracefully
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          console.warn('⚠️ Cache quota exceeded, triggering LRU eviction');
          console.log('Cache operation details:', {
            key,
            size,
            priority: config.priority,
            currentTotalSize: this.metadata.totalSize,
            currentEntryCount: this.metadata.entryCount,
          });
          
          // Try multiple evictions if needed
          let evictionAttempts = 0;
          const maxEvictions = 5;
          
          while (evictionAttempts < maxEvictions) {
            await this.evictLRU();
            evictionAttempts++;
            
            try {
              await setJSON(cacheKey, entry);
              const sizeChange = existingEntry ? size - existingSize : size;
              const countChange = existingEntry ? 0 : 1;
              await this.updateMetadata(sizeChange, countChange);
              console.log(`✅ Cache write successful after ${evictionAttempts} eviction(s)`);
              return;
            } catch (retryError: any) {
              if (retryError.name !== 'QuotaExceededError' && retryError.code !== 22) {
                throw retryError;
              }
              // Continue to next eviction attempt
            }
          }
          
          console.error(`❌ Cache write failed after ${maxEvictions} eviction attempts`);
          throw new Error('Cache quota exceeded and eviction failed');
        } else {
          console.error('Cache write error:', {
            key,
            error: error instanceof Error ? error.message : String(error),
            errorName: error.name,
            errorCode: error.code,
          });
          throw error;
        }
      }
    } catch (error) {
      console.error('Error writing to cache:', {
        key,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Invalidate (remove) a cache entry
   */
  async invalidate(key: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await getJSON<EnhancedCacheEntry<any>>(cacheKey);

      if (entry) {
        await storage.removeItem(cacheKey);
        await this.updateMetadata(-entry.size, -1);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = await storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      for (const key of cacheKeys) {
        await storage.removeItem(key);
      }

      this.metadata = {
        totalSize: 0,
        entryCount: 0,
      };
      await this.saveMetadata();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Check if a cache entry is stale (exceeded TTL)
   */
  async isStale(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await getJSON<EnhancedCacheEntry<any>>(cacheKey);

      if (!entry) {
        return true;
      }

      const now = Date.now();
      const age = now - entry.timestamp;

      return age > entry.ttl;
    } catch (error) {
      console.error('Error checking if cache is stale:', error);
      return true;
    }
  }

  /**
   * Check if a cache entry is valid (exists and not stale)
   */
  async isValid(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await getJSON<EnhancedCacheEntry<any>>(cacheKey);

      if (!entry) {
        return false;
      }

      const now = Date.now();
      const age = now - entry.timestamp;

      return age <= entry.ttl;
    } catch (error) {
      console.error('Error checking if cache is valid:', error);
      return false;
    }
  }

  /**
   * Get cache metadata
   */
  async getMetadata(): Promise<CacheMetadata> {
    return { ...this.metadata };
  }

  /**
   * Update cache metadata with validation
   */
  private async updateMetadata(sizeChange: number, countChange: number): Promise<void> {
    // Sanitize inputs
    const safeSizeChange = this.sanitizeNumber(sizeChange, 0);
    const safeCountChange = this.sanitizeNumber(countChange, 0);
    
    // Update with validation
    this.metadata.totalSize = Math.max(0, this.sanitizeNumber(this.metadata.totalSize + safeSizeChange, 0));
    this.metadata.entryCount = Math.max(0, this.sanitizeNumber(this.metadata.entryCount + safeCountChange, 0));
    
    await this.saveMetadata();
  }

  /**
   * Save metadata to storage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await setJSON(METADATA_KEY, this.metadata);
    } catch (error) {
      console.error('Error saving cache metadata:', error);
    }
  }

  /**
   * Evict least recently used entries
   * Respects priority levels - never evicts critical priority
   * Evicts multiple entries at once for better space clearing
   */
  private async evictLRU(): Promise<void> {
    try {
      const keys = await storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      // Load all cache entries
      const entries: Array<EnhancedCacheEntry<any> & { storageKey: string }> = [];

      for (const storageKey of cacheKeys) {
        const entry = await getJSON<EnhancedCacheEntry<any>>(storageKey);
        if (entry) {
          entries.push({ ...entry, storageKey });
        }
      }

      // Filter out critical priority entries
      const evictableEntries = entries.filter(e => e.priority !== 'critical');

      if (evictableEntries.length === 0) {
        console.warn('No evictable entries found (all are critical)');
        return;
      }

      // Sort by priority (low first) and lastAccessed (oldest first)
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      evictableEntries.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastAccessed - b.lastAccessed;
      });

      // Evict multiple entries at once (up to 3 or 25% of evictable entries)
      const evictCount = Math.min(3, Math.ceil(evictableEntries.length * 0.25));
      const toEvict = evictableEntries.slice(0, evictCount);

      for (const entry of toEvict) {
        await storage.removeItem(entry.storageKey);
        await this.updateMetadata(-entry.size, -1);
        console.log(`Evicted: ${entry.key} (${entry.priority}, ${entry.size} bytes)`);
      }

      this.metadata.lastEviction = Date.now();
      await this.saveMetadata();

      console.log(`✅ Evicted ${evictCount} entries, freed ~${toEvict.reduce((sum, e) => sum + e.size, 0)} bytes`);
    } catch (error) {
      console.error('Error during LRU eviction:', error);
    }
  }

  /**
   * Calculate approximate size of data in bytes
   */
  private async calculateSize(data: any): Promise<number> {
    try {
      const jsonString = JSON.stringify(data);
      // Approximate size in bytes (UTF-16 encoding)
      return jsonString.length * 2;
    } catch (error) {
      console.error('Error calculating size:', error);
      return 0;
    }
  }

  /**
   * Get full cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`;
  }

  /**
   * Track cache hit for statistics
   */
  private async trackHit(): Promise<void> {
    if (this.metadata.hits === undefined) {
      this.metadata.hits = 0;
    }
    this.metadata.hits++;
    await this.saveMetadata();
  }

  /**
   * Track cache miss for statistics
   */
  private async trackMiss(): Promise<void> {
    if (this.metadata.misses === undefined) {
      this.metadata.misses = 0;
    }
    this.metadata.misses++;
    await this.saveMetadata();
  }

  /**
   * Get cache statistics including hit rate and miss rate
   * Requirement 7.3: Cache statistics function
   */
  async getStatistics(): Promise<CacheStatistics> {
    const hits = this.metadata.hits || 0;
    const misses = this.metadata.misses || 0;
    const total = hits + misses;

    return {
      totalSize: this.metadata.totalSize,
      entryCount: this.metadata.entryCount,
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
      missRate: total > 0 ? misses / total : 0,
      lastEviction: this.metadata.lastEviction,
    };
  }

  /**
   * Clear all cache entries and reset statistics
   * Requirement 7.3: Manual cache clear function for debugging
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      for (const key of cacheKeys) {
        await storage.removeItem(key);
      }

      // Reset metadata including statistics
      this.metadata = {
        totalSize: 0,
        entryCount: 0,
        hits: 0,
        misses: 0,
      };
      await this.saveMetadata();

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Perform cache health check to detect corrupted entries
   * Requirement 7.3: Cache health check
   */
  async healthCheck(): Promise<CacheHealthCheck> {
    const result: CacheHealthCheck = {
      healthy: true,
      totalEntries: 0,
      corruptedEntries: 0,
      corruptedKeys: [],
      issues: [],
    };

    try {
      const keys = await storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      result.totalEntries = cacheKeys.length;

      for (const storageKey of cacheKeys) {
        try {
          const entry = await getJSON<EnhancedCacheEntry<any>>(storageKey);

          if (!entry) {
            result.corruptedEntries++;
            result.corruptedKeys.push(storageKey);
            result.issues.push(`Entry ${storageKey} is null or undefined`);
            continue;
          }

          // Validate required fields
          const requiredFields = ['data', 'timestamp', 'ttl', 'lastAccessed', 'size', 'priority', 'version', 'key'];
          const missingFields = requiredFields.filter(field => !(field in entry));

          if (missingFields.length > 0) {
            result.corruptedEntries++;
            result.corruptedKeys.push(storageKey);
            result.issues.push(`Entry ${storageKey} missing fields: ${missingFields.join(', ')}`);
            continue;
          }

          // Validate data types
          if (typeof entry.timestamp !== 'number' || isNaN(entry.timestamp)) {
            result.corruptedEntries++;
            result.corruptedKeys.push(storageKey);
            result.issues.push(`Entry ${storageKey} has invalid timestamp`);
            continue;
          }

          if (typeof entry.ttl !== 'number' || isNaN(entry.ttl)) {
            result.corruptedEntries++;
            result.corruptedKeys.push(storageKey);
            result.issues.push(`Entry ${storageKey} has invalid TTL`);
            continue;
          }

          // Validate priority
          const validPriorities = ['low', 'medium', 'high', 'critical'];
          if (!validPriorities.includes(entry.priority)) {
            result.corruptedEntries++;
            result.corruptedKeys.push(storageKey);
            result.issues.push(`Entry ${storageKey} has invalid priority: ${entry.priority}`);
            continue;
          }

        } catch (error) {
          result.corruptedEntries++;
          result.corruptedKeys.push(storageKey);
          result.issues.push(`Entry ${storageKey} failed to parse: ${error}`);
        }
      }

      result.healthy = result.corruptedEntries === 0;

      if (!result.healthy) {
        console.warn(`Cache health check found ${result.corruptedEntries} corrupted entries`);
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`Health check failed: ${error}`);
      console.error('Error during cache health check:', error);
    }

    return result;
  }

  /**
   * Migrate old cache format to new enhanced format
   * Requirement 7.3: Cache migration logic for old cache format
   */
  async migrateOldCache(): Promise<{ migrated: number; failed: number }> {
    const result = { migrated: 0, failed: 0 };

    try {
      const keys = await storage.keys();
      
      // Look for old cache keys (without the enhanced prefix)
      const oldCacheKeys = keys.filter(key => 
        !key.startsWith(CACHE_KEY_PREFIX) && 
        !key.startsWith('_cap_') && // Skip Capacitor internal keys
        key !== METADATA_KEY
      );

      console.log(`Found ${oldCacheKeys.length} potential old cache entries to migrate`);

      for (const oldKey of oldCacheKeys) {
        try {
          const oldEntry = await getJSON<OldCacheEntry>(oldKey);

          if (!oldEntry || !oldEntry.data) {
            result.failed++;
            continue;
          }

          // Determine appropriate TTL and priority based on key patterns
          let ttl = CACHE_TTL.SCHEDULE; // Default
          let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

          if (oldKey.includes('faculty') || oldKey.includes('faculties')) {
            ttl = CACHE_TTL.FACULTIES;
            priority = 'medium';
          } else if (oldKey.includes('major')) {
            ttl = CACHE_TTL.MAJORS;
            priority = 'medium';
          } else if (oldKey.includes('group')) {
            ttl = CACHE_TTL.GROUPS;
            priority = 'high';
          } else if (oldKey.includes('selected')) {
            ttl = CACHE_TTL.SELECTED_GROUP;
            priority = 'critical';
          }

          // Create new enhanced cache entry
          const now = Date.now();
          const timestamp = oldEntry.timestamp || now;

          await this.set(oldKey, oldEntry.data, { ttl, priority });

          // Remove old entry
          await storage.removeItem(oldKey);

          result.migrated++;
          console.log(`Migrated cache entry: ${oldKey}`);

        } catch (error) {
          console.error(`Failed to migrate cache entry ${oldKey}:`, error);
          result.failed++;
        }
      }

      console.log(`Cache migration complete: ${result.migrated} migrated, ${result.failed} failed`);

    } catch (error) {
      console.error('Error during cache migration:', error);
    }

    return result;
  }

  /**
   * Remove corrupted cache entries found during health check
   */
  async removeCorruptedEntries(): Promise<number> {
    const healthCheck = await this.healthCheck();
    
    if (healthCheck.healthy) {
      return 0;
    }

    let removed = 0;
    for (const corruptedKey of healthCheck.corruptedKeys) {
      try {
        await storage.removeItem(corruptedKey);
        removed++;
        console.log(`Removed corrupted cache entry: ${corruptedKey}`);
      } catch (error) {
        console.error(`Failed to remove corrupted entry ${corruptedKey}:`, error);
      }
    }

    // Recalculate metadata after cleanup
    await this.recalculateMetadata();

    return removed;
  }

  /**
   * Recalculate cache metadata by scanning all entries
   */
  private async recalculateMetadata(): Promise<void> {
    try {
      const keys = await storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      let totalSize = 0;
      let entryCount = 0;

      for (const storageKey of cacheKeys) {
        try {
          const entry = await getJSON<EnhancedCacheEntry<any>>(storageKey);
          if (entry && typeof entry.size === 'number') {
            totalSize += this.sanitizeNumber(entry.size, 0);
            entryCount++;
          }
        } catch (error) {
          // Skip corrupted entries
          console.warn(`Skipping corrupted entry during recalculation: ${storageKey}`);
        }
      }

      this.metadata.totalSize = this.sanitizeNumber(totalSize, 0);
      this.metadata.entryCount = this.sanitizeNumber(entryCount, 0);
      await this.saveMetadata();

      console.log(`Metadata recalculated: ${entryCount} entries, ${totalSize} bytes`);
    } catch (error) {
      console.error('Error recalculating metadata:', error);
    }
  }

  /**
   * Repair cache by removing corrupted entries and recalculating metadata
   * Use this when cache is in a bad state
   */
  async repairCache(): Promise<{ removed: number; recalculated: boolean }> {
    await this.metadataLoaded;
    
    console.log('Starting cache repair...');
    
    // Remove corrupted entries
    const removed = await this.removeCorruptedEntries();
    
    // Recalculate metadata
    await this.recalculateMetadata();
    
    console.log(`Cache repair complete: ${removed} corrupted entries removed`);
    
    return { removed, recalculated: true };
  }
}

// Export singleton instance
export const enhancedCacheManager = new EnhancedCacheManager();
