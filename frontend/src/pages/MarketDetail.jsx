import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast.jsx";
import CandleChart from "../components/CandleChart.jsx";
import { useCandleData } from "../hooks/useCandleData.js";

const MARKETS = {
  "EUR-USD": {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    category: "Forex",
    basePrice: 1.085,
    decimals: 5,
    volume: "2.4B",
  },
  "GBP-USD": {
    symbol: "GBP/USD",
    name: "British Pound / US Dollar",
    category: "Forex",
    basePrice: 1.2642,
    decimals: 5,
    volume: "1.8B",
  },
  "USD-JPY": {
    symbol: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    category: "Forex",
    basePrice: 149.82,
    decimals: 3,
    volume: "3.1B",
  },
  "BTC-USD": {
    symbol: "BTC/USD",
    name: "Bitcoin / US Dollar",
    category: "Crypto",
    basePrice: 67432.18,
    decimals: 2,
    volume: "18.2B",
  },
  "ETH-USD": {
    symbol: "ETH/USD",
    name: "Ethereum / US Dollar",
    category: "Crypto",
    basePrice: 3512.44,
    decimals: 2,
    volume: "9.4B",
  },
  "XAU-USD": {
    symbol: "XAU/USD",
    name: "Gold / US Dollar",
    category: "Commodities",
    basePrice: 2341.6,
    decimals: 2,
    volume: "412M",
  },
  SPX500: {
    symbol: "SPX500",
    name: "S&P 500 Index",
    category: "Indices",
    basePrice: 5234.18,
    decimals: 2,
    volume: "1.1B",
  },
  NAS100: {
    symbol: "NAS100",
    name: "Nasdaq 100 Index",
    category: "Indices",
    basePrice: 18234.55,
    decimals: 2,
    volume: "890M",
  },
};

function MarketDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const market = useMemo(
    () => MARKETS[symbol],
    [symbol]
  );

  const { candles, currentPrice, change } =
    useCandleData(
      market?.basePrice || 1,
      market?.decimals || 5
    );

  const [wallet, setWallet] = useState(null);
  const [tradeType, setTradeType] = useState("RISE");
  const [stake, setStake] = useState("100");
  const [duration, setDuration] = useState("60");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get("/wallet/")
      .then((res) => {
        if (active) setWallet(res.data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  if (!market) {
    return (
      <div className="page-container">
        <div className="empty-page-card">
          <h2>Market not found</h2>
          <p>This instrument isn't available.</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/markets")}
          >
            Back to markets
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (value, decimals) =>
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const handlePlace = async () => {
    const numericStake = Number(stake);
    const numericDuration = Number(duration);

    if (!numericStake || numericStake <= 0) {
      toast.error("Enter a valid stake amount.");
      return;
    }

    if (numericStake > Number(wallet?.balance || 0)) {
      toast.error("Insufficient balance.");
      return;
    }

    try {
      setPlacing(true);

      await api.post("/trading/create/", {
        market: market.symbol,
        trade_type: tradeType,
        stake: numericStake,
        entry_price: currentPrice,
        duration_seconds: numericDuration,
      });

      toast.success(
        `Demo ${tradeType.toLowerCase()} trade placed successfully.`
      );

      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Unable to place the trade."
      );
    } finally {
      setPlacing(false);
    }
  };

  const high24 = useMemo(() => {
    if (!candles.length) return market.basePrice;
    return Math.max(...candles.map((c) => c.high));
  }, [candles, market.basePrice]);

  const low24 = useMemo(() => {
    if (!candles.length) return market.basePrice;
    return Math.min(...candles.map((c) => c.low));
  }, [candles, market.basePrice]);

  return (
    <div className="page-container market-detail-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/markets")}
      >
        ← All markets
      </button>

      <div className="market-detail-header">
        <div>
          <span className="page-eyebrow">
            {market.category.toUpperCase()}
          </span>

          <div className="market-detail-title-row">
            <h1>{market.symbol}</h1>

            <span
              className={
                change >= 0
                  ? "market-detail-change rise-text"
                  : "market-detail-change fall-text"
              }
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>

          <p className="market-detail-name">
            {market.name}
          </p>
        </div>

        <div className="market-detail-price-block">
          <span>Current price</span>
          <strong>
            {formatPrice(
              currentPrice,
              market.decimals
            )}
          </strong>
          <small>Updated just now</small>
        </div>
      </div>

      <div className="market-detail-stats">
        <div>
          <span>24h high</span>
          <strong>
            {formatPrice(high24, market.decimals)}
          </strong>
        </div>
        <div>
          <span>24h low</span>
          <strong>
            {formatPrice(low24, market.decimals)}
          </strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>{market.volume}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{market.category}</strong>
        </div>
      </div>

      <div className="market-detail-grid">
        <section className="market-chart-panel">
          <div className="market-chart-header">
            <div>
              <span className="page-eyebrow">
                LIVE CHART
              </span>
              <h2>Candlestick · 1m</h2>
            </div>

            <div className="market-live-badge">
              <span></span>
              LIVE
            </div>
          </div>

          <CandleChart
            candles={candles}
            decimals={market.decimals}
            height={380}
          />
        </section>

        <section className="market-trade-panel">
          <span className="page-eyebrow">
            PLACE TRADE
          </span>
          <h2>Quick trade</h2>

          <div className="market-trade-balance">
            <span>Available</span>
            <strong>
              ${" "}
              {Number(
                wallet?.balance || 0
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="trade-direction">
            <button
              type="button"
              className={
                tradeType === "RISE"
                  ? "direction-button rise active"
                  : "direction-button rise"
              }
              onClick={() => setTradeType("RISE")}
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
              onClick={() => setTradeType("FALL")}
            >
              <span>↓</span>
              <strong>FALL</strong>
              <small>Price goes lower</small>
            </button>
          </div>

          <label>Stake</label>
          <div className="input-with-prefix">
            <span>$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
          </div>

          <label>Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="120">2 minutes</option>
            <option value="300">5 minutes</option>
          </select>

          <div className="trade-summary">
            <div>
              <span>Market</span>
              <strong>{market.symbol}</strong>
            </div>
            <div>
              <span>Direction</span>
              <strong>{tradeType}</strong>
            </div>
            <div>
              <span>Entry price</span>
              <strong>
                {formatPrice(
                  currentPrice,
                  market.decimals
                )}
              </strong>
            </div>
            <div>
              <span>Stake</span>
              <strong>${stake}</strong>
            </div>
          </div>

          <button
            type="button"
            className={`primary-button full-button trade-submit-button ${
              tradeType === "RISE" ? "" : ""
            }`}
            onClick={handlePlace}
            disabled={placing}
          >
            {placing
              ? "Placing…"
              : `Place ${tradeType} Trade`}
          </button>

          <div className="trade-warning">
            Demo simulation only. Virtual funds.
          </div>
        </section>
      </div>

      <div className="info-panel">
        <div className="info-icon">i</div>

        <div>
          <strong>About this chart</strong>

          <p>
            Candle data is simulated locally in your
            browser. Each candle represents one
            minute of price movement. Green candles
            closed above their open, red closed
            below. Trades execute against the current
            price at the moment you click.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MarketDetail;