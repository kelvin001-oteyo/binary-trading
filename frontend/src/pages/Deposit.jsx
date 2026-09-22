import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000, 25000];

const METHODS = [
  {
    id: "mobile",
    label: "Mobile Money",
    sub: "M-Pesa · Airtel · T-Kash",
    icon: "◈",
  },
  {
    id: "card",
    label: "Card",
    sub: "Visa · Mastercard · Amex",
    icon: "▭",
  },
  {
    id: "crypto",
    label: "Crypto",
    sub: "BTC · ETH · USDT",
    icon: "◆",
  },
];

function Deposit() {
  const navigate = useNavigate();

  // Single-screen flow: form → processing → success
  const [view, setView] = useState("form");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile");
  const [phone, setPhone] = useState("");
  const [showMoreMethods, setShowMoreMethods] =
    useState(false);

  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const numericAmount = Number(amount || 0);

  const formattedAmount = useMemo(
    () =>
      numericAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [numericAmount]
  );

  const phoneIsValid = /^0\d{9}$/.test(
    phone.replace(/\s/g, "")
  );

  const cardIsValid =
    card.number.replace(/\s/g, "").length >= 15 &&
    card.name.trim().length >= 2 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3;

  const canSubmit = useMemo(() => {
    if (numericAmount <= 0 || numericAmount > 1000000) {
      return false;
    }

    if (method === "mobile") return phoneIsValid;
    if (method === "card") return cardIsValid;
    if (method === "crypto") return true;

    return false;
  }, [
    numericAmount,
    method,
    phoneIsValid,
    cardIsValid,
  ]);

  const handlePhoneChange = (e) => {
    const digits = e.target.value
      .replace(/\D/g, "")
      .slice(0, 10);
    setPhone(digits);
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    let next = value;

    if (name === "number") {
      next = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }

    if (name === "expiry") {
      next = value
        .replace(/\D/g, "")
        .slice(0, 4)
        .replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }

    if (name === "cvv") {
      next = value.replace(/\D/g, "").slice(0, 4);
    }

    setCard({ ...card, [name]: next });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      if (numericAmount <= 0) {
        setError("Enter a deposit amount.");
      } else if (method === "mobile" && !phoneIsValid) {
        setError(
          "Enter a valid 10-digit phone number starting with 0."
        );
      } else if (method === "card" && !cardIsValid) {
        setError("Complete all card fields to continue.");
      }
      return;
    }

    setError("");
    setView("processing");

    // Simulated gateway delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    try {
      const response = await api.post(
        "/wallet/demo-deposit/",
        { amount: numericAmount }
      );

      setReceipt({
        amount: Number(response.data.amount),
        balanceBefore: Number(response.data.balance_before),
        balanceAfter: Number(response.data.balance_after),
        currency: response.data.currency || "USD",
        method,
        reference:
          "TXN-" +
          Date.now().toString(36).toUpperCase().slice(-8),
      });

      setView("success");

      setTimeout(() => navigate("/wallet"), 2600);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Payment failed. Please try again."
      );
      setView("form");
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(String(value));
  };

  return (
    <div className="deposit-page">
      <div className="deposit-shell">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/wallet")}
        >
          ← Back to wallet
        </button>

        {error && (
          <div className="deposit-error">{error}</div>
        )}

        {/* ============ FORM ============ */}
        {view === "form" && (
          <form
            className="deposit-card"
            onSubmit={handleSubmit}
          >
            <header className="deposit-card-header">
              <span className="page-eyebrow">
                DEPOSIT
              </span>
              <h2>Add money to your wallet</h2>
              <p>
                Funds appear in your balance
                immediately.
              </p>
            </header>

            {/* --- Amount --- */}
            <label className="deposit-label">
              Amount (USD)
            </label>

            <div className="deposit-amount-input">
              <span>$</span>
              <input
                type="number"
                min="1"
                max="1000000"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="deposit-quick">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    Number(amount) === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleQuickAmount(value)
                  }
                >
                  ${value.toLocaleString()}
                </button>
              ))}
            </div>

            {/* --- Method toggle --- */}
            <div className="deposit-method-toggle">
              <button
                type="button"
                className={
                  method === "mobile"
                    ? "deposit-method-pill active"
                    : "deposit-method-pill"
                }
                onClick={() => {
                  setMethod("mobile");
                  setShowMoreMethods(false);
                }}
              >
                Mobile Money
              </button>
              <button
                type="button"
                className={
                  method === "card"
                    ? "deposit-method-pill active"
                    : "deposit-method-pill"
                }
                onClick={() => {
                  setMethod("card");
                  setShowMoreMethods(false);
                }}
              >
                Card
              </button>
              <button
                type="button"
                className={
                  method === "crypto"
                    ? "deposit-method-pill active"
                    : "deposit-method-pill"
                }
                onClick={() => {
                  setMethod("crypto");
                  setShowMoreMethods(false);
                }}
              >
                Crypto
              </button>
            </div>

            {/* --- Method-specific fields --- */}
            {method === "mobile" && (
              <>
                <label className="deposit-label">
                  Phone number
                </label>
                <input
                  className="deposit-input"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                />

                <p className="deposit-note">
                  A payment prompt will appear on
                  your phone. Enter your PIN to
                  confirm.
                </p>
              </>
            )}

            {method === "card" && (
              <>
                <label className="deposit-label">
                  Card number
                </label>
                <input
                  className="deposit-input"
                  name="number"
                  inputMode="numeric"
                  value={card.number}
                  onChange={handleCardChange}
                  placeholder="1234 5678 9012 3456"
                />

                <label className="deposit-label">
                  Name on card
                </label>
                <input
                  className="deposit-input"
                  name="name"
                  value={card.name}
                  onChange={handleCardChange}
                  placeholder="JOHN DOE"
                />

                <div className="deposit-row">
                  <div>
                    <label className="deposit-label">
                      Expiry
                    </label>
                    <input
                      className="deposit-input"
                      name="expiry"
                      inputMode="numeric"
                      value={card.expiry}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <label className="deposit-label">
                      CVV
                    </label>
                    <input
                      className="deposit-input"
                      name="cvv"
                      inputMode="numeric"
                      value={card.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                    />
                  </div>
                </div>
              </>
            )}

            {method === "crypto" && (
              <>
                <label className="deposit-label">
                  Wallet address
                </label>
                <input
                  className="deposit-input"
                  value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                  readOnly
                />

                <p className="deposit-note">
                  Send the exact amount to this
                  address. Simulated network — no
                  real transfer occurs.
                </p>
              </>
            )}

            {/* --- Summary --- */}
            {numericAmount > 0 && (
              <div className="deposit-summary-box">
                <div>
                  <span>Amount</span>
                  <strong>${formattedAmount}</strong>
                </div>
                <div>
                  <span>Fee</span>
                  <strong>$0.00</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>${formattedAmount}</strong>
                </div>
              </div>
            )}

            {/* --- Submit --- */}
            <button
              type="submit"
              className="deposit-primary deposit-primary-large"
              disabled={!canSubmit}
            >
              {numericAmount > 0
                ? `Deposit $${formattedAmount}`
                : "Deposit"}
              <span className="deposit-arrow">→</span>
            </button>

            <p className="deposit-note deposit-note-center">
              By continuing you agree this is a
              simulated environment and no real
              money is charged.
            </p>
          </form>
        )}

        {/* ============ PROCESSING ============ */}
        {view === "processing" && (
          <div className="deposit-card deposit-processing">
            <div className="deposit-spinner" />
            <h2>
              {method === "mobile"
                ? "Sending prompt to your phone…"
                : "Processing payment…"}
            </h2>
            <p>
              Do not close this window. This
              usually takes a few seconds.
            </p>
          </div>
        )}

        {/* ============ SUCCESS ============ */}
        {view === "success" && receipt && (
          <div className="deposit-card deposit-success">
            <div className="deposit-success-mark">✓</div>
            <h2>Deposit successful</h2>
            <p>
              ${receipt.amount.toLocaleString()} has
              been added to your wallet.
            </p>

            <div className="deposit-summary-box">
              <div>
                <span>Reference</span>
                <strong>{receipt.reference}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>
                  {receipt.method === "card"
                    ? "Card"
                    : receipt.method === "mobile"
                    ? "Mobile money"
                    : "Crypto"}
                </strong>
              </div>
              <div>
                <span>New balance</span>
                <strong>
                  $
                  {receipt.balanceAfter.toLocaleString()}
                </strong>
              </div>
            </div>

            <p className="deposit-note deposit-note-center">
              Redirecting to your wallet…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Deposit;