# Smart Pantry — Dokumentacja API

Wszystkie endpointy (poza `/api/auth/register`, `/api/auth/login`, `/api/health`) wymagają nagłówka:

```
Authorization: Bearer <access_token>
```

Interaktywna dokumentacja Swagger dostępna pod adresem: `http://localhost:8000/docs`

---

## Spis treści

- [Uwierzytelnianie](#uwierzytelnianie-apiauthprefix)
- [Spiżarnie](#spiżarnie-apipantriesprefix)
- [Produkty](#produkty-apipantriesidproducts)
- [Kody kreskowe](#kody-kreskowe-apibarcodeprefix)
- [Lista zakupów](#lista-zakupów-apipantriesidshopping-list)
- [Synchronizacja](#synchronizacja-apisyncprefix)
- [Kody błędów](#kody-błędów)

---

## Uwierzytelnianie `/api/auth`

### POST `/api/auth/register`

Rejestracja nowego użytkownika.

**Request body:**
```json
{
  "email": "jan@example.com",
  "password": "bezpieczne123",
  "display_name": "Jan Kowalski"
}
```

> Hasło musi mieć minimum 8 znaków.

**Response `201 Created`:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "jan@example.com",
  "display_name": "Jan Kowalski",
  "created_at": "2026-04-09T10:00:00Z"
}
```

**Błędy:** `409` — email już zajęty · `422` — błąd walidacji

---

### POST `/api/auth/login`

Logowanie — zwraca parę tokenów JWT.

**Request body:**
```json
{
  "email": "jan@example.com",
  "password": "bezpieczne123"
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

> `access_token` — krótkotrwały (30 min), używany w nagłówku `Authorization`  
> `refresh_token` — długotrwały (7 dni), używany wyłącznie do odświeżenia access tokena

**Błędy:** `401` — nieprawidłowe dane logowania

---

### POST `/api/auth/refresh`

Odświeżenie wygasłego access tokena.

**Request body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `200 OK`:** — taka sama struktura jak `/login`

**Błędy:** `401` — nieprawidłowy lub wygasły refresh token

---

## Spiżarnie `/api/pantries`

### GET `/api/pantries/`

Lista spiżarni zalogowanego użytkownika (jako właściciel lub członek).

**Response `200 OK`:**
```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Kuchnia",
    "owner_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "created_at": "2026-04-01T08:00:00Z"
  }
]
```

---

### POST `/api/pantries/`

Tworzenie nowej spiżarni. Twórca automatycznie staje się właścicielem (`owner`).

**Request body:**
```json
{
  "name": "Spiżarnia główna"
}
```

**Response `201 Created`:**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "Spiżarnia główna",
  "owner_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-04-09T12:00:00Z"
}
```

---

### GET `/api/pantries/{pantry_id}`

Szczegóły spiżarni.

**Response `200 OK`:** — obiekt `PantryResponse` jak powyżej

**Błędy:** `403` — brak dostępu · `404` — nie znaleziono

---

### PUT `/api/pantries/{pantry_id}`

Zmiana nazwy spiżarni.

**Request body:**
```json
{
  "name": "Nowa nazwa"
}
```

**Response `200 OK`:** — zaktualizowany obiekt `PantryResponse`

---

### DELETE `/api/pantries/{pantry_id}`

Usunięcie spiżarni (tylko właściciel). Kaskadowo usuwa produkty i listę zakupów.

**Response `204 No Content`**

**Błędy:** `403` — nie jesteś właścicielem

---

### GET `/api/pantries/{pantry_id}/members`

Lista członków spiżarni.

**Response `200 OK`:**
```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_email": "jan@example.com",
    "role": "owner",
    "joined_at": "2026-04-01T08:00:00Z"
  },
  {
    "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "user_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "user_email": "anna@example.com",
    "role": "member",
    "joined_at": "2026-04-05T14:30:00Z"
  }
]
```

> `role` może być: `owner` lub `member`

---

### POST `/api/pantries/{pantry_id}/invite`

Zaproszenie użytkownika do spiżarni (tylko właściciel). Zaproszony musi być już zarejestrowany.

**Request body:**
```json
{
  "email": "anna@example.com"
}
```

**Response `201 Created`:** — obiekt `PantryMemberResponse` dla nowego członka

**Błędy:** `403` — nie jesteś właścicielem · `404` — użytkownik nie znaleziony · `409` — już jest członkiem

---

### DELETE `/api/pantries/{pantry_id}/members/{user_id}`

Usunięcie członka ze spiżarni. Właściciel może usunąć każdego członka; zwykły użytkownik może usunąć tylko siebie.

**Response `204 No Content`**

---

## Produkty `/api/pantries/{id}/products`

### GET `/api/pantries/{pantry_id}/products/`

Lista produktów w spiżarni. Obsługuje filtrowanie i wyszukiwanie.

**Query parameters:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `category` | `string` | Filtrowanie po kategorii (np. `nabiał`) |
| `search` | `string` | Wyszukiwanie po nazwie (case-insensitive, częściowe dopasowanie) |

**Przykład:** `GET /api/pantries/{id}/products/?category=nabiał&search=mleko`

**Response `200 OK`:**
```json
[
  {
    "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "pantry_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "name": "Mleko 3.2%",
    "barcode": "5901234123457",
    "image_url": "https://images.openfoodfacts.org/images/products/590/123/412/3457/front.jpg",
    "quantity": 2.0,
    "unit": "l",
    "category": "nabiał",
    "expiry_date": "2026-04-15",
    "min_quantity": 1.0,
    "created_at": "2026-04-09T10:00:00Z",
    "updated_at": "2026-04-09T10:00:00Z"
  }
]
```

---

### POST `/api/pantries/{pantry_id}/products/`

Dodanie nowego produktu do spiżarni.

**Request body:**
```json
{
  "name": "Mleko 3.2%",
  "barcode": "5901234123457",
  "image_url": "https://images.openfoodfacts.org/images/products/...",
  "quantity": 2.0,
  "unit": "l",
  "category": "nabiał",
  "expiry_date": "2026-04-15",
  "min_quantity": 1.0
}
```

> Wymagane jest tylko pole `name`. Pozostałe są opcjonalne.  
> `unit` domyślnie: `"szt"` · `quantity` domyślnie: `1.0` · `min_quantity` domyślnie: `0.0`

**Response `201 Created`:** — pełny obiekt `ProductResponse`

**Błędy:** `422` — ujemna ilość lub min_quantity

---

### GET `/api/pantries/{pantry_id}/products/{product_id}`

Szczegóły jednego produktu.

**Response `200 OK`:** — obiekt `ProductResponse`

**Błędy:** `404` — produkt nie istnieje lub należy do innej spiżarni

---

### PUT `/api/pantries/{pantry_id}/products/{product_id}`

Aktualizacja produktu (częściowa — tylko podane pola).

**Request body** (wszystkie pola opcjonalne):
```json
{
  "quantity": 1.0,
  "expiry_date": "2026-04-20"
}
```

**Response `200 OK`:** — zaktualizowany obiekt `ProductResponse`

---

### DELETE `/api/pantries/{pantry_id}/products/{product_id}`

Usunięcie produktu.

**Response `204 No Content`**

---

## Kody kreskowe `/api/barcode`

### GET `/api/barcode/{code}`

Pobranie danych produktu z bazy Open Food Facts na podstawie kodu EAN-13, EAN-8 lub QR.

**Przykład:** `GET /api/barcode/5901234123457`

**Response `200 OK` — produkt znaleziony:**
```json
{
  "barcode": "5901234123457",
  "name": "Mleko UHT 3.2%",
  "category": "Nabiał",
  "image_url": "https://images.openfoodfacts.org/images/products/590/123/412/3457/front.jpg",
  "found": true
}
```

**Response `200 OK` — produkt nie znaleziony:**
```json
{
  "barcode": "9999999999999",
  "name": null,
  "category": null,
  "image_url": null,
  "found": false
}
```

> Endpoint zawsze zwraca `200`. Pole `found` informuje, czy produkt istnieje w bazie Open Food Facts.

---

## Lista zakupów `/api/pantries/{id}/shopping-list`

### GET `/api/pantries/{pantry_id}/shopping-list/`

Pobranie listy zakupów. Pozycje nie-kupione są zwracane przed kupionymi.

**Response `200 OK`:**
```json
[
  {
    "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
    "pantry_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "product_name": "Mleko 3.2%",
    "quantity": 2.0,
    "unit": "l",
    "category": "nabiał",
    "is_bought": false,
    "source_product_id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "created_at": "2026-04-09T11:00:00Z"
  }
]
```

---

### POST `/api/pantries/{pantry_id}/shopping-list/`

Ręczne dodanie pozycji do listy zakupów.

**Request body:**
```json
{
  "product_name": "Chleb żytni",
  "quantity": 1.0,
  "unit": "szt",
  "category": "pieczywo"
}
```

**Response `201 Created`:** — obiekt `ShoppingListItemResponse`

---

### POST `/api/pantries/{pantry_id}/shopping-list/generate`

Automatyczne wygenerowanie listy zakupów. Dodaje pozycje dla wszystkich produktów, których `quantity < min_quantity`.

**Response `200 OK`:** — lista `ShoppingListItemResponse[]` z nowo dodanymi pozycjami

---

### PUT `/api/pantries/{pantry_id}/shopping-list/{item_id}`

Aktualizacja pozycji (zmiana ilości lub oznaczenie jako kupione).

**Request body:**
```json
{
  "is_bought": true
}
```

> Gdy `is_bought` zmienia się na `true`:
> - jeśli pozycja ma `source_product_id` → ilość produktu w spiżarni zostaje zwiększona
> - jeśli nie ma `source_product_id` → nowy produkt zostaje dodany do spiżarni

**Response `200 OK`:** — zaktualizowany obiekt `ShoppingListItemResponse`

---

### DELETE `/api/pantries/{pantry_id}/shopping-list/{item_id}`

Usunięcie pozycji z listy zakupów.

**Response `204 No Content`**

---

## Synchronizacja `/api/sync`

### GET `/api/sync/pull`

Pobranie produktów ze wszystkich spiżarni użytkownika. Opcjonalnie filtrowanie po dacie ostatniej zmiany.

**Query parameters:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `since` | `datetime` (ISO 8601) | Pobierz tylko produkty zmienione po tej dacie |

**Przykład:** `GET /api/sync/pull?since=2026-04-09T10:00:00Z`

**Response `200 OK`:** — lista `ProductResponse[]`

---

### POST `/api/sync/push`

Przesłanie kolejki operacji wykonanych offline. Operacje są przetwarzane chronologicznie.

**Request body:**
```json
{
  "actions": [
    {
      "type": "create",
      "pantry_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
      "payload": {
        "name": "Jogurt naturalny",
        "quantity": 3.0,
        "unit": "szt",
        "category": "nabiał",
        "min_quantity": 1.0
      },
      "timestamp": "2026-04-09T09:30:00Z"
    },
    {
      "type": "update",
      "pantry_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
      "payload": {
        "quantity": 1.0
      },
      "timestamp": "2026-04-09T09:45:00Z"
    },
    {
      "type": "delete",
      "pantry_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
      "timestamp": "2026-04-09T09:50:00Z"
    }
  ]
}
```

> `type` może być: `create`, `update`, `delete`  
> `id` dla `create` — UUID generowany po stronie klienta (idempotentność)  
> Konflikty rozwiązywane przez `updated_at` (last-write-wins)

**Response `200 OK`:**
```json
{
  "results": [
    {
      "index": 0,
      "success": true,
      "product": { "id": "b8c9d0e1-...", "name": "Jogurt naturalny", "..." : "..." }
    },
    {
      "index": 1,
      "success": true,
      "product": { "id": "f6a7b8c9-...", "quantity": 1.0, "..." : "..." }
    },
    {
      "index": 2,
      "success": true,
      "product": null
    }
  ]
}
```

---

## Zdrowie serwera

### GET `/api/health`

Sprawdzenie czy serwer działa (nie wymaga JWT).

**Response `200 OK`:**
```json
{
  "status": "ok"
}
```

---

## Kody błędów

| Kod | Znaczenie | Typowa przyczyna |
|-----|-----------|-----------------|
| `400` | Bad Request | Nieprawidłowe parametry zapytania |
| `401` | Unauthorized | Brak tokena / token wygasł / nieprawidłowy |
| `403` | Forbidden | Brak uprawnień (np. nie jesteś właścicielem) |
| `404` | Not Found | Zasób nie istnieje lub nie masz do niego dostępu |
| `409` | Conflict | Duplikat (email, członek spiżarni) |
| `422` | Unprocessable Entity | Błąd walidacji Pydantic (np. ujemna ilość) |
| `500` | Internal Server Error | Nieobsłużony błąd serwera |

**Format odpowiedzi błędu:**
```json
{
  "detail": "Opis błędu"
}
```
