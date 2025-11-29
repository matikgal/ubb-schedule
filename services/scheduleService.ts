import { supabase, isSupabaseAvailable } from './supabaseClient'
import { ClassEvent, SupabaseScheduleRow } from '../types'
import { getCachedSchedule, setCachedSchedule, isCacheValid } from './cacheManager'
import { transformSupabaseToClassEvents } from './transformers'
import { ERROR_MESSAGES } from '../constants/errorMessages'

export { ERROR_MESSAGES }

export async function fetchScheduleForWeek(groupId: number, weekId?: number): Promise<ClassEvent[]> {
	try {
		// Step 1: Check cache first
		const cachedData = weekId ? await getCachedSchedule(groupId, weekId) : null

		// Step 2: Jeśli mamy cache, użyj go i zaktualizuj w tle
		if (cachedData) {
			console.log('📦 Using cached schedule data')

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

		let actualWeekKey: string
		if (!weekId || !scheduleRow.data.weeks[weekId.toString()]) {
			actualWeekKey = availableWeeks[0]
			console.log('🔄 Using first available week:', actualWeekKey)
		} else {
			actualWeekKey = weekId.toString()
		}

		const weekData = scheduleRow.data.weeks[actualWeekKey]

		console.log('🗓️ Week data for week', actualWeekKey, ':', !!weekData)

		if (!weekData) {
			console.warn('⚠️ No data for week', actualWeekKey)
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		const events: ClassEvent[] = []

		for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
			if (Array.isArray(classItems) && classItems.length > 0) {
				const dayEvents = await transformSupabaseToClassEvents(classItems, dayName, scheduleRow.group_name)
				events.push(...dayEvents)
			}
		}

		const actualWeekId = parseInt(actualWeekKey, 10)
		await setCachedSchedule(groupId, actualWeekId, events, scheduleRow.updated_at)

		return events
	} catch (error) {
		const cachedData = await getCachedSchedule(groupId, weekId)
		if (cachedData) {
			console.warn('Error fetching schedule, using cache:', error)
			return cachedData
		}

		if (error instanceof Error && Object.values(ERROR_MESSAGES).some(msg => msg === error.message)) {
			throw error
		}

		console.error('Unexpected error in fetchScheduleForWeek:', error)
		throw new Error(ERROR_MESSAGES.FETCH_FAILED)
	}
}

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

		if (await isCacheValid(groupId, actualWeekId, scheduleRow.updated_at)) {
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

		await setCachedSchedule(groupId, actualWeekId, events, scheduleRow.updated_at)
		console.log('🔄 Schedule updated in background')
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}
