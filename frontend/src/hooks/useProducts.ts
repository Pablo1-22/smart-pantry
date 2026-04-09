import { useState, useEffect, useCallback } from "react";
import { db } from "../db/dexie";
import { useSync } from "./useSync";
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
  const { refreshPendingCount } = useSync();

  // ── initial load ──────────────────────────────────────────────────────────
  const fetch = useCallback(
    async (filters?: ProductFilters) => {
      setError("");

      // 1. Serve from IndexedDB immediately (works offline)
      let cached = await db.products
        .where("pantry_id")
        .equals(pantryId)
        .toArray();

      if (filters?.search || filters?.category) {
        const search = filters.search?.toLowerCase() ?? "";
        const cat = filters.category ?? "";
        cached = cached.filter(
          (p) =>
            (!search || p.name.toLowerCase().includes(search)) &&
            (!cat || p.category === cat)
        );
      }

      if (cached.length > 0) {
        // Data in cache — show it immediately, skip spinner entirely
        setProducts(cached);
        setLoading(false);
      } else {
        // Nothing cached — show spinner until API responds
        setLoading(true);
      }

      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      // 2. Silent background refresh from server
      try {
        const fresh = await listProducts(pantryId, filters);
        await db.products.bulkPut(fresh);
        if (!filters?.search && !filters?.category) {
          const freshIds = new Set(fresh.map((p) => p.id));
          const pendingCreates = (await db.pending_actions.toArray())
            .filter((a) => a.type === "create");
          const pendingCreateIds = new Set(pendingCreates.map((a) => a.productId));
          const cachedAll = await db.products
            .where("pantry_id")
            .equals(pantryId)
            .toArray();
          const staleIds = cachedAll
            .map((p) => p.id)
            .filter((id) => !freshIds.has(id) && !pendingCreateIds.has(id));
          if (staleIds.length > 0) await db.products.bulkDelete(staleIds);
        }
        setProducts(fresh);
      } catch {
        if (cached.length === 0) setError("Nie udało się pobrać produktów");
      } finally {
        setLoading(false);
      }
    },
    [pantryId]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  // ── add ───────────────────────────────────────────────────────────────────
  const add = useCallback(
    async (payload: ProductCreate): Promise<Product> => {
      if (navigator.onLine) {
        const product = await createProduct(pantryId, payload);
        await db.products.put(product);
        setProducts((prev) => [...prev, product]);
        return product;
      }

      // Offline: generate a client-side UUID and queue the action
      const localProduct: Product = {
        id: crypto.randomUUID(),
        pantry_id: pantryId,
        name: payload.name,
        barcode: payload.barcode ?? null,
        quantity: payload.quantity,
        unit: payload.unit,
        category: payload.category ?? null,
        expiry_date: payload.expiry_date ?? null,
        min_quantity: payload.min_quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await db.products.put(localProduct);
      await db.pending_actions.add({
        type: "create",
        pantryId,
        productId: localProduct.id,
        payload: payload as unknown as Record<string, unknown>,
        timestamp: localProduct.updated_at,
      });
      await refreshPendingCount();
      setProducts((prev) => [...prev, localProduct]);
      return localProduct;
    },
    [pantryId]
  );

  // ── update ────────────────────────────────────────────────────────────────
  const update = useCallback(
    async (productId: string, payload: ProductUpdate): Promise<Product> => {
      if (navigator.onLine) {
        const updated = await updateProduct(pantryId, productId, payload);
        await db.products.put(updated);
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
        return updated;
      }

      // Offline: update IndexedDB and queue
      const existing = await db.products.get(productId);
      if (!existing) throw new Error("Product not found locally");
      const updated: Product = {
        ...existing,
        ...payload,
        updated_at: new Date().toISOString(),
      };
      await db.products.put(updated);
      await db.pending_actions.add({
        type: "update",
        pantryId,
        productId,
        payload: payload as unknown as Record<string, unknown>,
        timestamp: updated.updated_at,
      });
      await refreshPendingCount();
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      return updated;
    },
    [pantryId]
  );

  // ── remove ────────────────────────────────────────────────────────────────
  const remove = useCallback(
    async (productId: string): Promise<void> => {
      if (navigator.onLine) {
        await deleteProduct(pantryId, productId);
        await db.products.delete(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return;
      }

      // Offline: remove locally and queue
      await db.products.delete(productId);
      await db.pending_actions.add({
        type: "delete",
        pantryId,
        productId,
        timestamp: new Date().toISOString(),
      });
      await refreshPendingCount();
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    },
    [pantryId]
  );

  return { products, loading, error, add, update, remove, refresh: fetch };
}
