import { useSync } from "../hooks/useSync";

export default function SyncStatus() {
  const { isOnline, syncState, pendingCount, sync } = useSync();

  if (!isOnline) {
    return (
      <span className="sync-badge sync-badge--offline" title="Tryb offline — zmiany zostaną zsynchronizowane po powrocie do sieci">
        ● Offline{pendingCount > 0 ? ` (${pendingCount})` : ""}
      </span>
    );
  }

  if (syncState === "syncing") {
    return (
      <span className="sync-badge sync-badge--syncing" title="Synchronizacja…">
        ↻ Sync…
      </span>
    );
  }

  if (syncState === "error") {
    return (
      <button
        className="sync-badge sync-badge--error"
        title="Błąd synchronizacji — kliknij, aby spróbować ponownie"
        onClick={sync}
      >
        ⚠ Błąd sync
      </button>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        className="sync-badge sync-badge--pending"
        title={`${pendingCount} oczekujące zmiany — kliknij, aby zsynchronizować`}
        onClick={sync}
      >
        ↑ {pendingCount} do sync
      </button>
    );
  }

  return (
    <span className="sync-badge sync-badge--online" title="Online — zsynchronizowano">
      ✓ Online
    </span>
  );
}
