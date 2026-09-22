import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrade = async () => {
      try {
        const response = await api.get(
          `/trading/${id}/`
        );

        setTrade(response.data);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load this trade."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTrade();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          Loading trade...
        </div>
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
            onClick={() =>
              navigate("/trades")
            }
          >
            Back to Trades
          </button>
        </div>
      </div>
    );
  }

  const profitLoss = Number(
    trade.profit_loss
  );

  return (
    <div className="page-container">
      <button
        className="back-button"
        onClick={() =>
          navigate("/trades")
        }
      >
        ← Back to Trades
      </button>

      <div className="page-header">
        <span className="page-eyebrow">
          TRADE DETAILS
        </span>

        <h1>
          Trade #{trade.id}
        </h1>

        <p>
          Details of your simulated trade.
        </p>
      </div>

      <div className="trade-detail-grid">
        <div className="detail-main-card">
          <div className="detail-market-header">
            <div>
              <span className="market-symbol">
                {trade.market}
              </span>

              <h2>
                {trade.trade_type}
              </h2>
            </div>

            <span
              className={`status-pill status-${trade.result.toLowerCase()}`}
            >
              {trade.result}
            </span>
          </div>

          <div className="detail-stats">
            <div>
              <span>Stake</span>

              <strong>
                $
                {Number(
                  trade.stake
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Entry Price</span>

              <strong>
                {trade.entry_price}
              </strong>
            </div>

            <div>
              <span>Exit Price</span>

              <strong>
                {trade.exit_price || "--"}
              </strong>
            </div>

            <div>
              <span>Duration</span>

              <strong>
                {trade.duration_seconds}s
              </strong>
            </div>
          </div>
        </div>

        <div className="detail-result-card">
          <span>Profit / Loss</span>

          <strong
            className={
              profitLoss >= 0
                ? "rise-text"
                : "fall-text"
            }
          >
            {profitLoss >= 0
              ? `+$${profitLoss.toFixed(2)}`
              : `-$${Math.abs(
                  profitLoss
                ).toFixed(2)}`}
          </strong>

          <p>
            This result belongs to the demo
            simulation and does not represent real
            financial gains or losses.
          </p>
        </div>
      </div>

      <div className="detail-information">
        <div>
          <span>Created</span>

          <strong>
            {new Date(
              trade.created_at
            ).toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Expires</span>

          <strong>
            {new Date(
              trade.expires_at
            ).toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Last Updated</span>

          <strong>
            {new Date(
              trade.updated_at
            ).toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default TradeDetails;