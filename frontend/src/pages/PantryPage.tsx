import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import EditProductModal from "../components/EditProductModal";
import type { Product, ProductCreate } from "../api/products";
import { listPantries } from "../api/pantries";

const CATEGORIES = [
  { label: "Wszystkie",       icon: "🏠", value: "" },
  { label: "Nabiał",          icon: "🥛", value: "Nabiał" },
  { label: "Mięso i ryby",    icon: "🥩", value: "Mięso i ryby" },
  { label: "Warzywa i owoce", icon: "🥦", value: "Warzywa i owoce" },
  { label: "Pieczywo",        icon: "🍞", value: "Pieczywo" },
  { label: "Napoje",          icon: "🥤", value: "Napoje" },
  { label: "Chemia",          icon: "🧴", value: "Chemia" },
  { label: "Inne",            icon: "📦", value: "Inne" },
];

export default function PantryPage() {
  const { pantryId } = useParams<{ pantryId: string }>();
  const navigate = useNavigate();
  const { products, loading, error, update, remove, refresh } = useProducts(pantryId!);

  const [pantryName, setPantryName] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    listPantries().then((list) => {
      const p = list.find((p) => p.id === pantryId);
      if (p) setPantryName(p.name);
    });
  }, [pantryId]);

  const handleSearch = useCallback(() => {
    refresh({
      search: search || undefined,
      category: categoryFilter || undefined,
    });
  }, [search, categoryFilter, refresh]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  async function handleSaveEdit(data: ProductCreate) {
    if (!editingProduct) return;
    await update(editingProduct.id, data);
    setEditingProduct(null);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Usunąć produkt "${product.name}"?`)) return;
    await remove(product.id);
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">Pantry Zone</div>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`sidebar-item ${categoryFilter === cat.value ? "active" : ""}`}
            onClick={() => setCategoryFilter(cat.value)}
          >
            <span className="sidebar-item-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate("/")}>
              ← Spiżarnie
            </button>
            <h1>{pantryName || "Spiżarnia"}</h1>
          </div>
          <Link
            to={`/pantries/${pantryId}/products/new`}
            className="btn btn-primary btn-sm"
          >
            + Dodaj produkt
          </Link>
        </div>

        <div className="filters">
          <input
            type="text"
            className="filter-search"
            placeholder="🔍  Szukaj produktu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <p className="loading">Ładowanie produktów…</p>}

        {!loading && products.length === 0 && (
          <div className="empty-state">
            <p>
              {search || categoryFilter
                ? "Brak wyników dla podanych filtrów."
                : "Spiżarnia jest pusta. Dodaj pierwszy produkt!"}
            </p>
          </div>
        )}

        <div className="product-list">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={setEditingProduct}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {editingProduct && (
          <EditProductModal
            product={editingProduct}
            onSave={handleSaveEdit}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </div>
    </div>
  );
}
