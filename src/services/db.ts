import initSqlJs, { Database } from 'sql.js'
import localforage from 'localforage'

const DB_NAME = 'ubb_schedule_db'
let db: Database | null = null
let initPromise: Promise<Database> | null = null


localforage.config({
    name: 'UBBSchedule',
    storeName: 'database',
})

export async function initDB(): Promise<Database> {
    if (db) return db
    if (initPromise) return initPromise

    initPromise = (async () => {
        try {
            const SQL = await initSqlJs({
                locateFile: file => `/${file}`,
            })

            const savedDb = await localforage.getItem<Uint8Array>(DB_NAME)

            if (savedDb) {
                db = new SQL.Database(savedDb)
            } else {
                db = new SQL.Database()
                createTables(db)
            }

            try {
                db.run("ALTER TABLE semester_info ADD COLUMN updated_at TEXT")
            } catch (e) {

            }

            return db
        } catch (error) {
            console.error('Failed to initialize database:', error)
            initPromise = null
            throw error
        }
    })()

    return initPromise
}

export function getDB(): Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.')
    }
    return db
}

export async function saveDB(): Promise<void> {
    if (!db) return
    const data = db.export()
    await localforage.setItem(DB_NAME, data)
}

export async function resetDB(): Promise<void> {
    if (db) {
        db.close()
        db = null
    }
    initPromise = null
    await localforage.removeItem(DB_NAME)
    await initDB()
}

function createTables(database: Database) {
    // Create unified_schedules table matching Supabase structure
    // We use TEXT for JSONB data
    database.run(`
    CREATE TABLE IF NOT EXISTS unified_schedules (
      id INTEGER,
      type TEXT NOT NULL,
      name TEXT,
      faculty TEXT,
      data TEXT,
      updated_at TEXT,
      weeks_count INTEGER,
      major TEXT,
      study_type TEXT,
      email TEXT,
      phone TEXT,
      office TEXT,
      PRIMARY KEY (id, type)
    );
    
    CREATE INDEX IF NOT EXISTS idx_type ON unified_schedules(type);
    CREATE INDEX IF NOT EXISTS idx_faculty ON unified_schedules(faculty);
  `)

    // Create semester_info table
    database.run(`
    CREATE TABLE IF NOT EXISTS semester_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      semester TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      updated_at TEXT
    );
  `)
}

export function execQuery(query: string, params: any[] = []): any[] {
    const database = getDB()
    const stmt = database.prepare(query)
    stmt.bind(params)

    const result = []
    while (stmt.step()) {
        result.push(stmt.getAsObject())
    }
    stmt.free()
    return result
}

export function execSingle(query: string, params: any[] = []): any | null {
    const results = execQuery(query, params)
    return results.length > 0 ? results[0] : null
}
