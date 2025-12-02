import { supabase, isSupabaseAvailable } from './supabaseClient'
import { ClassEvent, SupabaseScheduleRow } from '../types'
import { getCachedSchedule, setCachedSchedule, isCacheValid } from './cacheManager'
import { transformSupabaseToClassEvents } from './transformers'
import { ERROR_MESSAGES } from '../constants/errorMessages'

export { ERROR_MESSAGES }

export async function fetchScheduleForWeek(
	entityId: number,
	weekId?: number | string,
	forceRefresh: boolean = false,
	isTeacher: boolean = false
): Promise<ClassEvent[]> {
	try {
		// Step 1: Check cache first (unless force refresh)
		// Step 1: Check cache first (unless force refresh)
		if (!forceRefresh && weekId) {
			const cachedData = await getCachedSchedule(entityId, weekId)

			if (cachedData && cachedData.length > 0) {
				console.log('📦 Using cached schedule data')
				return cachedData
			}
		}

		// Step 2: Jeśli nie ma cache lub force refresh, pobierz z Supabase
		if (!isSupabaseAvailable || !supabase) {
			console.log('📴 No Supabase available')
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		if (!navigator.onLine) {
			throw new Error(ERROR_MESSAGES.NO_CONNECTION)
		}

		console.log('🔍 Fetching from Supabase:', { entityId, weekId, forceRefresh, isTeacher })

		let data, error
		if (isTeacher) {
			const response = await supabase.from('teacher_schedules').select('*').eq('teacher_id', entityId).single()
			data = response.data
			error = response.error
		} else {
			const response = await supabase.from('schedules').select('*').eq('group_id', entityId).single()
			data = response.data
			error = response.error
		}

		if (error) {
			throw new Error(ERROR_MESSAGES.FETCH_FAILED)
		}

		if (!data) {
			throw new Error(ERROR_MESSAGES.INVALID_GROUP)
		}

		const scheduleRow = data as any // SupabaseScheduleRow | SupabaseTeacherScheduleRow

		const availableWeeks = scheduleRow.data?.weeks ? Object.keys(scheduleRow.data.weeks) : []

		if (availableWeeks.length === 0) {
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		let actualWeekKey: string
		if (!weekId || !scheduleRow.data.weeks[weekId.toString()]) {
			actualWeekKey = availableWeeks[0]
		} else {
			actualWeekKey = weekId.toString()
		}

		const weekData = scheduleRow.data.weeks[actualWeekKey]

		if (!weekData) {
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		const events: ClassEvent[] = []
		const entityName = isTeacher ? scheduleRow.teacher_name : scheduleRow.group_name

		for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
			if (Array.isArray(classItems) && classItems.length > 0) {
				const dayEvents = await transformSupabaseToClassEvents(classItems, dayName, entityName)
				events.push(...dayEvents)
			}
		}

		const actualWeekId = parseInt(actualWeekKey, 10)
		await setCachedSchedule(entityId, actualWeekId, events, scheduleRow.updated_at)

		console.log('✅ Schedule fetched and cached:', events.length, 'events')

		return events
	} catch (error) {
		// Fallback to cache on error
		const cachedData = await getCachedSchedule(entityId, weekId)
		if (cachedData && cachedData.length > 0) {
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

// Removed background update function - we only fetch when selecting a group

/**
 * Get all available weeks for a group or teacher
 */
export async function getAvailableWeeks(
	entityId: number,
	isTeacher: boolean = false
): Promise<Array<{ id: string; label: string; start: Date; end: Date }>> {
	if (!isSupabaseAvailable || !supabase) {
		return []
	}

	try {
		let data, error
		if (isTeacher) {
			const response = await supabase.from('teacher_schedules').select('data').eq('teacher_id', entityId).single()
			data = response.data
			error = response.error
		} else {
			const response = await supabase.from('schedules').select('data').eq('group_id', entityId).single()
			data = response.data
			error = response.error
		}

		if (error || !data) {
			return []
		}

		const scheduleRow = data as { data: { weeks: Record<string, { week_label?: string; schedule: any }> } }
		const weeks = scheduleRow.data?.weeks || {}

		const result: Array<{ id: string; label: string; start: Date; end: Date }> = []

		for (const [weekId, weekData] of Object.entries(weeks)) {
			if (weekData.week_label) {
				const range = parseWeekLabel(weekData.week_label)
				if (range) {
					result.push({
						id: weekId,
						label: weekData.week_label,
						start: range.start,
						end: range.end,
					})
				}
			}
		}

		// Sort by start date
		result.sort((a, b) => a.start.getTime() - b.start.getTime())

		return result
	} catch (error) {
		console.error('Error getting available weeks:', error)
		return []
	}
}

/**
 * Find current week ID based on today's date
 */
export async function getCurrentWeekId(entityId: number, isTeacher: boolean = false): Promise<string | null> {
	const weeks = await getAvailableWeeks(entityId, isTeacher)
	const today = new Date()

	for (const week of weeks) {
		if (today >= week.start && today <= week.end) {
			return week.id
		}
	}

	return weeks.length > 0 ? weeks[0].id : null
}

/**
 * Parse week_label to get start and end dates
 * Format: "02.02-08.02" (DD.MM-DD.MM)
 */
function parseWeekLabel(weekLabel: string): { start: Date; end: Date } | null {
	if (!weekLabel) return null

	const parts = weekLabel.split('-')
	if (parts.length !== 2) return null

	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()

	// Parse start date (DD.MM)
	const startParts = parts[0].split('.')
	if (startParts.length !== 2) return null
	const startDay = parseInt(startParts[0], 10)
	const startMonth = parseInt(startParts[1], 10) - 1

	// Parse end date (DD.MM)
	const endParts = parts[1].split('.')
	if (endParts.length !== 2) return null
	const endDay = parseInt(endParts[0], 10)
	const endMonth = parseInt(endParts[1], 10) - 1

	// Determine year based on academic year
	let startYear = currentYear
	let endYear = currentYear

	if (currentMonth >= 8) {
		if (startMonth < 8) {
			startYear = currentYear + 1
			endYear = currentYear + 1
		}
	} else if (currentMonth < 8) {
		if (startMonth >= 8) {
			startYear = currentYear - 1
			endYear = currentYear - 1
		}
	}

	const start = new Date(startYear, startMonth, startDay)
	let end = new Date(endYear, endMonth, endDay)

	if (end < start) {
		end = new Date(endYear + 1, endMonth, endDay)
	}

	if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

	return { start, end }
}
