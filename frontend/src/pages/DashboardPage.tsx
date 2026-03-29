import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePantries } from "../hooks/usePantries";

export default function DashboardPage() {
  const { pantries, loading, error, add, remove } = usePantries();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setFormError("");
    setCreating(true);
    try {
      const pantry = await add(newName.trim());
      setNewName("");
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
    } catch {
      alert("Nie udało się usunąć spiżarni");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Moje spiżarnie</h1>
      </div>

      <form className="create-pantry-form" onSubmit={handleCreate}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nazwa nowej spiżarni…"
          disabled={creating}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={creating || !newName.trim()}
        >
          {creating ? "Tworzenie…" : "+ Utwórz"}
        </button>
        {formError && <span className="inline-error">{formError}</span>}
      </form>

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
          <div
            key={pantry.id}
            className="pantry-card"
            onClick={() => navigate(`/pantries/${pantry.id}`)}
          >
            <div className="pantry-card-body">
              <h2>{pantry.name}</h2>
              <span className="pantry-date">
                {new Date(pantry.created_at).toLocaleDateString("pl-PL")}
              </span>
            </div>
            <button
              className="btn-icon btn-danger"
              title="Usuń spiżarnię"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(pantry.id, pantry.name);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
