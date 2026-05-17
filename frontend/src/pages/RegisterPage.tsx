import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Podaj nazwę użytkownika.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Hasła nie są identyczne.");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    setLoading(true);

    try {
      await register({ email, password, display_name: displayName });
      navigate("/login", { state: { registered: true } });
    } catch (err: unknown) {
      setError(translateRegisterError(err));
    } finally {
      setLoading(false);
    }
  }

  function translateRegisterError(err: unknown): string {
    if (!axios.isAxiosError(err)) return "Nieoczekiwany błąd. Spróbuj ponownie.";
    if (!err.response) return "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";
    if (err.response.status === 409) return "Konto z tym adresem email już istnieje.";
    if (err.response.status === 422) {
      const detail = err.response.data?.detail;
      if (Array.isArray(detail)) {
        const first = detail[0];
        const field = first?.loc?.[first.loc.length - 1];
        if (field === "email") return "Nieprawidłowy format adresu email.";
        if (field === "password") return "Hasło musi mieć co najmniej 8 znaków.";
        if (field === "display_name") return "Podaj nazwę użytkownika.";
      }
      return "Sprawdź poprawność wprowadzonych danych.";
    }
    if (err.response.status >= 500) return "Błąd serwera. Spróbuj ponownie za chwilę.";
    return err.response.data?.detail ?? "Nie udało się utworzyć konta. Spróbuj ponownie.";
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="SmartPantry" className="auth-logo-img" />
        </div>
        <h1>Rejestracja</h1>
        <p className="auth-subtitle">Utwórz nowe konto</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Nazwa użytkownika</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jan Kowalski"
              required
            />
          </div>

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
              placeholder="Min. 8 znaków"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">Powtórz hasło</label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            {loading ? "Rejestracja…" : "Zarejestruj się"}
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
