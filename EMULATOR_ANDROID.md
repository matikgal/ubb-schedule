# 📱 Jak skonfigurować emulator Android w Android Studio

## 🎯 Testowanie bez fizycznego telefonu

Możesz testować aplikację na wirtualnym telefonie (emulatorze) w Android Studio!

---

## 1️⃣ Otwórz projekt w Android Studio

W terminalu (w folderze projektu):

```bash
npx cap open android
```

Poczekaj aż Android Studio się otworzy.

---

## 2️⃣ Otwórz Device Manager

### Sposób 1:

- U góry znajdź ikonę telefonu 📱 (Device Manager)
- Kliknij w nią

### Sposób 2:

- Menu: **Tools** → **Device Manager**

---

## 3️⃣ Utwórz nowe wirtualne urządzenie

1. **Kliknij "Create Device"** (lub "+" jeśli masz już jakieś urządzenia)

2. **Wybierz typ urządzenia:**

   - Wybierz **"Phone"**
   - Polecam: **Pixel 6** lub **Pixel 7**
   - Kliknij **"Next"**

3. **Wybierz wersję Androida:**

   - Polecam: **"Tiramisu" (Android 13, API 33)** lub **"UpsideDownCake" (Android 14, API 34)**
   - Jeśli nie jest pobrana, kliknij **"Download"** obok nazwy
   - Poczekaj na pobranie (~1-2 GB)
   - Kliknij **"Next"**

4. **Konfiguracja:**
   - Nazwa: możesz zostawić domyślną
   - Startup orientation: Portrait
   - Kliknij **"Finish"**

---

## 4️⃣ Uruchom emulator

### Sposób 1 - Z Device Manager:

1. W Device Manager znajdź swoje urządzenie
2. Kliknij przycisk ▶️ (Play) obok nazwy
3. Poczekaj ~30 sekund aż emulator się uruchomi

### Sposób 2 - Bezpośrednio:

1. U góry w Android Studio wybierz swoje wirtualne urządzenie z listy
2. Kliknij zielony przycisk ▶️ "Run"
3. Emulator uruchomi się automatycznie

---

## 5️⃣ Uruchom aplikację

1. **Poczekaj aż emulator się w pełni załaduje** (zobaczysz ekran główny Androida)

2. **W Android Studio:**

   - Upewnij się że u góry wybrane jest Twoje wirtualne urządzenie
   - Kliknij zielony przycisk ▶️ "Run"

3. **Aplikacja zainstaluje się i uruchomi na emulatorze!** 🎉

---

## 🎮 Jak używać emulatora

### Podstawowe kontrolki:

- **Kliknięcie** = kliknij myszką
- **Przeciąganie** = przeciągnij myszką
- **Scroll** = kółko myszy lub przeciągnij
- **Wstecz** = przycisk ◀ na panelu bocznym
- **Home** = przycisk ⚪ na panelu bocznym
- **Ostatnie aplikacje** = przycisk ▢ na panelu bocznym

### Panel boczny emulatora:

- **⚙️** = Ustawienia emulatora
- **📷** = Zrób screenshot
- **🔄** = Obróć urządzenie
- **📶** = Symuluj brak internetu
- **📍** = Symuluj lokalizację GPS

---

## 🌐 Testowanie offline w emulatorze

### Wyłącz internet:

1. **Kliknij "..." (More) na panelu bocznym emulatora**
2. **Przejdź do zakładki "Settings"**
3. **Znajdź "Network"**
4. **Ustaw "Network mode" na "None"**
5. **Aplikacja teraz działa offline!**

### Lub szybciej:

1. **Przeciągnij palec z góry ekranu w dół** (Quick Settings)
2. **Wyłącz WiFi**

---

## 🐛 Debugowanie w emulatorze

### Chrome DevTools (NAJLEPSZE!):

1. **Uruchom aplikację na emulatorze**
2. **Otwórz Chrome na komputerze**
3. **Wpisz:** `chrome://inspect`
4. **Znajdź "UniSchedule" na liście**
5. **Kliknij "inspect"**
6. **Masz pełny DevTools!** 🎉

### Logi Android:

W Android Studio, na dole:

- **Zakładka "Logcat"**
- Filtruj po "Capacitor" lub "UniSchedule"

