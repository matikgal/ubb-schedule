import { supabase, isSupabaseAvailable } from './supabaseClient'
import { GroupInfo } from '../types'
import { storage, setJSON, getJSON } from './storage'

const INIT_FLAG_KEY = 'data_initialized'

/**
 * Sprawdza czy dane zostały już zainicjalizowane
 */
export async function isDataInitialized(): Promise<boolean> {
	const value = await storage.getItem(INIT_FLAG_KEY)
	return value === 'true'
}

/**
 * Pobiera WSZYSTKIE dane z Supabase i zapisuje do storage
 * OPTYMALIZACJA: Nie zapisujemy surowych danych, tylko od razu przetwarzamy
 */
export async function initializeAllData(): Promise<void> {
	// Jeśli już zainicjalizowane, pomiń
	if (await isDataInitialized()) {
		console.log('📦 Data already initialized')
		return
	}

	// Jeśli nie ma Supabase, nie możemy zainicjalizować
	if (!isSupabaseAvailable || !supabase) {
		console.log('📴 No Supabase available for initialization')
		return
	}

	// Jeśli nie ma internetu, pomiń
	if (!navigator.onLine) {
		console.log('📴 No internet connection for initialization')
		return
	}

	try {
		console.log('🚀 Starting data initialization...')

		// Pobierz WSZYSTKIE dane z tabeli schedules
		const { data, error } = await supabase.from('schedules').select('*')

		if (error) {
			console.error('❌ Failed to fetch all data:', error)
			return
		}

		if (!data || data.length === 0) {
			console.log('⚠️ No data available in Supabase')
			return
		}

		console.log(`📊 Fetched ${data.length} schedule records`)

		// 1. Wyodrębnij i zapisz wydziały
		const faculties = Array.from(new Set(data.map((row: any) => row.faculty).filter(Boolean))).sort()
		await setJSON('cached_faculties', faculties)
		console.log(`✅ Cached ${faculties.length} faculties`)

		// 2. Wyodrębnij i zapisz kierunki dla każdego wydziału
		const facultyMajorsMap = new Map<string, Set<string>>()
		data.forEach((row: any) => {
			if (!row.faculty || !row.major) return

			if (!facultyMajorsMap.has(row.faculty)) {
				facultyMajorsMap.set(row.faculty, new Set())
			}

			const cleanMajor = row.major.replace(/\s*(S|NW)$/i, '').trim()
			facultyMajorsMap.get(row.faculty)!.add(cleanMajor)
		})

		for (const [faculty, majors] of facultyMajorsMap.entries()) {
			const sortedMajors = Array.from(majors).sort()
			await setJSON(`cached_majors_${faculty}`, sortedMajors)
		}
		console.log(`✅ Cached majors for ${facultyMajorsMap.size} faculties`)

		// 3. Wyodrębnij i zapisz grupy
		const groupsMap = new Map<string, GroupInfo[]>()

		data.forEach((row: any) => {
			if (!row.faculty || !row.major || !row.study_type) return

			const key = `${row.faculty}_${row.major.replace(/\s*(S|NW)$/i, '').trim()}_${row.study_type}`

			if (!groupsMap.has(key)) {
				groupsMap.set(key, [])
			}

			const semester = extractSemesterFromGroupName(row.group_name)

			const groupInfo: GroupInfo = {
				id: row.group_id,
				name: row.group_name,
				faculty: row.faculty,
				field: row.major.replace(/\s*(S|NW)$/i, '').trim(),
				studyType: row.study_type,
				weeksCount: row.weeks_count,
				semester: semester || undefined,
			}

			groupsMap.get(key)!.push(groupInfo)
		})

		for (const [key, groups] of groupsMap.entries()) {
			await setJSON(`cached_groups_${key}`, groups)
		}
		console.log(`✅ Cached groups for ${groupsMap.size} combinations`)

		// 4. Zapisz plany zajęć (wszystkie tygodnie - teraz mamy miejsce!)
		let schedulesCount = 0
		for (const row of data) {
			if (!row.data || !row.data.weeks) continue

			const availableWeeks = Object.keys(row.data.weeks)

			for (const weekKey of availableWeeks) {
				const weekData = row.data.weeks[weekKey]
				if (!weekData || !weekData.schedule) continue

				const weekId = parseInt(weekKey, 10)
				const events: any[] = []

				for (const [dayName, classItems] of Object.entries(weekData.schedule)) {
					if (!Array.isArray(classItems) || classItems.length === 0) continue

					const dayMap: Record<string, number> = {
						Poniedziałek: 1,
						Wtorek: 2,
						Środa: 3,
						Czwartek: 4,
						Piątek: 5,
						Sobota: 6,
						Niedziela: 7,
					}

					const dayOfWeek = dayMap[dayName] || 1

					;(classItems as any[]).forEach((item: any) => {
						const event = {
							id: `${row.group_id}-${weekId}-${dayOfWeek}-${item.start_time}-${item.subject}`,
							subject: item.subject,
							type: extractClassType(item.subject),
							startTime: item.start_time,
							endTime: item.end_time,
							room: item.room_name,
							teacher: item.teacher_initials,
							dayOfWeek: dayOfWeek,
							groups: [row.group_name],
							weekId: weekId,
						}
						events.push(event)
					})
				}

				const cacheKey = `schedule_cache_${row.group_id}_${weekId}`
				const cacheEntry = {
					data: events,
					updatedAt: row.updated_at,
					cachedAt: Date.now(),
				}

				try {
					await setJSON(cacheKey, cacheEntry)
					schedulesCount++
				} catch (e) {
					console.warn('⚠️ Error saving schedule:', e)
				}
			}
		}

		console.log(`✅ Cached ${schedulesCount} schedule weeks`)

		// Oznacz jako zainicjalizowane
		await storage.setItem(INIT_FLAG_KEY, 'true')
		console.log('🎉 Data initialization complete!')
	} catch (error) {
		console.error('❌ Error during data initialization:', error)
	}
}

function extractSemesterFromGroupName(groupName: string): number | null {
	const match = groupName.match(/(\d+)sem/i)
	return match ? parseInt(match[1], 10) : null
}

function extractClassType(subject: string): string {
	const types = ['WYK', 'CW', 'LAB', 'PRO', 'SEM']
	for (const type of types) {
		if (subject.includes(type)) return type
	}
	return 'WYK'
}

export async function resetAllData(): Promise<void> {
	await storage.removeItem(INIT_FLAG_KEY)

	const keys = await storage.keys()
	for (const key of keys) {
		if (key.startsWith('cached_') || key.startsWith('schedule_cache_')) {
			await storage.removeItem(key)
		}
	}

	console.log('🔄 Data reset - will reinitialize on next load')
}
