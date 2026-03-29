import { useState, useEffect, useCallback } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type ProductCreate,
  type ProductUpdate,
  type ProductFilters,
} from "../api/products";

export function useProducts(pantryId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(
    async (filters?: ProductFilters) => {
      setLoading(true);
      setError("");
      try {
        setProducts(await listProducts(pantryId, filters));
      } catch {
        setError("Nie udało się pobrać produktów");
      } finally {
        setLoading(false);
      }
    },
    [pantryId]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  const add = useCallback(
    async (payload: ProductCreate) => {
      const product = await createProduct(pantryId, payload);
      setProducts((prev) => [...prev, product]);
      return product;
    },
    [pantryId]
  );

  const update = useCallback(
    async (productId: string, payload: ProductUpdate) => {
      const updated = await updateProduct(pantryId, productId, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
      return updated;
    },
    [pantryId]
  );

  const remove = useCallback(
    async (productId: string) => {
      await deleteProduct(pantryId, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    },
    [pantryId]
  );

  return { products, loading, error, add, update, remove, refresh: fetch };
}
