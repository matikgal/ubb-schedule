import { ClassEvent } from "./types";

export const getMinutesFromMidnight = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getCurrentTimeMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const getClassStatus = (cls: ClassEvent, currentMinutes: number, currentDay: number) => {
  if (cls.dayOfWeek !== currentDay) return 'upcoming';

  const start = getMinutesFromMidnight(cls.startTime);
  const end = getMinutesFromMidnight(cls.endTime);

  if (currentMinutes >= start && currentMinutes < end) return 'active';
  if (currentMinutes < start) return 'upcoming';
  return 'past';
};

export const getDayName = (dayIndex: number) => {
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
  return days[dayIndex] || '';
};

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateRange = (start: Date, end: Date) => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('pl-PL', options);
  const endStr = end.toLocaleDateString('pl-PL', options);
  return `${startStr} - ${endStr}`;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};