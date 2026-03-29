import { useState, type FormEvent } from "react";
import type { ProductCreate } from "../api/products";

const UNITS = ["szt", "kg", "g", "l", "ml"];
const CATEGORIES = [
  "Nabiał",
  "Mięso i ryby",
  "Warzywa i owoce",
  "Pieczywo",
  "Napoje",
  "Chemia",
  "Inne",
];

interface Props {
  initial?: Partial<ProductCreate>;
  onSubmit: (data: ProductCreate) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ProductForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "Zapisz",
}: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [quantity, setQuantity] = useState(String(initial.quantity ?? "1"));
  const [unit, setUnit] = useState(initial.unit ?? "szt");
  const [category, setCategory] = useState(initial.category ?? "");
  const [expiryDate, setExpiryDate] = useState(initial.expiry_date ?? "");
  const [minQuantity, setMinQuantity] = useState(
    String(initial.min_quantity ?? "0")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const qty = parseFloat(quantity);
    const minQty = parseFloat(minQuantity);
    if (isNaN(qty) || qty < 0) {
      setError("Ilość musi być liczbą nieujemną");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        quantity: qty,
        unit,
        category: category || undefined,
        expiry_date: expiryDate || undefined,
        min_quantity: isNaN(minQty) ? 0 : minQty,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Błąd zapisu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="pf-name">Nazwa *</label>
        <input
          id="pf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Mleko"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pf-qty">Ilość *</label>
          <input
            id="pf-qty"
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pf-unit">Jednostka</label>
          <select
            id="pf-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pf-category">Kategoria</label>
        <select
          id="pf-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">— brak —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="pf-expiry">Data ważności</label>
        <input
          id="pf-expiry"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pf-min">Min. ilość (alert zakupów)</label>
        <input
          id="pf-min"
          type="number"
          min="0"
          step="0.01"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Anuluj
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Zapisywanie…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
