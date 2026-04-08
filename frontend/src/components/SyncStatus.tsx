import { useSync } from "../hooks/useSync";

export default function SyncStatus() {
  const { isOnline, forcedOffline, syncState, pendingCount, sync, toggleForcedOffline } = useSync();

  if (!isOnline) {
    return (
      <button
        className="sync-badge sync-badge--offline"
        title={forcedOffline ? "Tryb offline wymuszony ręcznie — kliknij, aby wrócić do trybu online" : "Brak połączenia — zmiany zostaną zsynchronizowane po powrocie do sieci"}
        onClick={forcedOffline ? toggleForcedOffline : undefined}
        style={forcedOffline ? { cursor: "pointer" } : { cursor: "default" }}
      >
        ● {forcedOffline ? "Offline (ręczny)" : "Offline"}
        {pendingCount > 0 ? ` (${pendingCount})` : ""}
      </button>
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
    <button
      className="sync-badge sync-badge--online"
      title="Online — kliknij, aby symulować tryb offline"
      onClick={toggleForcedOffline}
    >
      ✓ Online
    </button>
  );
}
