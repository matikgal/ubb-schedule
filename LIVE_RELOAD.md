# 🔥 Live Reload - Zmiany na żywo na telefonie!

Zmieniasz kod → Zapisujesz → Od razu widzisz na telefonie! ⚡

---

## 🚀 Krok po kroku

### 1️⃣ Sprawdź IP swojego komputera

**Windows:**

```bash
ipconfig
```

Znajdź **IPv4 Address**, np:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Zapisz to IP!** (np. `192.168.1.100`)

---

### 2️⃣ Włącz Live Reload w konfiguracji

Otwórz `capacitor.config.ts` i odkomentuj/dodaj:

```typescript
server: {
  androidScheme: 'https',
  // ZAMIEŃ na swoje IP!
  url: 'http://192.168.1.100:5173',
  cleartext: true
},
```

**WAŻNE:** Zamień `192.168.1.100` na swoje IP z kroku 1!

---

### 3️⃣ Uruchom dev server

```bash
npm run dev
```

Zostaw terminal otwarty! Serwer musi działać.

---

### 4️⃣ Zsynchronizuj z telefonem

**W NOWYM terminalu:**

```bash
npx cap sync android
```

---

### 5️⃣ Zainstaluj na telefonie

#### Opcja A - Przez Android Studio:

```bash
npx cap open android
```

Wybierz telefon i kliknij ▶️

#### Opcja B - Przez terminal:

```bash
npm run android:run
```

#### Opcja C - Zbuduj APK:

```bash
cd android
gradlew assembleDebug
```

Zainstaluj `android/app/build/outputs/apk/debug/app-debug.apk` na telefonie

---

### 6️⃣ Gotowe! 🎉

**Teraz:**

1. Zmień coś w kodzie (np. w `pages/Home.tsx`)
2. Zapisz plik (Ctrl + S)
3. **Aplikacja na telefonie odświeży się automatycznie!** ⚡

---

## 📱 Wymagania

- **Telefon i komputer w tej samej sieci WiFi!**
- Dev server musi działać (`npm run dev`)
- Firewall nie może blokować portu 5173

---

## 🔧 Rozwiązywanie problemów

### Problem: Aplikacja nie łączy się

**Sprawdź:**

1. Czy telefon i komputer są w tej samej sieci WiFi?
2. Czy `npm run dev` działa?
3. Czy możesz otworzyć `http://TWOJE_IP:5173` w przeglądarce na telefonie?

**Rozwiązanie:**

- Wyłącz firewall na chwilę
- Sprawdź czy IP się nie zmieniło (`ipconfig`)
- Upewnij się że port 5173 nie jest zablokowany

### Problem: Zmiany nie odświeżają się

**Rozwiązanie:**

1. Sprawdź czy dev server widzi zmiany (terminal powinien pokazać "hmr update")
2. Odśwież aplikację ręcznie (przeciągnij w dół)
3. Zrestartuj aplikację na telefonie

### Problem: "ERR_CONNECTION_REFUSED"

**Rozwiązanie:**

1. Sprawdź czy `npm run dev` działa
2. Sprawdź IP - może się zmienić po restarcie routera
3. Dodaj regułę w firewall dla portu 5173

---

## 🎯 Wyłącz Live Reload (produkcja)

Gdy skończysz developować, **WYŁĄCZ** live reload:

W `capacitor.config.ts` zakomentuj:

```typescript
server: {
  androidScheme: 'https',
  // url: 'http://192.168.1.100:5173',  // ZAKOMENTOWANE!
  // cleartext: true
},
```

Potem:

```bash
npm run build
npx cap sync android
```

---

## 💡 Wskazówki

### Szybsze odświeżanie:

- Vite ma bardzo szybki HMR (Hot Module Replacement)
- Większość zmian odświeży się w <1 sekundę!

### Debugowanie:

- Chrome DevTools nadal działa: `chrome://inspect`
- Widzisz console.log() na żywo!

### Testowanie offline:

- Wyłącz live reload (zakomentuj `url`)
- Zbuduj i zainstaluj ponownie
- Teraz możesz testować offline

---

## 🔥 Workflow developmentu

```bash
# Terminal 1 - Dev server (zostaw otwarty)
npm run dev

# Terminal 2 - Pierwsza instalacja
npx cap sync android
npm run android:run

# Teraz:
# 1. Edytuj kod
# 2. Zapisz (Ctrl + S)
# 3. Zobacz zmiany na telefonie! ⚡
```

---

## ✅ Checklist

- [ ] Sprawdziłem IP komputera (`ipconfig`)
- [ ] Zaktualizowałem `capacitor.config.ts` z moim IP
- [ ] Uruchomiłem `npm run dev`
- [ ] Zsynchronizowałem `npx cap sync android`
- [ ] Zainstalowałem aplikację na telefonie
- [ ] Telefon i komputer w tej samej sieci WiFi
- [ ] Zmiany odświeżają się automatycznie! 🎉

---

## 🎉 Gotowe!

Teraz masz pełny live reload - zmieniasz kod i od razu widzisz na telefonie! 🚀📱

**Pytania?** Sprawdź sekcję "Rozwiązywanie problemów" powyżej!
