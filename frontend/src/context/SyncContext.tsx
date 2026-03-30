import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { db } from "../db/dexie";
import client from "../api/client";
import type { Product } from "../api/products";

export type SyncState = "idle" | "syncing" | "offline" | "error";

interface SyncContextValue {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  sync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>(
    navigator.onLine ? "idle" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await db.pending_actions.count();
    setPendingCount(count);
  }, []);

  const pullChanges = useCallback(async () => {
    try {
      // Pełny pull (bez since) — jedyny sposób by wykryć produkty usunięte na serwerze.
      // Inkrementalny pull zwróciłby tylko zmienione rekordy i nie wiedziałby o usunięciach.
      const { data: fresh } = await client.get<Product[]>("/api/sync/pull");

      // Upsert wszystkich aktualnych produktów z serwera
      if (fresh.length > 0) {
        await db.products.bulkPut(fresh);
      }

      // Usuń z IndexedDB produkty, których serwer już nie zwrócił (skasowane)
      // Wyjątek: produkty z oczekującym offline create — jeszcze nie trafiły na serwer
      const pendingCreates = await db.pending_actions
        .filter((a) => a.type === "create")
        .toArray();
      const pendingCreateIds = new Set(pendingCreates.map((a) => a.productId));
      const freshIds = new Set(fresh.map((p) => p.id));

      const allLocal = await db.products.toArray();
      const staleIds = allLocal
        .map((p) => p.id)
        .filter((id) => !freshIds.has(id) && !pendingCreateIds.has(id));

      if (staleIds.length > 0) {
        await db.products.bulkDelete(staleIds);
      }

      localStorage.setItem("last_sync_at", new Date().toISOString());
    } catch {
      // Silent — lokalne dane są dostępne
    }
  }, []);

  const pushOfflineQueue = useCallback(async () => {
    const actions = await db.pending_actions.orderBy("timestamp").toArray();
    if (actions.length === 0) return;

    const payload = actions.map((a) => ({
      type: a.type,
      pantry_id: a.pantryId,
      id: a.productId,
      payload: a.payload,
      timestamp: a.timestamp,
    }));

    const { data } = await client.post<{
      results: { index: number; success: boolean; product?: Product }[];
    }>("/api/sync/push", { actions: payload });

    // Zaktualizuj lokalne produkty danymi potwierdzonymi przez serwer
    const updates: Product[] = [];
    for (const result of data.results) {
      if (result.success && result.product) {
        updates.push(result.product);
      }
    }
    if (updates.length > 0) {
      await db.products.bulkPut(updates);
    }

    // Usuń tylko akcje, które się powiodły — failed zostają do ponowienia
    const successfulIndices = new Set(
      data.results.filter((r) => r.success).map((r) => r.index)
    );
    const toDelete = actions
      .filter((_, i) => successfulIndices.has(i))
      .map((a) => a.id)
      .filter((id): id is number => id !== undefined);

    if (toDelete.length > 0) {
      await db.pending_actions.bulkDelete(toDelete);
    }

    const remaining = await db.pending_actions.count();
    setPendingCount(remaining);

    const failed = data.results.filter((r) => !r.success);
    if (failed.length > 0) {
      throw new Error(
        `${failed.length} z ${data.results.length} akcji offline nie powiodło się`
      );
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncState("syncing");
    try {
      await pushOfflineQueue();
      await pullChanges();
      setSyncState("idle");
    } catch {
      setSyncState("error");
    } finally {
      syncingRef.current = false;
    }
  }, [pushOfflineQueue, pullChanges]);

  // Nasłuch online / offline
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      sync();
    };
    const onOffline = () => {
      setIsOnline(false);
      setSyncState("offline");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [sync]);

  // Inicjalne pobranie danych przy montowaniu
  useEffect(() => {
    refreshPendingCount();
    if (navigator.onLine) {
      sync();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SyncContext.Provider
      value={{ isOnline, syncState, pendingCount, sync, refreshPendingCount }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync musi być użyte wewnątrz SyncProvider");
  return ctx;
}
