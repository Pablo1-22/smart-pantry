import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>Witaj w Smart Pantry!</h1>
      <p>Zalogowano jako: <strong>{user?.id}</strong></p>
      <p className="dashboard-hint">
        Tutaj wkrótce pojawi się lista Twoich spiżarni i produktów.
      </p>
    </div>
  );
}
