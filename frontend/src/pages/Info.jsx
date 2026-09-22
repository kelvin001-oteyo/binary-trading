import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const TABS = [
  { id: "about", label: "About" },
  { id: "terms", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Policy" },
];

function Info() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") || "about";
  const [tab, setTab] = useState(initial);

  const changeTab = (id) => {
    setTab(id);
    setParams({ tab: id });
  };

  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-hero-inner">
          <Link to="/" className="info-back">
            ← Back to home
          </Link>

          <span className="info-eyebrow">
            INFORMATION
          </span>

          <h1>
            About, Terms &amp; Privacy
          </h1>

          <p>
            Everything you need to know about
            Binary Trading — who we are, how we
            operate, and how we handle your data.
          </p>

          <div className="info-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={
                  tab === t.id
                    ? "info-tab active"
                    : "info-tab"
                }
                onClick={() => changeTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="info-content">
        {tab === "about" && <AboutTab />}
        {tab === "terms" && <TermsTab />}
        {tab === "privacy" && <PrivacyTab />}
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <article className="info-article">
      <Section
        eyebrow="OUR STORY"
        title="A trading platform built for practice, not profit"
      >
        <p>
          Binary Trading was created for one
          reason: learning binary options is
          expensive if you do it wrong. Real
          brokers require real deposits, and a
          beginner's first hundred trades almost
          always end in losses. By the time you
          understand the mechanics, your account
          is empty.
        </p>
        <p>
          We built the opposite. A full trading
          platform — real interface, live
          simulated prices, real settlement
          logic — where every trade uses virtual
          funds. You learn the mechanics, test
          your strategy, feel the pressure of a
          countdown timer, and never risk a
          single real dollar.
        </p>
      </Section>

      <Section eyebrow="WHAT WE BELIEVE" title="Three principles">
        <div className="info-value-grid">
          <ValueCard
            icon="✓"
            title="Honest by default"
            text="We never pretend this is real money. Every page tells you exactly what's happening. No dark patterns, no upsells, no hidden fees."
          />
          <ValueCard
            icon="◈"
            title="Built to teach"
            text="Features exist because they help you learn — not because they increase our revenue. The AI assistant, trade analytics, and history pages all serve the trader."
          />
          <ValueCard
            icon="✦"
            title="Free forever"
            text="The core platform is free. No credit card, no trial period, no forced upgrade. Premium tools are optional."
          />
        </div>
      </Section>

      <Section eyebrow="WHO BUILT THIS" title="A solo developer project">
        <p>
          Binary Trading is a solo project,
          designed and coded by one developer
          with a background in full-stack web
          development. The goal was to build a
          platform that feels indistinguishable
          from a real brokerage — a portfolio
          piece that demonstrates what a modern
          trading interface can be.
        </p>
        <p>
          It's not a startup. There's no team,
          no investors, no roadmap sold to
          anyone. Just one person shipping
          features that traders actually use.
        </p>
      </Section>

      <Section eyebrow="CONTACT" title="Get in touch">
        <div className="info-contact-grid">
          <div className="info-contact-card">
            <strong>General</strong>
            <span>hello@binarytrading.example</span>
          </div>
          <div className="info-contact-card">
            <strong>Support</strong>
            <span>support@binarytrading.example</span>
          </div>
          <div className="info-contact-card">
            <strong>Press</strong>
            <span>press@binarytrading.example</span>
          </div>
        </div>
      </Section>
    </article>
  );
}

