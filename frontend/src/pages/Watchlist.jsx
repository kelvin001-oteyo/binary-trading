import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Watchlist.css";

const MARKETS = {
  "EUR/USD": { basePrice: 1.085, decimals: 5, name: "Euro / US Dollar", category: "Forex" },
  "GBP/USD": { basePrice: 1.2642, decimals: 5, name: "British Pound / US Dollar", category: "Forex" },
  "USD/JPY": { basePrice: 149.82, decimals: 3, name: "US Dollar / Japanese Yen", category: "Forex" },
  "BTC/USD": { basePrice: 67432.18, decimals: 2, name: "Bitcoin / US Dollar", category: "Crypto" },
  "ETH/USD": { basePrice: 3512.44, decimals: 2, name: "Ethereum / US Dollar", category: "Crypto" },
  "XAU/USD": { basePrice: 2341.6, decimals: 2, name: "Gold / US Dollar", category: "Commodities" },
  SPX500: { basePrice: 5234.18, decimals: 2, name: "S&P 500 Index", category: "Indices" },
  NAS100: { basePrice: 18234.55, decimals: 2, name: "Nasdaq 100 Index", category: "Indices" },
};

const WATCHLIST_KEY = "market_watchlist";

function makeSeries(basePrice, decimals, points = 30) {
  const series = [];
  let current = basePrice;
  for (let i = 0; i < points; i += 1) {
    const drift = (Math.random() - 0.5) * basePrice * 0.004;
    current += drift;
    series.push(Number(current.toFixed(decimals)));
  }
  return series;
}

function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;

  const width = 100;
  const height = 30;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Watchlist() {
  const navigate = useNavigate();

  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(WATCHLIST_KEY) || "[]"
      );
      setSymbols(stored);
    } catch {
      setSymbols([]);
    }
  }, []);

  const remove = (symbol) => {
    setSymbols((current) => {
      const next = current.filter((s) => s !== symbol);
      localStorage.setItem(
        WATCHLIST_KEY,
        JSON.stringify(next)
      );
      return next;
    });
  };

  // One card per watched symbol
  const cards = symbols
    .map((symbol) => {
      const cfg = MARKETS[symbol];
      if (!cfg) return null;
      return {
        symbol,
        ...cfg,
        series: makeSeries(cfg.basePrice, cfg.decimals),
        change: (Math.random() - 0.4) * 1.5,
      };
    })
    .filter(Boolean);

  return (
    <div className="page-container watchlist-page">
      <div className="page-header">
        <span className="page-eyebrow">
          SAVED MARKETS
        </span>
        <h1>Watchlist</h1>
        <p>
          Your starred markets with live simulated
          prices.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="empty-page-card">
          <div className="empty-page-icon">☆</div>
          <h2>No markets in your watchlist</h2>
          <p>
            Go to Markets and click the star on any
            instrument to add it here.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate("/markets")}
          >
            Browse Markets
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {cards.map((m) => {
            const up = m.change >= 0;

            return (
              <div
                className="watchlist-card"
                key={m.symbol}
              >
                <div className="watchlist-card-top">
                  <div>
                    <strong className="watchlist-symbol">
                      {m.symbol}
                    </strong>
                    <span className="watchlist-name">
                      {m.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="watchlist-remove"
                    onClick={() => remove(m.symbol)}
                    title="Remove from watchlist"
                  >
                    ×
                  </button>
                </div>

                <div className="watchlist-price-row">
                  <strong className="watchlist-price">
                    {Number(m.basePrice).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits:
                          m.decimals,
                        maximumFractionDigits:
                          m.decimals,
                      }
                    )}
                  </strong>

                  <span
                    className={
                      up ? "rise-text" : "fall-text"
                    }
                  >
                    {up ? "+" : ""}
                    {m.change.toFixed(2)}%
                  </span>
                </div>

                <div className="watchlist-spark">
                  <Sparkline
                    points={m.series}
                    color={up ? "#16a34a" : "#dc2626"}
                  />
                </div>

                <button
                  type="button"
                  className="watchlist-trade-button"
                  onClick={() =>
                    navigate(
                      `/markets/${m.symbol.replace(
                        "/",
                        "-"
                      )}`
                    )
                  }
                >
                  Trade
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Watchlist;