import { useParams, useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { useProducts } from "../hooks/useProducts";
import type { ProductCreate } from "../api/products";

export default function AddProductPage() {
  const { pantryId } = useParams<{ pantryId: string }>();
  const navigate = useNavigate();
  const { add } = useProducts(pantryId!);

  async function handleSubmit(data: ProductCreate) {
    await add(data);
    navigate(`/pantries/${pantryId}`);
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-header-left">
          <button
            className="btn-back"
            onClick={() => navigate(`/pantries/${pantryId}`)}
          >
            ← Spiżarnia
          </button>
          <h1>Dodaj produkt</h1>
        </div>
      </div>

      <div className="form-card">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/pantries/${pantryId}`)}
          submitLabel="Dodaj produkt"
        />
      </div>
    </div>
  );
}
