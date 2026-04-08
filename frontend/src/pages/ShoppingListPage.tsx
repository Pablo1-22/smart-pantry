import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listShoppingItems,
  createShoppingItem,
  generateShoppingList,
  updateShoppingItem,
  deleteShoppingItem,
  type ShoppingListItem,
} from "../api/shoppingList";
import { listProducts, type Product } from "../api/products";
import { listPantries, type Pantry } from "../api/pantries";

const UNITS = ["szt", "kg", "g", "l", "ml"];
const CATEGORIES = [
  "Nabial",
  "Mieso i ryby",
  "Warzywa i owoce",
  "Pieczywo",
  "Napoje",
  "Chemia",
  "Inne",
];

export default function ShoppingListPage() {
  const { pantryId: pantryIdParam } = useParams<{ pantryId: string }>();
  const pantryId = pantryIdParam ?? "";
  const navigate = useNavigate();

  const [pantry, setPantry] = useState<Pantry | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // Add-item form
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("szt");
  const [newCategory, setNewCategory] = useState("");
  const [sourceProductId, setSourceProductId] = useState<string | null>(null);

  // Autocomplete
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await listShoppingItems(pantryId);
      setItems(data);
    } catch {
      setError("Nie udalo sie pobrac listy zakupow.");
    } finally {
      setLoading(false);
    }
  }, [pantryId]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await listProducts(pantryId);
      setProducts(data);
    } catch {
      /* ignore */
    }
  }, [pantryId]);

  useEffect(() => {
    listPantries().then((list) => {
      const p = list.find((p) => p.id === pantryId);
      if (p) setPantry(p);
    });
    fetchItems();
    fetchProducts();
  }, [pantryId, fetchItems, fetchProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(newName.toLowerCase())
  );

  function selectProduct(product: Product) {
    setNewName(product.name);
    setNewUnit(product.unit);
    setNewCategory(product.category ?? "");
    setSourceProductId(product.id);
    setShowDropdown(false);
  }

  function handleNameChange(value: string) {
    setNewName(value);
    setSourceProductId(null);
    setShowDropdown(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const generated = await generateShoppingList(pantryId);
      if (generated.length === 0) {
        setError("Wszystkie produkty maja wystarczajacy zapas.");
      }
      await fetchItems();
    } catch {
      setError("Blad podczas generowania listy.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await createShoppingItem(pantryId, {
        product_name: name,
        quantity: parseFloat(newQty) || 1,
        unit: newUnit,
        category: newCategory || undefined,
        source_product_id: sourceProductId ?? undefined,
      });
      setNewName("");
      setNewQty("1");
      setNewUnit("szt");
      setNewCategory("");
      setSourceProductId(null);
      await fetchItems();
    } catch {
      setError("Nie udalo sie dodac pozycji.");
    }
  }

  async function handleToggle(item: ShoppingListItem) {
    try {
      await updateShoppingItem(pantryId, item.id, { is_bought: !item.is_bought });
      await fetchItems();
      await fetchProducts();
    } catch {
      setError("Nie udalo sie zaktualizowac pozycji.");
    }
  }

  async function handleQuantityChange(item: ShoppingListItem, value: string) {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty < 0) return;
    try {
      await updateShoppingItem(pantryId, item.id, { quantity: qty });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i))
      );
    } catch {
      setError("Nie udalo sie zaktualizowac ilosci.");
    }
  }

  async function handleDelete(item: ShoppingListItem) {
    try {
      await deleteShoppingItem(pantryId, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      setError("Nie udalo sie usunac pozycji.");
    }
  }

  async function handleClearBought() {
    const boughtItems = items.filter((i) => i.is_bought);
    try {
      await Promise.all(boughtItems.map((i) => deleteShoppingItem(pantryId, i.id)));
      setItems((prev) => prev.filter((i) => !i.is_bought));
    } catch {
      setError("Nie udalo sie wyczyscic kupionych.");
    }
  }

  const toBuy = items.filter((i) => !i.is_bought);
  const bought = items.filter((i) => i.is_bought);

  function renderItem(item: ShoppingListItem) {
    const isBought = item.is_bought;
    return (
      <div key={item.id} className={`sl-item ${isBought ? "sl-item--bought" : ""}`}>
        <button
          className={`sl-checkbox ${isBought ? "sl-checkbox--checked" : ""}`}
          onClick={() => handleToggle(item)}
          aria-label={isBought ? "Oznacz jako niekupione" : "Oznacz jako kupione"}
        />
        <div className="sl-item-info">
          <span className="sl-item-name">{item.product_name}</span>
          {item.category && <span className="sl-item-cat">{item.category}</span>}
        </div>
        <input
          type="number"
          className="sl-qty-input"
          min={item.unit === "szt" ? "1" : "0.1"}
          step={item.unit === "szt" ? "1" : "0.1"}
          value={item.quantity}
          onChange={(e) => handleQuantityChange(item, e.target.value)}
        />
        <span className="sl-item-unit">{item.unit}</span>
        <button
          className="btn-icon btn-danger"
          onClick={() => handleDelete(item)}
          title="Usun"
        >
          X
        </button>
      </div>
    );
  }

  if (!pantryIdParam) {
    return <div className="alert alert-error">Brak identyfikatora spizarni</div>;
  }

  return (
    <div className="main-content" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn-back" onClick={() => navigate(`/pantries/${pantryId}`)}>
            ← Produkty
          </button>
          <h1>Lista zakupow — {pantry?.name || "..."}</h1>
        </div>
      </div>

      {/* Auto-generate */}
      <div className="sl-generate">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Generowanie..." : "Generuj automatycznie"}
        </button>
        <span className="sl-generate-hint">
          Dodaje brakujace produkty (ilosc &lt; min. ilosc)
        </span>
      </div>

      {/* Manual add */}
      <form className="sl-add-form" onSubmit={handleAdd}>
        {/* Name with autocomplete */}
        <div className="sl-autocomplete" ref={dropdownRef}>
          <div className="sl-autocomplete-input-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nazwa produktu..."
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
            />
            <button
              type="button"
              className="sl-autocomplete-toggle"
              onClick={() => {
                setShowDropdown((v) => !v);
                inputRef.current?.focus();
              }}
              tabIndex={-1}
            >
              ▾
            </button>
          </div>
          {showDropdown && filteredProducts.length > 0 && (
            <div className="sl-dropdown">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="sl-dropdown-item"
                  onClick={() => selectProduct(p)}
                >
                  <span className="sl-dropdown-name">{p.name}</span>
                  <span className="sl-dropdown-meta">
                    {p.quantity} {p.unit}
                    {p.category ? ` · ${p.category}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          min="0.1"
          step={newUnit === "szt" ? "1" : "0.1"}
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          style={{ width: 70 }}
        />

        <select
          className="sl-select"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <select
          className="sl-select"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          <option value="">Kategoria</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary btn-sm" disabled={!newName.trim()}>
          + Dodaj
        </button>
      </form>

      {sourceProductId && (
        <div className="sl-source-hint">
          Produkt ze spizarni — po zakupie ilosc zostanie dodana do istniejacego zapasu.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Ladowanie listy zakupow...</p>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p>Lista zakupow jest pusta.</p>
          <p>Dodaj pozycje recznie lub wygeneruj automatycznie.</p>
        </div>
      )}

      {toBuy.length > 0 && (
        <>
          <div className="section-label">Do kupienia ({toBuy.length})</div>
          <div className="sl-list">{toBuy.map(renderItem)}</div>
        </>
      )}

      {bought.length > 0 && (
        <>
          <div className="sl-section-header">
            <span className="section-label" style={{ marginTop: 24 }}>
              Kupione ({bought.length})
            </span>
            <button className="btn btn-outline btn-sm" onClick={handleClearBought}>
              Wyczysc kupione
            </button>
          </div>
          <div className="sl-list">{bought.map(renderItem)}</div>
        </>
      )}
    </div>
  );
}
