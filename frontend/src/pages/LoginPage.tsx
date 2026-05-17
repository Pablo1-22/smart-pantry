import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: unknown) {
      setError(translateLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  function translateLoginError(err: unknown): string {
    if (!axios.isAxiosError(err)) return "Nieoczekiwany błąd. Spróbuj ponownie.";
    if (!err.response) return "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";
    if (err.response.status === 401) return "Nieprawidłowy email lub hasło.";
    if (err.response.status === 422) return "Wprowadź poprawny adres email i hasło.";
    if (err.response.status >= 500) return "Błąd serwera. Spróbuj ponownie za chwilę.";
    return err.response.data?.detail ?? "Nie udało się zalogować. Spróbuj ponownie.";
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="SmartPantry" className="auth-logo-img" />
        </div>
        <h1>Logowanie</h1>
        <p className="auth-subtitle">Zaloguj się do swojego konta</p>

        {justRegistered && !error && (
          <div className="alert alert-success">Konto utworzone. Możesz się teraz zalogować.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
}
