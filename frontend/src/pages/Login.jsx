import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import authBg from "../assets/auth-bg.jpg";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/accounts/login/", form);

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      const userResponse = await api.get("/accounts/me/");

      localStorage.setItem(
        "user",
        JSON.stringify(userResponse.data)
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* ============ LEFT — FORM ============ */}
      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark">B</span>
            <span className="auth-brand-text">
              Binary Trading
            </span>
          </Link>

          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to your trading dashboard.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && (
                <span className="auth-submit-arrow">→</span>
              )}
            </button>
          </form>

          <p className="auth-split-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

      {/* ============ RIGHT — BRAND PANEL ============ */}
      <div
        className="auth-split-brand"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(37,99,235,0.9), rgba(124,58,237,0.82)), url(${authBg})`,
        }}
      >
        <div className="auth-split-brand-inner">
          <span className="auth-brand-eyebrow">
            BINARY TRADING SIMULATOR
          </span>

          <h1>
            Trade binary options.
            <br />
            Risk nothing.
          </h1>

          <p>
            A full trading platform where every
            trade uses virtual funds. Learn the
            mechanics, test your strategy, keep
            your money.
          </p>

          <ul className="auth-brand-list">
            <li>
              <span className="auth-brand-check">✓</span>
              8+ live-simulated markets
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              $10,000 virtual starting balance
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              AI assistant built in
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              No credit card, no deposits
            </li>
          </ul>

          <div className="auth-brand-preview">
            <div className="auth-brand-preview-top">
              <span>EUR/USD</span>
              <span className="auth-brand-preview-badge">
                LIVE
              </span>
            </div>

            <div className="auth-brand-preview-price">
              1.08500
            </div>

            <div className="auth-brand-preview-change">
              +0.46% today
            </div>
          </div>

          <p className="auth-brand-disclaimer">
            Demo environment · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;