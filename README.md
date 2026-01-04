# UniSchedule

Nowoczesna i intuicyjna aplikacja do zarządzania planem zajęć dla studentów UBB. Zaprojektowana z myślą o szybkości, dostępności i natywnym doświadczeniu użytkownika na urządzeniach mobilnych.

![UniSchedule Mockup](public/assets/ubb_mockup.png)

## Demo

Pobierz najnowszą wersję na Androida: **[UniSchedule.apk](https://github.com/matikgal/ubb-schedule/releases/latest)**

---

## Instalacja i uruchomienie

```bash
# Klonowanie repozytorium
git clone https://github.com/matikgal/ubb-schedule.git

# Przejście do folderu projektu
cd ubb-schedule

# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

### Pozostałe komendy

```bash
# Build produkcyjny
npm run build

# Uruchomienie na Androidzie (wymaga Android Studio)
npm run android:run

# Synchronizacja z Android (po buildzie)
npm run android:sync
```

---

## Struktura projektu

```
ubb-schedule/
├── android/                 # Pliki natywne Android
├── public/                  # Pliki statyczne (assets)
├── src/                     # Kod źródłowy aplikacji
│   ├── components/          # Komponenty UI i funkcjonalne
│   │   ├── features/        # Komponenty domenowe (Widgets, Views)
│   │   ├── layout/          # Układ strony (Layout wrapper)
│   │   └── ui/              # Komponenty bazowe (Atomic Design)
│   ├── constants/           # Stałe i konfiguracja
│   ├── context/             # Stan globalny
│   ├── hooks/               # Custom Hooks
│   ├── lib/                 # Biblioteki i utility
│   ├── pages/               # Widoki (Home, Schedule, Settings, Search)
│   ├── services/            # API i logika biznesowa
│   ├── types/               # Typy TypeScript
│   ├── App.tsx
│   ├── index.css
│   └── index.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Technologie

| Kategoria    | Technologie                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| **Mobile**   | ![Capacitor](https://img.shields.io/badge/Capacitor-1199EE?style=for-the-badge&logo=capacitor&logoColor=white)                                                                                                                                                                                                                                                      |
| **Backend**  | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)                                                                                                                                                                                                                                                         |
| **Build**    | ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)                                                                                                                                                                                                                                                              |

---

## Główne funkcjonalności

- **Native-Feel Mobile App** - pełna integracja z systemem Android
- **Minimalistyczny Design** - przejrzysty interfejs z obsługą trybu ciemnego
- **Wydajność** - błyskawiczne ładowanie i optymalizacja assetów
- **Offline-first** - lokalne zapisywanie preferencji
- **Powiadomienia** - obsługa powiadomień o zajęciach
- **Inteligentne wyszukiwanie** - szybkie filtrowanie grup i wykładowców

---

## Licencja

Projekt udostępniony na licencji MIT. Zobacz plik [LICENSE](LICENSE) po więcej szczegółów.

---

## Autorzy

<br>
Stworzone przez 
Mateusz Gałuszka i Jakub Gałuszka
