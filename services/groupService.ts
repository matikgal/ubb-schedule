import { supabase, isSupabaseAvailable } from './supabaseClient'
import { GroupInfo } from '../types'
import { ERROR_MESSAGES } from '../constants/errorMessages'

// LocalStorage keys
const FACULTIES_KEY = 'cached_faculties'
const MAJORS_KEY_PREFIX = 'cached_majors_'
const GROUPS_KEY_PREFIX = 'cached_groups_'
const ALL_GROUPS_KEY = 'cached_all_groups'

/**
 * Pobiera unikalne wydziały - najpierw z localStorage, potem z Supabase
 */
export async function fetchFaculties(): Promise<string[]> {
	try {
		// 1. Zawsze najpierw sprawdź localStorage
		const cached = localStorage.getItem(FACULTIES_KEY)
		if (cached) {
			const faculties = JSON.parse(cached)
			console.log('📦 Using cached faculties:', faculties)

			// Jeśli jest internet i Supabase, zaktualizuj w tle
			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateFacultiesInBackground()
			}

			return faculties
		}

		// 2. Jeśli nie ma cache, spróbuj pobrać z Supabase
		if (!isSupabaseAvailable || !supabase) {
			console.log('📴 No Supabase and no cache available')
			return []
		}

		if (!navigator.onLine) {
			throw new Error(ERROR_MESSAGES.NO_CONNECTION)
		}

		const { data, error } = await supabase.from('schedules').select('faculty')

		console.log('📊 Supabase response (faculties):', { data, error })

		if (error) {
			throw new Error(`Failed to fetch faculties: ${error.message}`)
		}

		if (!data) {
			return []
		}

		const uniqueFaculties = Array.from(new Set(data.map(row => row.faculty).filter(Boolean)))

		const sorted = uniqueFaculties.sort()

		// Zapisz do cache
		localStorage.setItem(FACULTIES_KEY, JSON.stringify(sorted))
		console.log('✅ Faculties cached:', sorted)

		return sorted
	} catch (error) {
		console.error('Error fetching faculties:', error)

		// Fallback do cache jeśli jest błąd
		const cached = localStorage.getItem(FACULTIES_KEY)
		if (cached) {
			return JSON.parse(cached)
		}

		throw error
	}
}

/**
 * Aktualizuje wydziały w tle (nie blokuje UI)
 */
