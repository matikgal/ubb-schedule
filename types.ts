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
  id: number; // group_id from Supabase
  name: string; // e.g., "Gr. 3A"
  faculty: string;
  field: string; // Kierunek (major)
  studyType: string; // stacjonarne/zaoczne
  weeksCount: number; // Number of weeks in schedule
  semester?: number; // Optional for backward compatibility
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

export interface SupabaseScheduleRow {
  group_id: number;
  group_name: string;
  faculty: string;
  major: string;
  study_type: string;
  weeks_count: number;
  data: ScheduleData;
  updated_at: string;
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
