import { ClassEvent, FacultyData } from '../types';

// Simulate complex structure for cascading dropdowns
export const UNIVERSITY_STRUCTURE: FacultyData[] = [
  {
    name: "Wydział Elektroniki, Telekomunikacji i Informatyki (WETI)",
    fields: [
      {
        name: "Informatyka",
        semesters: [
          { number: 1, groups: ["1A", "1B", "1C"] },
          { number: 3, groups: ["3A", "3B", "3C"] },
          { number: 5, groups: ["5A", "5B", "5C"] },
        ]
      },
      {
        name: "Automatyka i Robotyka",
        semesters: [
          { number: 1, groups: ["1A", "1B"] },
          { number: 3, groups: ["3A", "3B"] },
        ]
      }
    ]
  },
  {
    name: "Wydział Zarządzania i Ekonomii (WZiE)",
    fields: [
      {
        name: "Analityka Gospodarcza",
        semesters: [
          { number: 1, groups: ["101", "102"] },
        ]
      }
    ]
  }
];

// Mock Schedule Data
export const MOCK_SCHEDULE: ClassEvent[] = [
  // MONDAY
  {
    id: '1',
    subject: 'Matematyka Dyskretna',
    type: 'WYK',
    startTime: '08:00',
    endTime: '09:30',
    room: 'Aud. Novum',
    teacher: 'dr hab. Jan Kowalski',
    dayOfWeek: 1,
    groups: ['5A', '5B', '5C']
  },
  {
    id: '2',
    subject: 'Bazy Danych',
    type: 'LAB',
    startTime: '09:45',
    endTime: '11:15',
    room: 'S. 404 NE',
    teacher: 'mgr Anna Nowak',
    dayOfWeek: 1,
    groups: ['5A']
  },
  {
    id: '3',
    subject: 'Systemy Operacyjne',
    type: 'CW',
    startTime: '11:30',
    endTime: '13:00',
    room: 'S. 102 ETI',
    teacher: 'dr inż. Piotr Wiśniewski',
    dayOfWeek: 1,
    groups: ['5A']
  },
  
  // TUESDAY
  {
    id: '4',
    subject: 'Algorytmy i Struktury Danych',
    type: 'WYK',
    startTime: '10:00',
    endTime: '11:30',
    room: 'Aud. A',
    teacher: 'prof. dr hab. K. Zieliński',
    dayOfWeek: 2,
    groups: ['5A', '5B']
  },
  {
    id: '5',
    subject: 'Programowanie Obiektowe',
    type: 'LAB',
    startTime: '12:00',
    endTime: '13:30',
    room: 'Lab 202',
    teacher: 'mgr T. Kaczmarek',
    dayOfWeek: 2,
    groups: ['5A']
  },

  // WEDNESDAY
  {
    id: '6',
    subject: 'Język Angielski',
    type: 'CW',
    startTime: '08:00',
    endTime: '09:30',
    room: 'S. 312',
    teacher: 'mgr S. Collins',
    dayOfWeek: 3,
    groups: ['5A']
  },
  {
    id: '7',
    subject: 'Fizyka Techniczna',
    type: 'WYK',
    startTime: '14:00',
    endTime: '15:30',
    room: 'Aud. Fizyki',
    teacher: 'dr A. Einstein',
    dayOfWeek: 3,
    groups: ['5A', '5B', '5C']
  },

  // THURSDAY
  {
    id: '8',
    subject: 'Podstawy Sieci Komputerowych',
    type: 'LAB',
    startTime: '08:00',
    endTime: '11:00',
    room: 'S. Sieciowa',
    teacher: 'inż. M. Router',
    dayOfWeek: 4,
    groups: ['5A']
  },

  // FRIDAY
  {
    id: '9',
    subject: 'Wychowanie Fizyczne',
    type: 'CW',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Hala Sportowa',
    teacher: 'mgr W. Biegański',
    dayOfWeek: 5,
    groups: ['5A', '5B']
  }
];

export const getEventsForGroup = (group: string) => {
  return MOCK_SCHEDULE.filter(evt => evt.groups.includes(group));
};
