import type { Product } from "../api/products";

const UNITS: Record<string, string> = {
  szt: "szt.",
  kg: "kg",
  g: "g",
  l: "l",
  ml: "ml",
};

function expiryStatus(dateStr: string | null): "ok" | "soon" | "expired" | null {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 3) return "soon";
  return "ok";
}

interface Props {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: Props) {
  const status = expiryStatus(product.expiry_date);

  return (
    <div className={`product-card ${status === "expired" ? "card-expired" : status === "soon" ? "card-soon" : ""}`}>
      <div className="product-card-main">
        <div className="product-info">
          <span className="product-name">{product.name}</span>
          {product.category && (
            <span className="product-category">{product.category}</span>
          )}
        </div>

        <div className="product-meta">
          <span className="product-qty">
            {product.quantity} {UNITS[product.unit] ?? product.unit}
          </span>

          {product.expiry_date && (
            <span className={`product-expiry expiry-${status}`}>
              {status === "expired" && "⚠ Wygasło: "}
              {status === "soon" && "⏰ Wygasa: "}
              {new Date(product.expiry_date).toLocaleDateString("pl-PL")}
            </span>
          )}

          {product.min_quantity > 0 && product.quantity <= product.min_quantity && (
            <span className="product-low">🛒 Mało!</span>
          )}
        </div>
      </div>

      <div className="product-actions">
        <button
          className="btn-icon btn-edit"
          title="Edytuj produkt"
          onClick={() => onEdit(product)}
        >
          ✏
        </button>
        <button
          className="btn-icon btn-danger"
          title="Usuń produkt"
          onClick={() => onDelete(product)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
