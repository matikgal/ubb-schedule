# 📱 Instrukcja - Testowanie na Androidzie

## 🎯 Wymagania

### 1. Android Studio

Pobierz i zainstaluj: https://developer.android.com/studio

### 2. Java JDK

- Android Studio zawiera JDK
- Lub pobierz: https://www.oracle.com/java/technologies/downloads/

### 3. Włącz tryb dewelopera na telefonie

1. Otwórz **Ustawienia** → **O telefonie**
2. Kliknij 7 razy w **Numer kompilacji**
3. Wróć do Ustawień → **Opcje programisty**
4. Włącz **Debugowanie USB**

## 🚀 Krok 1: Zbuduj aplikację

```bash
npm run build
```

## 🔄 Krok 2: Synchronizuj z Androidem

```bash
npx cap sync android
```

## 📱 Krok 3: Testowanie na telefonie

### Opcja A: Przez Android Studio (POLECAM)

1. **Otwórz projekt w Android Studio:**

```bash
npx cap open android
```

2. **Podłącz telefon przez USB**

   - Podłącz telefon kablem USB
   - Na telefonie zaakceptuj "Zezwól na debugowanie USB"

3. **Wybierz urządzenie**

   - W Android Studio, u góry wybierz swój telefon z listy
   - Kliknij zielony przycisk ▶️ "Run"

4. **Aplikacja zainstaluje się na telefonie!**

### Opcja B: Przez terminal

```bash
npm run android:run
```

To automatycznie:

- Zbuduje aplikację
- Zsynchronizuje z Androidem
- Zainstaluje na podłączonym telefonie

## 📲 Krok 4: Testowanie przez WiFi (bez kabla)

### 1. Podłącz telefon przez USB i włącz ADB przez WiFi:

```bash
# Sprawdź czy telefon jest podłączony
adb devices

# Włącz ADB przez TCP na porcie 5555
adb tcpip 5555

# Sprawdź IP telefonu (Ustawienia → O telefonie → Status → Adres IP)
# Przykład: 192.168.1.100

# Połącz się przez WiFi
adb connect 192.168.1.100:5555

# Odłącz kabel USB - teraz działa przez WiFi!
```

### 2. Teraz możesz uruchamiać aplikację bez kabla:

```bash
npm run android:run
```

## 🔍 Debugowanie

### 1. Logi w czasie rzeczywistym:

```bash
adb logcat | findstr "Capacitor"
```

### 2. Chrome DevTools (NAJLEPSZE!):

1. Otwórz Chrome
2. Wpisz: `chrome://inspect`
3. Znajdź swoją aplikację na liście
4. Kliknij "inspect"
5. Masz pełny DevTools jak w przeglądarce! 🎉

### 3. Sprawdź czy aplikacja działa:

```bash
adb shell pm list packages | findstr unischedule
```

## 📦 Krok 5: Zbuduj APK do instalacji

### Debug APK (do testowania):

```bash
cd android
gradlew assembleDebug
```

APK będzie w: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (do publikacji):

1. **Wygeneruj klucz podpisywania:**

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Skonfiguruj podpisywanie:**

Utwórz plik `android/key.properties`:

```
storePassword=twoje_haslo
keyPassword=twoje_haslo
keyAlias=my-key-alias
storeFile=../my-release-key.keystore
```

3. **Zbuduj Release APK:**

```bash
cd android
gradlew assembleRelease
```

APK będzie w: `android/app/build/outputs/apk/release/app-release.apk`

## 📤 Krok 6: Instalacja APK na telefonie

### Metoda 1: Przez ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Metoda 2: Przez plik

1. Skopiuj APK na telefon (email, Dysk Google, USB)
2. Na telefonie otwórz plik APK
3. Zaakceptuj instalację z nieznanych źródeł

## 🎨 Krok 7: Dodaj ikonę aplikacji

1. Wygeneruj ikony: https://icon.kitchen/
2. Pobierz zestaw ikon Android
3. Skopiuj do `android/app/src/main/res/`

Lub użyj narzędzia:

```bash
npm install -g cordova-res
cordova-res android --skip-config --copy
```

## 🚀 Krok 8: Publikacja w Google Play

### 1. Przygotuj aplikację:

- Zbuduj Release APK (lub AAB)
- Przygotuj ikony (512x512 px)
- Przygotuj screenshoty (min. 2)
- Napisz opis aplikacji

### 2. Utwórz konto Google Play Console:

https://play.google.com/console

Koszt: $25 (jednorazowo)

### 3. Utwórz nową aplikację:

1. Kliknij "Utwórz aplikację"
2. Wypełnij podstawowe informacje
3. Prześlij APK/AAB
4. Wypełnij formularz sklepu
5. Wyślij do przeglądu

## 🔧 Rozwiązywanie problemów

### Problem: "adb: command not found"

**Rozwiązanie:**
Dodaj Android SDK do PATH:

```
C:\Users\[USER]\AppData\Local\Android\Sdk\platform-tools
```

### Problem: Telefon nie wykrywa się

**Rozwiązanie:**

1. Sprawdź czy debugowanie USB jest włączone
2. Zainstaluj sterowniki USB dla swojego telefonu
3. Spróbuj innego kabla USB (niektóre są tylko do ładowania)

### Problem: Aplikacja się crashuje

**Rozwiązanie:**
Sprawdź logi:

```bash
adb logcat | findstr "AndroidRuntime"
```

### Problem: Brak internetu w aplikacji

**Rozwiązanie:**
Dodaj w `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 📝 Szybkie komendy

```bash
# Zbuduj i uruchom na telefonie
npm run android:run

# Tylko synchronizuj (bez uruchamiania)
npm run android:sync

# Otwórz Android Studio
npm run android

# Sprawdź podłączone urządzenia
adb devices

# Odinstaluj aplikację
adb uninstall com.unischedule.app

# Wyczyść cache i przebuduj
cd android
gradlew clean
cd ..
npm run android:sync
```

## 🎉 Gotowe!

Teraz możesz testować aplikację na swoim telefonie Android! 📱

Aplikacja działa offline-first, więc po pierwszym uruchomieniu z internetem będzie działać zawsze, nawet bez połączenia.
