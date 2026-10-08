import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast.jsx";
import CandleChart from "../components/CandleChart.jsx";
import { useCandleData } from "../hooks/useCandleData.js";
import "./Dashboard.css";

const MARKET_CONFIG = {
  "DEMO/USD": { basePrice: 1.085, decimals: 5 },
  "DEMO/EUR": { basePrice: 0.9321, decimals: 4 },
  "DEMO/GBP": { basePrice: 0.7912, decimals: 4 },
  "DEMO/JPY": { basePrice: 149.82, decimals: 3 },
  "EUR/USD": { basePrice: 1.085, decimals: 5 },
  "GBP/USD": { basePrice: 1.2642, decimals: 5 },
  "USD/JPY": { basePrice: 149.82, decimals: 3 },
  "BTC/USD": { basePrice: 67432.18, decimals: 2 },
  "ETH/USD": { basePrice: 3512.44, decimals: 2 },
  "XAU/USD": { basePrice: 2341.6, decimals: 2 },
  SPX500: { basePrice: 5234.18, decimals: 2 },
  NAS100: { basePrice: 18234.55, decimals: 2 },
};

const STAKE_PRESETS = [10, 50, 100, 500];
const DURATION_PRESETS = [
  { label: "30s", value: "30" },
  { label: "1m", value: "60" },
  { label: "2m", value: "120" },
  { label: "5m", value: "300" },
];

const WATCHLIST_KEY = "market_watchlist";

