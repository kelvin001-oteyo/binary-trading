import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

function AppLayout() {
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

  const sections = [
    {
      title: "TRADING",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: "⌂",
        },
        {
          label: "Markets",
          path: "/markets",
          icon: "◈",
        },
        {
          label: "Trades",
          path: "/trades",
          icon: "↗",
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          label: "Wallet",
          path: "/wallet",
          icon: "$",
        },
        {
          label: "AI Assistant",
          path: "/ai",
          icon: "✦",
        },
        {
          label: "Profile",
          path: "/profile",
          icon: "◉",
        },
        {
          label: "Settings",
          path: "/settings",
          icon: "⚙",
        },
      ],
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            title: "ADMIN",
            items: [
              {
                label: "Admin",
                path: "/admin",
                icon: "▣",
              },
            ],
          },
        ]
      : []),
  ];

  const flatNavigation = sections.flatMap((s) => s.items);
  const mobileNavigation = flatNavigation.slice(0, 5);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">B</div>

          <div>
            <strong>Binary Trading</strong>
            <span>Trading Platform</span>
          </div>
        </div>

        <div className="sidebar-demo">
          LIVE ACCOUNT
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="nav-section-title">
                {section.title}
              </div>

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "nav-link active"
                      : "nav-link"
                  }
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {(user?.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.username || "User"}
              </strong>

              <span>Trader</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="mobile-topbar">
        <div className="sidebar-brand">
          <div className="brand-mark">B</div>

          <div>
            <strong>Binary Trading</strong>
            <span>Trading Platform</span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-profile-button"
          onClick={() => navigate("/profile")}
        >
          {(user?.username || "U")
            .charAt(0)
            .toUpperCase()}
        </button>
      </div>

      <main className="app-content">
        <Outlet />

        <footer className="app-footer">
          <div className="app-footer-inner">
            <span className="app-footer-copy">
              © {new Date().getFullYear()} Binary
              Trading · All data simulated
            </span>

            <div className="app-footer-links">
              <Link to="/info?tab=privacy">
                Privacy
              </Link>
              <Link to="/info?tab=terms">Terms</Link>
              <Link to="/support">Support</Link>
            </div>

            <div className="app-footer-status">
              <span className="app-footer-version">
                v1.0.0
              </span>
              <span className="app-footer-dot"></span>
              <span className="app-footer-label">
                System operational
              </span>
            </div>
          </div>
        </footer>
      </main>

      <nav className="mobile-bottom-nav">
        {mobileNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;