---

## ⚙️ Ustawienia emulatora (opcjonalne)

### Zwiększ wydajność:

1. **Tools → Device Manager**
2. **Kliknij ✏️ (Edit) obok swojego urządzenia**
3. **"Show Advanced Settings"**
4. **Zwiększ:**
   - RAM: 2048 MB → 4096 MB
   - VM heap: 256 MB → 512 MB
   - Internal Storage: 2048 MB → 4096 MB
5. **Kliknij "Finish"**

### Włącz akcelerację sprzętową:

W ustawieniach Android Studio:

- **File → Settings → Appearance & Behavior → System Settings → Android SDK**
- **SDK Tools (zakładka)**
- Zaznacz: **"Intel x86 Emulator Accelerator (HAXM installer)"**
- Kliknij **"Apply"**

---

## 🚀 Szybkie komendy

### Uruchom emulator z terminala:

```bash
# Lista dostępnych emulatorów
emulator -list-avds

# Uruchom konkretny emulator
emulator -avd Pixel_6_API_33
```

### Zainstaluj APK na emulatorze:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Sprawdź czy emulator działa:

```bash
adb devices
```

---

## 🔧 Rozwiązywanie problemów

### Problem: Emulator jest bardzo wolny

**Rozwiązanie:**

1. Upewnij się że masz włączoną wirtualizację w BIOS (Intel VT-x / AMD-V)
2. Zainstaluj HAXM (Intel) lub WHPX (Windows Hypervisor)
3. Zwiększ RAM emulatora (patrz wyżej)
4. Zamknij inne aplikacje

### Problem: Emulator się nie uruchamia

**Rozwiązanie:**

1. Sprawdź czy masz wystarczająco miejsca na dysku (~10 GB)
2. Sprawdź czy wirtualizacja jest włączona w BIOS
3. Spróbuj utworzyć nowe urządzenie z niższą wersją Androida (API 30)

### Problem: Aplikacja się crashuje na emulatorze

**Rozwiązanie:**

1. Sprawdź logi w Logcat
2. Spróbuj z inną wersją Androida
3. Wyczyść i przebuduj projekt:
   ```bash
   cd android
   gradlew clean
   cd ..
   npm run build
   npx cap sync android
   ```

---

## 📊 Porównanie: Emulator vs Fizyczny telefon

| Cecha             | Emulator   | Fizyczny telefon      |
| ----------------- | ---------- | --------------------- |
| Szybkość          | Wolniejszy | Szybszy               |
| Debugowanie       | Łatwiejsze | Łatwiejsze            |
| Testy offline     | Łatwe      | Łatwe                 |
| Testy GPS         | Symulowane | Prawdziwe             |
| Testy aparatu     | Brak       | Prawdziwe             |
| Testy powiadomień | Działają   | Działają              |
| Koszt             | Darmowy    | Potrzebujesz telefonu |

---

## 🎯 Polecane konfiguracje

### Do szybkiego testowania:

- **Urządzenie:** Pixel 6
- **Android:** 13 (API 33)
- **RAM:** 2048 MB

### Do dokładnego testowania:

- **Urządzenie:** Pixel 7 Pro
- **Android:** 14 (API 34)
- **RAM:** 4096 MB

### Do testowania starszych wersji:

- **Urządzenie:** Pixel 4
- **Android:** 10 (API 29)
- **RAM:** 2048 MB

---

## ✅ Checklist

- [ ] Android Studio zainstalowane
- [ ] Projekt otwarty w Android Studio
- [ ] Device Manager otwarty
- [ ] Wirtualne urządzenie utworzone
- [ ] Emulator uruchomiony
- [ ] Aplikacja zainstalowana na emulatorze
- [ ] Aplikacja działa!
- [ ] Chrome DevTools podłączone
- [ ] Testowanie offline działa

---

## 🎉 Gotowe!

Teraz możesz testować aplikację na wirtualnym telefonie bez potrzeby fizycznego urządzenia! 📱

**Pytania?** Sprawdź [ANDROID_INSTRUKCJA.md](./ANDROID_INSTRUKCJA.md) lub [JAK_TESTOWAC.md](./JAK_TESTOWAC.md)
