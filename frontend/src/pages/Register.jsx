import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import authBg from "../assets/auth-bg.jpg";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone_number: "",
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
      await api.post("/accounts/register/", form);

      navigate("/login");
    } catch (err) {
      const data = err.response?.data;

      if (data) {
        const firstError = Object.values(data).flat()[0];
        setError(firstError || "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
      }
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
            <h2>Create your account</h2>
            <p>
              Start trading in under a minute. No
              credit card required.
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
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="phone_number">
                Phone Number
                <span className="auth-optional">(optional)</span>
              </label>

              <input
                id="phone_number"
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                autoComplete="tel"
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
                  placeholder="Minimum 8 characters"
                  minLength="8"
                  autoComplete="new-password"
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
              {loading
                ? "Creating account…"
                : "Create Account"}
              {!loading && (
                <span className="auth-submit-arrow">→</span>
              )}
            </button>

            <p className="auth-terms">
              By creating an account you agree to
              use this platform for simulation
              purposes only.
            </p>
          </form>

          <p className="auth-split-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
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
            GET STARTED FREE
          </span>

          <h1>
            Everything to practice.
            <br />
            Nothing to lose.
          </h1>

          <p>
            Set up a virtual account in seconds.
            Explore markets, place trades, and
            build strategy — all risk-free.
          </p>

          <ul className="auth-brand-list">
            <li>
              <span className="auth-brand-check">✓</span>
              Instant signup — no email
              verification
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Full dashboard from day one
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Unlimited simulated trades
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Real-time market data
            </li>
          </ul>

          <div className="auth-brand-preview">
            <div className="auth-brand-preview-top">
              <span>BTC/USD</span>
              <span className="auth-brand-preview-badge">
                LIVE
              </span>
            </div>

            <div className="auth-brand-preview-price">
              67,432.18
            </div>

            <div className="auth-brand-preview-change">
              +1.87% today
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

export default Register;