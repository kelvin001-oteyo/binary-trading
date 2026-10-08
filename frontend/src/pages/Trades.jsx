import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Trades.css";

const PAGE_SIZE = 10;

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "WON", label: "Won" },
  { id: "LOST", label: "Lost" },
];

const SORTS = {
  date_desc: "Date (newest)",
  date_asc: "Date (oldest)",
  stake_desc: "Stake (high → low)",
  stake_asc: "Stake (low → high)",
  pl_desc: "P/L (high → low)",
  pl_asc: "P/L (low → high)",
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Trades() {
  const navigate = useNavigate();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);

  const loadTrades = async () => {
    try {
      setLoading(true);

      const response = await api.get("/trading/");

      setTrades(response.data);
    } catch (err) {
      console.error(err);

      setError("Unable to load your trades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  // Reset to page 1 whenever filter/search/sort changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, sortBy]);

  // -------- Summary stats --------
  const summary = useMemo(() => {
    let wonCount = 0;
    let lostCount = 0;
    let wonAmount = 0;
    let lostAmount = 0;

    trades.forEach((t) => {
      const pl = Number(t.profit_loss || 0);
      if (t.result === "WON") {
        wonCount += 1;
        wonAmount += pl;
      } else if (t.result === "LOST") {
        lostCount += 1;
        lostAmount += Math.abs(pl);
      }
    });

    const settled = wonCount + lostCount;
    const winRate = settled
      ? Math.round((wonCount / settled) * 100)
      : 0;

    return {
      wonCount,
      lostCount,
      wonAmount,
      lostAmount,
      net: wonAmount - lostAmount,
      winRate,
      settled,
    };
  }, [trades]);

  // -------- Filter + search + sort --------
  const visibleTrades = useMemo(() => {
    let list = [...trades];

    if (filter !== "ALL") {
      list = list.filter((t) => t.result === filter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((t) =>
        String(t.market || "")
          .toLowerCase()
          .includes(term)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.created_at) -
            new Date(a.created_at)
          );
        case "date_asc":
          return (
            new Date(a.created_at) -
            new Date(b.created_at)
          );
        case "stake_desc":
          return Number(b.stake) - Number(a.stake);
        case "stake_asc":
          return Number(a.stake) - Number(b.stake);
        case "pl_desc":
          return (
            Number(b.profit_loss || 0) -
            Number(a.profit_loss || 0)
          );
        case "pl_asc":
          return (
            Number(a.profit_loss || 0) -
            Number(b.profit_loss || 0)
          );
        default:
          return 0;
      }
    });

    return list;
  }, [trades, filter, search, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleTrades.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const paginatedTrades = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleTrades.slice(start, start + PAGE_SIZE);
  }, [visibleTrades, safePage]);

  // -------- CSV export --------
  const handleExport = () => {
    const rows = [
      [
        "Date",
        "Market",
        "Direction",
        "Stake",
        "Entry",
        "Exit",
        "Result",
        "P/L",
      ],
      ...visibleTrades.map((t) => [
        new Date(t.created_at).toISOString(),
        t.market,
        t.trade_type,
        Number(t.stake).toFixed(2),
        t.entry_price,
        t.exit_price || "",
        t.result,
        Number(t.profit_loss || 0).toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return s.includes(",") ||
              s.includes('"') ||
              s.includes("\n")
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `youngtraders-trades-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container trades-page">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">TRADING</span>

          <h1>Trade History</h1>

          <p>
            View all of your demo trades and their
            results.
          </p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() => navigate("/dashboard")}
        >
          New Trade
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading ? (
        <div className="page-loading">
          Loading trades...
        </div>
      ) : trades.length === 0 ? (
        <div className="empty-page-card">
          <div className="empty-page-icon">↗</div>

          <h2>No trades yet</h2>

          <p>
            Your demo trades will appear here after
            you place your first trade.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/dashboard")}
          >
            Place Demo Trade
          </button>
        </div>
      ) : (
        <>
          {/* ============ SUMMARY STRIP ============ */}
          <div className="trades-summary">
            <div className="trades-summary-card">
              <span>Total Won</span>
              <strong className="rise-text">
                +${formatMoney(summary.wonAmount)}
              </strong>
              <small>
                {summary.wonCount} trade
                {summary.wonCount === 1 ? "" : "s"}
              </small>
            </div>

            <div className="trades-summary-card">
              <span>Total Lost</span>
              <strong className="fall-text">
                -${formatMoney(summary.lostAmount)}
              </strong>
              <small>
                {summary.lostCount} trade
                {summary.lostCount === 1 ? "" : "s"}
              </small>
            </div>

            <div className="trades-summary-card">
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
              <small>Simulated result</small>
            </div>

            <div className="trades-summary-card">
              <span>Win Rate</span>
              <strong>
                {summary.settled > 0
                  ? `${summary.winRate}%`
                  : "—"}
              </strong>
              <small>
                {summary.settled} settled trade
                {summary.settled === 1 ? "" : "s"}
              </small>
            </div>
          </div>

          {/* ============ TOOLBAR ============ */}
          <div className="trades-toolbar">
            <div className="markets-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={
                    filter === f.id
                      ? "markets-tab active"
                      : "markets-tab"
                  }
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="trades-toolbar-right">
              <input
                type="text"
                className="markets-search"
                placeholder="Search market…"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                className="markets-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                {Object.entries(SORTS).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                className="secondary-button"
                onClick={handleExport}
                disabled={visibleTrades.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* ============ TABLE ============ */}
          {visibleTrades.length === 0 ? (
            <div className="empty-page-card compact-empty">
              <h2>No trades match your filters</h2>
              <p>
                Try changing the filter or search
                term.
              </p>
            </div>
          ) : (
            <>
              <div className="full-trades-table">
                <div className="full-trades-header">
                  <span>Date</span>
                  <span>Market</span>
                  <span>Direction</span>
                  <span>Stake</span>
                  <span>Result</span>
                  <span>P/L</span>
                  <span></span>
                </div>

                {paginatedTrades.map((trade) => {
                  const pl = Number(
                    trade.profit_loss || 0
                  );

                  return (
                    <div
                      className="full-trades-row"
                      key={trade.id}
                    >
                      <span className="trades-date">
                        {formatDate(trade.created_at)}
                      </span>

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
                        ${formatMoney(trade.stake)}
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
                          pl >= 0
                            ? "rise-text"
                            : "fall-text"
                        }
                      >
                        {pl >= 0
                          ? `+$${formatMoney(pl)}`
                          : `-$${formatMoney(
                              Math.abs(pl)
                            )}`}
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
                  );
                })}
              </div>

              {/* ============ PAGINATION ============ */}
              {totalPages > 1 && (
                <div className="trades-pagination">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    disabled={safePage === 1}
                  >
                    ← Prev
                  </button>

                  <span className="trades-pagination-label">
                    Page {safePage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={safePage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Trades;