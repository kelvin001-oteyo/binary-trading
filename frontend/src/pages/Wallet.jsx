import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Wallet() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await api.get("/wallet/");
      setWallet(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-loading">
          Loading wallet…
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <div>
          <span className="wallet-label">MY WALLET</span>
          <h1>Wallet</h1>
          <p>Manage your account balance for trading.</p>
        </div>

        <div className="demo-badge">USD ACCOUNT</div>
      </div>

      <div className="wallet-balance-card">
        <div>
          <span>Available Balance</span>

          <h2>
            {wallet?.currency || "USD"}{" "}
            {Number(wallet?.balance || 0).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h2>
        </div>

        <div className="wallet-balance-icon">$</div>
      </div>

      <div className="wallet-quick-actions">
        <button
          type="button"
          className="wallet-action-link"
          onClick={() =>
            navigate("/wallet/transactions")
          }
        >
          View transaction history
          <span className="deposit-arrow">→</span>
        </button>
      </div>

      {error && (
        <div className="wallet-error">{error}</div>
      )}

      <div className="wallet-content-grid">
        <section className="wallet-card">
          <div className="wallet-card-header">
            <div>
              <h2>Add funds</h2>
              <p>
                Top up your balance via card,
                mobile money or crypto. Funds
                appear instantly.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="wallet-deposit-button"
            onClick={() => navigate("/wallet/deposit")}
          >
            Deposit Funds
            <span className="deposit-arrow">→</span>
          </button>

          <div className="wallet-demo-notice">
            <strong>About your balance</strong>
            <p>
              Your balance represents real trading
              funds in USD. Deposits via card,
              mobile money or crypto are processed
              instantly.
            </p>
          </div>
        </section>

        <section className="wallet-card wallet-info-card">
          <h2>How your wallet works</h2>

          <div className="wallet-info-item">
            <div className="wallet-info-number">1</div>
            <div>
              <h3>Add funds</h3>
              <p>
                Top up via card, mobile money or
                crypto. Funds appear instantly.
              </p>
            </div>
          </div>

          <div className="wallet-info-item">
            <div className="wallet-info-number">2</div>
            <div>
              <h3>Place trades</h3>
              <p>
                Use your balance to open RISE or
                FALL positions on any market.
              </p>
            </div>
          </div>

          <div className="wallet-info-item">
            <div className="wallet-info-number">3</div>
            <div>
              <h3>Track results</h3>
              <p>
                Your balance updates automatically
                as trades settle.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Wallet;