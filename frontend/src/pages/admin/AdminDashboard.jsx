import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [reports, setReports] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        usersResponse,
        tradesResponse,
        aiResponse,
        reportsResponse,
      ] = await Promise.all([
        api.get("/admin/dashboard/"),
        api.get("/admin/users/"),
        api.get("/admin/trades/"),
        api.get("/admin/ai/"),
        api.get("/admin/reports/"),
      ]);

      setStats(dashboardResponse.data);
      setUsers(usersResponse.data);
      setTrades(tradesResponse.data);
      setAiConfig(aiResponse.data);
      setReports(reportsResponse.data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        navigate("/dashboard");
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const showUserDetails = async (userId) => {
    try {
      setUserLoading(true);
      setError("");
      setMessage("");

      const response = await api.get(
        `/admin/users/${userId}/`
      );

      setSelectedUser(response.data);

      setBalanceInput(
        Number(
          response.data.wallet?.balance || 0
        ).toFixed(2)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load user details."
      );
    } finally {
      setUserLoading(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setBalanceInput("");
    setMessage("");
  };

  const toggleUserStatus = async (user) => {
    try {
      setError("");
      setMessage("");

      const response = await api.patch(
        `/admin/users/${user.id}/status/`
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                is_active:
                  response.data.is_active,
              }
            : currentUser
        )
      );

      if (
        selectedUser &&
        selectedUser.id === user.id
      ) {
        setSelectedUser((current) => ({
          ...current,
          is_active:
            response.data.is_active,
        }));
      }

      setMessage(response.data.detail);

      const dashboardResponse = await api.get(
        "/admin/dashboard/"
      );

      setStats(dashboardResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update user status."
      );
    }
  };

  const updateDemoBalance = async () => {
    if (!selectedUser) {
      return;
    }

    const numericBalance = Number(balanceInput);

    if (
      Number.isNaN(numericBalance) ||
      numericBalance < 0
    ) {
      setError(
        "Enter a valid non-negative demo balance."
      );
      return;
    }

    try {
      setBalanceLoading(true);
      setError("");
      setMessage("");

      const response = await api.patch(
        `/admin/users/${selectedUser.id}/wallet/`,
        {
          balance: numericBalance,
        }
      );

      setSelectedUser((current) => ({
        ...current,
        wallet: {
          ...current.wallet,
          balance: response.data.balance,
          currency: response.data.currency,
        },
      }));

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                balance: response.data.balance,
                currency: response.data.currency,
              }
            : user
        )
      );

      setMessage(response.data.detail);

      const dashboardResponse = await api.get(
        "/admin/dashboard/"
      );

      setStats(dashboardResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update demo balance."
      );
    } finally {
      setBalanceLoading(false);
    }
  };

  const updateAIConfig = (field, value) => {
    setAiConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveAIConfiguration = async () => {
    if (!aiConfig) {
      return;
    }

    try {
      setAiSaving(true);
      setAiMessage("");
      setError("");

      const response = await api.patch(
        "/admin/ai/",
        {
          enabled: aiConfig.enabled,
          analysis_enabled:
            aiConfig.analysis_enabled,
          suggestions_enabled:
            aiConfig.suggestions_enabled,
          risk_level: aiConfig.risk_level,
          confidence_threshold:
            aiConfig.confidence_threshold,
          status_message:
            aiConfig.status_message,
        }
      );

      setAiConfig(response.data);

      setAiMessage(
        response.data.detail ||
          "AI configuration updated successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update AI configuration."
      );
    } finally {
      setAiSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Platform Overview</h1>

          <p>
            Manage users, virtual wallets and
            simulated trading activity.
          </p>
        </div>

        <div className="admin-status-badge">
          <span></span>
          ADMIN MODE
        </div>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =====================================================
          PLATFORM STATISTICS
          ===================================================== */}

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span>Total Users</span>

          <strong>
            {stats?.total_users || 0}
          </strong>

          <small>
            Registered accounts
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Active Users</span>

          <strong>
            {stats?.active_users || 0}
          </strong>

          <small>
            Active accounts
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Total Trades</span>

          <strong>
            {stats?.total_trades || 0}
          </strong>

          <small>
            Demo activity
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Pending Trades</span>

          <strong>
            {stats?.pending_trades || 0}
          </strong>

          <small>
            Currently running
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Won Trades</span>

          <strong className="rise-text">
            {stats?.won_trades || 0}
          </strong>

          <small>
            Simulated wins
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Lost Trades</span>

          <strong className="fall-text">
            {stats?.lost_trades || 0}
          </strong>

          <small>
            Simulated losses
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Demo Balance</span>

          <strong>
            $
            {formatMoney(
              stats?.total_demo_balance
            )}
          </strong>

          <small>
            Virtual funds
          </small>
        </div>

        <div className="admin-stat-card">
          <span>Total P/L</span>

          <strong
            className={
              Number(
                stats?.total_profit_loss || 0
              ) >= 0
                ? "rise-text"
                : "fall-text"
            }
          >
            {Number(
              stats?.total_profit_loss || 0
            ) >= 0
              ? `+$${formatMoney(
                  stats?.total_profit_loss
                )}`
              : `-$${formatMoney(
                  Math.abs(
                    Number(
                      stats?.total_profit_loss || 0
                    )
                  )
                )}`}
          </strong>

          <small>
            Simulated results
          </small>
        </div>
      </div>

      {/* =====================================================
          AI CONTROL CENTER
          ===================================================== */}

      {aiConfig && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <span className="page-eyebrow">
                AI MANAGEMENT
              </span>

              <h2>
                AI Control Center
              </h2>

              <p>
                Configure simulated AI analysis
                available to platform users.
              </p>
            </div>

            <span
              className={
                aiConfig.enabled
                  ? "active-status"
                  : "inactive-status"
              }
            >
              {aiConfig.enabled
                ? "AI ENABLED"
                : "AI DISABLED"}
            </span>
          </div>

          {aiMessage && (
            <div className="success-message">
              {aiMessage}
            </div>
          )}

          <div className="admin-ai-grid">
            <div className="admin-ai-control">
              <div>
                <strong>
                  AI Assistant
                </strong>

                <p>
                  Enable or disable the simulated
                  AI assistant.
                </p>
              </div>

              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      aiConfig.enabled
                    )
                  }
                  onChange={(event) =>
                    updateAIConfig(
                      "enabled",
                      event.target.checked
                    )
                  }
                />

                <span></span>
              </label>
            </div>

            <div className="admin-ai-control">
              <div>
                <strong>
                  Market Analysis
                </strong>

                <p>
                  Allow simulated market trend
                  analysis.
                </p>
              </div>

              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      aiConfig.analysis_enabled
                    )
                  }
                  onChange={(event) =>
                    updateAIConfig(
                      "analysis_enabled",
                      event.target.checked
                    )
                  }
                />

                <span></span>
              </label>
            </div>

            <div className="admin-ai-control">
              <div>
                <strong>
                  AI Suggestions
                </strong>

                <p>
                  Enable simulated trade suggestions.
                </p>
              </div>

              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      aiConfig.suggestions_enabled
                    )
                  }
                  onChange={(event) =>
                    updateAIConfig(
                      "suggestions_enabled",
                      event.target.checked
                    )
                  }
                />

                <span></span>
              </label>
            </div>
          </div>

          <div className="admin-ai-settings">
            <div className="admin-form-group">
              <label>
                Risk Level
              </label>

              <select
                value={
                  aiConfig.risk_level ||
                  "MEDIUM"
                }
                onChange={(event) =>
                  updateAIConfig(
                    "risk_level",
                    event.target.value
                  )
                }
              >
                <option value="LOW">
                  Low
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="HIGH">
                  High
                </option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>
                Confidence Threshold
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={
                  aiConfig.confidence_threshold ??
                  60
                }
                onChange={(event) =>
                  updateAIConfig(
                    "confidence_threshold",
                    event.target.value
                  )
                }
              />

              <small>
                Value from 0 to 100.
              </small>
            </div>

            <div className="admin-form-group admin-form-group-wide">
              <label>
                AI Status Message
              </label>

              <input
                type="text"
                maxLength="255"
                value={
                  aiConfig.status_message ||
                  ""
                }
                onChange={(event) =>
                  updateAIConfig(
                    "status_message",
                    event.target.value
                  )
                }
              />

              <small>
                Message displayed by the simulated
                AI service.
              </small>
            </div>
          </div>

          <div className="admin-ai-footer">
            <div className="admin-ai-notice">
              <strong>
                Simulation only
              </strong>

              <span>
                AI analysis is for the demo platform
                and does not guarantee trading results.
              </span>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={saveAIConfiguration}
              disabled={aiSaving || aiLoading}
            >
              {aiSaving
                ? "Saving..."
                : "Save AI Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          REPORTS & ANALYTICS
          ===================================================== */}

      {reports && (
        <div className="admin-section admin-reports-section">
          <div className="admin-section-header">
            <div>
              <span className="page-eyebrow">
                REPORTING
              </span>

              <h2>
                Reports & Analytics
              </h2>

              <p>
                Monitor simulated trading performance
                and platform activity.
              </p>
            </div>

            <span className="admin-count">
              {reports.summary?.total_trades || 0}{" "}
              trades
            </span>
          </div>

          <div className="admin-report-grid">
            <div className="admin-report-card">
              <span>
                Total Volume
              </span>

              <strong>
                $
                {formatMoney(
                  reports.summary?.total_stake
                )}
              </strong>

              <small>
                Simulated stake volume
              </small>
            </div>

            <div className="admin-report-card">
              <span>
                Average Stake
              </span>

              <strong>
                $
                {formatMoney(
                  reports.summary?.average_stake
                )}
              </strong>

              <small>
                Average demo trade
              </small>
            </div>

            <div className="admin-report-card">
              <span>
                Win Rate
              </span>

              <strong className="rise-text">
                {reports.summary?.win_rate || 0}%
              </strong>

              <small>
                Completed trades
              </small>
            </div>

            <div className="admin-report-card">
              <span>
                Simulated P/L
              </span>

              <strong
                className={
                  Number(
                    reports.summary
                      ?.total_profit_loss || 0
                  ) >= 0
                    ? "rise-text"
                    : "fall-text"
                }
              >
                {Number(
                  reports.summary
                    ?.total_profit_loss || 0
                ) >= 0
                  ? `+$${formatMoney(
                      reports.summary
                        ?.total_profit_loss
                    )}`
                  : `-$${formatMoney(
                      Math.abs(
                        Number(
                          reports.summary
                            ?.total_profit_loss ||
                            0
                        )
                      )
                    )}`}
              </strong>

              <small>
                Simulated results
              </small>
            </div>
          </div>

          <div className="admin-report-columns">
            <div className="admin-report-panel">
              <div className="admin-report-panel-header">
                <div>
                  <span className="page-eyebrow">
                    OUTCOMES
                  </span>

                  <h3>
                    Trade Results
                  </h3>
                </div>
              </div>

              <div className="admin-result-list">
                <div className="admin-result-row">
                  <span>
                    Won Trades
                  </span>

                  <strong className="rise-text">
                    {reports.summary?.won_trades || 0}
                  </strong>
                </div>

                <div className="admin-result-row">
                  <span>
                    Lost Trades
                  </span>

                  <strong className="fall-text">
                    {reports.summary?.lost_trades || 0}
                  </strong>
                </div>

                <div className="admin-result-row">
                  <span>
                    Pending Trades
                  </span>

                  <strong>
                    {reports.summary?.pending_trades || 0}
                  </strong>
                </div>

                <div className="admin-result-row">
                  <span>
                    Cancelled Trades
                  </span>

                  <strong>
                    {reports.summary?.cancelled_trades || 0}
                  </strong>
                </div>

                <div className="admin-result-row">
                  <span>
                    Completed Trades
                  </span>

                  <strong>
                    {reports.summary?.completed_trades || 0}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-report-panel">
              <div className="admin-report-panel-header">
                <div>
                  <span className="page-eyebrow">
                    DIRECTIONS
                  </span>

                  <h3>
                    Rise vs Fall
                  </h3>
                </div>
              </div>

              <div className="admin-result-list">
                <div className="admin-result-row">
                  <span>
                    RISE Trades
                  </span>

                  <strong className="rise-text">
                    {reports.summary?.rise_trades || 0}
                  </strong>
                </div>

                <div className="admin-result-row">
                  <span>
                    FALL Trades
                  </span>

                  <strong className="fall-text">
                    {reports.summary?.fall_trades || 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-report-panel admin-market-panel">
            <div className="admin-report-panel-header">
              <div>
                <span className="page-eyebrow">
                  MARKETS
                </span>

                <h3>
                  Market Performance
                </h3>
              </div>
            </div>

            {reports.markets?.length === 0 ? (
              <div className="compact-empty">
                No market data available.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        Market
                      </th>

                      <th>
                        Trades
                      </th>

                      <th>
                        Volume
                      </th>

                      <th>
                        P/L
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.markets?.map(
                      (market) => (
                        <tr
                          key={market.market}
                        >
                          <td>
                            <strong>
                              {market.market}
                            </strong>
                          </td>

                          <td>
                            {market.trades || 0}
                          </td>

                          <td>
                            $
                            {formatMoney(
                              market.volume
                            )}
                          </td>

                          <td
                            className={
                              Number(
                                market.profit_loss ||
                                  0
                              ) >= 0
                                ? "rise-text"
                                : "fall-text"
                            }
                          >
                            {Number(
                              market.profit_loss ||
                                0
                            ) >= 0
                              ? `+$${formatMoney(
                                  market.profit_loss
                                )}`
                              : `-$${formatMoney(
                                  Math.abs(
                                    Number(
                                      market.profit_loss ||
                                        0
                                    )
                                  )
                                )}`}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-report-panel admin-market-panel">
            <div className="admin-report-panel-header">
              <div>
                <span className="page-eyebrow">
                  ACTIVITY
                </span>

                <h3>
                  Recent Trading Activity
                </h3>
              </div>
            </div>

            {reports.recent_activity?.length ===
            0 ? (
              <div className="compact-empty">
                No recent activity.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        User
                      </th>

                      <th>
                        Market
                      </th>

                      <th>
                        Direction
                      </th>

                      <th>
                        Stake
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        P/L
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.recent_activity?.map(
                      (trade) => (
                        <tr key={trade.id}>
                          <td>
                            <strong>
                              {trade.username}
                            </strong>
                          </td>

                          <td>
                            {trade.market}
                          </td>

                          <td
                            className={
                              trade.trade_type ===
                              "RISE"
                                ? "rise-text"
                                : "fall-text"
                            }
                          >
                            {trade.trade_type}
                          </td>

                          <td>
                            $
                            {formatMoney(
                              trade.stake
                            )}
                          </td>

                          <td>
                            <span
                              className={`status-pill status-${trade.result.toLowerCase()}`}
                            >
                              {trade.result}
                            </span>
                          </td>

                          <td
                            className={
                              Number(
                                trade.profit_loss ||
                                  0
                              ) >= 0
                                ? "rise-text"
                                : "fall-text"
                            }
                          >
                            {Number(
                              trade.profit_loss ||
                                0
                            ) >= 0
                              ? `+$${formatMoney(
                                  trade.profit_loss
                                )}`
                              : `-$${formatMoney(
                                  Math.abs(
                                    Number(
                                      trade.profit_loss ||
                                        0
                                    )
                                  )
                                )}`}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-information">
            <div className="info-icon">
              i
            </div>

            <div>
              <strong>
                Simulation analytics
              </strong>

              <p>
                These reports are generated from
                simulated trading activity and virtual
                balances. They do not represent real
                financial performance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          USERS
          ===================================================== */}

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <span className="page-eyebrow">
              USER MANAGEMENT
            </span>

            <h2>
              Registered Users
            </h2>
          </div>

          <span className="admin-count">
            {users.length} users
          </span>
        </div>

        {users.length === 0 ? (
          <div className="empty-page-card compact-empty">
            <h2>
              No users found
            </h2>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    User
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Demo Balance
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {user.username
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <strong>
                          {user.username}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "admin-role-badge"
                            : "user-role-badge"
                        }
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active
                            ? "active-status"
                            : "inactive-status"
                        }
                      >
                        {user.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </td>

                    <td>
                      {user.currency || "USD"}{" "}
                      {formatMoney(
                        user.balance
                      )}
                    </td>

                    <td>
                      <div className="admin-action-group">
                        <button
                          type="button"
                          className="table-action"
                          onClick={() =>
                            showUserDetails(
                              user.id
                            )
                          }
                        >
                          View
                        </button>

                        {user.role !== "ADMIN" && (
                          <button
                            type="button"
                            className={
                              user.is_active
                                ? "admin-danger-button"
                                : "admin-success-button"
                            }
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                          >
                            {user.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          TRADES
          ===================================================== */}

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <span className="page-eyebrow">
              TRADING ACTIVITY
            </span>

            <h2>
              Recent Trades
            </h2>
          </div>

          <span className="admin-count">
            {trades.length} trades
          </span>
        </div>

        {trades.length === 0 ? (
          <div className="empty-page-card compact-empty">
            <h2>
              No trades found
            </h2>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    ID
                  </th>

                  <th>
                    User
                  </th>

                  <th>
                    Market
                  </th>

                  <th>
                    Direction
                  </th>

                  <th>
                    Stake
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    P/L
                  </th>
                </tr>
              </thead>

              <tbody>
                {trades.slice(0, 20).map(
                  (trade) => (
                    <tr key={trade.id}>
                      <td>
                        #{trade.id}
                      </td>

                      <td>
                        <strong>
                          {trade.username}
                        </strong>
                      </td>

                      <td>
                        {trade.market}
                      </td>

                      <td
                        className={
                          trade.trade_type ===
                          "RISE"
                            ? "rise-text"
                            : "fall-text"
                        }
                      >
                        {trade.trade_type}
                      </td>

                      <td>
                        $
                        {formatMoney(
                          trade.stake
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-pill status-${trade.result.toLowerCase()}`}
                        >
                          {trade.result}
                        </span>
                      </td>

                      <td
                        className={
                          Number(
                            trade.profit_loss
                          ) >= 0
                            ? "rise-text"
                            : "fall-text"
                        }
                      >
                        {Number(
                          trade.profit_loss
                        ) >= 0
                          ? `+$${formatMoney(
                              trade.profit_loss
                            )}`
                          : `-$${formatMoney(
                              Math.abs(
                                Number(
                                  trade.profit_loss
                                )
                              )
                            )}`}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          USER DETAILS MODAL
          ===================================================== */}

      {selectedUser && (
        <div
          className="admin-modal-overlay"
          onClick={closeUserDetails}
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-modal-header">
              <div>
                <span className="page-eyebrow">
                  USER DETAILS
                </span>

                <h2>
                  {selectedUser.username}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeUserDetails}
              >
                ×
              </button>
            </div>

            {userLoading ? (
              <div className="page-loading">
                Loading user...
              </div>
            ) : (
              <>
                <div className="admin-user-profile">
                  <div className="admin-user-avatar large">
                    {selectedUser.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {selectedUser.username}
                    </strong>

                    <span>
                      {selectedUser.email}
                    </span>
                  </div>
                </div>

                <div className="admin-detail-grid">
                  <div>
                    <span>
                      Role
                    </span>

                    <strong>
                      {selectedUser.role}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {selectedUser.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Trades
                    </span>

                    <strong>
                      {
                        selectedUser.trading
                          ?.total_trades
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Won Trades
                    </span>

                    <strong className="rise-text">
                      {
                        selectedUser.trading
                          ?.won_trades
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Lost Trades
                    </span>

                    <strong className="fall-text">
                      {
                        selectedUser.trading
                          ?.lost_trades
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total P/L
                    </span>

                    <strong
                      className={
                        Number(
                          selectedUser.trading
                            ?.total_profit_loss ||
                            0
                        ) >= 0
                          ? "rise-text"
                          : "fall-text"
                      }
                    >
                      {Number(
                        selectedUser.trading
                          ?.total_profit_loss ||
                          0
                      ) >= 0
                        ? `+$${formatMoney(
                            selectedUser.trading
                              ?.total_profit_loss
                          )}`
                        : `-$${formatMoney(
                            Math.abs(
                              Number(
                                selectedUser.trading
                                  ?.total_profit_loss ||
                                  0
                              )
                            )
                          )}`}
                    </strong>
                  </div>
                </div>

                <div className="admin-balance-section">
                  <span className="page-eyebrow">
                    DEMO WALLET
                  </span>

                  <h3>
                    Virtual Balance
                  </h3>

                  <div className="admin-balance-current">
                    Current balance:{" "}
                    <strong>
                      {selectedUser.wallet
                        ?.currency || "USD"}{" "}
                      {formatMoney(
                        selectedUser.wallet
                          ?.balance
                      )}
                    </strong>
                  </div>

                  <label>
                    Set New Demo Balance
                  </label>

                  <div className="admin-balance-input">
                    <span>
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={balanceInput}
                      onChange={(event) =>
                        setBalanceInput(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="primary-button full-button"
                    onClick={
                      updateDemoBalance
                    }
                    disabled={balanceLoading}
                  >
                    {balanceLoading
                      ? "Updating..."
                      : "Update Demo Balance"}
                  </button>
                </div>

                {selectedUser.role !== "ADMIN" && (
                  <button
                    type="button"
                    className={
                      selectedUser.is_active
                        ? "admin-danger-button full-button"
                        : "admin-success-button full-button"
                    }
                    onClick={() =>
                      toggleUserStatus(
                        selectedUser
                      )
                    }
                  >
                    {selectedUser.is_active
                      ? "Deactivate User"
                      : "Activate User"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="admin-information">
        <div className="info-icon">
          i
        </div>

        <div>
          <strong>
            Demo platform administration
          </strong>

          <p>
            User balances are virtual demo funds.
            Account controls affect the simulation
            only. No real deposits or withdrawals are
            processed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;