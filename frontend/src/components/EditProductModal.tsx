import type { Product, ProductCreate } from "../api/products";
import ProductForm from "./ProductForm";

interface Props {
  product: Product;
  onSave: (data: ProductCreate) => Promise<void>;
  onClose: () => void;
}

export default function EditProductModal({ product, onSave, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edytuj produkt</h2>
          <button className="btn-icon" onClick={onClose} title="Zamknij">
            ✕
          </button>
        </div>
        <ProductForm
          initial={{
            name: product.name,
            barcode: product.barcode ?? "",
            image_url: product.image_url ?? "",
            quantity: product.quantity,
            unit: product.unit,
            category: product.category ?? "",
            expiry_date: product.expiry_date ?? "",
            min_quantity: product.min_quantity,
          }}
          onSubmit={onSave}
          onCancel={onClose}
          submitLabel="Zapisz zmiany"
        />
      </div>
    </div>
  );
}