function TermsTab() {
  return (
    <article className="info-article">
      <p className="info-updated">
        Last updated: September 2026
      </p>

      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using Binary Trading
          (the "Platform"), you agree to be
          bound by these Terms of Service. If
          you do not agree, do not use the
          Platform.
        </p>
      </Section>

      <Section title="2. The simulated environment">
        <p>
          The Platform is a <strong>simulated
          trading environment</strong>. All
          balances, transactions, trades and
          market data are virtual and have no
          cash value. No real money is
          deposited, held, transferred or
          withdrawn at any point.
        </p>
        <p>
          You acknowledge that any "deposit" or
          "withdrawal" you initiate affects only
          a virtual balance and does not
          represent real financial activity.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <p>
          You must be at least 18 years old to
          use the Platform. By registering, you
          confirm that the information you
          provide is accurate and that you meet
          this age requirement.
        </p>
      </Section>

      <Section title="4. Account responsibilities">
        <p>
          You are responsible for maintaining
          the confidentiality of your login
          credentials and for all activity that
          occurs under your account. Notify us
          immediately if you suspect
          unauthorized access.
        </p>
      </Section>

      <Section title="5. Prohibited use">
        <p>You agree not to:</p>
        <ul className="info-list">
          <li>
            Use the Platform for any unlawful
            purpose
          </li>
          <li>
            Attempt to reverse-engineer, scrape,
            or interfere with the Platform
          </li>
          <li>
            Impersonate another user or
            misrepresent your identity
          </li>
          <li>
            Use automated tools to manipulate
            trades or the leaderboard
          </li>
          <li>
            Resell or sublicense access to the
            Platform
          </li>
        </ul>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          All content, code, design, and data on
          the Platform are owned by Binary
          Trading or its licensors and are
          protected by copyright and other
          intellectual property laws.
        </p>
      </Section>

      <Section title="7. Disclaimer of warranties">
        <p>
          The Platform is provided "as is"
          without warranties of any kind,
          express or implied. We do not warrant
          that the Platform will be
          uninterrupted or error-free, or that
          any data will be accurate.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by
          law, Binary Trading shall not be
          liable for any indirect, incidental,
          special, or consequential damages
          arising from your use of the Platform.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          We may suspend or terminate your
          account at any time, with or without
          notice, if we believe you have
          violated these Terms. You may delete
          your account at any time from your
          settings page.
        </p>
      </Section>

      <Section title="10. Changes to these terms">
        <p>
          We may update these Terms from time to
          time. Continued use of the Platform
          after changes take effect constitutes
          acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these Terms may be
          directed to{" "}
          <strong>legal@binarytrading.example</strong>.
        </p>
      </Section>
    </article>
  );
}

function PrivacyTab() {
  return (
    <article className="info-article">
      <p className="info-updated">
        Last updated: September 2026
      </p>

      <Section title="1. Overview">
        <p>
          This Privacy Policy explains what
          information Binary Trading collects,
          how we use it, and what rights you
          have over your data. We've kept it
          short and readable.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <ul className="info-list">
          <li>
            <strong>Account data:</strong>{" "}
            username, email address, phone
            number (optional), and hashed
            password
          </li>
          <li>
            <strong>Activity data:</strong>{" "}
            trades placed, wallet transactions,
            login timestamps
          </li>
          <li>
            <strong>Technical data:</strong>{" "}
            browser type, device, IP address,
            pages visited
          </li>
        </ul>
      </Section>

      <Section title="3. How we use your information">
        <ul className="info-list">
          <li>To provide and improve the Platform</li>
          <li>To display your trade history and stats</li>
          <li>To prevent fraud and abuse</li>
          <li>
            To communicate with you about
            account activity (only when necessary)
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell your
          data to third parties. Ever.
        </p>
      </Section>

      <Section title="4. Cookies and local storage">
        <p>
          We use browser local storage to keep
          you logged in and remember your
          preferences (such as your watchlist).
          No third-party tracking cookies are
          used for advertising.
        </p>
      </Section>

      <Section title="5. Data security">
        <p>
          Passwords are hashed with a strong
          one-way algorithm. All traffic between
          your browser and our servers is
          encrypted in transit using TLS. We do
          not store credit card numbers, bank
          details, or any payment credentials —
          because we don't process real payments.
        </p>
      </Section>

      <Section title="6. Third-party services">
        <p>
          We may use a small number of
          third-party services to operate the
          Platform (such as hosting providers).
          These providers access only the data
          necessary to perform their function
          and are bound by confidentiality
          obligations.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          You have the right to:
        </p>
        <ul className="info-list">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Export your trade history</li>
        </ul>
        <p>
          To exercise any of these rights,
          contact{" "}
          <strong>privacy@binarytrading.example</strong>.
        </p>
      </Section>

      <Section title="8. Data retention">
        <p>
          We retain your account data for as
          long as your account is active. When
          you delete your account, all personal
          data is removed within 30 days, except
          where we're required by law to retain
          certain records.
        </p>
      </Section>

      <Section title="9. Children's privacy">
        <p>
          The Platform is not intended for
          anyone under 18. We do not knowingly
          collect data from children.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We may update this policy from time to
          time. Significant changes will be
          announced on the Platform.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about privacy can be sent
          to{" "}
          <strong>privacy@binarytrading.example</strong>.
        </p>
      </Section>
    </article>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="info-section">
      {eyebrow && (
        <span className="info-section-eyebrow">
          {eyebrow}
        </span>
      )}
      {title && <h2>{title}</h2>}
      <div className="info-section-body">{children}</div>
    </section>
  );
}

function ValueCard({ icon, title, text }) {
  return (
    <div className="info-value-card">
      <div className="info-value-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default Info;