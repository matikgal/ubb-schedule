import { supabase } from './supabaseClient';
import { GroupInfo } from '../types';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Pobiera unikalne wydziały z bazy danych Supabase
 * Requirements: 1.2
 */
export async function fetchFaculties(): Promise<string[]> {
  try {
    // Check if offline
    if (!navigator.onLine) {
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }

    const { data, error } = await supabase
      .from('schedules')
      .select('faculty');

    console.log('📊 Supabase response (faculties):', { data, error });

    if (error) {
      throw new Error(`Failed to fetch faculties: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Wyodrębnij unikalne wydziały
    const uniqueFaculties = Array.from(
      new Set(data.map((row) => row.faculty).filter(Boolean))
    );

    console.log('✅ Unique faculties:', uniqueFaculties);

    return uniqueFaculties.sort();
  } catch (error) {
    console.error('Error fetching faculties:', error);
    throw error;
  }
}

/**
 * Usuwa końcówki S (stacjonarne) lub NW (niestacjonarne) z nazwy kierunku
 * @param major - Pełna nazwa kierunku z końcówką (np. "Informatyka S")
 * @returns Czysta nazwa kierunku (np. "Informatyka")
 */
function cleanMajorName(major: string): string {
  // Usuń końcówki S lub NW (z opcjonalną spacją przed)
  return major.replace(/\s*(S|NW)$/i, '').trim();
}

/**
 * Pobiera kierunki dla wybranego wydziału (bez końcówek S/NW)
 * Requirements: 1.2
 */
export async function fetchMajorsForFaculty(faculty: string): Promise<string[]> {
  try {
    // Check if offline
    if (!navigator.onLine) {
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }

    console.log('🔍 Fetching majors for faculty:', faculty);

    const { data, error } = await supabase
      .from('schedules')
      .select('major')
      .eq('faculty', faculty);

    console.log('📊 Supabase response (majors):', { data, error });

    if (error) {
      throw new Error(`Failed to fetch majors: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Wyodrębnij unikalne kierunki i usuń końcówki S/NW
    const rawMajors = data.map((row) => row.major).filter(Boolean);
    console.log('📝 Raw majors from DB:', rawMajors);

    const cleanedMajors = rawMajors.map((major) => cleanMajorName(major));
    console.log('🧹 Cleaned majors:', cleanedMajors);

    const uniqueMajors = Array.from(new Set(cleanedMajors));
    console.log('✅ Unique majors:', uniqueMajors);

    return uniqueMajors.sort();
  } catch (error) {
    console.error('Error fetching majors:', error);
    throw error;
  }
}

/**
 * Pobiera grupy dla wybranego kierunku, wydziału i trybu studiów
 * Uwaga: major w bazie ma końcówki S/NW, więc musimy filtrować po czystej nazwie
 * Requirements: 1.2
 */
/**
 * Wyciąga numer semestru z nazwy grupy
 * @param groupName - Nazwa grupy (np. "Fil ang/S/Ist/1sem/1gr")
 * @returns Numer semestru lub null
 */
function extractSemesterFromGroupName(groupName: string): number | null {
  const match = groupName.match(/(\d+)sem/i);
  return match ? parseInt(match[1], 10) : null;
}

export async function fetchGroupsForMajor(
  faculty: string,
  major: string,
  studyType: string,
  semester?: number
): Promise<GroupInfo[]> {
  try {
    // Check if offline
    if (!navigator.onLine) {
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }

    console.log('🔍 Fetching groups for:', { faculty, major, studyType, semester });

    // Zbuduj pełną nazwę kierunku z końcówką (np. "Informatyka S")
    const majorWithSuffix = `${major} ${studyType}`;
    console.log('🔧 Major with suffix:', majorWithSuffix);

    // Pobierz grupy dla wydziału i pełnej nazwy kierunku
    const { data, error } = await supabase
      .from('schedules')
      .select('group_id, group_name, faculty, major, study_type, weeks_count')
      .eq('faculty', faculty)
      .eq('major', majorWithSuffix);

    console.log('📊 Supabase response (groups):', { data, error, count: data?.length });

    if (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Filtruj po semestrze jeśli podano
    let filteredData = data;
    if (semester) {
      filteredData = data.filter((row) => {
        const groupSemester = extractSemesterFromGroupName(row.group_name);
        const matches = groupSemester === semester;
        console.log(`  Group: "${row.group_name}" → semester: ${groupSemester} === ${semester} ? ${matches}`);
        return matches;
      });
      console.log('✅ Filtered by semester:', filteredData.length);
    }

    // Transformuj dane z Supabase do formatu GroupInfo
    const groups: GroupInfo[] = filteredData.map((row) => ({
      id: row.group_id,
      name: row.group_name,
      faculty: row.faculty,
      field: cleanMajorName(row.major), // Zapisz czystą nazwę kierunku
      studyType: row.study_type,
      weeksCount: row.weeks_count,
      semester: extractSemesterFromGroupName(row.group_name) || undefined,
    }));

    console.log('🎯 Final groups:', groups);

    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
}

/**
 * Zapisuje wybraną grupę do localStorage
 * Requirements: 1.3
 */
export function saveSelectedGroup(groupInfo: GroupInfo): void {
  try {
    const groupData = JSON.stringify(groupInfo);
    localStorage.setItem('selectedGroup', groupData);
  } catch (error) {
    console.error('Error saving selected group:', error);
    throw new Error('Failed to save selected group to localStorage');
  }
}

/**
 * Pobiera wybraną grupę z localStorage
 * Requirements: 1.3
 */
export function getSelectedGroup(): GroupInfo | null {
  try {
    const groupData = localStorage.getItem('selectedGroup');
    
    if (!groupData) {
      return null;
    }

    const groupInfo: GroupInfo = JSON.parse(groupData);
    return groupInfo;
  } catch (error) {
    console.error('Error retrieving selected group:', error);
    return null;
  }
}
