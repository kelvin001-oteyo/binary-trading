// ============================================================
// FAKE AI ENGINE
// Generates realistic market analysis without calling any API.
// All output is simulated. For demonstration purposes only.
// ============================================================

const MARKETS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "BTC/USD",
  "ETH/USD",
  "XAU/USD",
  "SPX500",
  "NAS100",
];

const INDICATORS = [
  "RSI",
  "MACD",
  "MA-20",
  "MA-50",
  "Bollinger Bands",
  "Support/Resistance",
  "Volume",
  "Momentum",
  "Volatility",
];

const DIRECTION_PHRASES = {
  bullish: [
    "Momentum is trending upward with sustained volume.",
    "Price action is holding above key support levels.",
    "Short-term moving averages are crossing upward.",
    "Buyers are defending the current range.",
    "The trend structure remains constructive.",
  ],
  bearish: [
    "Selling pressure is building at the recent highs.",
    "Price has broken below a short-term support zone.",
    "Momentum is rolling over on the hourly chart.",
    "Lower highs are forming on the recent swings.",
    "The trend structure is weakening.",
  ],
  mixed: [
    "Price is consolidating within a narrow range.",
    "Conflicting signals between momentum and volume.",
    "Market is waiting for a catalyst to break out.",
    "Conditions are indecisive in the near term.",
  ],
};

const CONFIDENCE_LABELS = [
  { min: 75, label: "High" },
  { min: 60, label: "Moderate" },
  { min: 45, label: "Low" },
  { min: 0, label: "Very low" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractMarket(text) {
  const upper = text.toUpperCase();
  for (const m of MARKETS) {
    if (upper.includes(m)) return m;
  }
  // Fallback: extract anything that looks like XXX/YYY
  const match = upper.match(/\b[A-Z]{2,5}\/[A-Z]{2,5}\b/);
  return match ? match[0] : null;
}

function extractDirection(text) {
  const upper = text.toUpperCase();
  if (upper.includes("RISE") || upper.includes("UP")) return "RISE";
  if (upper.includes("FALL") || upper.includes("DOWN")) return "FALL";
  return null;
}

function generateWinPercent(bias = 0) {
  // Base 50, add random variance, clamp 25–88.
  const base = 50 + bias;
  const variance = randomInt(-22, 32);
  const raw = base + variance;
  return Math.max(25, Math.min(88, raw));
}

function confidenceFor(percent) {
  return (
    CONFIDENCE_LABELS.find((c) => percent >= c.min)?.label ||
    "Low"
  );
}

function biasFromMarket(market) {
  if (!market) return 0;
  // Deterministic-ish bias based on market so it feels grounded
  const seed = market
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return (seed % 20) - 10;
}

function verdictStyle(percent) {
  if (percent >= 70) return "strong-win";
  if (percent >= 55) return "moderate-win";
  if (percent >= 40) return "weak-win";
  return "low-win";
}

function directionSentence(percent) {
  if (percent >= 70) return pick(DIRECTION_PHRASES.bullish);
  if (percent >= 55) return pick(DIRECTION_PHRASES.bullish);
  if (percent >= 40) return pick(DIRECTION_PHRASES.mixed);
  return pick(DIRECTION_PHRASES.bearish);
}

function indicatorSentence() {
  const a = pick(INDICATORS);
  let b = pick(INDICATORS);
  while (b === a) b = pick(INDICATORS);
  const templates = [
    `${a} is currently neutral while ${b} confirms the bias.`,
    `${a} and ${b} are aligned on the near-term direction.`,
    `${a} is lagging; ${b} is the more reliable signal here.`,
    `${a} suggests consolidation; ${b} points to continuation.`,
    `Watch ${a} closely — ${b} will confirm or invalidate the setup.`,
  ];
  return pick(templates);
}

function riskSentence(percent) {
  if (percent >= 70) {
    return "Setup aligns with the prevailing trend. Still, no trade is risk-free — use a defined stake.";
  }
  if (percent >= 55) {
    return "Conditions are favourable but not decisive. Consider a smaller stake than usual.";
  }
  if (percent >= 40) {
    return "Conditions are mixed. This is a low-conviction setup — avoid oversizing.";
  }
  return "Signals are weak. Consider waiting for a clearer entry before committing funds.";
}

// -----------------------------------------------------------
// Scanner steps shown while "thinking"
// -----------------------------------------------------------

export function scanStepsFor(market) {
  const m = market || "market";
  return [
    `Establishing connection to ${m}…`,
    `Retrieving recent price action…`,
    `Computing ${pick(INDICATORS)}…`,
    `Analysing ${pick(INDICATORS)}…`,
    `Cross-checking ${pick(INDICATORS)}…`,
    `Running probabilistic model…`,
    `Generating verdict…`,
  ];
}

// -----------------------------------------------------------
// Main entry: given user text, produce an AI reply object
// -----------------------------------------------------------

export function analyse(userText) {
  const market = extractMarket(userText) || pick(MARKETS);
  const direction =
    extractDirection(userText) ||
    (Math.random() > 0.5 ? "RISE" : "FALL");

  const bias = biasFromMarket(market);
  const directionBias = direction === "RISE" ? 5 : -5;
  const percent = generateWinPercent(bias + directionBias);

  return {
    market,
    direction,
    percent,
    confidence: confidenceFor(percent),
    style: verdictStyle(percent),
    directionSentence: directionSentence(percent),
    indicatorSentence: indicatorSentence(),
    riskSentence: riskSentence(percent),
    disclaimer:
      "Simulated analysis. Not financial advice. Past patterns do not guarantee future outcomes.",
  };
}

// -----------------------------------------------------------
// Handle non-scan questions (what's trending, etc.)
// -----------------------------------------------------------

export function answerGeneric(userText) {
  const text = userText.toLowerCase();

  if (
    text.includes("trend") ||
    text.includes("moving") ||
    text.includes("hot")
  ) {
    const top = [...MARKETS].sort(() => 0.5 - Math.random()).slice(0, 3);
    return {
      type: "text",
      text: `Top movers right now: **${top.join(", ")}**. These are showing the highest intraday volatility. Would you like me to scan any of them?`,
    };
  }

  if (
    text.includes("rise") &&
    text.includes("fall")
  ) {
    return {
      type: "text",
      text: `**RISE** means you believe the price will be higher at expiry than your entry. **FALL** means lower. Your payout depends on the direction being correct — nothing else. Choose one direction per trade, set your stake, and wait for expiry.`,
    };
  }

  if (text.includes("help") || text.includes("what can")) {
    return {
      type: "text",
      text: `I can help you:\n\n• **Scan a market** — try "Analyze EUR/USD" or "Scan BTC/USD"\n• **Get a verdict** — I'll show win probability and reasoning\n• **Explain concepts** — ask me what RISE or FALL means\n• **Find opportunities** — ask "What's trending?"\n\nWhat would you like to do?`,
    };
  }

  // Fallback: treat as a scan request
  return { type: "scan" };
}

// -----------------------------------------------------------
// Public wrapper: given user text, return the full response
// -----------------------------------------------------------

export function getAiResponse(userText) {
  const generic = answerGeneric(userText);

  if (generic.type === "text") {
    return { type: "text", text: generic.text };
  }

  const analysis = analyse(userText);
  return {
    type: "scan",
    ...analysis,
    steps: scanStepsFor(analysis.market),
  };
}