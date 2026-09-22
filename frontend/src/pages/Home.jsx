import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import heroBg from "../assets/hero-bg.jpg";
import ctaBg from "../assets/cta-bg.jpg";

const TICKER_MARKETS = [
  { symbol: "EUR/USD", price: 1.085, decimals: 5 },
  { symbol: "GBP/USD", price: 1.2642, decimals: 5 },
  { symbol: "USD/JPY", price: 149.82, decimals: 3 },
  { symbol: "BTC/USD", price: 67432.18, decimals: 2 },
  { symbol: "ETH/USD", price: 3512.44, decimals: 2 },
  { symbol: "XAU/USD", price: 2341.6, decimals: 2 },
  { symbol: "SPX500", price: 5234.18, decimals: 2 },
  { symbol: "NAS100", price: 18234.55, decimals: 2 },
];

const PRICING = [
  {
    name: "Starter",
    monthly: 0,
    annual: 0,
    tagline: "For getting started",
    features: [
      "Access to 3 markets",
      "$1,000 starting balance",
      "Basic trade history",
      "Community support",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 19,
    annual: 15,
    tagline: "For active traders",
    features: [
      "All 8+ markets",
      "$10,000 starting balance",
      "AI Assistant access",
      "Advanced trade history",
      "Priority email support",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    name: "Elite",
    monthly: 49,
    annual: 39,
    tagline: "For serious learners",
    features: [
      "Everything in Pro",
      "Unlimited virtual balance",
      "Custom AI tuning",
      "Export trade data",
      "Dedicated support",
    ],
    cta: "Choose Elite",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Is this real money?",
    a: "No. Every trade on this platform uses virtual funds. No real money is deposited, traded, or withdrawn at any point. The platform exists for practice and education.",
  },
  {
    q: "Do I need to verify my identity?",
    a: "No. Signup takes seconds — a username and password is all we need. There's no KYC process because there's no real money involved.",
  },
  {
    q: "How do I get virtual funds?",
    a: "Every account starts with a balance. You can add more through the wallet page using any of the simulated payment methods.",
  },
  {
    q: "What markets can I trade?",
    a: "Forex, crypto, indices and commodities. We currently simulate 8 instruments, with more added regularly.",
  },
  {
    q: "How are trades settled?",
    a: "When a trade's duration expires, the system compares your entry price to the exit price. If you chose RISE and price went up, you win. If you chose FALL and price went down, you win.",
  },
  {
    q: "Can I withdraw my balance?",
    a: "No. Your balance is virtual and has no cash value. It cannot be converted to real money or transferred out.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your account information is encrypted in transit and stored securely. We never share data with third parties.",
  },
  {
    q: "What is the AI assistant?",
    a: "A built-in tool that reads simulated market data and offers analysis in plain English. Use it as a second opinion on price direction.",
  },
  {
    q: "Can I reset my account?",
    a: "Yes. Contact support or reset via your profile page to start fresh with a new balance and clean trade history.",
  },
  {
    q: "Do you offer refunds on paid plans?",
    a: "Since this is a simulation platform with no real funds, plans are illustrative. In a real product, we'd offer a 14-day money-back guarantee.",
  },
];

const TESTIMONIALS = [
  {
    name: "Amara N.",
    role: "Forex trader · Nairobi",
    initials: "AN",
    quote:
      "I used this to learn binary options mechanics before touching a real account. The simulated markets behave exactly like the real ones — same moves, same timing, same adrenaline.",
  },
  {
    name: "Marcus L.",
    role: "Strategy tester · London",
    initials: "ML",
    quote:
      "The AI assistant is a game-changer. I can ask it to explain a chart pattern and it actually breaks down the price action in plain English. Worth it just for that.",
  },
  {
    name: "Priya S.",
    role: "Beginner trader · Mumbai",
    initials: "PS",
    quote:
      "I tried three other platforms before this one. This is the only one where I didn't feel like I was being sold something. Everything is honest and the demo account never runs out.",
  },
];

const STATS = [
  { value: "8+", label: "Markets" },
  { value: "$2.4M", label: "Simulated volume" },
  { value: "12K+", label: "Trades placed" },
  { value: "99.9%", label: "Uptime" },
];

const COMPARISON = [
  { label: "Real money at risk", ours: "Never", theirs: "Always" },
  { label: "Signup time", ours: "30 seconds", theirs: "1–3 days" },
  { label: "Identity verification", ours: "Not required", theirs: "Required" },
  { label: "Minimum deposit", ours: "$0", theirs: "$100+" },
  { label: "Practice mode", ours: "Full platform", theirs: "Limited demo" },
  { label: "AI assistant", ours: "Included", theirs: "Rarely offered" },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function Reveal({ children, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [heroPrice, setHeroPrice] = useState(1.085);
  const [heroChange, setHeroChange] = useState(0.46);
  const [pricingCycle, setPricingCycle] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [tickerPrices, setTickerPrices] = useState(() =>
    TICKER_MARKETS.map((m) => ({
      ...m,
      flash: null,
      change: (Math.random() - 0.4) * 1.2,
    }))
  );

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("user") || "null"
    );
    setUser(stored);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () =>
      window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerPrices((current) =>
        current.map((item) => {
          const volatility = item.price * 0.001;
          const delta =
            (Math.random() - 0.5) * volatility * 2;
          const next = Math.max(0.0001, item.price + delta);

          return {
            ...item,
            price: next,
            change: item.change + (delta / item.price) * 100,
            flash: delta >= 0 ? "up" : "down",
          };
        })
      );

      setHeroPrice((current) => {
        const delta = (Math.random() - 0.5) * 0.0008;
        const next = current + delta;
        setHeroChange((c) => c + delta * 100);
        return next;
      });
    }, 1500);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerPrices((current) =>
        current.map((item) =>
          item.flash ? { ...item, flash: null } : item
        )
      );
    }, 400);

    return () => clearInterval(id);
  }, []);

  const handlePrimaryClick = () => {
    navigate(user ? "/dashboard" : "/register");
  };

  const handleEmailSave = (e) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    try {
      const list = JSON.parse(
        localStorage.getItem("newsletter_emails") || "[]"
      );
      if (!list.includes(email)) list.push(email);
      localStorage.setItem(
        "newsletter_emails",
        JSON.stringify(list)
      );
    } catch {
      // ignore
    }

    setEmailSaved(true);
    setEmail("");
  };

  const heroDecimals = 5;

  const heroFormatted = useMemo(
    () =>
      Number(heroPrice).toLocaleString("en-US", {
        minimumFractionDigits: heroDecimals,
        maximumFractionDigits: heroDecimals,
      }),
    [heroPrice]
  );

  return (
    <div className="home-page">
      {/* ============ NAVBAR ============ */}
      <header
        className={
          scrolled
            ? "home-navbar scrolled"
            : "home-navbar"
        }
      >
        <div className="home-navbar-inner">
          <Link to="/" className="home-brand">
            <span className="home-brand-mark">B</span>
            <span className="home-brand-text">
              Binary Trading
            </span>
          </Link>

          <nav className="home-nav-links">
            <Link to="/markets" className="home-nav-link">
              Markets
            </Link>
            <a
              href="#features"
              className="home-nav-link"
            >
              Features
            </a>
            <a href="#pricing" className="home-nav-link">
              Pricing
            </a>
            <a href="#faq" className="home-nav-link">
              FAQ
            </a>

            {user && (
              <>
                <Link
                  to="/wallet"
                  className="home-nav-link"
                >
                  Wallet
                </Link>
                <Link
                  to="/ai"
                  className="home-nav-link"
                >
                  AI
                </Link>
              </>
            )}

            {user ? (
              <Link
                to="/dashboard"
                className="home-nav-link"
              >
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="home-nav-link">
                Login
              </Link>
            )}

            <button
              type="button"
              className="home-nav-cta"
              onClick={handlePrimaryClick}
            >
              {user ? "Open Dashboard" : "Get Started"}
            </button>
          </nav>
        </div>
      </header>

      {/* ============ TICKER BAND ============ */}
      <div className="home-ticker">
        <div className="home-ticker-track">
          {[...tickerPrices, ...tickerPrices].map(
            (item, i) => (
              <div
                className="home-ticker-item"
                key={`${item.symbol}-${i}`}
              >
                <span className="home-ticker-symbol">
                  {item.symbol}
                </span>

                <span
                  className={
                    item.flash
                      ? `home-ticker-price flash-${item.flash}`
                      : "home-ticker-price"
                  }
                >
                  {Number(item.price).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits:
                        item.decimals,
                      maximumFractionDigits:
                        item.decimals,
                    }
                  )}
                </span>

                <span
                  className={
                    item.change >= 0
                      ? "rise-text"
                      : "fall-text"
                  }
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change.toFixed(2)}%
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section
        className="home-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(11,18,32,0.82) 0%, rgba(11,18,32,0.94) 100%), url(${heroBg})`,
        }}
      >
        <div className="home-hero-content">
          <span className="home-eyebrow">
            BINARY TRADING SIMULATOR
          </span>

          <h1>
            Trade binary options.
            <br />
            <span className="home-hero-accent">
              Risk nothing.
            </span>
          </h1>

          <p>
            Practice on live-simulated markets with
            virtual funds. Real interface, real
            mechanics, zero real money — ever.
          </p>

          <div className="home-hero-actions">
            <button
              type="button"
              className="home-primary-button"
              onClick={handlePrimaryClick}
            >
              {user
                ? "Open Dashboard"
                : "Create Free Account"}
              <span className="home-button-arrow">→</span>
            </button>

            <Link
              to="/markets"
              className="home-secondary-button"
            >
              Browse Markets
            </Link>
          </div>

          <div className="home-hero-note">
            <span className="status-dot"></span>
            No deposits · No withdrawals · No risk
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-preview-card">
            <div className="home-preview-top">
              <div>
                <span className="home-preview-symbol">
                  EUR/USD
                </span>
                <span className="home-preview-badge">
                  LIVE
                </span>
              </div>
              <span className="home-preview-time">
                {new Date().toISOString().slice(11, 19)}
              </span>
            </div>

            <div className="home-preview-price">
              {heroFormatted}
            </div>

            <div
              className={
                heroChange >= 0
                  ? "home-preview-change rise-text"
                  : "home-preview-change fall-text"
              }
            >
              {heroChange >= 0 ? "+" : ""}
              {heroChange.toFixed(2)}% today
            </div>

            <div className="home-preview-chart">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="home-preview-actions">
              <div className="home-preview-rise">
                ↑ RISE
              </div>
              <div className="home-preview-fall">
                ↓ FALL
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="home-trust">
        <div className="home-trust-inner">
          <div className="home-trust-item">
            <CheckIcon /> No real money
          </div>
          <div className="home-trust-item">
            <CheckIcon /> No credit card
          </div>
          <div className="home-trust-item">
            <CheckIcon /> Instant setup
          </div>
          <div className="home-trust-item">
            <CheckIcon /> 8+ markets
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <Reveal>
        <section className="home-stats">
          <div className="home-stats-grid">
            {STATS.map((stat) => (
              <div
                className="home-stat"
                key={stat.label}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ============ FEATURES ============ */}
      <section
        className="home-features"
        id="features"
      >
        <Reveal>
          <div className="home-section-heading">
            <span className="home-eyebrow">
              WHY BINARY TRADING
            </span>
            <h2>Built for practice that feels real</h2>
            <p>
              Everything a real trading platform
              has, minus the risk. Learn the
              mechanics before you ever touch real
              capital.
            </p>
          </div>
        </Reveal>

        <div className="home-feature-grid">
          <FeatureCard
            icon={<WalletIcon />}
            title="Virtual Balance"
            text="Start with a fully-funded demo wallet. Place trades with virtual capital and track performance."
          />

          <FeatureCard
            icon={<ChartIcon />}
            title="Live Markets"
            text="Watch simulated prices move in real time across forex, crypto, indices and commodities."
          />

          <FeatureCard
            icon={<SparkIcon />}
            title="AI Assistant"
            text="Ask the built-in assistant to help you interpret price action and market direction."
          />

          <FeatureCard
            icon={<HistoryIcon />}
            title="Trade History"
            text="Every trade is logged with entry, exit, duration, result and simulated profit or loss."
          />

          <FeatureCard
            icon={<BoltIcon />}
            title="Instant Execution"
            text="Trades settle on expiry without delay. No setup, no commissions, no hidden fees."
          />

          <FeatureCard
            icon={<ShieldIcon />}
            title="Zero Risk"
            text="The entire platform runs on virtual funds. Experiment freely without losing anything."
          />
        </div>
      </section>

      {/* ============ COMPARISON ============ */}
      <Reveal>
        <section className="home-compare">
          <div className="home-section-heading">
            <span className="home-eyebrow">
              COMPARISON
            </span>
            <h2>
              Binary Trading vs. a traditional broker
            </h2>
            <p>
              What you get here that you won't get
              with a real brokerage account.
            </p>
          </div>

          <div className="home-compare-table">
            <div className="home-compare-head">
              <span></span>
              <span className="home-compare-ours">
                Binary Trading
              </span>
              <span className="home-compare-theirs">
                Traditional broker
              </span>
            </div>

            {COMPARISON.map((row) => (
              <div
                className="home-compare-row"
                key={row.label}
              >
                <span className="home-compare-label">
                  {row.label}
                </span>
                <span className="home-compare-value ours">
                  <CheckIcon /> {row.ours}
                </span>
                <span className="home-compare-value theirs">
                  {row.theirs}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ============ HOW IT WORKS ============ */}
      <section className="home-how" id="how">
        <Reveal>
          <div className="home-section-heading">
            <span className="home-eyebrow">
              HOW IT WORKS
            </span>
            <h2>Start in under a minute</h2>
            <p>
              Three steps from sign-up to your
              first simulated trade.
            </p>
          </div>
        </Reveal>

        <div className="home-how-grid">
          <div className="home-how-step">
            <div className="home-how-number">1</div>
            <h3>Create account</h3>
            <p>
              Sign up with any username and
              password. No email verification, no
              credit card.
            </p>
          </div>

          <div className="home-how-step">
            <div className="home-how-number">2</div>
            <h3>Pick a market</h3>
            <p>
              Browse live-simulated instruments
              and choose one to trade.
            </p>
          </div>

          <div className="home-how-step">
            <div className="home-how-number">3</div>
            <h3>Place a trade</h3>
            <p>
              Choose RISE or FALL, set your stake
              and duration, and watch it settle.
            </p>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <Reveal>
        <section className="home-testimonials">
          <div className="home-section-heading">
            <span className="home-eyebrow">
              TESTIMONIALS
            </span>
            <h2>Trusted by traders worldwide</h2>
            <p>
              What people using the platform have
              to say.
            </p>
          </div>

          <div className="home-testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <div
                className="home-testimonial"
                key={t.name}
              >
                <div className="home-testimonial-stars">
                  ★★★★★
                </div>

                <p className="home-testimonial-quote">
                  "{t.quote}"
                </p>

                <div className="home-testimonial-author">
                  <div className="home-testimonial-avatar">
                    {t.initials}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ============ PRICING ============ */}
      <section
        className="home-pricing"
        id="pricing"
      >
        <Reveal>
          <div className="home-section-heading">
            <span className="home-eyebrow">
              PRICING
            </span>
            <h2>Simple plans. No surprises.</h2>
            <p>
              Start free forever. Upgrade for more
              markets and tools.
            </p>

            <div className="home-pricing-toggle">
              <button
                type="button"
                className={
                  pricingCycle === "monthly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPricingCycle("monthly")
                }
              >
                Monthly
              </button>
              <button
                type="button"
                className={
                  pricingCycle === "annual"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPricingCycle("annual")
                }
              >
                Annual
                <span className="home-pricing-save">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="home-pricing-grid">
          {PRICING.map((tier) => {
            const price =
              pricingCycle === "monthly"
                ? tier.monthly
                : tier.annual;

            return (
              <div
                className={
                  tier.highlight
                    ? "home-pricing-card highlight"
                    : "home-pricing-card"
                }
                key={tier.name}
              >
                {tier.highlight && (
                  <span className="home-pricing-badge">
                    MOST POPULAR
                  </span>
                )}

                <h3>{tier.name}</h3>
                <p className="home-pricing-tagline">
                  {tier.tagline}
                </p>

                <div className="home-pricing-price">
                  <span className="home-pricing-currency">
                    $
                  </span>
                  <strong>{price}</strong>
                  <span className="home-pricing-period">
                    {price === 0
                      ? " forever"
                      : "/mo"}
                  </span>
                </div>

                {pricingCycle === "annual" &&
                  price > 0 && (
                    <p className="home-pricing-annual-note">
                      Billed annually
                    </p>
                  )}

                <ul className="home-pricing-features">
                  {tier.features.map((f) => (
                    <li key={f}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={
                    tier.highlight
                      ? "home-pricing-cta highlight"
                      : "home-pricing-cta"
                  }
                  onClick={handlePrimaryClick}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <Reveal>
        <section className="home-faq" id="faq">
          <div className="home-section-heading">
            <span className="home-eyebrow">FAQ</span>
            <h2>Questions, answered</h2>
            <p>
              Everything you might want to know
              before signing up.
            </p>
          </div>

          <div className="home-faq-list">
            {FAQS.map((item, i) => (
              <div
                className={
                  openFaq === i
                    ? "home-faq-item open"
                    : "home-faq-item"
                }
                key={item.q}
              >
                <button
                  type="button"
                  className="home-faq-trigger"
                  onClick={() =>
                    setOpenFaq(openFaq === i ? -1 : i)
                  }
                >
                  <span>{item.q}</span>
                  <span className="home-faq-chevron">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>

                {openFaq === i && (
                  <div className="home-faq-answer">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ============ EMAIL CAPTURE ============ */}
      <Reveal>
        <section className="home-newsletter">
          <div className="home-newsletter-inner">
            <div>
              <h3>Get notified when we launch new markets</h3>
              <p>
                Join the list. We'll send you an
                email when new instruments go live.
              </p>
            </div>

            {emailSaved ? (
              <div className="home-newsletter-success">
                ✓ You're on the list
              </div>
            ) : (
              <form
                className="home-newsletter-form"
                onSubmit={handleEmailSave}
              >
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
                <button type="submit">
                  Notify me
                </button>
              </form>
            )}
          </div>
        </section>
      </Reveal>

      {/* ============ CTA ============ */}
      <section
        className="home-cta"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(37,99,235,0.88), rgba(124,58,237,0.88)), url(${ctaBg})`,
        }}
      >
        <div className="home-cta-inner">
          <div>
            <h2>Ready to start trading?</h2>
            <p>
              Set up your free account in seconds.
              No credit card, no real money, no
              commitment.
            </p>
          </div>

          <button
            type="button"
            className="home-cta-button"
            onClick={handlePrimaryClick}
          >
            {user
              ? "Go to Dashboard"
              : "Create Free Account"}
            <span className="home-button-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <Link to="/" className="home-brand">
              <span className="home-brand-mark">B</span>
              <span className="home-brand-text">
                Binary Trading
              </span>
            </Link>
            <p>
              A simulated trading platform for
              practicing binary options strategy
              without risk.
            </p>
          </div>

          <div className="home-footer-col">
            <h4>Product</h4>
            <Link to="/markets">Markets</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/wallet">Wallet</Link>
            <Link to="/trades">Trades</Link>
            <Link to="/ai">AI Assistant</Link>
          </div>

          <div className="home-footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
          </div>

          <div className="home-footer-col">
            <h4>Resources</h4>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>
            © {new Date().getFullYear()} Binary Trading
          </span>

          <div className="home-footer-legal">
            <Link to="/info?tab=terms">Terms</Link>
            <Link to="/info?tab=privacy">Privacy</Link>
            <Link to="/info">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   ICONS
   ============================================================ */

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.8L20 11l-5.8 1.9L12 19l-1.9-6.1L4 11l6.1-2.2Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="home-feature-card">
      <div className="home-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default Home;