import { Link, useNavigate, useMatch } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SyncStatus from "./SyncStatus";
import logo from "../assets/logo.png";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onDashboard = useMatch("/");
  const onPantry = useMatch("/pantries/:id");
  const onAdd = useMatch("/pantries/:id/products/new");
  const onShoppingList = useMatch("/pantries/:id/shopping-list");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <img src={logo} alt="SmartPantry" className="topbar-brand-logo" />
      </Link>

      {user && (
        <nav className="topbar-nav">
          <Link to="/" className={onDashboard ? "active" : ""}>
            Spiżarnie
          </Link>
          {(onPantry || onAdd || onShoppingList) && (
            <Link
              to={window.location.pathname.split("/products")[0].split("/shopping-list")[0]}
              className={onPantry || onAdd ? "active" : ""}
            >
              Produkty
            </Link>
          )}
          {onShoppingList && (
            <Link to={window.location.pathname} className="active">
              Lista zakupow
            </Link>
          )}
        </nav>
      )}

      {user && <SyncStatus />}

      <div className="topbar-actions">
        {user ? (
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Wyloguj
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">
              Logowanie
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Rejestracja
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
