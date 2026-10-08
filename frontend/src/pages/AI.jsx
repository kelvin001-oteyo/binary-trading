import { useEffect, useRef, useState } from "react";
import { getAiResponse } from "../services/fakeAi";

import "./AI.css";

const QUICK_ACTIONS = [
  "Analyze EUR/USD",
  "Scan BTC/USD",
  "What's trending?",
  "Explain RISE vs FALL",
];

const STORAGE_KEY = "ai_chat_history";

function now() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Message({ role, children }) {
  return (
    <div className={`ai-msg ai-msg-${role}`}>
      <div className="ai-msg-avatar">
        {role === "user" ? "You" : "AI"}
      </div>
      <div className="ai-msg-body">{children}</div>
    </div>
  );
}

function ScanBubble({ steps, onDone }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= steps.length) {
      const timer = setTimeout(onDone, 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setVisible((v) => v + 1),
      350
    );
    return () => clearTimeout(timer);
  }, [visible, steps.length, onDone]);

  return (
    <div className="ai-scan">
      {steps.slice(0, visible).map((step, i) => (
        <div className="ai-scan-step" key={i}>
          <span className="ai-scan-dot" />
          <span>{step}</span>
        </div>
      ))}
      {visible < steps.length && (
        <div className="ai-scan-typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}

function Verdict({ data }) {
  const barWidth = `${data.percent}%`;

  return (
    <div className={`ai-verdict ${data.style}`}>
      <div className="ai-verdict-top">
        <span className="ai-verdict-percent">
          {data.percent}%
        </span>
        <span className="ai-verdict-label">WIN</span>
      </div>

      <div className="ai-verdict-bar">
        <div
          className="ai-verdict-bar-fill"
          style={{ width: barWidth }}
        />
      </div>

      <div className="ai-verdict-meta">
        <div>
          <span>Market</span>
          <strong>{data.market}</strong>
        </div>
        <div>
          <span>Direction</span>
          <strong>{data.direction}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{data.confidence}</strong>
        </div>
      </div>

      <div className="ai-verdict-body">
        <p>{data.directionSentence}</p>
        <p>{data.indicatorSentence}</p>
        <p className="ai-verdict-risk">{data.riskSentence}</p>
      </div>

      <div className="ai-verdict-disclaimer">
        ⚠ {data.disclaimer}
      </div>
    </div>
  );
}

function AI() {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      /* ignore */
    }
    return [
      {
        id: 1,
        role: "ai",
        kind: "text",
        text: "Hi! I'm your market assistant. Ask me to scan any market, or tap a quick action below.",
        time: now(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-40))
      );
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const pushMessage = (msg) => {
    setMessages((current) => [...current, msg]);
  };

  const handleSend = (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || thinking) return;

    setInput("");

    pushMessage({
      id: Date.now(),
      role: "user",
      kind: "text",
      text,
      time: now(),
    });

    setThinking(true);

    const response = getAiResponse(text);

    if (response.type === "text") {
      setTimeout(() => {
        pushMessage({
          id: Date.now() + 1,
          role: "ai",
          kind: "text",
          text: response.text,
          time: now(),
        });
        setThinking(false);
      }, 900);
      return;
    }

    // Scan flow
    const scanId = Date.now() + 2;

    pushMessage({
      id: scanId,
      role: "ai",
      kind: "scan",
      steps: response.steps,
      time: now(),
    });

    // After scan completes, push verdict
    const totalTime = response.steps.length * 350 + 500;

    setTimeout(() => {
      pushMessage({
        id: scanId + 1,
        role: "ai",
        kind: "verdict",
        data: response,
        time: now(),
      });
      setThinking(false);
    }, totalTime);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "ai",
        kind: "text",
        text: "Chat cleared. Ask me to scan a market, or tap a quick action below.",
        time: now(),
      },
    ]);
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <span className="page-eyebrow">
            AI ASSISTANT
          </span>
          <h1>Market Scanner</h1>
          <p>
            Simulated AI that scans markets and
            estimates win probability.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={clearChat}
        >
          Clear chat
        </button>
      </div>

      <div className="ai-chat-shell">
        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.map((m) => (
            <Message key={m.id} role={m.role}>
              {m.kind === "text" && (
                <div className="ai-text">
                  {m.text.split("\n").map((line, i) => (
                    <p key={i}>
                      {line.split("**").map((chunk, j) =>
                        j % 2 === 1 ? (
                          <strong key={j}>{chunk}</strong>
                        ) : (
                          <span key={j}>{chunk}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
              )}

              {m.kind === "scan" && (
                <ScanBubble
                  steps={m.steps}
                  onDone={() => {}}
                />
              )}

              {m.kind === "verdict" && (
                <Verdict data={m.data} />
              )}
            </Message>
          ))}

          {thinking && (
            <div className="ai-thinking">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        <div className="ai-quick-actions">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="ai-quick-button"
              onClick={() => handleSend(q)}
              disabled={thinking}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="ai-chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me to scan a market, or ask a question…"
            rows={1}
            disabled={thinking}
          />
          <button
            type="button"
            className="ai-send-button"
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default AI;