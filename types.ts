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
}

export interface GroupInfo {
  id: string;
  name: string; // e.g., "Gr. 3A"
  faculty: string;
  field: string; // Kierunek
  semester: number;
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