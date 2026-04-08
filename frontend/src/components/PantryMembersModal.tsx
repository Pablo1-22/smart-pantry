import { useState, useEffect } from "react";
import { listMembers, inviteMember, removeMember, type PantryMember } from "../api/pantries";

interface Props {
  pantryId: string;
  currentUserId: string;
  ownerId: string;
  onClose: () => void;
}

export default function PantryMembersModal({ pantryId, currentUserId, ownerId, onClose }: Props) {
  const [members, setMembers] = useState<PantryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentUserId === ownerId;

  useEffect(() => {
    listMembers(pantryId)
      .then(setMembers)
      .catch(() => setError("Nie udało się załadować członków"))
      .finally(() => setLoading(false));
  }, [pantryId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setInviting(true);
    try {
      const member = await inviteMember(pantryId, email.trim());
      setMembers((prev) => [...prev, member]);
      setEmail("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail === "User not found") setError("Nie znaleziono użytkownika o podanym adresie e-mail");
      else if (detail === "User already a member") setError("Ten użytkownik jest już członkiem");
      else setError("Nie udało się zaprosić użytkownika");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Usunąć tego członka?")) return;
    try {
      await removeMember(pantryId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch {
      setError("Nie udało się usunąć członka");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Członkowie spiżarni</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="loading">Ładowanie…</p>
        ) : (
          <ul className="members-list">
            {members.map((m) => (
              <li key={m.id} className="member-item">
                <span className="member-email">{m.user_email}</span>
                <span className={`member-role member-role--${m.role}`}>
                  {m.role === "owner" ? "właściciel" : "członek"}
                </span>
                {isOwner && m.user_id !== ownerId && (
                  <button
                    className="btn-icon btn-danger"
                    title="Usuń członka"
                    onClick={() => handleRemove(m.user_id)}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          <form className="invite-form" onSubmit={handleInvite}>
            <input
              type="email"
              placeholder="E-mail użytkownika…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviting}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={inviting || !email.trim()}
            >
              {inviting ? "Zapraszanie…" : "Zaproś"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