async function updateFacultiesInBackground(): Promise<void> {
	try {
		if (!supabase) return

		const { data, error } = await supabase.from('schedules').select('faculty')

		if (!error && data) {
			const uniqueFaculties = Array.from(new Set(data.map(row => row.faculty).filter(Boolean)))
			const sorted = uniqueFaculties.sort()
			localStorage.setItem(FACULTIES_KEY, JSON.stringify(sorted))
			console.log('🔄 Faculties updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

/**
 * Usuwa końcówki S (stacjonarne) lub NW (niestacjonarne) z nazwy kierunku
 */
function cleanMajorName(major: string): string {
	return major.replace(/\s*(S|NW)$/i, '').trim()
}

/**
 * Pobiera kierunki dla wybranego wydziału - najpierw z localStorage
 */
export async function fetchMajorsForFaculty(faculty: string): Promise<string[]> {
	try {
		const cacheKey = `${MAJORS_KEY_PREFIX}${faculty}`

		// 1. Sprawdź cache
		const cached = localStorage.getItem(cacheKey)
		if (cached) {
			const majors = JSON.parse(cached)
			console.log('📦 Using cached majors for', faculty, ':', majors)

			// Aktualizuj w tle
			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateMajorsInBackground(faculty)
			}

			return majors
		}

		// 2. Pobierz z Supabase
		if (!isSupabaseAvailable || !supabase) {
			console.log('📴 No Supabase and no cache available')
			return []
		}

		if (!navigator.onLine) {
			throw new Error(ERROR_MESSAGES.NO_CONNECTION)
		}

		console.log('🔍 Fetching majors for faculty:', faculty)

		const { data, error } = await supabase.from('schedules').select('major').eq('faculty', faculty)

		console.log('📊 Supabase response (majors):', { data, error })

		if (error) {
			throw new Error(`Failed to fetch majors: ${error.message}`)
		}

		if (!data) {
			return []
		}

		const rawMajors = data.map(row => row.major).filter(Boolean)
		const cleanedMajors = rawMajors.map(major => cleanMajorName(major))
		const uniqueMajors = Array.from(new Set(cleanedMajors))
		const sorted = uniqueMajors.sort()

		// Zapisz do cache
		localStorage.setItem(cacheKey, JSON.stringify(sorted))
		console.log('✅ Majors cached')

		return sorted
	} catch (error) {
		console.error('Error fetching majors:', error)

		// Fallback do cache
		const cacheKey = `${MAJORS_KEY_PREFIX}${faculty}`
		const cached = localStorage.getItem(cacheKey)
		if (cached) {
			return JSON.parse(cached)
		}

		throw error
	}
}

async function updateMajorsInBackground(faculty: string): Promise<void> {
	try {
		if (!supabase) return

		const { data, error } = await supabase.from('schedules').select('major').eq('faculty', faculty)

		if (!error && data) {
			const rawMajors = data.map(row => row.major).filter(Boolean)
			const cleanedMajors = rawMajors.map(major => cleanMajorName(major))
			const uniqueMajors = Array.from(new Set(cleanedMajors))
			const sorted = uniqueMajors.sort()

			const cacheKey = `${MAJORS_KEY_PREFIX}${faculty}`
			localStorage.setItem(cacheKey, JSON.stringify(sorted))
			console.log('🔄 Majors updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

/**
 * Wyciąga numer semestru z nazwy grupy
 */
function extractSemesterFromGroupName(groupName: string): number | null {
	const match = groupName.match(/(\d+)sem/i)
	return match ? parseInt(match[1], 10) : null
}

/**
 * Pobiera grupy - najpierw z localStorage
 */
export async function fetchGroupsForMajor(
	faculty: string,
	major: string,
	studyType: string,
	semester?: number
): Promise<GroupInfo[]> {
	try {
		const cacheKey = `${GROUPS_KEY_PREFIX}${faculty}_${major}_${studyType}`

		// 1. Sprawdź cache
		const cached = localStorage.getItem(cacheKey)
		if (cached) {
			let groups: GroupInfo[] = JSON.parse(cached)
			console.log('📦 Using cached groups:', groups.length)

			// Filtruj po semestrze
			if (semester) {
				groups = groups.filter(g => g.semester === semester)
			}

			// Aktualizuj w tle
			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateGroupsInBackground(faculty, major, studyType)
			}

			return groups
		}

		// 2. Pobierz z Supabase
		if (!isSupabaseAvailable || !supabase) {
			console.log('📴 No Supabase and no cache available')
			return []
		}

		if (!navigator.onLine) {
			throw new Error(ERROR_MESSAGES.NO_CONNECTION)
		}

		console.log('🔍 Fetching groups for:', { faculty, major, studyType, semester })

		const majorWithSuffix = `${major} ${studyType}`

		const { data, error } = await supabase
			.from('schedules')
			.select('group_id, group_name, faculty, major, study_type, weeks_count')
			.eq('faculty', faculty)
			.eq('major', majorWithSuffix)

		console.log('📊 Supabase response (groups):', { data, error, count: data?.length })

		if (error) {
			throw new Error(`Failed to fetch groups: ${error.message}`)
		}

		if (!data) {
			return []
		}

		// Transformuj dane
		const groups: GroupInfo[] = data.map(row => ({
			id: row.group_id,
			name: row.group_name,
			faculty: row.faculty,
			field: cleanMajorName(row.major),
			studyType: row.study_type,
			weeksCount: row.weeks_count,
			semester: extractSemesterFromGroupName(row.group_name) || undefined,
		}))

		// Zapisz do cache
		localStorage.setItem(cacheKey, JSON.stringify(groups))
		console.log('✅ Groups cached')

		// Filtruj po semestrze
		if (semester) {
			return groups.filter(g => g.semester === semester)
		}

		return groups
	} catch (error) {
		console.error('Error fetching groups:', error)

		// Fallback do cache
		const cacheKey = `${GROUPS_KEY_PREFIX}${faculty}_${major}_${studyType}`
		const cached = localStorage.getItem(cacheKey)
		if (cached) {
			let groups: GroupInfo[] = JSON.parse(cached)
			if (semester) {
				groups = groups.filter(g => g.semester === semester)
			}
			return groups
		}

		throw error
	}
}

async function updateGroupsInBackground(faculty: string, major: string, studyType: string): Promise<void> {
	try {
		if (!supabase) return

		const majorWithSuffix = `${major} ${studyType}`

		const { data, error } = await supabase
			.from('schedules')
			.select('group_id, group_name, faculty, major, study_type, weeks_count')
			.eq('faculty', faculty)
			.eq('major', majorWithSuffix)

		if (!error && data) {
			const groups: GroupInfo[] = data.map(row => ({
				id: row.group_id,
				name: row.group_name,
				faculty: row.faculty,
				field: cleanMajorName(row.major),
				studyType: row.study_type,
				weeksCount: row.weeks_count,
				semester: extractSemesterFromGroupName(row.group_name) || undefined,
			}))

			const cacheKey = `${GROUPS_KEY_PREFIX}${faculty}_${major}_${studyType}`
			localStorage.setItem(cacheKey, JSON.stringify(groups))
			console.log('🔄 Groups updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

/**
 * Zapisuje wybraną grupę do localStorage
 */
export function saveSelectedGroup(groupInfo: GroupInfo): void {
	try {
		const groupData = JSON.stringify(groupInfo)
		localStorage.setItem('selectedGroup', groupData)
	} catch (error) {
		console.error('Error saving selected group:', error)
		throw new Error('Failed to save selected group to localStorage')
	}
}

/**
 * Pobiera wybraną grupę z localStorage
 */
export function getSelectedGroup(): GroupInfo | null {
	try {
		const groupData = localStorage.getItem('selectedGroup')

		if (!groupData) {
			return null
		}

		const groupInfo: GroupInfo = JSON.parse(groupData)
		return groupInfo
	} catch (error) {
		console.error('Error retrieving selected group:', error)
		return null
	}
}
