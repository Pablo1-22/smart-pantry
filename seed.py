"""
Seed script — dodaje produkty do wszystkich spiżarni użytkownika.
Użycie:
    python seed.py EMAIL HASLO
    python seed.py EMAIL HASLO --url http://localhost:8000
"""
import sys
import httpx

API = "http://localhost:8000"

# 15+ produktów rozłożonych na różne kategorie
W = "https://commons.wikimedia.org/wiki/Special:FilePath/"

PRODUCTS_PER_PANTRY = [
    # Pantry 1 — typowa lodówka / spożywcze
    [
        {"name": "Mleko UHT 3,2%",       "quantity": 3,   "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-05-10", "min_quantity": 1,   "image_url": W+"Milk_glass.jpg?width=200"},
        {"name": "Ser żółty Gouda",       "quantity": 0.4, "unit": "kg",  "category": "Nabiał",          "expiry_date": "2026-04-15", "min_quantity": 0.1, "image_url": W+"Goudakaas.jpg?width=200"},
        {"name": "Jogurt naturalny",      "quantity": 4,   "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-04-05", "min_quantity": 2,   "image_url": W+"YoghurtOpened.jpg?width=200"},
        {"name": "Masło 82%",             "quantity": 2,   "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-06-01", "min_quantity": 1,   "image_url": W+"Butter_block.jpg?width=200"},
        {"name": "Pierś z kurczaka",      "quantity": 1.2, "unit": "kg",  "category": "Mięso i ryby",    "expiry_date": "2026-04-01", "min_quantity": 0.5, "image_url": W+"Chicken_breast.jpg?width=200"},
        {"name": "Łosoś wędzony",         "quantity": 0.2, "unit": "kg",  "category": "Mięso i ryby",    "expiry_date": "2026-04-03", "min_quantity": 0,   "image_url": W+"Smoked_salmon_on_a_plate.jpg?width=200"},
        {"name": "Jaja L",                "quantity": 10,  "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-04-20", "min_quantity": 6,   "image_url": W+"Chicken_eggs_2009.jpg?width=200"},
        {"name": "Chleb żytni",           "quantity": 1,   "unit": "szt", "category": "Pieczywo",        "expiry_date": "2026-04-02", "min_quantity": 1,   "image_url": W+"Dark_rye_bread.jpg?width=200"},
        {"name": "Bułki pszenne",         "quantity": 6,   "unit": "szt", "category": "Pieczywo",        "expiry_date": "2026-04-01", "min_quantity": 4,   "image_url": W+"Bread_rolls.jpg?width=200"},
        {"name": "Jabłka Gala",           "quantity": 1.5, "unit": "kg",  "category": "Warzywa i owoce", "expiry_date": "2026-04-15", "min_quantity": 0.5, "image_url": W+"Red_Apple.jpg?width=200"},
        {"name": "Marchew",               "quantity": 0.8, "unit": "kg",  "category": "Warzywa i owoce", "expiry_date": "2026-04-10", "min_quantity": 0.3, "image_url": W+"Carrot-fb.jpg?width=200"},
        {"name": "Pomidory koktajlowe",   "quantity": 0.3, "unit": "kg",  "category": "Warzywa i owoce", "expiry_date": "2026-04-04", "min_quantity": 0,   "image_url": W+"Cherry_tomatoes.jpg?width=200"},
        {"name": "Woda mineralna 1,5l",   "quantity": 6,   "unit": "szt", "category": "Napoje",          "expiry_date": "2027-01-01", "min_quantity": 3,   "image_url": W+"Water_bottle.jpg?width=200"},
        {"name": "Sok pomarańczowy",      "quantity": 2,   "unit": "szt", "category": "Napoje",          "expiry_date": "2026-06-01", "min_quantity": 1,   "image_url": W+"Glass_of_orange_juice.jpg?width=200"},
        {"name": "Kawa mielona 250g",     "quantity": 1,   "unit": "szt", "category": "Napoje",          "expiry_date": "2026-12-01", "min_quantity": 1,   "image_url": W+"A_small_cup_of_coffee.JPG?width=200"},
        {"name": "Herbata czarna 100 szt","quantity": 2,   "unit": "szt", "category": "Napoje",          "expiry_date": "2027-03-01", "min_quantity": 1,   "image_url": W+"Loose_leaf_teas.jpg?width=200"},
        {"name": "Ryż jaśminowy 1kg",     "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-06-01", "min_quantity": 1,   "image_url": W+"Uncooked_white_rice.jpg?width=200"},
    ],

    # Pantry 2 — spiżarnia sucha / zapasy
    [
        {"name": "Makaron penne 500g",    "quantity": 4,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-01-01", "min_quantity": 2,   "image_url": W+"Penne-Pasta.jpg?width=200"},
        {"name": "Makaron spaghetti",     "quantity": 3,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-01-01", "min_quantity": 1,   "image_url": W+"Spaghetti_crop.jpg?width=200"},
        {"name": "Mąka pszenna 1kg",      "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-10-01", "min_quantity": 1,   "image_url": W+"Wheat_flour_p1160279.jpg?width=200"},
        {"name": "Cukier biały 1kg",      "quantity": 3,   "unit": "szt", "category": "Inne",            "expiry_date": "2028-01-01", "min_quantity": 1,   "image_url": W+"Sugar_2xmacro.jpg?width=200"},
        {"name": "Olej rzepakowy 1l",     "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-11-01", "min_quantity": 1,   "image_url": W+"Refined_sunflower_oil.jpg?width=200"},
        {"name": "Oliwa z oliwek 500ml",  "quantity": 1,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-09-01", "min_quantity": 1,   "image_url": W+"Olive-oil.jpg?width=200"},
        {"name": "Sól kamienna 1kg",      "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2030-01-01", "min_quantity": 1,   "image_url": W+"Salt_shaker_on_white_background.jpg?width=200"},
        {"name": "Pieprz mielony 50g",    "quantity": 1,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-06-01", "min_quantity": 1,   "image_url": W+"Peppercorns.jpg?width=200"},
        {"name": "Bulion warzywny",       "quantity": 6,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-01-01", "min_quantity": 3,   "image_url": W+"Vegetable_broth.jpg?width=200"},
        {"name": "Pomidory z puszki",     "quantity": 5,   "unit": "szt", "category": "Warzywa i owoce", "expiry_date": "2027-06-01", "min_quantity": 2,   "image_url": W+"Canned_tomatoes.jpg?width=200"},
        {"name": "Kukurydza konserwowa",  "quantity": 3,   "unit": "szt", "category": "Warzywa i owoce", "expiry_date": "2027-01-01", "min_quantity": 2,   "image_url": W+"Canned_corn.jpg?width=200"},
        {"name": "Czerwona fasola",       "quantity": 4,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-01-01", "min_quantity": 2,   "image_url": W+"Red_kidney_beans.jpg?width=200"},
        {"name": "Soczewica czerwona",    "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2027-06-01", "min_quantity": 1,   "image_url": W+"Red_lentils.jpg?width=200"},
        {"name": "Miód wielokwiatowy",    "quantity": 1,   "unit": "szt", "category": "Inne",            "expiry_date": "2028-01-01", "min_quantity": 1,   "image_url": W+"Runny_hunny.jpg?width=200"},
        {"name": "Dżem truskawkowy",      "quantity": 2,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-12-01", "min_quantity": 1,   "image_url": W+"Strawberry_jam_on_a_dish.jpg?width=200"},
        {"name": "Płatki owsiane 500g",   "quantity": 3,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-12-01", "min_quantity": 1,   "image_url": W+"Porridge_oats.jpg?width=200"},
        {"name": "Kakao naturalne 100g",  "quantity": 1,   "unit": "szt", "category": "Inne",            "expiry_date": "2026-10-01", "min_quantity": 1,   "image_url": W+"Cocoa_powder_p1160405.jpg?width=200"},
    ],

    # Pantry 3 — chemia / środki czystości + różne
    [
        {"name": "Proszek do prania 3kg", "quantity": 1,   "unit": "szt", "category": "Chemia",          "expiry_date": "2027-01-01", "min_quantity": 1,   "image_url": W+"Washing_powder.jpg?width=200"},
        {"name": "Płyn do naczyń 1l",     "quantity": 2,   "unit": "szt", "category": "Chemia",          "expiry_date": "2028-01-01", "min_quantity": 1,   "image_url": W+"Fairy_Washing_Up_Liquid.jpg?width=200"},
        {"name": "Tabletki do zmywarki",  "quantity": 40,  "unit": "szt", "category": "Chemia",          "expiry_date": "2027-06-01", "min_quantity": 10,  "image_url": W+"Dishwasher_tablet.jpg?width=200"},
        {"name": "Płyn WC 750ml",         "quantity": 2,   "unit": "szt", "category": "Chemia",          "expiry_date": "2028-01-01", "min_quantity": 1,   "image_url": W+"Domestos.jpg?width=200"},
        {"name": "Płyn do podłóg 1l",     "quantity": 1,   "unit": "szt", "category": "Chemia",          "expiry_date": "2028-01-01", "min_quantity": 1,   "image_url": W+"Flash_floor_cleaning_products.jpg?width=200"},
        {"name": "Papier toaletowy 12szt","quantity": 2,   "unit": "szt", "category": "Chemia",          "expiry_date": "2030-01-01", "min_quantity": 1,   "image_url": W+"Toilet_paper_orientation_over.jpg?width=200"},
        {"name": "Ręczniki papierowe",    "quantity": 4,   "unit": "szt", "category": "Chemia",          "expiry_date": "2030-01-01", "min_quantity": 2,   "image_url": W+"Bounty_paper_towel.jpg?width=200"},
        {"name": "Gąbki do naczyń 5szt",  "quantity": 2,   "unit": "szt", "category": "Chemia",          "expiry_date": "2030-01-01", "min_quantity": 1,   "image_url": W+"Synthetic_sponge.jpg?width=200"},
        {"name": "Kapsułki do prania",    "quantity": 20,  "unit": "szt", "category": "Chemia",          "expiry_date": "2027-01-01", "min_quantity": 10,  "image_url": W+"Ariel_Liquitabs.jpg?width=200"},
        {"name": "Odżywka do tkanin",     "quantity": 1,   "unit": "szt", "category": "Chemia",          "expiry_date": "2027-06-01", "min_quantity": 1,   "image_url": W+"Comfort_fabric_conditioner.jpg?width=200"},
        {"name": "Twaróg półtłusty",      "quantity": 3,   "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-04-08", "min_quantity": 1,   "image_url": W+"Quark_Cheese.jpg?width=200"},
        {"name": "Śmietana 18% 400ml",    "quantity": 2,   "unit": "szt", "category": "Nabiał",          "expiry_date": "2026-04-06", "min_quantity": 1,   "image_url": W+"Sour_cream.jpg?width=200"},
        {"name": "Banan",                 "quantity": 6,   "unit": "szt", "category": "Warzywa i owoce", "expiry_date": "2026-04-04", "min_quantity": 3,   "image_url": W+"Banana-Chocolate-Chip-Cookies-3.jpg?width=200"},
        {"name": "Cebula",                "quantity": 1.0, "unit": "kg",  "category": "Warzywa i owoce", "expiry_date": "2026-05-01", "min_quantity": 0.3, "image_url": W+"Onion_on_White.JPG?width=200"},
        {"name": "Czosnek",               "quantity": 3,   "unit": "szt", "category": "Warzywa i owoce", "expiry_date": "2026-05-01", "min_quantity": 1,   "image_url": W+"Garlic_bulb.jpg?width=200"},
        {"name": "Piwo 500ml",            "quantity": 8,   "unit": "szt", "category": "Napoje",          "expiry_date": "2026-10-01", "min_quantity": 4,   "image_url": W+"Pint_of_bitter.jpg?width=200"},
        {"name": "Wino czerwone 0,75l",   "quantity": 2,   "unit": "szt", "category": "Napoje",          "expiry_date": "2028-01-01", "min_quantity": 0,   "image_url": W+"Red_Wine_Glass.jpg?width=200"},
    ],
]


def main():
    if len(sys.argv) < 3:
        print("Użycie: python seed.py EMAIL HASLO [--url http://localhost:8000]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]

    if "--url" in sys.argv:
        global API
        API = sys.argv[sys.argv.index("--url") + 1]

    print(f"🔗 API: {API}")

    with httpx.Client(base_url=API, timeout=10) as client:
        # Login
        print(f"🔑 Logowanie jako {email}…")
        resp = client.post("/api/auth/login", json={"email": email, "password": password})
        if resp.status_code != 200:
            print(f"❌ Błąd logowania: {resp.status_code} {resp.text}")
            sys.exit(1)

        tokens = resp.json()
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        # Get pantries
        print("📦 Pobieranie spiżarni…")
        resp = client.get("/api/pantries/", headers=headers)
        pantries = resp.json()

        if not pantries:
            print("❌ Brak spiżarni. Utwórz najpierw spiżarnie w aplikacji.")
            sys.exit(1)

        print(f"✅ Znaleziono {len(pantries)} spiżarni: {[p['name'] for p in pantries]}")

        # Add products to each pantry
        total = 0
        for i, pantry in enumerate(pantries):
            products = PRODUCTS_PER_PANTRY[i % len(PRODUCTS_PER_PANTRY)]
            print(f"\n🛒 Dodawanie produktów do '{pantry['name']}' ({len(products)} szt.)…")

            for product in products:
                resp = client.post(
                    f"/api/pantries/{pantry['id']}/products/",
                    json=product,
                    headers=headers,
                )
                if resp.status_code == 201:
                    print(f"   ✓ {product['name']}")
                    total += 1
                else:
                    print(f"   ✗ {product['name']}: {resp.status_code} {resp.text}")

        print(f"\n🎉 Gotowe! Dodano łącznie {total} produktów.")


if __name__ == "__main__":
    main()
