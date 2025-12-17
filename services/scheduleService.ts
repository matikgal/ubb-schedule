import { execSingle, initDB } from './db'
import { ClassEvent, UnifiedScheduleRow, SemesterInfo } from '../types'
import { transformSupabaseToClassEvents } from './transformers'
import { ERROR_MESSAGES } from '../constants/errorMessages'

export { ERROR_MESSAGES }

// Helper to ensure DB is ready
async function ensureDB() {
	await initDB()
}

export async function fetchScheduleForWeek(
	entityId: number,
	weekId?: number | string,
	forceRefresh: boolean = false,
	isTeacher: boolean = false,
	isRoom: boolean = false
): Promise<ClassEvent[]> {
	try {
		await ensureDB()

		const row = execSingle(`
			SELECT * FROM unified_schedules WHERE id = ?
		`, [entityId])

		if (!row) {
			throw new Error(ERROR_MESSAGES.INVALID_GROUP)
		}

		// Parse JSON data
		const scheduleData = JSON.parse(row.data)
		const scheduleRow = { ...row, data: scheduleData } as UnifiedScheduleRow

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

		if (actualWeekKey.startsWith('virtual_')) {
			return []
		}

		const weekData = scheduleRow.data.weeks[actualWeekKey]

		if (!weekData) {
			throw new Error(ERROR_MESSAGES.NO_DATA)
		}

		const events: ClassEvent[] = []
		const entityName = scheduleRow.name

		for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
			if (Array.isArray(classItems) && classItems.length > 0) {
				const dayEvents = await transformSupabaseToClassEvents(
					classItems,
					dayName,
					!isTeacher && !isRoom ? entityName : undefined, // defaultGroup
					isTeacher ? entityName : undefined,             // defaultTeacher
					isRoom ? entityName : undefined                 // defaultRoom
				)
				events.push(...dayEvents)
			}
		}

		return events
	} catch (error) {
		if (error instanceof Error && Object.values(ERROR_MESSAGES).some(msg => msg === error.message)) {
			throw error
		}

		console.error('Unexpected error in fetchScheduleForWeek:', error)
		throw new Error(ERROR_MESSAGES.FETCH_FAILED)
	}
}

export async function getAvailableWeeks(
	entityId: number,
	isTeacher: boolean = false,
	isRoom: boolean = false
): Promise<Array<{ id: string; label: string; start: Date; end: Date }>> {
	try {
		await ensureDB()

		const row = execSingle(`
			SELECT data FROM unified_schedules WHERE id = ?
		`, [entityId])

		if (!row) {
			return []
		}

		const scheduleData = JSON.parse(row.data)
		const weeks = scheduleData.weeks || {}

		const result: Array<{ id: string; label: string; start: Date; end: Date }> = []

		for (const [weekId, weekData] of Object.entries(weeks)) {
			if ((weekData as any).week_label) {
				const range = parseWeekLabel((weekData as any).week_label)
				if (range) {
					result.push({
						id: weekId,
						label: (weekData as any).week_label,
						start: range.start,
						end: range.end,
					})
				}
			}
		}

		// Sort by start date
		result.sort((a, b) => a.start.getTime() - b.start.getTime())

		// Fill gaps
		return fillWeekGaps(result)
	} catch (error) {
		console.error('Error getting available weeks:', error)
		return []
	}
}

export async function getCurrentWeekId(entityId: number, isTeacher: boolean = false, isRoom: boolean = false): Promise<string | null> {
	const weeks = await getAvailableWeeks(entityId, isTeacher, isRoom)
	const today = new Date()

	for (const week of weeks) {
		const weekStart = new Date(week.start)
		weekStart.setHours(0, 0, 0, 0)

		const weekEnd = new Date(week.end)
		weekEnd.setHours(23, 59, 59, 999)

		if (today >= weekStart && today <= weekEnd) {
			return week.id
		}
	}

	return weeks.length > 0 ? weeks[0].id : null
}

function parseWeekLabel(weekLabel: string): { start: Date; end: Date } | null {
	if (!weekLabel) return null

	const parts = weekLabel.split('-')
	if (parts.length !== 2) return null

	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()

	const startParts = parts[0].split('.')
	if (startParts.length !== 2) return null
	const startDay = parseInt(startParts[0], 10)
	const startMonth = parseInt(startParts[1], 10) - 1

	const endParts = parts[1].split('.')
	if (endParts.length !== 2) return null
	const endDay = parseInt(endParts[0], 10)
	const endMonth = parseInt(endParts[1], 10) - 1

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
	start.setHours(0, 0, 0, 0)

	let end = new Date(endYear, endMonth, endDay)
	end.setHours(23, 59, 59, 999)

	if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

	return { start, end }
}

export async function fetchSemesterInfo(): Promise<SemesterInfo | null> {
	try {
		await ensureDB()
		const row = execSingle(`SELECT semester, academic_year FROM semester_info WHERE id = 1`)

		if (!row) return null

		return {
			semester: row.semester as 'Zimowy' | 'Letni',
			academic_year: row.academic_year
		}
	} catch (error) {
		console.error('Error fetching semester info:', error)
		return null
	}
}

function fillWeekGaps(weeks: Array<{ id: string; label: string; start: Date; end: Date }>): Array<{ id: string; label: string; start: Date; end: Date }> {
	if (weeks.length === 0) return []

	const sorted = [...weeks].sort((a, b) => a.start.getTime() - b.start.getTime())
	const result: Array<{ id: string; label: string; start: Date; end: Date }> = []

	const firstWeek = sorted[0]
	const lastWeek = sorted[sorted.length - 1]

	let currentDate = new Date(firstWeek.start)
	const endDate = new Date(lastWeek.end)

	let weekIndex = 0

	while (currentDate <= endDate) {
		const weekEnd = new Date(currentDate)
		weekEnd.setDate(weekEnd.getDate() + 6)
		weekEnd.setHours(23, 59, 59, 999)

		// Check if we have a real week for this range
		const existingWeek = sorted.find(w => {
			const wStart = new Date(w.start)
			const wEnd = new Date(w.end)
			return Math.abs(wStart.getTime() - currentDate.getTime()) < 86400000 // Within 1 day tolerance
		})

		if (existingWeek) {
			result.push(existingWeek)
		} else {
			// Create virtual week
			const label = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`
			result.push({
				id: `virtual_${currentDate.getTime()}`,
				label,
				start: new Date(currentDate),
				end: new Date(weekEnd)
			})
		}

		// Move to next week
		currentDate.setDate(currentDate.getDate() + 7)
	}

	return result
}
