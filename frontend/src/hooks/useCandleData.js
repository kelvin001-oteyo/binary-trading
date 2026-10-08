import { useEffect, useRef, useState } from "react";

const DEFAULT_SEED = 60;

// Timeframe → tick interval in ms
export const TIMEFRAMES = {
  "1m": 1500,
  "5m": 3000,
  "15m": 5000,
  "1h": 8000,
};

function makeInitialCandles(basePrice, decimals, count, tickMs) {
  const candles = [];
  let price = basePrice;

  for (let i = 0; i < count; i += 1) {
    const open = price;
    const drift = (Math.random() - 0.5) * basePrice * 0.002;
    const close = open + drift;
    const high =
      Math.max(open, close) +
      Math.random() * basePrice * 0.0008;
    const low =
      Math.min(open, close) -
      Math.random() * basePrice * 0.0008;

    candles.push({
      time: Date.now() - (count - i) * tickMs,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
    });

    price = close;
  }

  return candles;
}

export function useCandleData(
  basePrice,
  decimals = 5,
  timeframe = "1m"
) {
  const tickMs = TIMEFRAMES[timeframe] || TIMEFRAMES["1m"];

  const [candles, setCandles] = useState(() =>
    makeInitialCandles(
      basePrice,
      decimals,
      DEFAULT_SEED,
      tickMs
    )
  );

  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [change, setChange] = useState(0);

  const basePriceRef = useRef(basePrice);

  useEffect(() => {
    basePriceRef.current = basePrice;
    setCandles(
      makeInitialCandles(
        basePrice,
        decimals,
        DEFAULT_SEED,
        tickMs
      )
    );
    setCurrentPrice(basePrice);
    setChange(0);
  }, [basePrice, decimals, tickMs]);

  useEffect(() => {
    const id = setInterval(() => {
      setCandles((current) => {
        if (current.length === 0) return current;

        const last = current[current.length - 1];
        const volatility = last.close * 0.0018;
        const delta =
          (Math.random() - 0.5) * volatility * 2;

        const nextClose = Math.max(
          0.0001,
          last.close + delta
        );

        const newCandle = {
          time: Date.now(),
          open: last.close,
          high: Number(
            Math.max(last.close, nextClose).toFixed(decimals)
          ),
          low: Number(
            Math.min(last.close, nextClose).toFixed(decimals)
          ),
          close: Number(nextClose.toFixed(decimals)),
        };

        setCurrentPrice(nextClose);

        const pct =
          ((nextClose - basePriceRef.current) /
            basePriceRef.current) *
          100;
        setChange(pct);

        const next = [...current, newCandle];

        return next.slice(-80);
      });
    }, tickMs);

    return () => clearInterval(id);
  }, [decimals, tickMs]);

  return { candles, currentPrice, change };
}

// Compute a simple moving average over candle closes.
// Returns an array the same length as candles, with null
// for the first (period - 1) entries.
export function computeMA(candles, period = 20) {
  if (!candles || candles.length === 0) return [];

  const closes = candles.map((c) => c.close);
  const result = new Array(closes.length).fill(null);

  let sum = 0;

  for (let i = 0; i < closes.length; i += 1) {
    sum += closes[i];

    if (i >= period) {
      sum -= closes[i - period];
    }

    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }

  return result;
}