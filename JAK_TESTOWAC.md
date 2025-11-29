# 🚀 Jak przetestować aplikację - SZYBKI START

## 📱 Wybierz metodę testowania:

### Opcja A: Na fizycznym telefonie (polecam)

### Opcja B: Na emulatorze w Android Studio

---

## ⚡ Opcja A: Fizyczny telefon (5 minut)

### 1. Włącz debugowanie USB na telefonie

**Android:**

1. Ustawienia → O telefonie
2. Kliknij 7 razy w "Numer kompilacji"
3. Wróć → Opcje programisty → Włącz "Debugowanie USB"

### 2. Podłącz telefon kablem USB do komputera

### 3. Uruchom aplikację

```bash
npm run android:run
```

To automatycznie:

- ✅ Zbuduje aplikację
- ✅ Zsynchronizuje z Androidem
- ✅ Zainstaluje na telefonie
- ✅ Uruchomi aplikację

### 4. Gotowe! 🎉

Aplikacja jest teraz na Twoim telefonie!

---

## 🖥️ Opcja B: Emulator (bez telefonu)

**Nie masz telefonu? Testuj na wirtualnym urządzeniu!**

### 1. Otwórz projekt w Android Studio

```bash
npx cap open android
```

### 2. Utwórz wirtualne urządzenie

1. Kliknij ikonę 📱 (Device Manager) u góry
2. Kliknij "Create Device"
3. Wybierz **Pixel 6** → Next
4. Wybierz **Tiramisu (API 33)** → Download (jeśli trzeba) → Next
5. Kliknij **Finish**

### 3. Uruchom emulator

1. W Device Manager kliknij ▶️ obok swojego urządzenia
2. Poczekaj ~30 sekund aż się uruchomi

### 4. Uruchom aplikację

1. U góry wybierz swoje wirtualne urządzenie
2. Kliknij zielony przycisk ▶️ "Run"

### 5. Gotowe! 🎉

Aplikacja działa na wirtualnym telefonie!

**Szczegółowa instrukcja:** [EMULATOR_ANDROID.md](./EMULATOR_ANDROID.md)

---

## 🔍 Debugowanie (Chrome DevTools)

### Najlepszy sposób na debugowanie:

1. Podłącz telefon przez USB
2. Otwórz Chrome na komputerze
3. Wpisz: `chrome://inspect`
4. Znajdź "UniSchedule" na liście
5. Kliknij "inspect"

**Masz pełny DevTools jak w przeglądarce!** 🎉

- Console
- Network
- Elements
- Application (localStorage/storage)

---

## 📱 Testowanie offline

### Test 1: Pierwsze uruchomienie

1. Uruchom aplikację z internetem
2. Poczekaj na "Pobieranie danych..." (5-10 sekund)
3. Dane są zapisane!

### Test 2: Tryb offline

1. Wyłącz WiFi i dane mobilne
2. Otwórz aplikację
3. ✅ Wszystko działa!

### Test 3: Wybór grupy offline

1. Wyłącz internet
2. Przejdź do "Szukaj"
3. Wybierz wydział → kierunek → grupę
4. ✅ Wszystko z cache!

---

## 🐛 Problemy?

### "adb: command not found"

Zainstaluj Android Studio: https://developer.android.com/studio

### Telefon się nie wykrywa

1. Sprawdź czy debugowanie USB jest włączone
2. Zaakceptuj "Zezwól na debugowanie USB" na telefonie
3. Spróbuj innego kabla USB

### Aplikacja się crashuje

Sprawdź logi:

```bash
adb logcat | findstr "Capacitor"
```

---

## 📦 Zbuduj APK do wysłania komuś

```bash
cd android
gradlew assembleDebug
```

APK będzie w: `android/app/build/outputs/apk/debug/app-debug.apk`

Wyślij ten plik komuś, zainstaluje na telefonie!

---

## 🎯 Szybkie komendy

```bash
# Uruchom na telefonie
npm run android:run

# Otwórz Android Studio
npm run android

# Sprawdź czy telefon jest podłączony
adb devices

# Odinstaluj aplikację
adb uninstall com.unischedule.app
```

---

## 📚 Więcej informacji

- Pełna instrukcja: [ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md)
- Dokumentacja offline: [INSTRUKCJA_OFFLINE.md](./INSTRUKCJA_OFFLINE.md)
- README: [README_ANDROID.md](./README_ANDROID.md)

---

## ✅ Checklist testowania

- [ ] Aplikacja instaluje się na telefonie
- [ ] Pierwsze uruchomienie pobiera dane (z internetem)
- [ ] Aplikacja działa offline (bez internetu)
- [ ] Można wybrać grupę offline
- [ ] Plan zajęć wyświetla się offline
- [ ] Deadline'y działają
- [ ] Kalkulator średniej działa
- [ ] Mapa kampusu działa

---

## 🎉 To wszystko!

Aplikacja jest gotowa do testowania i publikacji w Google Play! 📱
