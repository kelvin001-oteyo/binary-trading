import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast.jsx";

const PREFS_KEY = "user_preferences";

const DEFAULT_PREFS = {
  theme: "light",
  currency: "USD",
  timezone: "UTC",
};

function Settings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get("/accounts/me/")
      .then((res) => {
        if (!active) return;

        setUser(res.data);
        setProfile({
          email: res.data.email || "",
          phone_number: res.data.phone_number || "",
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
        });
      })
      .catch(() => {
        toast.error("Unable to load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    try {
      const stored = JSON.parse(
        localStorage.getItem(PREFS_KEY) || "null"
      );
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...stored });
    } catch {
      // ignore
    }

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePrefs = (next) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);

      const res = await api.patch(
        "/accounts/update-profile/",
        profile
      );

      setUser(res.data);

      // keep localStorage user in sync for the sidebar avatar etc.
      try {
        const current = JSON.parse(
          localStorage.getItem("user") || "null"
        );
        localStorage.setItem(
          "user",
          JSON.stringify({ ...current, ...res.data })
        );
      } catch {
        // ignore
      }

      toast.success("Profile updated.");
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (data && Object.values(data).flat()[0]) ||
        "Unable to update profile.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (passwords.new_password.length < 8) {
      toast.error(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      passwords.new_password !==
      passwords.confirm_password
    ) {
      toast.error("New passwords don't match.");
      return;
    }

    try {
      setSavingPassword(true);

      await api.post("/accounts/change-password/", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });

      toast.success("Password updated.");

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (data && Object.values(data).flat()[0]) ||
        "Unable to change password.";
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatePassword) {
      toast.error("Enter your password to confirm.");
      return;
    }

    try {
      setDeactivating(true);

      await api.post("/accounts/deactivate/", {
        password: deactivatePassword,
      });

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      toast.success("Account deactivated.");

      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (data && Object.values(data).flat()[0]) ||
        "Unable to deactivate account.";
      toast.error(msg);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-header">
          <div className="skeleton skeleton-line skeleton-line-sm" />
          <div className="skeleton skeleton-line skeleton-line-lg" />
        </div>
        <div className="skeleton skeleton-panel" />
      </div>
    );
  }

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <span className="page-eyebrow">ACCOUNT</span>
        <h1>Settings</h1>
        <p>
          Manage your profile, password and
          preferences.
        </p>
      </div>

      {/* ============ ACCOUNT ============ */}
      <section className="settings-section">
        <header className="settings-section-header">
          <h2>Account</h2>
          <p>
            Update your contact details. Username
            and role cannot be changed here.
          </p>
        </header>

        <form
          className="settings-form"
          onSubmit={handleSaveProfile}
        >
          <div className="settings-grid">
            <div className="settings-field">
              <label>Username</label>
              <input
                type="text"
                value={user?.username || ""}
                readOnly
              />
              <small>Contact support to change.</small>
            </div>

            <div className="settings-field">
              <label>Role</label>
              <input
                type="text"
                value={user?.role || "USER"}
                readOnly
              />
              <small>Assigned by the platform.</small>
            </div>

            <div className="settings-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="settings-field">
              <label>Phone number</label>
              <input
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleProfileChange}
                placeholder="+254..."
              />
            </div>

            <div className="settings-field">
              <label>First name</label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleProfileChange}
              />
            </div>

            <div className="settings-field">
              <label>Last name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* ============ SECURITY ============ */}
      <section className="settings-section">
        <header className="settings-section-header">
          <h2>Security</h2>
          <p>
            Change your password. You'll stay
            logged in on this device.
          </p>
        </header>

        <form
          className="settings-form"
          onSubmit={handleSavePassword}
        >
          <div className="settings-grid settings-grid-single">
            <div className="settings-field">
              <label>Current password</label>
              <input
                type="password"
                name="current_password"
                value={passwords.current_password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="settings-field">
              <label>New password</label>
              <input
                type="password"
                name="new_password"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                minLength={8}
                autoComplete="new-password"
                required
              />
              <small>Minimum 8 characters.</small>
            </div>

            <div className="settings-field">
              <label>Confirm new password</label>
              <input
                type="password"
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={handlePasswordChange}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={savingPassword}
            >
              {savingPassword
                ? "Updating…"
                : "Update password"}
            </button>
          </div>
        </form>
      </section>

      {/* ============ PREFERENCES ============ */}
      <section className="settings-section">
        <header className="settings-section-header">
          <h2>Preferences</h2>
          <p>
            Display preferences for this browser.
            Stored locally.
          </p>
        </header>

        <div className="settings-grid">
          <div className="settings-field">
            <label>Theme</label>
            <select
              value={prefs.theme}
              onChange={(e) =>
                savePrefs({
                  ...prefs,
                  theme: e.target.value,
                })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
            <small>Theme switching is coming soon.</small>
          </div>

          <div className="settings-field">
            <label>Preferred currency</label>
            <select
              value={prefs.currency}
              onChange={(e) =>
                savePrefs({
                  ...prefs,
                  currency: e.target.value,
                })
              }
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="KES">KES — Kenyan Shilling</option>
            </select>
          </div>

          <div className="settings-field">
            <label>Timezone</label>
            <select
              value={prefs.timezone}
              onChange={(e) =>
                savePrefs({
                  ...prefs,
                  timezone: e.target.value,
                })
              }
            >
              <option value="UTC">UTC</option>
              <option value="Africa/Nairobi">
                Africa/Nairobi (EAT)
              </option>
              <option value="Europe/London">
                Europe/London (GMT)
              </option>
              <option value="America/New_York">
                America/New York (EST)
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* ============ DANGER ZONE ============ */}
      <section className="settings-section settings-danger">
        <header className="settings-section-header">
          <h2>Danger zone</h2>
          <p>
            Deactivate your account. Your data
            stays on file but you won't be able to
            log in. An admin can reactivate you.
          </p>
        </header>

        <button
          type="button"
          className="settings-danger-button"
          onClick={() => setDeactivateOpen(true)}
        >
          Deactivate account
        </button>
      </section>

      {deactivateOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h2>Deactivate account?</h2>
            <p>
              You'll be logged out and won't be able
              to sign back in until an admin
              reactivates you. Enter your password to
              confirm.
            </p>

            <label>Password</label>
            <input
              type="password"
              value={deactivatePassword}
              onChange={(e) =>
                setDeactivatePassword(e.target.value)
              }
              autoFocus
            />

            <div className="settings-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setDeactivateOpen(false);
                  setDeactivatePassword("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-danger-button"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating
                  ? "Deactivating…"
                  : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;