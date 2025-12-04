export type ClassType = 'WYK' | 'CW' | 'LAB' | 'PRO' | 'SEM';

export interface ClassEvent {
    id: string;
    subject: string;
    type: ClassType;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    room: string;
    teacher: string;
    dayOfWeek: number; // 1 = Monday, 7 = Sunday
    groups: string[];
    weekId?: number; // Week identifier from Supabase
}

export interface GroupInfo {
    id: number; // group_id or teacher_id
    name: string; // group_name or teacher_name
    faculty: string;
    field?: string; // Kierunek (major) - optional for teachers
    studyType?: string; // stacjonarne/zaoczne - optional for teachers
    weeksCount: number; // Number of weeks in schedule
    semester?: number; // Optional for backward compatibility
    type?: 'group' | 'teacher' | 'room'; // Discriminator, optional for backward compatibility (default: group)
    email?: string | null;
    phone?: string | null;
    office?: string | null;
}

export interface SearchFilters {
    faculty: string;
    mode: string; // stacjonarne/zaoczne
    field: string;
    degree: string; // I stopnia
    semester: string;
    group: string;
}

// Helper specific for the cascading dropdown data structure
export interface FacultyData {
    name: string;
    fields: {
        name: string;
        semesters: {
            number: number;
            groups: string[];
        }[];
    }[];
}

// Supabase Response Types

export interface UnifiedScheduleRow {
    id: number;
    type: 'group' | 'teacher' | 'room';
    name: string;
    faculty: string;
    data: ScheduleData;
    updated_at: string;
    weeks_count: number;
    major?: string | null;
    study_type?: string | null;
    email?: string | null;
    phone?: string | null;
    office?: string | null;
}

export interface ScheduleData {
    weeks: {
        [weekId: string]: WeekSchedule;
    };
}

export interface WeekSchedule {
    schedule: {
        [dayName: string]: ClassItem[];
    };
}

export interface ClassItem {
    room_id: number;
    subject: string;
    week_id: number;
    end_time: string;
    room_name: string;
    start_time: string;
    teacher_id: number;
    teacher_initials: string;
}

export interface CacheEntry {
    data: ClassEvent[];
    updatedAt: string;
    cachedAt: number; // timestamp
}

export interface SupabaseConfig {
    url: string;
    anonKey: string;
}

export interface SemesterInfo {
    semester: 'Zimowy' | 'Letni'
    academic_year: string
}
