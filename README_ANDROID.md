# 📱 UniSchedule - Aplikacja Android

Plan zajęć UBB jako natywna aplikacja Android z trybem offline.

## ✨ Funkcje

- ✅ **Offline-first** - działa bez internetu po pierwszym uruchomieniu
- ✅ **Natywna aplikacja Android** - pełna wydajność
- ✅ **Nieograniczona przestrzeń** - Capacitor Preferences zamiast localStorage
- ✅ **Gotowa do Google Play** - można publikować w sklepie
- ✅ **Plan zajęć** - przeglądaj zajęcia dla swojej grupy
- ✅ **Deadline'y** - zarządzaj terminami
- ✅ **Kalkulator średniej** - obliczaj średnią ocen
- ✅ **Mapa kampusu** - znajdź sale

## 🚀 Szybki start

### 1. Zainstaluj zależności

```bash
npm install
```

### 2. Zbuduj aplikację

```bash
npm run build
```

### 3. Synchronizuj z Androidem

```bash
npx cap sync android
```

### 4. Otwórz w Android Studio

```bash
npx cap open android
```

### 5. Podłącz telefon i uruchom ▶️

## 📱 Testowanie na telefonie

Szczegółowa instrukcja: [ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md)

### Szybka metoda:

```bash
# Podłącz telefon przez USB
# Włącz debugowanie USB na telefonie
npm run android:run
```

## 🔧 Komendy

```bash
npm run dev              # Uruchom w przeglądarce (development)
npm run build            # Zbuduj aplikację
npm run android          # Otwórz Android Studio
npm run android:sync     # Synchronizuj z Androidem
npm run android:run      # Zbuduj i uruchom na telefonie
```

## 📦 Struktura projektu

```
ubb-schedule/
├── src/
│   ├── components/      # Komponenty React
│   ├── pages/          # Strony aplikacji
│   ├── services/       # Logika biznesowa
│   │   ├── storage.ts  # Uniwersalny storage (Capacitor/localStorage)
│   │   ├── dataInitializer.ts  # Inicjalizacja danych offline
│   │   └── ...
│   └── ...
├── android/            # Projekt Android (Capacitor)
├── dist/              # Zbudowana aplikacja web
└── capacitor.config.ts # Konfiguracja Capacitor
```

## 🎨 Technologie

- **React** + **TypeScript** - UI
- **Vite** - Build tool
- **Capacitor** - Native wrapper
- **Supabase** - Backend (opcjonalny)
- **Tailwind CSS** - Styling
- **Lucide React** - Ikony

## 📝 Konfiguracja

### Supabase (opcjonalne)

Utwórz plik `.env`:

```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj_klucz
```

Jeśli nie podasz konfiguracji, aplikacja będzie działać tylko offline.

## 🐛 Debugowanie

### Chrome DevTools na telefonie:

1. Podłącz telefon przez USB
2. Otwórz Chrome: `chrome://inspect`
3. Znajdź aplikację i kliknij "inspect"

### Logi Android:

```bash
adb logcat | findstr "Capacitor"
```

## 📤 Publikacja w Google Play

1. Zbuduj Release APK:

```bash
cd android
gradlew assembleRelease
```

2. Utwórz konto Google Play Console ($25)

3. Prześlij APK i wypełnij formularz

Szczegóły: [ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md)

## 🎉 Gotowe!

Aplikacja jest gotowa do testowania na Androidzie i publikacji w Google Play!

---

**Autor:** Mateusz Gałuszka  
**Scraper:** Jakub Gałosz  
**Wersja:** 1.0.0
