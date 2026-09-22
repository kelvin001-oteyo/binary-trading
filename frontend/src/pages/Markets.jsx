import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const INITIAL_MARKETS = [
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    category: "Forex",
    price: 1.085,
    decimals: 5,
    change: 0.46,
    high: 1.0921,
    low: 1.0798,
    volume: "2.4B",
  },
  {
    symbol: "GBP/USD",
    name: "British Pound / US Dollar",
    category: "Forex",
    price: 1.2642,
    decimals: 5,
    change: -0.18,
    high: 1.2721,
    low: 1.2589,
    volume: "1.8B",
  },
  {
    symbol: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    category: "Forex",
    price: 149.82,
    decimals: 3,
    change: 0.11,
    high: 150.12,
    low: 149.21,
    volume: "3.1B",
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin / US Dollar",
    category: "Crypto",
    price: 67432.18,
    decimals: 2,
    change: 1.87,
    high: 68120.0,
    low: 66104.5,
    volume: "18.2B",
  },
  {
    symbol: "ETH/USD",
    name: "Ethereum / US Dollar",
    category: "Crypto",
    price: 3512.44,
    decimals: 2,
    change: -0.92,
    high: 3572.1,
    low: 3480.2,
    volume: "9.4B",
  },
  {
    symbol: "XAU/USD",
    name: "Gold / US Dollar",
    category: "Commodities",
    price: 2341.6,
    decimals: 2,
    change: 0.34,
    high: 2352.8,
    low: 2332.1,
    volume: "412M",
  },
  {
    symbol: "SPX500",
    name: "S&P 500 Index",
    category: "Indices",
    price: 5234.18,
    decimals: 2,
    change: 0.72,
    high: 5248.9,
    low: 5198.3,
    volume: "1.1B",
  },
  {
    symbol: "NAS100",
    name: "Nasdaq 100 Index",
    category: "Indices",
    price: 18234.55,
    decimals: 2,
    change: -0.41,
    high: 18345.2,
    low: 18180.9,
    volume: "890M",
  },
];

const CATEGORIES = [
  "All",
  "Forex",
  "Crypto",
  "Indices",
  "Commodities",
];

const SORTS = {
  change_desc: "Change (high → low)",
  change_asc: "Change (low → high)",
  price_desc: "Price (high → low)",
  price_asc: "Price (low → high)",
  symbol: "Symbol (A → Z)",
};

const WATCHLIST_KEY = "market_watchlist";

function generateSparkline(basePrice, decimals, points = 30) {
  const series = [];
  let current = basePrice;

  for (let i = 0; i < points; i += 1) {
    const drift = (Math.random() - 0.5) * basePrice * 0.004;
    current = current + drift;
    series.push(Number(current.toFixed(decimals)));
  }

  return series;
}

