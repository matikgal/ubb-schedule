import { ClassEvent, ClassType, ClassItem } from '@/types';
import { supabase } from './supabaseClient';

/**
 * Maps Polish day names to day of week numbers
 * @param dayName - Polish day name (e.g., "Poniedziałek")
 * @returns Day of week number (1 = Monday, 7 = Sunday)
 */
export function mapDayNameToDayOfWeek(dayName: string): number {
  const normalizedDay = dayName.trim().toLowerCase();

  const dayMap: Record<string, number> = {
    'poniedziałek': 1,
    'wtorek': 2,
    'środa': 3,
    'czwartek': 4,
    'piątek': 5,
    'sobota': 6,
    'niedziela': 7,
  };

  return dayMap[normalizedDay] || 1;
}

/**
 * Parses class type abbreviation from subject name
 * @param subject - Subject name with type abbreviation (e.g., "Matematyka wyk")
 * @returns ClassType enum value
 */
export function parseClassType(subject: string): ClassType {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('wyk')) return 'WYK';
  if (lowerSubject.includes('ćw')) return 'CW';
  if (lowerSubject.includes('lab')) return 'LAB';
  if (lowerSubject.includes('lek')) return 'LAB';
  if (lowerSubject.includes('pnj')) return 'LAB';
  if (lowerSubject.includes('sem')) return 'SEM';
  if (lowerSubject.includes('pro')) return 'PRO';

  return 'WYK';
}

/**
 * Removes class type abbreviation from subject name
 * @param subject - Subject name with type abbreviation
 * @returns Clean subject name without abbreviation
 */
export function cleanSubjectName(subject: string): string {
  const abbreviations = ['wyk', 'ćw', 'lab', 'lek', 'pnj', 'sem', 'pro'];

  let cleaned = subject;
  for (const abbr of abbreviations) {
    const regex = new RegExp(`\\s*${abbr}\\s*$`, 'i');
    cleaned = cleaned.replace(regex, '');
  }

  // Remove trailing commas and whitespace
  return cleaned.replace(/,\s*$/, '').trim();
}



/**
 * Cache dla pełnych nazwisk wykładowców
 */
const teacherNamesCache = new Map<number, string>();

/**
 * Pobiera pełne nazwisko wykładowcy z tabeli teacher_schedules
 * @param teacherId - ID wykładowcy
 * @returns Pełne nazwisko lub null jeśli nie znaleziono
 */
async function getTeacherFullName(teacherId: number): Promise<string | null> {
  if (!teacherId) return null;

  // Sprawdź cache
  if (teacherNamesCache.has(teacherId)) {
    return teacherNamesCache.get(teacherId)!;
  }

  try {
    const { data, error } = await supabase
      .from('teacher_schedules')
      .select('teacher_name')
      .eq('teacher_id', teacherId)
      .single();

    if (error || !data) {
      return null;
    }

    // Zapisz w cache
    teacherNamesCache.set(teacherId, data.teacher_name);
    return data.teacher_name;
  } catch {
    return null;
  }
}

/**
 * Transforms Supabase class items to ClassEvent format
 * @param data - Array of class items from Supabase
 * @param dayName - Polish day name
 * @param groupName - Group name for the events
 * @returns Promise resolving to array of ClassEvent objects
 */
export async function transformSupabaseToClassEvents(
  data: ClassItem[],
  dayName: string,
  defaultGroup?: string,
  defaultTeacher?: string,
  defaultRoom?: string
): Promise<ClassEvent[]> {
  const dayOfWeek = mapDayNameToDayOfWeek(dayName);

  // Pobierz wszystkie pełne nazwiska wykładowców równolegle
  const teacherPromises = data.map(item => getTeacherFullName(item.teacher_id));
  const teacherNames = await Promise.all(teacherPromises);

  return data.map((item, index) => {
    const type = parseClassType(item.subject);
    const cleanedSubject = cleanSubjectName(item.subject);

    // Użyj pełnego nazwiska jeśli dostępne, w przeciwnym razie inicjały, w ostateczności defaultTeacher
    const teacherName = teacherNames[index] || item.teacher_initials || defaultTeacher || '';

    // Use specific group name from item if available, otherwise fallback to defaultGroup
    const specificGroup = item.group_name;
    const groups = specificGroup ? [specificGroup] : (defaultGroup ? [defaultGroup] : []);

    return {
      id: `${item.week_id}-${dayOfWeek}-${index}`,
      subject: cleanedSubject,
      type,
      startTime: item.start_time,
      endTime: item.end_time,
      room: item.room_name || defaultRoom || '',
      teacher: teacherName,
      teacherId: item.teacher_id,
      roomId: item.room_id,
      dayOfWeek,
      groups,
    };
  });
}
