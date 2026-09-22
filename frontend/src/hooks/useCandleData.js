import { useEffect, useRef, useState } from "react";

const DEFAULT_SEED = 60;
const TICK_MS = 1500;

function makeInitialCandles(basePrice, decimals, count) {
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
      time: Date.now() - (count - i) * TICK_MS,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
    });

    price = close;
  }

  return candles;
}

export function useCandleData(basePrice, decimals = 5) {
  const [candles, setCandles] = useState(() =>
    makeInitialCandles(basePrice, decimals, DEFAULT_SEED)
  );

  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [change, setChange] = useState(0);

  const basePriceRef = useRef(basePrice);

  useEffect(() => {
    basePriceRef.current = basePrice;
    setCandles(
      makeInitialCandles(basePrice, decimals, DEFAULT_SEED)
    );
    setCurrentPrice(basePrice);
    setChange(0);
  }, [basePrice, decimals]);

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

        // Keep last 80 candles max
        return next.slice(-80);
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [decimals]);

  return { candles, currentPrice, change };
}