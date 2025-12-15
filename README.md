# UniSchedule - Plan zajęć UBB

Aplikacja mobilna z planem zajęć dla Uniwersytetu Bielsko-Bialskiego.

**Natywna aplikacja Android** z trybem offline-first.

---

## Szybki start

### Testuj na telefonie:

```bash
npm run android:run
```

### Testuj na emulatorze:

```bash
npx cap open android
```

### Uruchom w przeglądarce:

```bash
npm run dev
```

---

## Funkcje

- **Offline-first** - działa bez internetu po pierwszym uruchomieniu
- **Plan zajęć** - przeglądaj zajęcia dla swojej grupy
- **Deadline'y** - zarządzaj terminami
- **Kalkulator średniej** - obliczaj średnią ocen
- **Mapa kampusu** - znajdź sale
- **Tryb ciemny** - personalizacja
- **Nieograniczona przestrzeń** - Capacitor Preferences

---

## Dokumentacja

**Zacznij tutaj:** [START.md](./START.md) lub [GOTOWE.md](./GOTOWE.md)

### Instrukcje:

- **[JAK_TESTOWAC.md](./JAK_TESTOWAC.md)** - Testowanie na telefonie (5 min)
- **[EMULATOR_ANDROID.md](./EMULATOR_ANDROID.md)** - Testowanie na emulatorze
- **[ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md)** - Pełna instrukcja Android
- **[PODSUMOWANIE_ANDROID.md](./PODSUMOWANIE_ANDROID.md)** - Co zostało zrobione

---

## Technologie

- **React** + **TypeScript**
- **Vite**
- **Capacitor** (Native Android)
- **Supabase** (Backend - opcjonalny)
- **Tailwind CSS**

---

## Instalacja

```bash
# Zainstaluj zależności
npm install

# Zbuduj aplikację
npm run build

# Synchronizuj z Androidem
npx cap sync android

# Otwórz w Android Studio
npx cap open android
```

---

## Komendy

```bash
npm run dev              # Uruchom w przeglądarce
npm run build            # Zbuduj aplikację
npm run android          # Otwórz Android Studio
npm run android:sync     # Synchronizuj z Androidem
npm run android:run      # Uruchom na telefonie
```

---

## Wymagania

- **Node.js** (v18+)
- **Android Studio** (do testowania/budowania)
- **Telefon Android** lub emulator

---

## Status

**Aplikacja jest w 100% gotowa!**

- Kompiluje się bez błędów
- Działa w przeglądarce
- Działa na Androidzie
- Offline-first działa
- Gotowa do testowania
- Gotowa do publikacji w Google Play

---

## Autorzy

- **Aplikacja:** Mateusz Gałuszka
- **Scraper danych:** Jakub Gałosz

---

## Licencja

Dane planu zajęć są własnością Uniwersytetu Bielsko-Bialskiego.

---

## Linki

- **Źródło danych:** https://plany.ubb.edu.pl/
- **UBB:** https://ubb.edu.pl/

---

**Gotowy do testowania?** Otwórz [START.md](./START.md)!
