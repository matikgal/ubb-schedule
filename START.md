# 🚀 START - Szybki przewodnik

## 📱 Aplikacja UniSchedule - Android

Witaj! Masz gotową aplikację Android. Oto co możesz zrobić:

---

## 🎯 Chcę przetestować aplikację

### Na telefonie:

```bash
npm run android:run
```

📖 Instrukcja: [JAK_TESTOWAC.md](./JAK_TESTOWAC.md)

### Na emulatorze (bez telefonu):

```bash
npx cap open android
```

📖 Instrukcja: [EMULATOR_ANDROID.md](./EMULATOR_ANDROID.md)

---

## 🌐 Chcę uruchomić w przeglądarce

```bash
npm run dev
```

Otwórz: http://localhost:5173

---

## 📦 Chcę zbudować APK

### Debug APK (do testowania):

```bash
cd android
gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (do publikacji):

📖 Instrukcja: [ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md) - sekcja "Krok 5"

---

## 🔧 Podstawowe komendy

```bash
# Zbuduj aplikację
npm run build

# Synchronizuj z Androidem
npx cap sync android

# Otwórz Android Studio
npx cap open android

# Uruchom na telefonie
npm run android:run
```

---

## 📚 Dokumentacja

- **[JAK_TESTOWAC.md](./JAK_TESTOWAC.md)** - Szybki start (5 min)
- **[EMULATOR_ANDROID.md](./EMULATOR_ANDROID.md)** - Testowanie na emulatorze
- **[ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md)** - Pełna instrukcja
- **[PODSUMOWANIE_ANDROID.md](./PODSUMOWANIE_ANDROID.md)** - Co zostało zrobione
- **[README_ANDROID.md](./README_ANDROID.md)** - Dokumentacja projektu

---

## ✨ Funkcje aplikacji

- ✅ **Offline-first** - działa bez internetu
- ✅ **Plan zajęć** - dla Twojej grupy
- ✅ **Deadline'y** - zarządzaj terminami
- ✅ **Kalkulator średniej** - obliczaj oceny
- ✅ **Mapa kampusu** - znajdź sale
- ✅ **Nieograniczona przestrzeń** - Capacitor Preferences

---

## 🐛 Problemy?

### Aplikacja nie uruchamia się:

```bash
npm install
npm run build
npx cap sync android
```

### Brak Android SDK:

Zainstaluj Android Studio: https://developer.android.com/studio

### Telefon się nie wykrywa:

1. Włącz debugowanie USB
2. Zaakceptuj "Zezwól na debugowanie USB"
3. Spróbuj innego kabla

---

## 🎉 Gotowe!

Wybierz co chcesz zrobić i kliknij w link do instrukcji! 📱

**Pytania?** Sprawdź dokumentację powyżej.
