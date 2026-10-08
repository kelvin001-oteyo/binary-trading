import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "./Analytics.css";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Analytics() {
  const navigate = useNavigate();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/trading/");
        setTrades(res.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Only settled trades count toward analytics
  const settled = useMemo(
    () => trades.filter((t) => t.result !== "PENDING"),
    [trades]
  );

  const summary = useMemo(() => {
    let won = 0;
    let lost = 0;
    let wonAmount = 0;
    let lostAmount = 0;

    settled.forEach((t) => {
      const pl = Number(t.profit_loss || 0);
      if (t.result === "WON") {
        won += 1;
        wonAmount += pl;
      } else if (t.result === "LOST") {
        lost += 1;
        lostAmount += Math.abs(pl);
      }
    });

    const total = won + lost;
    return {
      won,
      lost,
      total,
      wonAmount,
      lostAmount,
      net: wonAmount - lostAmount,
      winRate: total ? Math.round((won / total) * 100) : 0,
    };
  }, [settled]);

  // P/L grouped by market
  const byMarket = useMemo(() => {
    const map = new Map();

    settled.forEach((t) => {
      const key = t.market || "Unknown";
      const pl = Number(t.profit_loss || 0);
      const entry = map.get(key) || {
        market: key,
        net: 0,
        count: 0,
      };
      entry.net += pl;
      entry.count += 1;
      map.set(key, entry);
    });

    return [...map.values()].sort(
      (a, b) => b.net - a.net
    );
  }, [settled]);

  const maxMarket = useMemo(() => {
    if (!byMarket.length) return 0;
    return Math.max(
      ...byMarket.map((m) => Math.abs(m.net)),
      1
    );
  }, [byMarket]);

  // Win rate over last 20 settled trades
  const recentResults = useMemo(() => {
    return settled
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
      .slice(-20)
      .map((t) => (t.result === "WON" ? 1 : 0));
  }, [settled]);

  // Best and worst trade
  const bestTrade = useMemo(() => {
    if (!settled.length) return null;
    return settled.reduce((best, t) => {
      const pl = Number(t.profit_loss || 0);
      return pl > Number(best.profit_loss || 0)
        ? t
        : best;
    });
  }, [settled]);

  const worstTrade = useMemo(() => {
    if (!settled.length) return null;
    return settled.reduce((worst, t) => {
      const pl = Number(t.profit_loss || 0);
      return pl < Number(worst.profit_loss || 0)
        ? t
        : worst;
    });
  }, [settled]);

  // By direction
  const byDirection = useMemo(() => {
    let rise = 0;
    let fall = 0;
    settled.forEach((t) => {
      const pl = Number(t.profit_loss || 0);
      if (t.trade_type === "RISE") rise += pl;
      else if (t.trade_type === "FALL") fall += pl;
    });
    return { rise, fall };
  }, [settled]);

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

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!settled.length) {
    return (
      <div className="page-container">
        <div className="empty-page-card">
          <h2>No settled trades yet</h2>
          <p>
            Analytics appear once you have
            completed trades. Place and settle a
            trade to see your stats.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate("/dashboard")}
          >
            Place Demo Trade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <span className="page-eyebrow">
          INSIGHTS
        </span>
        <h1>Trade Analytics</h1>
        <p>
          Performance breakdown of your simulated
          trading activity.
        </p>
      </div>

      {/* ============ SUMMARY ============ */}
      <div className="analytics-summary">
        <div className="analytics-summary-card">
          <span>Win Rate</span>
          <strong
            className={
              summary.winRate >= 50
                ? "rise-text"
                : "fall-text"
            }
          >
            {summary.winRate}%
          </strong>
          <small>
            {summary.won} won · {summary.lost} lost
          </small>
        </div>

        <div className="analytics-summary-card">
          <span>Net P/L</span>
          <strong
            className={
              summary.net >= 0
                ? "rise-text"
                : "fall-text"
            }
          >
            {summary.net >= 0 ? "+" : "-"}$
            {formatMoney(Math.abs(summary.net))}
          </strong>
          <small>
            From {summary.total} settled trades
          </small>
        </div>

        <div className="analytics-summary-card">
          <span>Total Won</span>
          <strong className="rise-text">
            +${formatMoney(summary.wonAmount)}
          </strong>
          <small>{summary.won} trades</small>
        </div>

        <div className="analytics-summary-card">
          <span>Total Lost</span>
          <strong className="fall-text">
            -${formatMoney(summary.lostAmount)}
          </strong>
          <small>{summary.lost} trades</small>
        </div>
      </div>

      {/* ============ P/L BY MARKET ============ */}
      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <span className="page-eyebrow">
            BREAKDOWN
          </span>
          <h2>P/L by Market</h2>
        </div>

        <div className="analytics-bars">
          {byMarket.map((row) => {
            const width =
              (Math.abs(row.net) / maxMarket) * 100;
            const positive = row.net >= 0;

            return (
              <div
                className="analytics-bar-row"
                key={row.market}
              >
                <div className="analytics-bar-label">
                  <strong>{row.market}</strong>
                  <small>{row.count} trades</small>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className={
                      positive
                        ? "analytics-bar-fill rise"
                        : "analytics-bar-fill fall"
                    }
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div
                  className={
                    positive
                      ? "analytics-bar-value rise-text"
                      : "analytics-bar-value fall-text"
                  }
                >
                  {positive ? "+" : "-"}$
                  {formatMoney(Math.abs(row.net))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ WIN RATE STREAK ============ */}
      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <span className="page-eyebrow">
            MOMENTUM
          </span>
          <h2>Last 20 Trades</h2>
        </div>

        <div className="analytics-streak">
          {recentResults.map((result, i) => (
            <div
              key={i}
              className={
                result ? "streak-dot win" : "streak-dot loss"
              }
              title={result ? "Won" : "Lost"}
            />
          ))}
        </div>

        <div className="analytics-streak-footer">
          <span>
            <strong>Wins:</strong>{" "}
            {recentResults.filter((r) => r === 1).length}
          </span>
          <span>
            <strong>Losses:</strong>{" "}
            {recentResults.filter((r) => r === 0).length}
          </span>
        </div>
      </div>

      {/* ============ DIRECTION SPLIT ============ */}
      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <span className="page-eyebrow">
            DIRECTION
          </span>
          <h2>P/L by Direction</h2>
        </div>

        <div className="analytics-direction-grid">
          <div className="analytics-direction-card rise">
            <span>RISE trades</span>
            <strong
              className={
                byDirection.rise >= 0
                  ? "rise-text"
                  : "fall-text"
              }
            >
              {byDirection.rise >= 0 ? "+" : "-"}$
              {formatMoney(Math.abs(byDirection.rise))}
            </strong>
            <small>Upward predictions</small>
          </div>

          <div className="analytics-direction-card fall">
            <span>FALL trades</span>
            <strong
              className={
                byDirection.fall >= 0
                  ? "rise-text"
                  : "fall-text"
              }
            >
              {byDirection.fall >= 0 ? "+" : "-"}$
              {formatMoney(Math.abs(byDirection.fall))}
            </strong>
            <small>Downward predictions</small>
          </div>
        </div>
      </div>

      {/* ============ BEST / WORST ============ */}
      <div className="analytics-highlights">
        {bestTrade && (
          <button
            type="button"
            className="analytics-highlight-card best"
            onClick={() =>
              navigate(`/trades/${bestTrade.id}`)
            }
          >
            <span className="page-eyebrow">
              BEST TRADE
            </span>
            <strong className="rise-text">
              +$
              {formatMoney(bestTrade.profit_loss)}
            </strong>
            <small>
              {bestTrade.market} ·{" "}
              {bestTrade.trade_type}
            </small>
          </button>
        )}

        {worstTrade && (
          <button
            type="button"
            className="analytics-highlight-card worst"
            onClick={() =>
              navigate(`/trades/${worstTrade.id}`)
            }
          >
            <span className="page-eyebrow">
              WORST TRADE
            </span>
            <strong className="fall-text">
              -$
              {formatMoney(
                Math.abs(worstTrade.profit_loss)
              )}
            </strong>
            <small>
              {worstTrade.market} ·{" "}
              {worstTrade.trade_type}
            </small>
          </button>
        )}
      </div>
    </div>
  );
}

export default Analytics;