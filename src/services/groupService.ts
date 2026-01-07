import { execQuery, initDB } from './db'
import { GroupInfo } from '@/types'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

// Helper to ensure DB is ready
async function ensureDB() {
	await initDB()
}

function cleanMajorName(major: string): string {
	return major.replace(/\s+(S|NW|NZ)$/i, '').trim()
}

function extractSemesterFromGroupName(groupName: string): number | null {
	// Standard format: 1sem, 2sem, etc.
	const standardMatch = groupName.match(/(\d+)sem/i)
	if (standardMatch) return parseInt(standardMatch[1], 10)

	// Erasmus format: sem_1, sem_2, etc.
	const erasmusMatch = groupName.match(/sem_(\d+)/i)
	if (erasmusMatch) return parseInt(erasmusMatch[1], 10)

	// Erasmus special format: sem_Z (Zimowy -> 1), sem_L (Letni -> 2)
	if (/sem_Z/i.test(groupName)) return 1
	if (/sem_L/i.test(groupName)) return 2

	return null
}

/**
 * Pobiera unikalne wydziały z lokalnej bazy
 */
export async function fetchFaculties(): Promise<string[]> {
	try {
		await ensureDB()
		const results = execQuery(`
			SELECT DISTINCT faculty 
			FROM unified_schedules 
			WHERE type = 'group' 
			ORDER BY faculty
		`)
		return results.map(row => row.faculty).filter(Boolean)
	} catch {
		return []
	}
}

export async function fetchMajorsForFaculty(faculty: string): Promise<string[]> {
	try {
		await ensureDB()
		const results = execQuery(`
			SELECT DISTINCT major 
			FROM unified_schedules 
			WHERE faculty = ? AND type = 'group'
		`, [faculty])

		const rawMajors = results.map(row => row.major).filter(Boolean)
		const cleanedMajors = rawMajors.map(major => cleanMajorName(major))
		const uniqueMajors = Array.from(new Set(cleanedMajors))
		return uniqueMajors.sort()
	} catch {
		return []
	}
}

export async function fetchGroupsForMajor(
	faculty: string,
	major: string,
	studyType: string,
	semester?: number
): Promise<GroupInfo[]> {
	try {
		await ensureDB()

		let query = `
			SELECT id, name, faculty, major, study_type, weeks_count 
			FROM unified_schedules 
			WHERE faculty = ? AND type = 'group'
		`
		const params: any[] = [faculty]

		// Special handling for Erasmus majors
		if (major.toLowerCase().includes('erasmus')) {
			query += ` AND major = ?`
			params.push(major)

			if (studyType === 'S') {
				query += ` AND study_type = 'Stacjonarne'`
			} else if (studyType === 'NW') {
				query += ` AND (study_type = 'Niestacjonarne Wieczorowe' OR study_type = 'Niestacjonarne Zaoczne')`
			}
		} else {
			const majorWithSuffix = `${major} ${studyType}`
			query += ` AND major = ?`
			params.push(majorWithSuffix)
		}

		const results = execQuery(query, params)

		const groups: GroupInfo[] = results.map(row => ({
			id: row.id,
			name: row.name,
			faculty: row.faculty,
			field: cleanMajorName(row.major),
			studyType: row.study_type,
			weeksCount: row.weeks_count,
			semester: extractSemesterFromGroupName(row.name) || undefined,
			type: 'group',
		}))

		if (semester) {
			return groups.filter(g => g.semester === semester)
		}

		return groups
	} catch {
		return []
	}
}

export async function fetchTeachersForFaculty(faculty: string): Promise<GroupInfo[]> {
	try {
		await ensureDB()
		const results = execQuery(`
			SELECT id, name, faculty, weeks_count, email, phone, office 
			FROM unified_schedules 
			WHERE faculty = ? AND type = 'teacher'
			ORDER BY name
		`, [faculty])

		return results.map(row => ({
			id: row.id,
			name: row.name,
			faculty: row.faculty,
			weeksCount: row.weeks_count,
			type: 'teacher',
			email: row.email,
			phone: row.phone,
			office: row.office,
		}))
	} catch {
		return []
	}
}

export async function fetchAllTeachers(): Promise<GroupInfo[]> {
	try {
		await ensureDB()
		const results = execQuery(`
			SELECT id, name, faculty, weeks_count, email, phone, office 
			FROM unified_schedules 
			WHERE type = 'teacher'
			ORDER BY name
		`)

		return results.map(row => ({
			id: row.id,
			name: row.name,
			faculty: row.faculty,
			weeksCount: row.weeks_count,
			type: 'teacher',
			email: row.email,
			phone: row.phone,
			office: row.office,
		}))
	} catch {
		return []
	}
}

export async function fetchAllRooms(): Promise<GroupInfo[]> {
	try {
		await ensureDB()
		const results = execQuery(`
			SELECT id, name, faculty, weeks_count 
			FROM unified_schedules 
			WHERE type = 'room'
			ORDER BY name
		`)

		return results.map(row => ({
			id: row.id,
			name: row.name,
			faculty: row.faculty,
			weeksCount: row.weeks_count,
			type: 'room',
		}))
	} catch {
		return []
	}
}

// Helper to get selected group from localStorage (still useful for persistence across reloads)
export async function getSelectedGroup(): Promise<GroupInfo | null> {
	try {
		const saved = localStorage.getItem('selectedGroup')
		return saved ? JSON.parse(saved) : null
	} catch (e) {
		return null
	}
}

export async function saveSelectedGroup(group: GroupInfo): Promise<void> {
	localStorage.setItem('selectedGroup', JSON.stringify(group))
}

export async function findGroupsByName(name: string): Promise<GroupInfo[]> {
	try {
		await ensureDB()
		// Try exact match first
		let results = execQuery(`
			SELECT id, name, faculty, major, study_type, weeks_count 
			FROM unified_schedules 
			WHERE type = 'group' AND name = ?
		`, [name])

		if (results.length === 0) {
			// Try matching by suffix (e.g. "3gr" matching "Inf/S/Ist/5sem/3gr/a/SKiBS")
			// Use LIKE with wildcards
			results = execQuery(`
				SELECT id, name, faculty, major, study_type, weeks_count 
				FROM unified_schedules 
				WHERE type = 'group' AND name LIKE ?
			`, [`%${name}%`])
		}

		return results.map(row => ({
			id: row.id,
			name: row.name,
			faculty: row.faculty,
			field: cleanMajorName(row.major),
			studyType: row.study_type,
			weeksCount: row.weeks_count,
			semester: extractSemesterFromGroupName(row.name) || undefined,
			type: 'group',
		}))
	} catch {
		return []
	}
}
