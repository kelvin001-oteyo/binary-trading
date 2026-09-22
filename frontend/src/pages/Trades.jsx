import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Trades() {
  const navigate = useNavigate();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrades = async () => {
    try {
      setLoading(true);

      const response = await api.get("/trading/");

      setTrades(response.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load your trades."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">
            TRADING
          </span>

          <h1>Trade History</h1>

          <p>
            View all of your demo trades and their
            results.
          </p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          New Trade
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="page-loading">
          Loading trades...
        </div>
      ) : trades.length === 0 ? (
        <div className="empty-page-card">
          <div className="empty-page-icon">
            ↗
          </div>

          <h2>No trades yet</h2>

          <p>
            Your demo trades will appear here after
            you place your first trade.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Place Demo Trade
          </button>
        </div>
      ) : (
        <div className="full-trades-table">
          <div className="full-trades-header">
            <span>Market</span>
            <span>Direction</span>
            <span>Stake</span>
            <span>Entry</span>
            <span>Exit</span>
            <span>Status</span>
            <span>P/L</span>
            <span></span>
          </div>

          {trades.map((trade) => (
            <div
              className="full-trades-row"
              key={trade.id}
            >
              <span>
                <strong>
                  {trade.market}
                </strong>
              </span>

              <span
                className={
                  trade.trade_type === "RISE"
                    ? "rise-text"
                    : "fall-text"
                }
              >
                {trade.trade_type}
              </span>

              <span>
                $
                {Number(
                  trade.stake
                ).toFixed(2)}
              </span>

              <span>
                {trade.entry_price}
              </span>

              <span>
                {trade.exit_price || "--"}
              </span>

              <span>
                <span
                  className={`status-pill status-${trade.result.toLowerCase()}`}
                >
                  {trade.result}
                </span>
              </span>

              <span
                className={
                  Number(trade.profit_loss) >= 0
                    ? "rise-text"
                    : "fall-text"
                }
              >
                {Number(
                  trade.profit_loss
                ) >= 0
                  ? `+$${Number(
                      trade.profit_loss
                    ).toFixed(2)}`
                  : `-$${Math.abs(
                      Number(
                        trade.profit_loss
                      )
                    ).toFixed(2)}`}
              </span>

              <button
                className="table-action"
                onClick={() =>
                  navigate(
                    `/trades/${trade.id}`
                  )
                }
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Trades;