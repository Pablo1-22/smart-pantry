import { useState, useEffect, useCallback } from "react";
import {
  listPantries,
  createPantry,
  deletePantry,
  type Pantry,
} from "../api/pantries";

export function usePantries() {
  const [pantries, setPantries] = useState<Pantry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPantries(await listPantries());
    } catch {
      setError("Nie udało się pobrać spiżarni");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const add = useCallback(async (name: string) => {
    const pantry = await createPantry(name);
    setPantries((prev) => [...prev, pantry]);
    return pantry;
  }, []);

  const remove = useCallback(async (pantryId: string) => {
    await deletePantry(pantryId);
    setPantries((prev) => prev.filter((p) => p.id !== pantryId));
  }, []);

  return { pantries, loading, error, add, remove, refresh: fetch };
}
