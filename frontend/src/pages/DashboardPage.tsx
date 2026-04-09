import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePantries } from "../hooks/usePantries";
import { usePantryIcons, DEFAULT_ICON } from "../hooks/usePantryIcons";
import IconPicker from "../components/IconPicker";
import { db } from "../db/dexie";

interface ExpiryStats {
  expired: number;
  expiring: number;
}

export default function DashboardPage() {
  const { pantries, loading, error, add, remove } = usePantries();
  const { getIcon, setIcon, removeIcon } = usePantryIcons();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(DEFAULT_ICON);
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Picker for existing pantry
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [expiryStats, setExpiryStats] = useState<Map<string, ExpiryStats>>(new Map());

  useEffect(() => {
    async function loadExpiryStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in3Days = new Date(today);
      in3Days.setDate(today.getDate() + 3);

      const products = await db.products.filter(p => p.expiry_date != null).toArray();

      const stats = new Map<string, ExpiryStats>();
      for (const p of products) {
        const exp = new Date(p.expiry_date!);
        exp.setHours(0, 0, 0, 0);
        const curr = stats.get(p.pantry_id) ?? { expired: 0, expiring: 0 };
        if (exp < today) curr.expired++;
        else if (exp <= in3Days) curr.expiring++;
        stats.set(p.pantry_id, curr);
      }
      setExpiryStats(stats);
    }
    loadExpiryStats();
  }, [pantries]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setFormError("");
    setCreating(true);
    try {
      const pantry = await add(newName.trim());
      setIcon(pantry.id, newIcon);
      setNewName("");
      setNewIcon(DEFAULT_ICON);
      setShowPicker(false);
      navigate(`/pantries/${pantry.id}`);
    } catch {
      setFormError("Nie udało się utworzyć spiżarni");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(pantryId: string, name: string) {
    if (!confirm(`Usunąć spiżarnię "${name}"? Ta operacja jest nieodwracalna.`))
      return;
    try {
      await remove(pantryId);
      removeIcon(pantryId);
    } catch {
      alert("Nie udało się usunąć spiżarni");
    }
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Moje spiżarnie</h1>
      </div>

      {/* Create form */}
      <form className="create-pantry-form" onSubmit={handleCreate}>
        <button
          type="button"
          className="icon-trigger"
          onClick={() => setShowPicker((v) => !v)}
          title="Wybierz ikonę"
        >
          {newIcon}
        </button>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nazwa nowej spiżarni…"
          disabled={creating}
          onFocus={() => setShowPicker(false)}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={creating || !newName.trim()}
        >
          {creating ? "Tworzenie…" : "Utwórz"}
        </button>
        {formError && <span className="inline-error">{formError}</span>}
      </form>

      {showPicker && (
        <div className="picker-dropdown">
          <IconPicker value={newIcon} onChange={(ic) => { setNewIcon(ic); setShowPicker(false); }} />
        </div>
      )}

      {loading && <p className="loading">Ładowanie…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && pantries.length === 0 && (
        <div className="empty-state">
          <p>Nie masz jeszcze żadnej spiżarni.</p>
          <p>Utwórz pierwszą, wpisując jej nazwę powyżej.</p>
        </div>
      )}

      <div className="pantry-grid">
        {pantries.map((pantry) => (
          <div key={pantry.id} className="pantry-card" onClick={() => navigate(`/pantries/${pantry.id}`)}>
            <div className="pantry-card-body">
              {/* Icon — click to change */}
              <button
                type="button"
                className="pantry-icon-btn"
                title="Zmień ikonę"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingIconId(editingIconId === pantry.id ? null : pantry.id);
                }}
              >
                {getIcon(pantry.id)}
              </button>
              <h2>{pantry.name}</h2>
              <span className="pantry-date">
                {new Date(pantry.created_at).toLocaleDateString("pl-PL")}
              </span>
              {(() => {
                const s = expiryStats.get(pantry.id);
                if (!s || (s.expired === 0 && s.expiring === 0)) return null;
                return (
                  <div className="pantry-expiry">
                    <span className="pantry-expiry-label">Data ważności:</span>
                    {s.expiring > 0 && (
                      <span className="pantry-expiry-warn">Wygasa: {s.expiring}</span>
                    )}
                    {s.expired > 0 && (
                      <span className="pantry-expiry-danger">Wygasło: {s.expired}</span>
                    )}
                  </div>
                );
              })()}
            </div>
            <button
              className="btn-icon btn-danger"
              title="Usuń spiżarnię"
              onClick={(e) => { e.stopPropagation(); handleDelete(pantry.id, pantry.name); }}
            >
              ✕
            </button>

            {/* Inline picker for this card */}
            {editingIconId === pantry.id && (
              <div
                className="card-picker"
                onClick={(e) => e.stopPropagation()}
              >
                <IconPicker
                  value={getIcon(pantry.id)}
                  onChange={(ic) => { setIcon(pantry.id, ic); setEditingIconId(null); }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
