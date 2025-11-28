import { supabase, isSupabaseAvailable } from './supabaseClient'
import { ClassEvent, SupabaseScheduleRow } from '../types'
import { getCachedSchedule, setCachedSchedule, isCacheValid } from './cacheManager'
import { transformSupabaseToClassEvents } from './transformers'
import { ERROR_MESSAGES } from '../constants/errorMessages'

// Re-export ERROR_MESSAGES for backward compatibility
export { ERROR_MESSAGES }

/**
 * Pobiera plan zajęć - najpierw z localStorage, potem z Supabase
 */
export async function fetchScheduleForWeek(groupId: number, weekId?: number): Promise<ClassEvent[]> {
	try {
		// Step 1: Check cache first (zawsze sprawdzamy cache)
		const cachedData = weekId ? getCachedSchedule(groupId, weekId) : null

		// Step 2: Jeśli mamy cache, użyj go i zaktualizuj w tle
		if (cachedData) {
			console.log('📦 Using cached schedule data')

			// Aktualizuj w tle jeśli jest internet i Supabase
			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateScheduleInBackground(groupId, weekId)
			}

			return cachedData
		}

		// Step 3: Jeśli nie ma cache, spróbuj pobrać z Supabase
		if (!isSupabaseAvailable || !supabase) {
			console.log('📴 No Supabase and no cache available')
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		if (!navigator.onLine) {
			throw new Error(ERROR_MESSAGES.NO_CONNECTION)
		}

		// Step 4: Fetch from Supabase
		console.log('🔍 Fetching from Supabase:', { groupId, weekId })

		const { data, error } = await supabase.from('schedules').select('*').eq('group_id', groupId).single()

		console.log('📊 Supabase response:', { data: !!data, error, groupId })

		if (error) {
			throw new Error(ERROR_MESSAGES.FETCH_FAILED)
		}

		if (!data) {
			throw new Error(ERROR_MESSAGES.INVALID_GROUP)
		}

		const scheduleRow = data as SupabaseScheduleRow

		const availableWeeks = scheduleRow.data?.weeks ? Object.keys(scheduleRow.data.weeks) : []

		console.log('📋 Schedule row:', {
			group_id: scheduleRow.group_id,
			group_name: scheduleRow.group_name,
			hasData: !!scheduleRow.data,
			hasWeeks: !!scheduleRow.data?.weeks,
			availableWeeks,
		})

		if (availableWeeks.length === 0) {
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		// Jeśli nie podano weekId lub nie ma danych dla tego tygodnia, użyj pierwszego dostępnego
		let actualWeekKey: string
		if (!weekId || !scheduleRow.data.weeks[weekId.toString()]) {
			actualWeekKey = availableWeeks[0]
			console.log('🔄 Using first available week:', actualWeekKey)
		} else {
			actualWeekKey = weekId.toString()
		}

		// Step 5: Extract week data from JSON
		const weekData = scheduleRow.data.weeks[actualWeekKey]

		console.log('🗓️ Week data for week', actualWeekKey, ':', !!weekData)

		if (!weekData) {
			console.warn('⚠️ No data for week', actualWeekKey)
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		// Step 6: Transform data to ClassEvent format
		const events: ClassEvent[] = []

		for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
			if (Array.isArray(classItems) && classItems.length > 0) {
				const dayEvents = await transformSupabaseToClassEvents(classItems, dayName, scheduleRow.group_name)
				events.push(...dayEvents)
			}
		}

		// Step 7: Cache the fresh data
		const actualWeekId = parseInt(actualWeekKey, 10)
		setCachedSchedule(groupId, actualWeekId, events, scheduleRow.updated_at)

		return events
	} catch (error) {
		// Final fallback to cache on any error
		const cachedData = getCachedSchedule(groupId, weekId)
		if (cachedData) {
			console.warn('Error fetching schedule, using cache:', error)
			return cachedData
		}

		// Re-throw if it's already a user-friendly error
		if (error instanceof Error && Object.values(ERROR_MESSAGES).some(msg => msg === error.message)) {
			throw error
		}

		// Generic error for unexpected issues
		console.error('Unexpected error in fetchScheduleForWeek:', error)
		throw new Error(ERROR_MESSAGES.FETCH_FAILED)
	}
}

/**
 * Aktualizuje plan zajęć w tle (nie blokuje UI)
 */
async function updateScheduleInBackground(groupId: number, weekId?: number): Promise<void> {
	try {
		if (!supabase) return

		const { data, error } = await supabase.from('schedules').select('*').eq('group_id', groupId).single()

		if (error || !data) return

		const scheduleRow = data as SupabaseScheduleRow
		const availableWeeks = scheduleRow.data?.weeks ? Object.keys(scheduleRow.data.weeks) : []

		if (availableWeeks.length === 0) return

		let actualWeekKey: string
		if (!weekId || !scheduleRow.data.weeks[weekId.toString()]) {
			actualWeekKey = availableWeeks[0]
		} else {
			actualWeekKey = weekId.toString()
		}

		const actualWeekId = parseInt(actualWeekKey, 10)

		// Sprawdź czy cache jest aktualny
		if (isCacheValid(groupId, actualWeekId, scheduleRow.updated_at)) {
			console.log('🔄 Cache is up to date')
			return
		}

		const weekData = scheduleRow.data.weeks[actualWeekKey]
		if (!weekData) return

		const events: ClassEvent[] = []

		for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
			if (Array.isArray(classItems) && classItems.length > 0) {
				const dayEvents = await transformSupabaseToClassEvents(classItems, dayName, scheduleRow.group_name)
				events.push(...dayEvents)
			}
		}

		setCachedSchedule(groupId, actualWeekId, events, scheduleRow.updated_at)
		console.log('🔄 Schedule updated in background')
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}
