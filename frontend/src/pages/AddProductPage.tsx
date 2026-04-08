import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import BarcodeScanner from "../components/BarcodeScanner";
import { useProducts } from "../hooks/useProducts";
import { lookupBarcode, type BarcodeResult } from "../api/barcode";
import type { ProductCreate } from "../api/products";

const OFF_CATEGORY_MAP: [string, string][] = [
  ["dairy", "Nabiał"],
  ["milk", "Nabiał"],
  ["yogurt", "Nabiał"],
  ["cheese", "Nabiał"],
  ["meat", "Mięso i ryby"],
  ["fish", "Mięso i ryby"],
  ["seafood", "Mięso i ryby"],
  ["poultry", "Mięso i ryby"],
  ["vegetable", "Warzywa i owoce"],
  ["fruit", "Warzywa i owoce"],
  ["bread", "Pieczywo"],
  ["pastry", "Pieczywo"],
  ["cereal", "Pieczywo"],
  ["beverage", "Napoje"],
  ["drink", "Napoje"],
  ["water", "Napoje"],
  ["juice", "Napoje"],
  ["soda", "Napoje"],
];

function mapCategory(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  for (const [key, val] of OFF_CATEGORY_MAP) {
    if (lower.includes(key)) return val;
  }
  return undefined;
}

export default function AddProductPage() {
  const { pantryId } = useParams<{ pantryId: string }>();
  const navigate = useNavigate();

  if (!pantryId) {
    return <div className="alert alert-error">Brak identyfikatora spiżarni</div>;
  }

  const { add } = useProducts(pantryId);

  const [showScanner, setShowScanner] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<BarcodeResult | null>(null);
  const [prefill, setPrefill] = useState<Partial<ProductCreate>>({});
  const [formKey, setFormKey] = useState(0);

  async function handleScan(code: string) {
    setShowScanner(false);
    setLookingUp(true);
    setBarcodeResult(null);
    try {
      const result = await lookupBarcode(code);
      setBarcodeResult(result);
      setPrefill({
        barcode: code,
        name: result.found && result.name ? result.name : undefined,
        category: result.found ? mapCategory(result.category) : undefined,
        image_url: result.found && result.image_url ? result.image_url : undefined,
      });
      setFormKey((k) => k + 1);
    } catch {
      setPrefill({ barcode: code });
      setFormKey((k) => k + 1);
    } finally {
      setLookingUp(false);
    }
  }

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

      {/* ── Barcode section ── */}
      <div className="barcode-section">
        <button
          className="btn btn-outline"
          onClick={() => setShowScanner(true)}
          disabled={lookingUp}
        >
          📷 Skanuj kod kreskowy
        </button>

        {lookingUp && (
          <span className="barcode-loading">Pobieranie danych z Open Food Facts…</span>
        )}
      </div>

      {barcodeResult && (
        <div className={`barcode-result ${barcodeResult.found ? "found" : "not-found"}`}>
          {barcodeResult.found ? (
            <>
              {barcodeResult.image_url && (
                <img
                  src={barcodeResult.image_url}
                  alt={barcodeResult.name ?? "produkt"}
                  className="barcode-product-img"
                />
              )}
              <div>
                <strong>{barcodeResult.name}</strong>
                <span className="barcode-code"> · {barcodeResult.barcode}</span>
                <p className="barcode-found-msg">
                  ✓ Formularz wypełniony automatycznie
                </p>
              </div>
            </>
          ) : (
            <div>
              <p>
                Kod <strong>{barcodeResult.barcode}</strong> nie znaleziony w
                Open Food Facts.
              </p>
              <p className="barcode-hint">Wypełnij dane ręcznie poniżej.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Product form ── */}
      <div className="form-card">
        <ProductForm
          key={formKey}
          initial={prefill}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/pantries/${pantryId}`)}
          submitLabel="Dodaj produkt"
        />
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
