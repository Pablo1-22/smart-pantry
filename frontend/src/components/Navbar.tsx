import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Smart Pantry
      </Link>

      <div className="navbar-links">
        {user ? (
          <button className="btn btn-outline" onClick={handleLogout}>
            Wyloguj
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">
              Logowanie
            </Link>
            <Link to="/register" className="btn btn-primary">
              Rejestracja
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
