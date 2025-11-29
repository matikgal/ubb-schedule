import { ClassEvent, CacheEntry } from '../types'
import { storage, getJSON, setJSON } from './storage'

const CACHE_KEY_PREFIX = 'schedule_cache'

function getCacheKey(groupId: number, weekId: number): string {
	return `${CACHE_KEY_PREFIX}_${groupId}_${weekId}`
}

export async function getCachedSchedule(groupId: number, weekId: number): Promise<ClassEvent[] | null> {
	try {
		const key = getCacheKey(groupId, weekId)
		const entry = await getJSON<CacheEntry>(key)

		if (!entry) {
			return null
		}

		return entry.data
	} catch (error) {
		console.error('Error reading from cache:', error)
		return null
	}
}

export async function setCachedSchedule(
	groupId: number,
	weekId: number,
	data: ClassEvent[],
	updatedAt: string
): Promise<void> {
	try {
		const key = getCacheKey(groupId, weekId)
		const entry: CacheEntry = {
			data,
			updatedAt,
			cachedAt: Date.now(),
		}

		await setJSON(key, entry)
	} catch (error) {
		console.error('Error writing to cache:', error)
	}
}

export async function isCacheValid(groupId: number, weekId: number, serverUpdatedAt: string): Promise<boolean> {
	try {
		const key = getCacheKey(groupId, weekId)
		const entry = await getJSON<CacheEntry>(key)

		if (!entry) {
			return false
		}

		const cachedTime = new Date(entry.updatedAt).getTime()
		const serverTime = new Date(serverUpdatedAt).getTime()

		return cachedTime >= serverTime
	} catch (error) {
		console.error('Error validating cache:', error)
		return false
	}
}

export async function clearCache(): Promise<void> {
	try {
		const keys = await storage.keys()
		const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX))

		for (const key of cacheKeys) {
			await storage.removeItem(key)
		}
	} catch (error) {
		console.error('Error clearing cache:', error)
	}
}
