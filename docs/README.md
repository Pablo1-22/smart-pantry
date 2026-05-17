# Smart Pantry — Dokumentacja Projektu

**Autorzy:** Paweł Marek (52740) · Maciej Mormul (55272)  
**Przedmiot:** Architektura i komunikacja w aplikacjach mobilnych  
**Semestr:** 6

---

## Spis treści

1. [Ogólne założenia projektu](#1-ogólne-założenia-projektu)
2. [Opis systemu](#2-opis-systemu)
3. [Podział zadań](#3-podział-zadań)
4. [Zastosowane technologie](#4-zastosowane-technologie)
5. [Architektura systemu](#5-architektura-systemu)
6. [Schemat bazy danych](#6-schemat-bazy-danych)
7. [Uruchomienie](#7-uruchomienie)

---

## 1. Ogólne założenia projektu

Smart Pantry to aplikacja webowa wspomagająca zarządzanie domowymi zapasami. Jej głównym celem jest eliminacja problemu marnowania żywności poprzez bieżące śledzenie stanów magazynowych, automatyczne generowanie list zakupów oraz powiadamianie o zbliżających się datach ważności produktów.

Aplikacja umożliwia współdzielenie spiżarni między wieloma użytkownikami (np. współlokatorami), co czyni ją praktycznym narzędziem dla gospodarstw domowych.

**Kluczowe problemy rozwiązywane przez system:**

- Brak wiedzy o aktualnych zapasach → przeglądarka produktów z wyszukiwaniem i filtrowaniem
- Marnowanie żywności → alerty o datach ważności (3 dni / przeterminowane)
- Niepotrzebne zakupy → automatyczna lista zakupów generowana na podstawie progów minimalnych
- Brak dostępu offline → tryb offline z IndexedDB i synchronizacją po powrocie do sieci

---

## 2. Opis systemu

System składa się z trzech warstw:

```
┌─────────────────────────────────────────────┐
│            Przeglądarka (React)              │
│  UI / logika offline / IndexedDB (Dexie.js)  │
└──────────────────┬──────────────────────────┘
                   │ HTTP / REST API
┌──────────────────▼──────────────────────────┐
│             Backend (FastAPI)                │
│   Uwierzytelnianie JWT · CRUD · Sync API     │
└──────────────────┬──────────────────────────┘
                   │ async SQLAlchemy
┌──────────────────▼──────────────────────────┐
│            Baza danych (PostgreSQL)          │
│   users · pantries · products · shopping     │
└─────────────────────────────────────────────┘
```

### Główne funkcjonalności

| Moduł | Opis |
|-------|------|
| **Uwierzytelnianie** | Rejestracja, logowanie, JWT access + refresh token, usuwanie konta |
| **Spiżarnie** | Tworzenie, edycja, usuwanie, zapraszanie członków |
| **Produkty** | Pełny CRUD, filtrowanie po kategorii i wyszukiwanie |
| **Skaner kodów** | Skanowanie EAN-13/8/QR → autouzupełnianie z Open Food Facts |
| **Lista zakupów** | Automatyczne generowanie gdy `quantity < min_quantity` |
| **Tryb offline** | Wszystkie operacje zapisywane w IndexedDB, kolejka synchronizacji |
| **Synchronizacja** | Pull/push z backendem, rozwiązywanie konfliktów last-write-wins |

---

## 3. Podział zadań

| Zadanie | Paweł Marek | Maciej Mormul |
|---------|:-----------:|:-------------:|
| Konfiguracja projektu (repo, Docker, struktury) | ✓ | |
| Backend — modele bazy danych i migracje | ✓ | |
| Backend — uwierzytelnianie JWT | ✓ | |
| Backend — CRUD produktów i spiżarni | ✓ | ✓ |
| Backend — integracja Open Food Facts | | ✓ |
| Backend — API synchronizacji offline | ✓ | |
| Backend — lista zakupów | | ✓ |
| Frontend — React routing, AuthContext | ✓ | |
| Frontend — widoki logowania i rejestracji | | ✓ |
| Frontend — Dashboard i zarządzanie spiżarniami | ✓ | |
| Frontend — CRUD produktów (PantryPage) | ✓ | ✓ |
| Frontend — skaner kodów kreskowych | | ✓ |
| Frontend — tryb offline (Dexie.js, SyncContext) | ✓ | |
| Frontend — lista zakupów (ShoppingListPage) | | ✓ |
| Frontend — współdzielenie spiżarni (modal członków) | ✓ | |
| Dokumentacja | ✓ | ✓ |

---

## 4. Zastosowane technologie

### Backend

| Technologia | Wersja | Rola |
|-------------|--------|------|
| **Python** | 3.12 | Język backendu |
| **FastAPI** | 0.115 | Framework REST API (bonus punktowy) |
| **SQLAlchemy** | 2.0 | ORM (tryb async) |
| **Alembic** | 1.14 | Migracje schematu bazy danych |
| **asyncpg** | 0.30 | Async driver PostgreSQL |
| **Pydantic** | 2.10 | Walidacja danych i schematy |
| **PyJWT** | 2.10 | Generowanie i weryfikacja tokenów JWT |
| **bcrypt / passlib** | 4.0 | Haszowanie haseł |
| **httpx** | 0.28 | Klient HTTP do Open Food Facts API |
| **loguru** | 0.7 | Logowanie zdarzeń aplikacji |

### Frontend

| Technologia | Wersja | Rola |
|-------------|--------|------|
| **React** | 19 | Framework UI |
| **TypeScript** | 5 | Statyczne typowanie |
| **Vite** | 8 | Bundler i serwer deweloperski |
| **React Router** | 7 | Routing SPA |
| **Axios** | 1.14 | Klient HTTP (interceptory JWT) |
| **Dexie.js** | 4 | Wrapper IndexedDB (lokalna baza offline) |
| **@zxing/browser** | 0.1 | Skaner kodów kreskowych (kamera) |

### Infrastruktura

| Technologia | Rola |
|-------------|------|
| **PostgreSQL 16** | Główna baza danych |
| **Docker** | Konteneryzacja serwisów |
| **docker-compose** | Orkiestracja: db + backend + frontend |

### Zewnętrzne API

| API | Cel |
|-----|-----|
| **Open Food Facts** | Pobieranie nazwy, kategorii i zdjęcia produktu na podstawie kodu kreskowego (EAN). Bezpłatne, bez klucza API. |

---

## 5. Architektura systemu

### Przepływ uwierzytelniania

```
Klient                          Backend
  │                                │
  │── POST /api/auth/login ───────►│
  │                                │── weryfikacja hasła (bcrypt)
  │◄── { access_token,             │── generowanie JWT (HS256)
  │       refresh_token } ─────────│
  │                                │
  │── GET /api/pantries ──────────►│
  │   Authorization: Bearer <JWT>  │── weryfikacja tokena
  │◄── [ ...pantries ] ────────────│
  │                                │
  │── POST /api/auth/refresh ─────►│  (gdy access token wygaśnie)
  │◄── { nowy access_token } ──────│
```

### Przepływ trybu offline i synchronizacji

```
Aplikacja uruchomiona
        │
        ▼
Ładuj dane z IndexedDB ──────────► Wyświetl UI natychmiast
        │
        ▼ (w tle)
GET /api/sync/pull
        │
        ▼
Upsert do IndexedDB (products)
        │
        ▼
Brak sieci wykryty (navigator.onLine = false)
        │
  CRUD operacje ──────────────────► IndexedDB + pending_actions queue
        │
        ▼
Powrót sieci (online event)
        │
        ▼
POST /api/sync/push (kolejka) ───► Backend: last-write-wins przez updated_at
        │
        ▼
Usuń z kolejki akcje z success: true
```

---

## 6. Schemat bazy danych

```
┌──────────────────┐         ┌──────────────────────┐
│      users       │         │       pantries       │
├──────────────────┤         ├──────────────────────┤
│ id          UUID │         │ id          UUID (PK)│
│ email       str  │──┐      │ name        str      │
│ password_hash str│  │      │ owner_id    UUID (FK)│──► users.id
│ display_name str │  │      │ created_at  timestamp│
│ created_at  ts   │  │      └──────────┬───────────┘
└──────────────────┘  │                 │
                      │      ┌──────────▼───────────┐
                      │      │    pantry_members    │
                      │      ├──────────────────────┤
                      └─────►│ id          UUID (PK)│
                             │ pantry_id   UUID (FK)│──► pantries.id
                             │ user_id     UUID (FK)│──► users.id
                             │ role        enum     │  owner | member
                             │ joined_at   timestamp│
                             └──────────┬───────────┘
                                        │
               ┌────────────────────────┴──────────────────────┐
               │                                               │
┌──────────────▼──────────────┐         ┌─────────────────────▼──────┐
│          products           │         │    shopping_list_items     │
├─────────────────────────────┤         ├────────────────────────────┤
│ id            UUID (PK)     │         │ id              UUID (PK)  │
│ pantry_id     UUID (FK)     │──►      │ pantry_id       UUID (FK)  │──► pantries.id
│ name          str           │         │ product_name    str        │
│ barcode       str?          │         │ quantity        float      │
│ image_url     str?          │         │ unit            str        │
│ quantity      float         │         │ category        str?       │
│ unit          str           │         │ is_bought       bool       │
│ category      str?          │         │ source_product_id UUID?    │──► products.id
│ expiry_date   date?         │         │ created_at      timestamp  │
│ min_quantity  float         │         └────────────────────────────┘
│ created_at    timestamp     │
│ updated_at    timestamp     │  ← używane przy synchronizacji
└─────────────────────────────┘
```

### Relacje

| Relacja | Typ | Opis |
|---------|-----|------|
| `users` → `pantries` | 1:N | Użytkownik może być właścicielem wielu spiżarni |
| `pantries` ↔ `users` przez `pantry_members` | N:M | Wielu użytkowników może współdzielić spiżarnię |
| `pantries` → `products` | 1:N | Spiżarnia zawiera wiele produktów |
| `pantries` → `shopping_list_items` | 1:N | Spiżarnia ma jedną listę zakupów |
| `shopping_list_items` → `products` | N:1 | Pozycja listy może wskazywać na istniejący produkt |

### Indeksy i ograniczenia

- `users.email` — `UNIQUE`
- `pantry_members(pantry_id, user_id)` — `UNIQUE` (jeden użytkownik raz na spiżarnię)
- `products.updated_at` — indeksowane (używane przy synchronizacji)

---

## 7. Uruchomienie

### Wymagania

- Docker Desktop
- Node.js 20+ (tylko do pierwszego `npm ci`)

### Kroki

```bash
# 1. Pobierz zależności frontendu (jednorazowo)
cd smart-pantry/frontend
npm ci
cd ..

# 2. Uruchom całą aplikację
docker compose up --build
```

| Serwis | Adres |
|--------|-------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger (interaktywne docs) | http://localhost:8000/docs |

### Zasilenie bazy przykładowymi danymi

```bash
cd smart-pantry
python seed.py twoj@email.pl twoje_haslo --url https://smart-pantry-production-1680.up.railway.app (dla konta railway)
```

### Zatrzymanie

```bash
docker compose down        # zatrzymaj kontenery
docker compose down -v     # + usuń dane bazy PostgreSQL
```