function generateVerdict(market, change) {
  // Deterministic-ish but organic-looking percentage, driven by market + change
  const seed = market
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 50 + (seed % 20) - 10;
  const trend = change > 0 ? 8 : -8;
  const jitter = Math.floor((Date.now() / 30000) % 15) - 7;
  const raw = base + trend + jitter;
  const percent = Math.max(25, Math.min(88, raw));
  return percent;
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const selectedMarket = location.state?.market || "DEMO/USD";

  const [wallet, setWallet] = useState(null);
  const [trades, setTrades] = useState([]);
  const [market, setMarket] = useState(selectedMarket);
  const [tradeType, setTradeType] = useState("RISE");
  const [stake, setStake] = useState("100");
  const [duration, setDuration] = useState("60");

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const config = MARKET_CONFIG[market] || MARKET_CONFIG["DEMO/USD"];

  const { candles, currentPrice, change } = useCandleData(
    config.basePrice,
    config.decimals
  );

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [walletResponse, tradesResponse] = await Promise.all([
        api.get("/wallet/"),
        api.get("/trading/"),
      ]);

      setWallet(walletResponse.data);
      setTrades(tradesResponse.data);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activeTrades = useMemo(() => {
    return trades.filter(
      (trade) => trade.result === "PENDING"
    );
  }, [trades]);

  const completedTrades = useMemo(() => {
    return trades
      .filter((trade) => trade.result !== "PENDING")
      .slice(0, 5);
  }, [trades]);

  const totalProfitLoss = useMemo(() => {
    return trades.reduce(
      (total, trade) =>
        total + Number(trade.profit_loss || 0),
      0
    );
  }, [trades]);

  // Session summary — today's stats
  const sessionStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrades = trades.filter((t) => {
      const created = new Date(t.created_at).getTime();
      return created >= today.getTime();
    });

    const settled = todayTrades.filter(
      (t) => t.result !== "PENDING"
    );

    const won = settled.filter((t) => t.result === "WON");
    const pl = todayTrades.reduce(
      (sum, t) => sum + Number(t.profit_loss || 0),
      0
    );

    return {
      count: todayTrades.length,
      pl,
      winRate: settled.length
        ? Math.round((won.length / settled.length) * 100)
        : 0,
      settled: settled.length,
    };
  }, [trades]);

  const verdict = useMemo(
    () => generateVerdict(market, change),
    [market, change]
  );

  const verdictStyle = useMemo(() => {
    if (verdict >= 70) return "strong";
    if (verdict >= 55) return "moderate";
    if (verdict >= 40) return "weak";
    return "low";
  }, [verdict]);

  const verdictLabel = useMemo(() => {
    if (verdict >= 70) return "High confidence";
    if (verdict >= 55) return "Moderate";
    if (verdict >= 40) return "Low";
    return "Very low";
  }, [verdict]);

  // Heatmap data — every market with a pseudo-direction
  const heatmap = useMemo(() => {
    const now = Date.now();
    return Object.entries(MARKET_CONFIG).map(
      ([symbol, cfg], i) => {
        const seed = symbol
          .split("")
          .reduce((a, c) => a + c.charCodeAt(0), 0);
        const wave = Math.sin(
          (now / 30000 + i * 3) * 0.5
        );
        const pct = (seed % 7) - 3 + wave * 1.5;
        return {
          symbol,
          decimals: cfg.decimals,
          price: cfg.basePrice,
          change: pct,
          direction: pct >= 0 ? "up" : "down",
        };
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  const getRemainingSeconds = (expiresAt) => {
    const expiry = new Date(expiresAt).getTime();

    const remaining = Math.max(
      0,
      Math.ceil((expiry - currentTime) / 1000)
    );

    return remaining;
  };

  const handleTrade = async () => {
    const numericStake = Number(stake);
    const numericDuration = Number(duration);

    const numericPrice = Number(
      currentPrice.toFixed(config.decimals)
    );

    if (!numericStake || numericStake <= 0) {
      toast.error("Enter a valid stake amount.");
      return;
    }

    if (!numericDuration || numericDuration < 10) {
      toast.error("Trade duration must be at least 10 seconds.");
      return;
    }

    if (
      wallet &&
      numericStake > Number(wallet.balance)
    ) {
      toast.error("Insufficient demo balance.");
      return;
    }

    try {
      setTrading(true);

      const response = await api.post(
        "/trading/create/",
        {
          market,
          trade_type: tradeType,
          stake: numericStake,
          entry_price: numericPrice,
          duration_seconds: numericDuration,
        }
      );

      toast.success(
        `Demo ${tradeType.toLowerCase()} trade placed successfully.`
      );

      setTrades((current) => [
        response.data,
        ...current,
      ]);

      const walletResponse = await api.get("/wallet/");

      setWallet(walletResponse.data);
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.detail ||
          "Unable to place the demo trade."
      );
    } finally {
      setTrading(false);
    }
  };

  useEffect(() => {
    if (!activeTrades.length) {
      return;
    }

    const expiredTrade = activeTrades.find(
      (trade) =>
        getRemainingSeconds(trade.expires_at) === 0
    );

    if (!expiredTrade) {
      return;
    }

    const settleExpiredTrade = async () => {
      try {
        const response = await api.post(
          `/trading/${expiredTrade.id}/settle/`
        );

        setTrades((current) =>
          current.map((trade) =>
            trade.id === expiredTrade.id
              ? response.data
              : trade
          )
        );

        const walletResponse = await api.get("/wallet/");

        setWallet(walletResponse.data);

        const result = response.data?.result;
        const pl = Number(response.data?.profit_loss || 0);

        if (result === "WON") {
          toast.success(`Trade won · +$${pl.toFixed(2)}`);
        } else if (result === "LOST") {
          toast.error(`Trade lost · -$${Math.abs(pl).toFixed(2)}`);
        }
      } catch (err) {
        console.error("Trade settlement error:", err);
      }
    };

    settleExpiredTrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, activeTrades]);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatPrice = (value) =>
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });

  const watchedMarkets = useMemo(() => {
    return heatmap.filter((m) =>
      watchlist.includes(m.symbol)
    );
  }, [heatmap, watchlist]);

  if (loading) {
    return (
      <div className="page-container dashboard-page">
        <div className="skeleton-header">
          <div className="skeleton skeleton-line skeleton-line-sm" />
          <div className="skeleton skeleton-line skeleton-line-lg" />
          <div className="skeleton skeleton-line skeleton-line-md" />
        </div>

        <div className="dashboard-stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div
              className="skeleton skeleton-card"
              key={i}
            />
          ))}
        </div>

        <div className="dashboard-main-grid">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">
            TRADING DASHBOARD
          </span>

          <h1>
            Welcome back,{" "}
            {user?.username || "Trader"}
          </h1>

          <p>
            Manage your simulated trades and explore
            demo market activity.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="status-dot"></span>
          Simulation Online
        </div>
      </div>

      {/* ============ SESSION SUMMARY STRIP ============ */}
      <div className="dashboard-session-strip">
        <div className="dashboard-session-item">
          <span>Today's P/L</span>
          <strong
            className={
              sessionStats.pl >= 0
                ? "rise-text"
                : "fall-text"
            }
          >
            {sessionStats.pl >= 0 ? "+" : "-"}$
            {formatMoney(Math.abs(sessionStats.pl))}
          </strong>
        </div>

        <div className="dashboard-session-item">
          <span>Trades Today</span>
          <strong>{sessionStats.count}</strong>
        </div>

        <div className="dashboard-session-item">
          <span>Win Rate</span>
          <strong>
            {sessionStats.settled > 0
              ? `${sessionStats.winRate}%`
              : "—"}
          </strong>
        </div>

        <div className="dashboard-session-item">
          <span>Active</span>
          <strong>{activeTrades.length}</strong>
        </div>
      </div>

      {/* ============ WATCHLIST STRIP ============ */}
      {watchedMarkets.length > 0 && (
        <div className="dashboard-watchlist-strip">
          <span className="dashboard-watchlist-label">
            ★ Watchlist
          </span>

          <div className="dashboard-watchlist-items">
            {watchedMarkets.map((m) => (
              <button
                key={m.symbol}
                type="button"
                className={
                  m.symbol === market
                    ? "dashboard-watchlist-pill active"
                    : "dashboard-watchlist-pill"
                }
                onClick={() => setMarket(m.symbol)}
              >
                <strong>{m.symbol}</strong>
                <span
                  className={
                    m.change >= 0
                      ? "rise-text"
                      : "fall-text"
                  }
                >
                  {m.change >= 0 ? "+" : ""}
                  {m.change.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat-card">
          <span>Demo Balance</span>

          <strong>
            {wallet?.currency || "USD"}{" "}
            {formatMoney(wallet?.balance)}
          </strong>

          <small>Virtual funds</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Active Trades</span>

          <strong>{activeTrades.length}</strong>

          <small>Currently running</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Total Trades</span>

          <strong>{trades.length}</strong>

          <small>Demo activity</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Total P/L</span>

          <strong
            className={
              totalProfitLoss >= 0
                ? "rise-text"
                : "fall-text"
            }
          >
            {totalProfitLoss >= 0
              ? `+$${formatMoney(totalProfitLoss)}`
              : `-$${formatMoney(
                  Math.abs(totalProfitLoss)
                )}`}
          </strong>

          <small>Simulated result</small>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <section className="trading-panel">
          <div className="panel-header">
            <div>
              <span className="page-eyebrow">
                MARKET
              </span>

              <h2>{market}</h2>

              <p>Live simulated market environment</p>
            </div>

            <div className="market-live-badge">
              <span></span>
              LIVE
            </div>
          </div>

          <div className="chart-area">
            <div className="chart-top">
              <div>
                <span>Current Price</span>

                <strong>{formatPrice(currentPrice)}</strong>
              </div>

              <div
                className={
                  change >= 0
                    ? "chart-change"
                    : "chart-change fall-text"
                }
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </div>
            </div>

            <CandleChart
              candles={candles}
              decimals={config.decimals}
              height={280}
            />

            <div className="chart-footer">
              <span>1m candles</span>
              <span>Updates every 1.5s</span>
            </div>
          </div>

          <div className="market-selector">
            <label>Market</label>

            <select
              value={market}
              onChange={(event) =>
                setMarket(event.target.value)
              }
            >
              {Object.keys(MARKET_CONFIG).map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* ============ MARKET HEATMAP ============ */}
          <div className="dashboard-heatmap">
            <div className="dashboard-heatmap-header">
              <span className="page-eyebrow">
                MARKET HEATMAP
              </span>
              <small>Click to switch</small>
            </div>

            <div className="dashboard-heatmap-grid">
              {heatmap.map((m) => (
                <button
                  key={m.symbol}
                  type="button"
                  className={
                    m.symbol === market
                      ? `heatmap-tile ${m.direction} active`
                      : `heatmap-tile ${m.direction}`
                  }
                  onClick={() => setMarket(m.symbol)}
                >
                  <span className="heatmap-tile-symbol">
                    {m.symbol}
                  </span>
                  <span className="heatmap-tile-change">
                    {m.change >= 0 ? "+" : ""}
                    {m.change.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="trade-form-panel">
          <div className="panel-header">
            <div>
              <span className="page-eyebrow">
                PLACE TRADE
              </span>

              <h2>Demo Trade</h2>

              <p>
                Choose a direction and trade settings.
              </p>
            </div>
          </div>

          {/* ============ AI VERDICT WIDGET ============ */}
          <div className={`ai-verdict-widget ${verdictStyle}`}>
            <div className="ai-verdict-widget-header">
              <span className="ai-verdict-widget-icon">
                ✦
              </span>
              <span className="ai-verdict-widget-title">
                AI Verdict
              </span>
              <span className="ai-verdict-widget-label">
                {verdictLabel}
              </span>
            </div>

            <div className="ai-verdict-widget-body">
              <div className="ai-verdict-widget-number">
                {verdict}%
              </div>

              <div className="ai-verdict-widget-bar">
                <div
                  className="ai-verdict-widget-bar-fill"
                  style={{ width: `${verdict}%` }}
                />
              </div>
            </div>

            <div className="ai-verdict-widget-footer">
              Estimated win probability for{" "}
              <strong>{market}</strong> on a{" "}
              <strong>{tradeType}</strong> trade.
            </div>
          </div>

          <div className="trade-direction">
            <button
              type="button"
              className={
                tradeType === "RISE"
                  ? "direction-button rise active"
                  : "direction-button rise"
              }
              onClick={() =>
                setTradeType("RISE")
              }
            >
              <span>↑</span>

              <strong>RISE</strong>

              <small>Price goes higher</small>
            </button>

            <button
              type="button"
              className={
                tradeType === "FALL"
                  ? "direction-button fall active"
                  : "direction-button fall"
              }
              onClick={() =>
                setTradeType("FALL")
              }
            >
              <span>↓</span>

              <strong>FALL</strong>

              <small>Price goes lower</small>
            </button>
          </div>

          <label>Stake Amount</label>

          <div className="input-with-prefix">
            <span>$</span>

            <input
              type="number"
              min="1"
              step="1"
              value={stake}
              onChange={(event) =>
                setStake(event.target.value)
              }
            />
          </div>

          {/* ============ STAKE PRESETS ============ */}
          <div className="quick-preset-row">
            {STAKE_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className={
                  Number(stake) === v
                    ? "quick-preset active"
                    : "quick-preset"
                }
                onClick={() => setStake(String(v))}
              >
                ${v}
              </button>
            ))}
          </div>

          <label>Duration</label>

          <select
            value={duration}
            onChange={(event) =>
              setDuration(event.target.value)
            }
          >
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="120">2 minutes</option>
            <option value="300">5 minutes</option>
          </select>

          {/* ============ DURATION PRESETS ============ */}
          <div className="quick-preset-row">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={
                  duration === p.value
                    ? "quick-preset active"
                    : "quick-preset"
                }
                onClick={() => setDuration(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label>Entry Price (live)</label>

          <input
            type="text"
            value={formatPrice(currentPrice)}
            readOnly
          />

          <div className="trade-summary">
            <div>
              <span>Market</span>
              <strong>{market}</strong>
            </div>

            <div>
              <span>Direction</span>
              <strong>{tradeType}</strong>
            </div>

            <div>
              <span>Stake</span>
              <strong>
                ${formatMoney(stake)}
              </strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>{duration}s</strong>
            </div>
          </div>

          <button
            type="button"
            className="primary-button full-button trade-submit-button"
            onClick={handleTrade}
            disabled={trading}
          >
            {trading
              ? "Placing Trade..."
              : `Place ${tradeType} Trade`}
          </button>

          <div className="trade-warning">
            Demo simulation only. No real money is
            involved.
          </div>
        </section>
      </div>

      <section className="active-trades-section">
        <div className="section-heading-row">
          <div>
            <span className="page-eyebrow">
              ACTIVE
            </span>

            <h2>Running Trades</h2>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/trades")}
          >
            View All
          </button>
        </div>

        {activeTrades.length === 0 ? (
          <div className="empty-page-card compact-empty">
            <div className="empty-page-icon">↗</div>

            <h2>No active trades</h2>

            <p>
              Your running demo trades will appear
              here.
            </p>
          </div>
        ) : (
          <div className="active-trades-grid">
            {activeTrades.map((trade) => {
              const remaining =
                getRemainingSeconds(
                  trade.expires_at
                );

              return (
                <div
                  className="active-trade-card"
                  key={trade.id}
                >
                  <div className="active-trade-top">
                    <div>
                      <span>{trade.market}</span>

                      <strong
                        className={
                          trade.trade_type ===
                          "RISE"
                            ? "rise-text"
                            : "fall-text"
                        }
                      >
                        {trade.trade_type}
                      </strong>
                    </div>

                    <span className="status-pill status-pending">
                      PENDING
                    </span>
                  </div>

                  <div className="active-trade-middle">
                    <div>
                      <span>Stake</span>

                      <strong>
                        ${formatMoney(trade.stake)}
                      </strong>
                    </div>

                    <div>
                      <span>Entry</span>

                      <strong>
                        {trade.entry_price}
                      </strong>
                    </div>

                    <div>
                      <span>Time Left</span>

                      <strong>{remaining}s</strong>
                    </div>
                  </div>

                  <div className="countdown-bar">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            5,
                            (remaining /
                              Number(
                                trade.duration_seconds
                              )) *
                              100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="recent-trades-section">
        <div className="section-heading-row">
          <div>
            <span className="page-eyebrow">
              HISTORY
            </span>

            <h2>Recent Trades</h2>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/trades")}
          >
            View History
          </button>
        </div>

        {completedTrades.length === 0 ? (
          <div className="empty-page-card compact-empty">
            <h2>No completed trades</h2>

            <p>
              Completed demo trades will appear
              here.
            </p>
          </div>
        ) : (
          <div className="recent-trades-list">
            {completedTrades.map((trade) => {
              const profitLoss = Number(
                trade.profit_loss || 0
              );

              return (
                <button
                  type="button"
                  className="recent-trade-row"
                  key={trade.id}
                  onClick={() =>
                    navigate(`/trades/${trade.id}`)
                  }
                >
                  <div>
                    <strong>{trade.market}</strong>
                    <span>{trade.trade_type}</span>
                  </div>

                  <div>
                    <span>Stake</span>
                    <strong>
                      ${formatMoney(trade.stake)}
                    </strong>
                  </div>

                  <div>
                    <span>Result</span>
                    <strong>{trade.result}</strong>
                  </div>

                  <div>
                    <span>P/L</span>

                    <strong
                      className={
                        profitLoss >= 0
                          ? "rise-text"
                          : "fall-text"
                      }
                    >
                      {profitLoss >= 0
                        ? `+$${formatMoney(
                            profitLoss
                          )}`
                        : `-$${formatMoney(
                            Math.abs(profitLoss)
                          )}`}
                    </strong>
                  </div>

                  <span className="row-arrow">→</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-ai-card">
        <div className="dashboard-ai-icon">AI</div>

        <div>
          <span className="page-eyebrow">
            AI ASSISTANT
          </span>

          <h2>
            Need help analyzing the market?
          </h2>

          <p>
            Use the demo AI assistant to interpret
            simulated price movement and market
            direction.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/ai")}
        >
          Open AI Assistant
        </button>
      </section>
    </div>
  );
}

export default Dashboard;