function Markets() {
  const navigate = useNavigate();

  const [markets, setMarkets] = useState(() =>
    INITIAL_MARKETS.map((market) => ({
      ...market,
      sparkline: generateSparkline(
        market.price,
        market.decimals
      ),
      flash: null,
    }))
  );

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("change_desc");

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist watchlist
  useEffect(() => {
    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  // Live price simulation
  const flashTimers = useRef({});

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets((current) =>
        current.map((market) => {
          const volatility =
            market.price * 0.0008;

          const delta =
            (Math.random() - 0.5) * volatility * 2;

          const nextPrice = Math.max(
            0.0001,
            market.price + delta
          );

          const direction = delta >= 0 ? "up" : "down";

          const newPoint = Number(
            nextPrice.toFixed(market.decimals)
          );

          const sparkline = [
            ...market.sparkline.slice(-29),
            newPoint,
          ];

          const newChange =
            market.change +
            (delta / market.price) * 100;

          return {
            ...market,
            price: nextPrice,
            sparkline,
            change: newChange,
            flash: direction,
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Clear flash flags shortly after they're set
  useEffect(() => {
    const id = setInterval(() => {
      setMarkets((current) =>
        current.map((m) =>
          m.flash ? { ...m, flash: null } : m
        )
      );
    }, 400);

    return () => clearInterval(id);
  }, []);

  const toggleWatchlist = (symbol) => {
    setWatchlist((current) =>
      current.includes(symbol)
        ? current.filter((s) => s !== symbol)
        : [...current, symbol]
    );
  };

  const visibleMarkets = useMemo(() => {
    let list = markets;

    if (category !== "All") {
      list = list.filter(
        (market) => market.category === category
      );
    }

    const term = search.trim().toLowerCase();

    if (term) {
      list = list.filter(
        (market) =>
          market.symbol.toLowerCase().includes(term) ||
          market.name.toLowerCase().includes(term)
      );
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "change_desc":
          return b.change - a.change;
        case "change_asc":
          return a.change - b.change;
        case "price_desc":
          return b.price - a.price;
        case "price_asc":
          return a.price - b.price;
        case "symbol":
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

    return sorted;
  }, [markets, category, search, sortBy]);

  const openTrade = (symbol) => {
    const slug = symbol.replace("/", "-");
    navigate(`/markets/${slug}`);
  };

  const formatPrice = (value, decimals) =>
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const formatChange = (value) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const clockString = now
    .toISOString()
    .slice(11, 19);

  return (
    <div className="page-container markets-page">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">MARKETS</span>

          <h1>Markets</h1>

          <p>
            Live simulated prices across forex,
            crypto, indices and commodities.
          </p>
        </div>

        <div className="markets-clock">
          <span className="markets-clock-dot"></span>
          <span className="markets-clock-label">
            Market open
          </span>
          <span className="markets-clock-time">
            {clockString} UTC
          </span>
        </div>
      </div>

      <div className="markets-toolbar">
        <div className="markets-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={
                category === cat
                  ? "markets-tab active"
                  : "markets-tab"
              }
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="markets-controls">
          <input
            type="text"
            className="markets-search"
            placeholder="Search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="markets-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="markets-table">
        <div className="markets-table-head">
          <span></span>
          <span>Symbol</span>
          <span>Name</span>
          <span className="markets-align-right">
            Price
          </span>
          <span className="markets-align-right">
            24h Change
          </span>
          <span>Trend (30s)</span>
          <span className="markets-align-right">
            Volume
          </span>
          <span></span>
        </div>

        {visibleMarkets.length === 0 ? (
          <div className="markets-empty">
            No markets match your filters.
          </div>
        ) : (
          visibleMarkets.map((market) => {
            const isWatched = watchlist.includes(
              market.symbol
            );

            const priceDirection = market.flash;

            return (
              <div
                key={market.symbol}
                className="markets-table-row"
              >
                <button
                  type="button"
                  className={
                    isWatched
                      ? "watch-star active"
                      : "watch-star"
                  }
                  onClick={() =>
                    toggleWatchlist(market.symbol)
                  }
                  aria-label="Toggle watchlist"
                >
                  {isWatched ? "★" : "☆"}
                </button>

                <span className="markets-symbol">
                  {market.symbol}
                </span>

                <span className="markets-name">
                  {market.name}
                </span>

                <span
                  className={
                    priceDirection
                      ? `markets-price flash-${priceDirection}`
                      : "markets-price"
                  }
                >
                  {formatPrice(
                    market.price,
                    market.decimals
                  )}
                </span>

                <span
                  className={
                    market.change >= 0
                      ? "markets-change rise-text"
                      : "markets-change fall-text"
                  }
                >
                  {formatChange(market.change)}
                </span>

                <span className="markets-spark">
                  <Sparkline
                    points={market.sparkline}
                    color={
                      market.change >= 0
                        ? "#16a34a"
                        : "#dc2626"
                    }
                  />
                </span>

                <span className="markets-volume">
                  {market.volume}
                </span>

                <button
                  type="button"
                  className="markets-trade-button"
                  onClick={() =>
                    openTrade(market.symbol)
                  }
                >
                  Trade
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="info-panel">
        <div className="info-icon">i</div>

        <div>
          <strong>Simulated market data</strong>

          <p>
            Prices, movements and trade outcomes
            are generated for demonstration
            purposes and do not reflect live
            financial markets.
          </p>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points, color, width = 120, height = 32 }) {
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const stepX = width / (points.length - 1);

  const coordinates = points
    .map((value, index) => {
      const x = index * stepX;
      const y =
        height -
        ((value - min) / range) * height;
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
        points={coordinates}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Markets;