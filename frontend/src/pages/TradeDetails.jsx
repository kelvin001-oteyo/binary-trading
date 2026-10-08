import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast.jsx";
import "./TradeDetails.css";


function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [settling, setSettling] = useState(false);

  // Load trade
  useEffect(() => {
    const loadTrade = async () => {
      try {
        const response = await api.get(`/trading/${id}/`);
        setTrade(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load this trade.");
      } finally {
        setLoading(false);
      }
    };

    loadTrade();
  }, [id]);

  // Live clock for pending trades
  useEffect(() => {
    const interval = setInterval(
      () => setCurrentTime(Date.now()),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  // Auto-settle when a pending trade expires
  useEffect(() => {
    if (!trade || trade.result !== "PENDING") return;

    const remaining = Math.max(
      0,
      Math.ceil(
        (new Date(trade.expires_at).getTime() -
          currentTime) /
          1000
      )
    );

    if (remaining > 0 || settling) return;

    const settle = async () => {
      try {
        setSettling(true);
        const response = await api.post(
          `/trading/${trade.id}/settle/`
        );
        setTrade(response.data);

        const result = response.data?.result;
        const pl = Number(response.data?.profit_loss || 0);

        if (result === "WON") {
          toast.success(`Trade won · +$${pl.toFixed(2)}`);
        } else if (result === "LOST") {
          toast.error(
            `Trade lost · -$${Math.abs(pl).toFixed(2)}`
          );
        }
      } catch (err) {
        console.error("Settle error:", err);
      } finally {
        setSettling(false);
      }
    };

    settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, trade]);

  const profitLoss = trade
    ? Number(trade.profit_loss || 0)
    : 0;

  const remainingSeconds = useMemo(() => {
    if (!trade || trade.result !== "PENDING") return 0;
    return Math.max(
      0,
      Math.ceil(
        (new Date(trade.expires_at).getTime() -
          currentTime) /
          1000
      )
    );
  }, [trade, currentTime]);

  // Result banner content
  const bannerContent = useMemo(() => {
    if (!trade) return null;

    if (trade.result === "WON") {
      return {
        tone: "won",
        title: "Trade Won",
        subtitle: `You predicted ${trade.trade_type} correctly.`,
        icon: "✓",
      };
    }
    if (trade.result === "LOST") {
      return {
        tone: "lost",
        title: "Trade Lost",
        subtitle: `Price moved against your ${trade.trade_type} position.`,
        icon: "✕",
      };
    }
    if (trade.result === "CANCELLED") {
      return {
        tone: "cancelled",
        title: "Trade Cancelled",
        subtitle: "This trade was cancelled before expiry.",
        icon: "—",
      };
    }
    return {
      tone: "pending",
      title: "Trade Running",
      subtitle: `Settles in ${remainingSeconds}s`,
      icon: "⏱",
    };
  }, [trade, remainingSeconds]);

  // Entry vs exit movement
  const movement = useMemo(() => {
    if (!trade || trade.exit_price == null) return null;
    const entry = Number(trade.entry_price);
    const exit = Number(trade.exit_price);
    const delta = exit - entry;
    const percent =
      entry !== 0 ? (delta / entry) * 100 : 0;
    return {
      delta,
      percent,
      direction:
        delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    };
  }, [trade]);

  // Potential payout (stake * 1.85 default binary payout)
  const potentialPayout = useMemo(() => {
    if (!trade) return 0;
    return Number(trade.stake) * 1.85;
  }, [trade]);

  const handleTradeAgain = () => {
    if (!trade) return;
    navigate("/dashboard", {
      state: { market: trade.market },
    });
  };

  const handleShare = async () => {
    if (!trade) return;

    const lines = [
      `YoungTraders · Trade #${trade.id}`,
      `Market: ${trade.market}`,
      `Direction: ${trade.trade_type}`,
      `Stake: $${Number(trade.stake).toFixed(2)}`,
      `Entry: ${trade.entry_price}`,
      `Exit: ${trade.exit_price || "—"}`,
      `Result: ${trade.result}`,
      `P/L: ${
        profitLoss >= 0 ? "+" : "-"
      }$${Math.abs(profitLoss).toFixed(2)}`,
    ];

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Trade summary copied to clipboard.");
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // -------- Render states --------

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-header">
          <div className="skeleton skeleton-line skeleton-line-sm" />
          <div className="skeleton skeleton-line skeleton-line-lg" />
          <div className="skeleton skeleton-line skeleton-line-md" />
        </div>
        <div className="skeleton skeleton-panel" />
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="page-container">
        <div className="empty-page-card">
          <h2>Trade not found</h2>
          <p>
            The requested trade could not be
            loaded.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate("/trades")}
          >
            Back to Trades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container trade-details-page">
      <button
        className="back-button"
        onClick={() => navigate("/trades")}
      >
        ← Back to Trades
      </button>

      {/* ============ RESULT BANNER ============ */}
      <div
        className={`trade-banner trade-banner-${bannerContent.tone}`}
      >
        <div className="trade-banner-icon">
          {bannerContent.icon}
        </div>

        <div className="trade-banner-body">
          <span className="trade-banner-eyebrow">
            TRADE #{trade.id}
          </span>
          <h1>{bannerContent.title}</h1>
          <p>{bannerContent.subtitle}</p>

          {trade.result !== "PENDING" && (
            <div
              className={
                profitLoss >= 0
                  ? "trade-banner-pl rise-text"
                  : "trade-banner-pl fall-text"
              }
            >
              {profitLoss >= 0 ? "+" : "-"}$
              {formatMoney(Math.abs(profitLoss))}
            </div>
          )}

          {trade.result === "PENDING" && (
            <div className="trade-banner-pl">
              <span className="trade-banner-clock">
                {remainingSeconds}s
              </span>
              <small>remaining</small>
            </div>
          )}
        </div>

        <div className="trade-banner-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleShare}
          >
            Share
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleTradeAgain}
          >
            Trade Again
          </button>
        </div>
      </div>

      {/* ============ ANALYTICS CHIPS ============ */}
      <div className="trade-chip-grid">
        <div className="trade-chip">
          <span>Stake</span>
          <strong>${formatMoney(trade.stake)}</strong>
        </div>

        <div className="trade-chip">
          <span>Potential payout</span>
          <strong>${formatMoney(potentialPayout)}</strong>
        </div>

        <div className="trade-chip">
          <span>Duration</span>
          <strong>{trade.duration_seconds}s</strong>
        </div>

        <div className="trade-chip">
          <span>Direction</span>
          <strong
            className={
              trade.trade_type === "RISE"
                ? "rise-text"
                : "fall-text"
            }
          >
            {trade.trade_type}
          </strong>
        </div>
      </div>

      {/* ============ ENTRY VS EXIT COMPARISON ============ */}
      <div className="trade-comparison">
        <div className="trade-comparison-header">
          <span className="page-eyebrow">
            PRICE MOVEMENT
          </span>
          <h2>{trade.market}</h2>
        </div>

        <div className="trade-comparison-body">
          <div className="trade-comparison-side">
            <span>Entry price</span>
            <strong>{trade.entry_price}</strong>
            <small>
              {formatDateTime(trade.created_at)}
            </small>
          </div>

          <div
            className={`trade-comparison-arrow ${
              movement?.direction || "flat"
            }`}
          >
            <span className="trade-comparison-arrow-line" />
            <span className="trade-comparison-arrow-icon">
              {movement?.direction === "up"
                ? "↑"
                : movement?.direction === "down"
                ? "↓"
                : "→"}
            </span>
            {movement && (
              <small>
                {movement.delta >= 0 ? "+" : ""}
                {movement.percent.toFixed(2)}%
              </small>
            )}
          </div>

          <div className="trade-comparison-side">
            <span>Exit price</span>
            <strong>
              {trade.exit_price || "Pending"}
            </strong>
            <small>
              {trade.exit_price
                ? formatDateTime(trade.updated_at)
                : "Awaiting settlement"}
            </small>
          </div>
        </div>

        {trade.result !== "PENDING" && (
          <div className="trade-comparison-summary">
            {trade.result === "WON" ? (
              <p>
                You chose{" "}
                <strong>{trade.trade_type}</strong>{" "}
                and price moved{" "}
                <strong>
                  {movement?.direction === "up"
                    ? "higher"
                    : "lower"}
                </strong>
                . That's a winning position.
              </p>
            ) : (
              <p>
                You chose{" "}
                <strong>{trade.trade_type}</strong>{" "}
                but price moved{" "}
                <strong>
                  {movement?.direction === "up"
                    ? "higher"
                    : "lower"}
                </strong>
                . That's a losing position.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ============ TIMELINE ============ */}
      <div className="trade-timeline">
        <span className="page-eyebrow">TIMELINE</span>

        <div className="trade-timeline-items">
          <div className="trade-timeline-item">
            <span className="trade-timeline-dot" />
            <div>
              <strong>Trade placed</strong>
              <small>
                {formatDateTime(trade.created_at)}
              </small>
            </div>
          </div>

          <div className="trade-timeline-connector" />

          <div className="trade-timeline-item">
            <span
              className={
                trade.result === "PENDING"
                  ? "trade-timeline-dot pending"
                  : "trade-timeline-dot done"
              }
            />
            <div>
              <strong>Scheduled expiry</strong>
              <small>
                {formatDateTime(trade.expires_at)}
              </small>
            </div>
          </div>

          <div className="trade-timeline-connector" />

          <div className="trade-timeline-item">
            <span
              className={
                trade.result === "PENDING"
                  ? "trade-timeline-dot"
                  : "trade-timeline-dot done"
              }
            />
            <div>
              <strong>Settled</strong>
              <small>
                {trade.result === "PENDING"
                  ? "Awaiting settlement"
                  : formatDateTime(trade.updated_at)}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* ============ DISCLAIMER ============ */}
      <div className="trade-details-disclaimer">
        This result belongs to the demo simulation
        and does not represent real financial gains
        or losses.
      </div>
    </div>
  );
}

export default TradeDetails;