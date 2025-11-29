# 📱 Aplikacja Offline-First - Instrukcja

## ✅ Co zostało zrobione?

Aplikacja działa teraz w trybie **offline-first** - raz pobierze dane i będzie działać zawsze bez internetu.

## 🚀 Pierwsze uruchomienie

### Krok 1: Otwórz aplikację z internetem

```
npm run dev
```

### Krok 2: Poczekaj na inicjalizację

Na górze ekranu zobaczysz: **"Pobieranie danych..."**

Aplikacja automatycznie pobierze:

- ✅ Wszystkie wydziały
- ✅ Wszystkie kierunki
- ✅ Wszystkie grupy
- ✅ Plany zajęć (pierwszy tydzień dla każdej grupy)

To zajmie **~5-10 sekund**.

### Krok 3: Gotowe!

Gdy wskaźnik zniknie, dane są zapisane w localStorage.

## 📴 Testowanie offline

### Test 1: Wyłącz internet

1. Otwórz DevTools (F12)
2. Network → Offline
3. Odśwież stronę (F5)
4. ✅ Aplikacja działa normalnie!

### Test 2: Wybierz grupę offline

1. Wyłącz internet
2. Przejdź do "Szukaj"
3. Wybierz wydział → kierunek → grupę
4. ✅ Wszystko działa z localStorage!

### Test 3: Zobacz plan offline

1. Wyłącz internet
2. Przejdź do "Plan"
3. ✅ Plan zajęć wyświetla się z cache!

## 🔄 Aktualizacja danych

### Automatyczna aktualizacja

Jeśli masz internet, aplikacja:

- Używa danych z localStorage (szybko!)
- Aktualizuje dane w tle (nie blokuje UI)
- Zapisuje nowe dane do localStorage

### Ręczne czyszczenie cache

Jeśli chcesz wymusić ponowne pobranie:

1. Otwórz DevTools Console (F12)
2. Wpisz:

```javascript
localStorage.clear()
location.reload()
```

## 📊 Co jest zapisane w localStorage?

### Dane podstawowe:

- `cached_faculties` - lista wydziałów
- `cached_majors_[wydział]` - kierunki dla wydziału
- `cached_groups_[wydział]_[kierunek]_[tryb]` - grupy

### Plany zajęć:

- `schedule_cache_[groupId]_[weekId]` - plan dla grupy i tygodnia

### Flaga inicjalizacji:

- `data_initialized` - czy dane zostały pobrane

## ⚠️ Limity localStorage

localStorage ma limit **~5-10MB**. Dlatego:

- Zapisujemy tylko **pierwszy tydzień** dla każdej grupy
- Pozostałe tygodnie pobierają się gdy użytkownik ich potrzebuje
- Jeśli localStorage się zapełni, aplikacja przestanie zapisywać nowe plany

## 🐛 Rozwiązywanie problemów

### Problem: "Pobieranie danych..." nie znika

**Rozwiązanie:**

1. Sprawdź czy masz internet
2. Sprawdź czy Supabase jest skonfigurowany w `.env`
3. Otwórz Console (F12) i sprawdź błędy

### Problem: Brak danych offline

**Rozwiązanie:**

1. Upewnij się że raz uruchomiłeś aplikację z internetem
2. Sprawdź localStorage w DevTools → Application → Local Storage
3. Jeśli pusty, wyczyść cache i odśwież z internetem

### Problem: QuotaExceededError

**Rozwiązanie:**

1. localStorage jest pełny
2. Wyczyść stare dane: `localStorage.clear()`
3. Odśwież stronę z internetem

## 🎉 Gotowe!

Aplikacja teraz działa offline-first. Raz pobierze dane i będzie działać zawsze, nawet bez internetu!
