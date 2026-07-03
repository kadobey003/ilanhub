import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { BrandLogo } from "../components/BrandLogo";

export function Login() {
  const { login, manager } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (manager) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="brand brand-light">
            <BrandLogo size={48} className="brand-logo brand-logo-hero" />
            <div className="brand-text">
              <span className="brand-name">UAREKLAMHUB</span>
              <span className="brand-tag">Admin Panel</span>
            </div>
          </div>
          <h1 className="login-hero-title">Керуйте оголошеннями в одному місці</h1>
          <p className="login-hero-desc">
            Модерація, публікації, користувачі та аналітика — все під контролем.
          </p>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <h2 className="login-title">Вхід до системи</h2>
          <p className="login-subtitle">Введіть облікові дані менеджера</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label className="label-sm" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label-sm" htmlFor="password">Пароль</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-lg login-btn" type="submit" disabled={loading}>
            {loading ? "Вхід..." : "Увійти"}
          </button>

          {import.meta.env.DEV && (
            <button
              className="btn btn-lg"
              type="button"
              disabled={loading}
              style={{ marginTop: 12, border: "1px dashed #f59e0b", background: "#fffbeb", color: "#92400e" }}
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  await login("admin@ilanhub.local", "admin123");
                } catch (err) {
                  setError(String(err).replace("Error: ", ""));
                } finally {
                  setLoading(false);
                }
              }}
            >
              ⚡ Швидкий вхід (dev)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
