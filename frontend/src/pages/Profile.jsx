import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="page-eyebrow">
          ACCOUNT
        </span>

        <h1>My Profile</h1>

        <p>
          View your account information.
        </p>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">
            {(user?.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2>
            {user?.username || "User"}
          </h2>

          <span>
            Demo Trader
          </span>

          <div className="profile-demo-badge">
            DEMO ACCOUNT
          </div>
        </div>

        <div className="profile-information">
          <div className="profile-field">
            <span>
              Username
            </span>

            <strong>
              {user?.username || "--"}
            </strong>
          </div>

          <div className="profile-field">
            <span>
              Email
            </span>

            <strong>
              {user?.email || "--"}
            </strong>
          </div>

          <div className="profile-field">
            <span>
              Phone Number
            </span>

            <strong>
              {user?.phone_number || "--"}
            </strong>
          </div>

          <div className="profile-field">
            <span>
              Account Type
            </span>

            <strong>
              {user?.role || "USER"}
            </strong>
          </div>

          <button
            className="logout-large-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
