import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "DEMO_DEPOSIT", label: "Deposits" },
  { id: "TRADE_STAKE", label: "Trade stakes" },
  { id: "TRADE_RETURN", label: "Trade returns" },
];

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso) {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800)
    return `${Math.floor(seconds / 86400)}d ago`;

  return "";
}

function Transactions() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextUrl, setNextUrl] = useState(null);
  const [count, setCount] = useState(0);

  const fetchPage = async (url, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const response = await api.get(url);
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.results || [];

      setItems((current) =>
        append ? [...current, ...list] : list
      );

      setNextUrl(data.next || null);
      setCount(data.count || list.length);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const url =
      filter === "ALL"
        ? "/wallet/transactions/"
        : `/wallet/transactions/?type=${filter}`;

    fetchPage(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleLoadMore = () => {
    if (!nextUrl) return;

    const path = nextUrl.replace(
      /^https?:\/\/[^/]+/,
      ""
    );
    fetchPage(path, true);
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter(
      (tx) =>
        (tx.description || "")
          .toLowerCase()
          .includes(term) ||
        String(tx.amount).includes(term) ||
        (tx.type_label || "")
          .toLowerCase()
          .includes(term)
    );
  }, [items, search]);

  const totals = useMemo(() => {
    let deposits = 0;
    let stakes = 0;
    let returns = 0;

    items.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.transaction_type === "DEMO_DEPOSIT")
        deposits += amt;
      else if (tx.transaction_type === "TRADE_STAKE")
        stakes += amt;
      else if (tx.transaction_type === "TRADE_RETURN")
        returns += amt;
    });

    return {
      deposits,
      stakes,
      returns,
      net: deposits + returns - stakes,
    };
  }, [items]);

  return (
    <div className="transactions-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/wallet")}
      >
        ← Back to wallet
      </button>

      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">WALLET</span>
          <h1>Transaction History</h1>
          <p>
            Every movement in and out of your
            account balance.
          </p>
        </div>

        <div className="transactions-count-badge">
          {count} transaction{count === 1 ? "" : "s"}
        </div>
      </div>

      <div className="transactions-summary">
        <div className="transactions-summary-card">
          <span>Total deposits</span>
          <strong className="rise-text">
            +${formatMoney(totals.deposits)}
          </strong>
        </div>

        <div className="transactions-summary-card">
          <span>Trade stakes</span>
          <strong className="fall-text">
            -${formatMoney(totals.stakes)}
          </strong>
        </div>

        <div className="transactions-summary-card">
          <span>Trade returns</span>
          <strong className="rise-text">
            +${formatMoney(totals.returns)}
          </strong>
        </div>

        <div className="transactions-summary-card">
          <span>Net change</span>
          <strong
            className={
              totals.net >= 0 ? "rise-text" : "fall-text"
            }
          >
            {totals.net >= 0 ? "+" : "-"}$
            {formatMoney(Math.abs(totals.net))}
          </strong>
        </div>
      </div>

      <div className="transactions-toolbar">
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

        <input
          type="text"
          className="markets-search"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="wallet-error">{error}</div>
      )}

      {loading ? (
        <div className="transactions-skeleton">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              className="skeleton skeleton-line"
              key={i}
              style={{
                height: 56,
                marginBottom: 8,
                borderRadius: 12,
              }}
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-page-card">
          <div className="empty-page-icon">$</div>
          <h2>No transactions yet</h2>
          <p>
            {search
              ? "No transactions match your search."
              : "Deposits, stakes and trade settlements will show up here."}
          </p>
        </div>
      ) : (
        <div className="transactions-table">
          <div className="transactions-table-head">
            <span>Date</span>
            <span>Type</span>
            <span>Description</span>
            <span className="markets-align-right">
              Amount
            </span>
            <span className="markets-align-right">
              Balance
            </span>
          </div>

          {visible.map((tx) => {
            const signed = Number(tx.signed_amount);
            const isDebit = signed < 0;

            return (
              <div
                className="transactions-table-row"
                key={tx.id}
              >
                <div>
                  <strong>{formatDate(tx.created_at)}</strong>
                  <small>{relativeTime(tx.created_at)}</small>
                </div>

                <span
                  className={
                    tx.transaction_type === "DEMO_DEPOSIT"
                      ? "tx-badge deposit"
                      : tx.transaction_type ===
                        "TRADE_STAKE"
                      ? "tx-badge stake"
                      : "tx-badge return"
                  }
                >
                  {tx.type_label}
                </span>

                <span className="transactions-description">
                  {tx.description || "—"}
                </span>

                <span
                  className={
                    isDebit
                      ? "transactions-amount fall-text"
                      : "transactions-amount rise-text"
                  }
                >
                  {isDebit ? "-" : "+"}$
                  {formatMoney(Math.abs(signed))}
                </span>

                <span className="transactions-balance">
                  ${formatMoney(tx.balance_after)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {nextUrl && !search && (
        <div className="transactions-load-more">
          <button
            type="button"
            className="secondary-button"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Transactions;