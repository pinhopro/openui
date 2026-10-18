import type { QueryManager, QuerySnapshot, Store } from "@openuidev/lang-core";
import { useSyncExternalStore } from "react";

/** The current store snapshot; the component re-renders whenever the store changes. */
export function useStoreSnapshot(store: Store): Record<string, unknown> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** The current query snapshot; the component re-renders whenever a query or mutation settles. */
export function useQuerySnapshot(queryManager: QueryManager): QuerySnapshot {
  return useSyncExternalStore(
    queryManager.subscribe,
    queryManager.getSnapshot,
    queryManager.getSnapshot,
  );
}
