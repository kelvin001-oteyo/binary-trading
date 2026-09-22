import { useState } from "react";
import api from "../services/api";

function AI() {
  const [market, setMarket] =
    useState("DEMO/USD");

  const [price, setPrice] =
    useState("1.08500");

  const [analysis, setAnalysis] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const analyzeMarket = async () => {
    setError("");
    setAnalysis(null);

    try {
      setLoading(true);

      const currentPrice = Number(price);

      const previousPrice =
        currentPrice - 0.0005;

      const response = await api.post(
        "/ai/analyze/",
        {
          market,
          price: currentPrice,
          previous_price: previousPrice,
        }
      );

      setAnalysis(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to generate analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="page-eyebrow">
          AI ASSISTANT
        </span>

        <h1>Market Analysis</h1>

        <p>
          Use the demo AI assistant to interpret
          simulated market movement.
        </p>
      </div>

      <div className="ai-page-grid">
        <div className="ai-control-card">
          <div className="ai-heading">
            <div className="ai-large-icon">
              AI
            </div>

            <div>
              <h2>
                Analyze a Market
              </h2>

              <p>
                Provide simulated market data for
                analysis.
              </p>
            </div>
          </div>

          <label>Market</label>

          <select
            value={market}
            onChange={(e) =>
              setMarket(e.target.value)
            }
          >
            <option value="DEMO/USD">
              DEMO/USD
            </option>

            <option value="DEMO/EUR">
              DEMO/EUR
            </option>

            <option value="DEMO/GBP">
              DEMO/GBP
            </option>
          </select>

          <label>
            Current Price
          </label>

          <input
            type="number"
            step="0.00001"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="primary-button full-button"
            onClick={analyzeMarket}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "Analyze Market"}
          </button>

          <div className="ai-disclaimer">
            <strong>Important</strong>

            <span>
              This AI feature currently provides
              simulated analysis. It does not
              guarantee trade outcomes or profits.
            </span>
          </div>
        </div>

        <div className="ai-result-card">
          {!analysis ? (
            <div className="ai-result-empty">
              <div className="ai-large-icon">
                ✦
              </div>

              <h2>
                Analysis will appear here
              </h2>

              <p>
                Select a market and provide a
                simulated price to generate an
                analysis.
              </p>
            </div>
          ) : (
            <div className="ai-result-content">
              <div className="result-header">
                <div>
                  <span>
                    MARKET
                  </span>

                  <h2>
                    {analysis.market}
                  </h2>
                </div>

                <div
                  className={`trend-badge ${
                    analysis.trend === "UP"
                      ? "trend-up"
                      : analysis.trend === "DOWN"
                      ? "trend-down"
                      : "trend-flat"
                  }`}
                >
                  {analysis.trend}
                </div>
              </div>

              <div className="analysis-price">
                <span>
                  Current Price
                </span>

                <strong>
                  {analysis.current_price}
                </strong>
              </div>

              <div className="analysis-section">
                <span>
                  Analysis
                </span>

                <p>
                  {analysis.analysis}
                </p>
              </div>

              <div className="risk-box">
                <strong>
                  Risk Note
                </strong>

                <span>
                  {analysis.risk_note}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AI;