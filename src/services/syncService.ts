import { supabase } from './supabaseClient'
import { getDB, saveDB, initDB, execSingle } from './db'
import { UnifiedScheduleRow, SemesterInfo } from '@/types'

export interface SyncStatus {
    isSyncing: boolean
    lastSync: number | null
    error: string | null
    progress: number
}

const SYNC_KEY = 'ubb_schedule_sync_state'

// Load initial state from localStorage
const savedState = localStorage.getItem(SYNC_KEY)
const initialState = savedState ? JSON.parse(savedState) : { lastSync: null }

let syncState: SyncStatus = {
    isSyncing: false,
    lastSync: initialState.lastSync,
    error: null,
    progress: 0,
}

const listeners: ((status: SyncStatus) => void)[] = []

function notifyListeners() {
    listeners.forEach(l => l({ ...syncState }))
}

function updateState(newState: Partial<SyncStatus>) {
    syncState = { ...syncState, ...newState }
    // Save persistent parts to localStorage
    if (newState.lastSync !== undefined) {
        localStorage.setItem(SYNC_KEY, JSON.stringify({ lastSync: syncState.lastSync }))
    }
    notifyListeners()
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void) {
    listeners.push(listener)
    listener({ ...syncState })
    return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
    }
}

export async function syncDatabase(force: boolean = false): Promise<void> {
    if (syncState.isSyncing) return

    try {
        await initDB()
        const db = getDB()

        // 1. Check remote version (semester_info updated_at)
        const { data: remoteSemester, error: remoteError } = await supabase
            .from('semester_info')
            .select('updated_at, semester, academic_year')
            .single()

        if (remoteError) {
            console.error('Failed to check remote version:', remoteError)
            // If we can't check remote, and we have local data, skip sync to be safe (offline mode)
            if (syncState.lastSync) return
            throw new Error('Could not connect to server to check version')
        }

        // 2. Check local version
        let shouldSync = false
        let localUpdatedAt: string | null = null

        try {
            const localSemester = execSingle('SELECT updated_at FROM semester_info WHERE id = 1')
            if (localSemester) {
                localUpdatedAt = localSemester.updated_at
            }
        } catch (e) {
            // Table might not exist or empty
        }

        // 3. Check if DB is empty (unified_schedules)
        let isDbEmpty = true
        try {
            const res = db.exec("SELECT count(*) as count FROM unified_schedules")
            const count = res[0]?.values[0]?.[0] as number

            if (count > 0) isDbEmpty = false
        } catch (e) {
            // Ignore
        }

        // DECISION LOGIC
        if (force) {
            shouldSync = true
        } else if (isDbEmpty) {
            shouldSync = true
        } else if (!localUpdatedAt || localUpdatedAt !== remoteSemester.updated_at) {
            shouldSync = true
        } else {
            shouldSync = false
        }

        if (!shouldSync) {
            return
        }

        updateState({ isSyncing: true, error: null, progress: 0 })

        // 4. Update Semester Info
        updateState({ progress: 10 })

        db.run('DELETE FROM semester_info')
        db.run('INSERT INTO semester_info (id, semester, academic_year, updated_at) VALUES (?, ?, ?, ?)', [
            1,
            remoteSemester.semester,
            remoteSemester.academic_year,
            remoteSemester.updated_at
        ])

        // 5. Fetch Schedules
        updateState({ progress: 30 })

        const { data: schedulesData, error: schedulesError } = await supabase
            .from('unified_schedules')
            .select('*')

        if (schedulesError) throw new Error(`Failed to fetch schedules: ${schedulesError.message}`)

        if (schedulesData) {
            const total = schedulesData.length
            let processed = 0

            db.run('BEGIN TRANSACTION')
            db.run('DELETE FROM unified_schedules')

            const stmt = db.prepare(`
				INSERT INTO unified_schedules (
					id, type, name, faculty, data, updated_at, weeks_count, 
					major, study_type, email, phone, office
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`)

            for (const row of schedulesData) {
                stmt.run([
                    row.id,
                    row.type,
                    row.name,
                    row.faculty,
                    JSON.stringify(row.data),
                    row.updated_at,
                    row.weeks_count,
                    row.major || null,
                    row.study_type || null,
                    row.email || null,
                    row.phone || null,
                    row.office || null
                ])

                processed++
                if (processed % 50 === 0) {
                    updateState({ progress: 30 + Math.floor((processed / total) * 60) })
                }
            }

            stmt.free()
            db.run('COMMIT')
        }

        // Save to IndexedDB
        await saveDB()

        updateState({
            isSyncing: false,
            lastSync: Date.now(),
            error: null,
            progress: 100,
        })

    } catch (error: any) {
        console.error('Sync failed:', error)
        updateState({
            isSyncing: false,
            error: error.message || 'Unknown error',
            progress: 0
        })
    }
}

export function getSyncStatus(): SyncStatus {
    return { ...syncState }
}
