import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Leaderboard.css";

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

// Fake traders with stats per range
const TRADERS = [
  { username: "AriaN", country: "🇰🇪", winRate: 71, net: 8420, trades: 142 },
  { username: "MarcusL", country: "🇬🇧", winRate: 68, net: 7310, trades: 118 },
  { username: "PriyaS", country: "🇮🇳", winRate: 66, net: 6890, trades: 97 },
  { username: "KenjiO", country: "🇯🇵", winRate: 64, net: 5420, trades: 88 },
  { username: "ZaynM", country: "🇦🇪", winRate: 63, net: 4810, trades: 76 },
  { username: "SophiaR", country: "🇺🇸", winRate: 61, net: 4230, trades: 91 },
  { username: "LucasB", country: "🇧🇷", winRate: 59, net: 3640, trades: 68 },
  { username: "NinaK", country: "🇩🇪", winRate: 58, net: 3210, trades: 55 },
  { username: "OmarF", country: "🇪🇬", winRate: 56, net: 2890, trades: 62 },
  { username: "JadeW", country: "🇦🇺", winRate: 54, net: 2420, trades: 44 },
];

function scaleForRange(range) {
  if (range === "7d") return 0.22;
  if (range === "30d") return 0.58;
  return 1;
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function Leaderboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");

  const leaders = useMemo(() => {
    const scale = scaleForRange(range);
    return TRADERS.map((t) => ({
      ...t,
      net: Math.round(t.net * scale),
      trades: Math.round(t.trades * scale),
    }));
  }, [range]);

  const podium = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="page-container leaderboard-page">
      <div className="page-header page-header-row">
        <div>
          <span className="page-eyebrow">
            COMMUNITY
          </span>

          <h1>Leaderboard</h1>

          <p>
            Top simulated traders ranked by net
            profit. Updated continuously.
          </p>
        </div>

        <div className="leaderboard-range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={
                range === r.id
                  ? "leaderboard-range-btn active"
                  : "leaderboard-range-btn"
              }
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ PODIUM ============ */}
      <div className="leaderboard-podium">
        {[1, 0, 2].map((idx) => {
          const t = podium[idx];
          if (!t) return null;

          const rank = idx + 1;

          return (
            <div
              key={t.username}
              className={`podium-card podium-${rank}`}
            >
              <div className="podium-rank">
                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
              </div>

              <div className="podium-avatar">
                {t.username.charAt(0)}
              </div>

              <div className="podium-name">
                <strong>{t.username}</strong>
                <span>{t.country}</span>
              </div>

              <div className="podium-net rise-text">
                +${formatMoney(t.net)}
              </div>

              <div className="podium-stats">
                <div>
                  <span>Win</span>
                  <strong>{t.winRate}%</strong>
                </div>
                <div>
                  <span>Trades</span>
                  <strong>{t.trades}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============ TABLE ============ */}
      <div className="leaderboard-table">
        <div className="leaderboard-table-head">
          <span>Rank</span>
          <span>Trader</span>
          <span className="markets-align-right">
            Trades
          </span>
          <span className="markets-align-right">
            Win rate
          </span>
          <span className="markets-align-right">
            Net P/L
          </span>
        </div>

        {rest.map((t, i) => (
          <div
            className="leaderboard-table-row"
            key={t.username}
          >
            <span className="leaderboard-rank">
              {i + 4}
            </span>

            <div className="leaderboard-user">
              <div className="leaderboard-avatar">
                {t.username.charAt(0)}
              </div>
              <div>
                <strong>{t.username}</strong>
                <span>{t.country}</span>
              </div>
            </div>

            <span className="markets-align-right">
              {t.trades}
            </span>

            <span className="markets-align-right">
              {t.winRate}%
            </span>

            <span className="leaderboard-net rise-text">
              +${formatMoney(t.net)}
            </span>
          </div>
        ))}
      </div>

      <div className="info-panel">
        <div className="info-icon">i</div>

        <div>
          <strong>About this leaderboard</strong>

          <p>
            Rankings are based on simulated net
            profit for the selected period. All
            trades are on virtual funds — no real
            money is involved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;