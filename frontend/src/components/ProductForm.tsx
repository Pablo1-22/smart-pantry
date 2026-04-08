import { useState, useRef, type FormEvent } from "react";
import axios from "axios";
import type { ProductCreate } from "../api/products";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

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
  const [barcode, setBarcode] = useState(initial.barcode ?? "");
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [quantity, setQuantity] = useState(String(initial.quantity ?? "1"));
  const [unit, setUnit] = useState(initial.unit ?? "szt");
  const [category, setCategory] = useState(initial.category ?? "");
  const [expiryDate, setExpiryDate] = useState(initial.expiry_date ?? "");
  const [minQuantity, setMinQuantity] = useState(
    String(initial.min_quantity ?? "0")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(file: File) {
    const dataUrl = await compressImage(file);
    setImageUrl(dataUrl);
    setShowImagePicker(false);
  }

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
        barcode: barcode.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        quantity: qty,
        unit,
        category: category || undefined,
        expiry_date: expiryDate || undefined,
        min_quantity: isNaN(minQty) ? 0 : minQty,
      });
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.detail ?? "Błąd zapisu" : "Błąd zapisu");
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

      <div className="form-group">
        <label htmlFor="pf-barcode">Kod kreskowy</label>
        <input
          id="pf-barcode"
          type="text"
          inputMode="numeric"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="np. 5900259127626"
        />
      </div>

      {imageUrl ? (
        <div className="form-image-preview">
          <img
            src={imageUrl}
            alt="Podgląd produktu"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            className="form-image-remove"
            onClick={() => setImageUrl("")}
            title="Usuń zdjęcie"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="form-image-add">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowImagePicker((v) => !v)}
          >
            📷 Dodaj zdjęcie
          </button>
          {showImagePicker && (
            <div className="image-picker-menu">
              <button
                type="button"
                onClick={() => { setShowImagePicker(false); cameraInputRef.current?.click(); }}
              >
                📷 Aparat
              </button>
              <button
                type="button"
                onClick={() => { setShowImagePicker(false); fileInputRef.current?.click(); }}
              >
                📁 Plik
              </button>
            </div>
          )}
          {/* hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture={"environment" as never}
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }}
          />
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pf-qty">Ilość *</label>
          <input
            id="pf-qty"
            type="number"
            min="0"
            step={unit === "szt" ? "1" : "0.1"}
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
          step={unit === "szt" ? "1" : "0.1"}
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
