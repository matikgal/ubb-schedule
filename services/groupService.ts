import { supabase, isSupabaseAvailable } from './supabaseClient'
import { GroupInfo } from '../types'
import { ERROR_MESSAGES } from '../constants/errorMessages'
import { storage, getJSON, setJSON } from './storage'

// Storage keys
const FACULTIES_KEY = 'cached_faculties'
const MAJORS_KEY_PREFIX = 'cached_majors_'
const GROUPS_KEY_PREFIX = 'cached_groups_'

/**
 * Pobiera unikalne wydziały - najpierw ze storage, potem z Supabase
 */
export async function fetchFaculties(): Promise<string[]> {
	try {
		// 1. Zawsze najpierw sprawdź storage
		const cached = await getJSON<string[]>(FACULTIES_KEY)
		if (cached) {
			console.log('📦 Using cached faculties:', cached)

			// Jeśli jest internet i Supabase, zaktualizuj w tle
			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateFacultiesInBackground()
			}

			return cached
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
		await setJSON(FACULTIES_KEY, sorted)
		console.log('✅ Faculties cached:', sorted)

		return sorted
	} catch (error) {
		console.error('Error fetching faculties:', error)

		// Fallback do cache jeśli jest błąd
		const cached = await getJSON<string[]>(FACULTIES_KEY)
		if (cached) {
			return cached
		}

		throw error
	}
}

async function updateFacultiesInBackground(): Promise<void> {
	try {
		if (!supabase) return

		const { data, error } = await supabase.from('schedules').select('faculty')

		if (!error && data) {
			const uniqueFaculties = Array.from(new Set(data.map(row => row.faculty).filter(Boolean)))
			const sorted = uniqueFaculties.sort()
			await setJSON(FACULTIES_KEY, sorted)
			console.log('🔄 Faculties updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

function cleanMajorName(major: string): string {
	return major.replace(/\s*(S|NW)$/i, '').trim()
}

export async function fetchMajorsForFaculty(faculty: string): Promise<string[]> {
	try {
		const cacheKey = `${MAJORS_KEY_PREFIX}${faculty}`

		const cached = await getJSON<string[]>(cacheKey)
		if (cached) {
			console.log('📦 Using cached majors for', faculty, ':', cached)

			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateMajorsInBackground(faculty)
			}

			return cached
		}

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

		await setJSON(cacheKey, sorted)
		console.log('✅ Majors cached')

		return sorted
	} catch (error) {
		console.error('Error fetching majors:', error)

		const cacheKey = `${MAJORS_KEY_PREFIX}${faculty}`
		const cached = await getJSON<string[]>(cacheKey)
		if (cached) {
			return cached
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
			await setJSON(cacheKey, sorted)
			console.log('🔄 Majors updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

function extractSemesterFromGroupName(groupName: string): number | null {
	const match = groupName.match(/(\d+)sem/i)
	return match ? parseInt(match[1], 10) : null
}

export async function fetchGroupsForMajor(
	faculty: string,
	major: string,
	studyType: string,
	semester?: number
): Promise<GroupInfo[]> {
	try {
		const cacheKey = `${GROUPS_KEY_PREFIX}${faculty}_${major}_${studyType}`

		const cached = await getJSON<GroupInfo[]>(cacheKey)
		if (cached) {
			let groups = cached
			console.log('📦 Using cached groups:', groups.length)

			if (semester) {
				groups = groups.filter(g => g.semester === semester)
			}

			if (navigator.onLine && isSupabaseAvailable && supabase) {
				updateGroupsInBackground(faculty, major, studyType)
			}

			return groups
		}

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

		const groups: GroupInfo[] = data.map(row => ({
			id: row.group_id,
			name: row.group_name,
			faculty: row.faculty,
			field: cleanMajorName(row.major),
			studyType: row.study_type,
			weeksCount: row.weeks_count,
			semester: extractSemesterFromGroupName(row.group_name) || undefined,
		}))

		// Try to cache, but don't fail if quota exceeded
		try {
			await setJSON(cacheKey, groups)
			console.log('✅ Groups cached')
		} catch (cacheError) {
			console.warn('⚠️ Could not cache groups (quota exceeded), continuing without cache:', cacheError)
		}

		if (semester) {
			return groups.filter(g => g.semester === semester)
		}

		return groups
	} catch (error) {
		console.error('Error fetching groups:', error)

		const cacheKey = `${GROUPS_KEY_PREFIX}${faculty}_${major}_${studyType}`
		const cached = await getJSON<GroupInfo[]>(cacheKey)
		if (cached) {
			let groups = cached
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
			await setJSON(cacheKey, groups)
			console.log('🔄 Groups updated in background')
		}
	} catch (error) {
		console.log('Background update failed (ignored):', error)
	}
}

export async function saveSelectedGroup(groupInfo: GroupInfo): Promise<void> {
	try {
		await setJSON('selectedGroup', groupInfo)
	} catch (error) {
		console.error('Error saving selected group:', error)

		// If quota exceeded, clear old cache and try again
		if (error instanceof Error && error.name === 'QuotaExceededError') {
			console.warn('⚠️ Storage quota exceeded, clearing old cache...')

			// Clear all cached groups (they can be re-fetched)
			const storage = await import('./storage')
			const allKeys = await storage.storage.keys()

			for (const key of allKeys) {
				if (key.startsWith(GROUPS_KEY_PREFIX) || key.startsWith(FACULTIES_KEY) || key.startsWith(MAJORS_KEY_PREFIX)) {
					await storage.storage.removeItem(key)
					console.log(`🗑️ Cleared cache: ${key}`)
				}
			}

			// Try saving again
			try {
				await setJSON('selectedGroup', groupInfo)
				console.log('✅ Selected group saved after clearing cache')
			} catch (retryError) {
				console.error('❌ Still failed after clearing cache:', retryError)
				throw new Error('Failed to save selected group even after clearing cache')
			}
		} else {
			throw new Error('Failed to save selected group to storage')
		}
	}
}

export async function getSelectedGroup(): Promise<GroupInfo | null> {
	try {
		return await getJSON<GroupInfo>('selectedGroup')
	} catch (error) {
		console.error('Error retrieving selected group:', error)
		return null
	}
}
