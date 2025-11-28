/**
 * Centralized error messages for user feedback
 * All messages are in Polish to match the application language
 */
export const ERROR_MESSAGES = {
  // Network and connection errors
  NO_CONNECTION: 'Brak połączenia z internetem. Wyświetlam dane z pamięci podręcznej.',
  FETCH_FAILED: 'Nie udało się pobrać danych. Spróbuj ponownie później.',
  
  // Schedule-specific errors
  NO_DATA: 'Brak danych planu dla wybranego tygodnia.',
  INVALID_GROUP: 'Nieprawidłowa grupa. Wybierz grupę ponownie.',
  NO_GROUP_SELECTED: 'Nie wybrano grupy. Przejdź do wyszukiwania aby wybrać grupę.',
  
  // Data processing errors
  PARSE_ERROR: 'Błąd przetwarzania danych. Skontaktuj się z administratorem.',
  
  // Group selection errors
  FACULTIES_LOAD_ERROR: 'Nie udało się pobrać listy wydziałów. Sprawdź połączenie z internetem.',
  MAJORS_LOAD_ERROR: 'Nie udało się pobrać listy kierunków.',
  GROUPS_LOAD_ERROR: 'Nie udało się pobrać listy grup.',
  GROUP_SAVE_ERROR: 'Nie udało się zapisać wyboru grupy.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
