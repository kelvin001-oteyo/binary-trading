function CandleChart({
  candles,
  width = 900,
  height = 380,
  decimals = 5,
  padding = { top: 20, right: 70, bottom: 30, left: 20 },
}) {
  if (!candles || candles.length === 0) {
    return (
      <div
        className="candle-chart-empty"
        style={{ width: "100%", height }}
      >
        Waiting for data…
      </div>
    );
  }

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Determine price range across all candles
  let min = Infinity;
  let max = -Infinity;

  candles.forEach((c) => {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  });

  const range = max - min || 1;

  const candleW = Math.max(2, (innerW / candles.length) * 0.7);
  const stepX = innerW / candles.length;

  const yFor = (price) =>
    padding.top + ((max - price) / range) * innerH;

  // Horizontal grid lines (5 bands)
  const gridCount = 5;
  const gridLines = [];

  for (let i = 0; i <= gridCount; i += 1) {
    const price = min + (range * i) / gridCount;
    const y = yFor(price);

    gridLines.push({ y, price });
  }

  // Vertical grid lines (every 8 candles)
  const vGridStep = Math.ceil(candles.length / 8);
  const vGridLines = [];

  for (let i = 0; i < candles.length; i += vGridStep) {
    vGridLines.push(
      padding.left + i * stepX + stepX / 2
    );
  }

  const lastCandle = candles[candles.length - 1];
  const lastY = yFor(lastCandle.close);
  const lastBullish = lastCandle.close >= lastCandle.open;

  return (
    <svg
      className="candle-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
    >
      {/* Horizontal grid + right-side price labels */}
      {gridLines.map(({ y, price }, i) => (
        <g key={`h-${i}`}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            stroke="#eef2f7"
            strokeWidth="1"
          />
          <text
            x={width - padding.right + 8}
            y={y + 4}
            fill="#94a3b8"
            fontSize="11"
            fontFamily="SF Mono, Menlo, monospace"
          >
            {Number(price).toFixed(decimals)}
          </text>
        </g>
      ))}

      {/* Vertical grid */}
      {vGridLines.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          x2={x}
          y1={padding.top}
          y2={height - padding.bottom}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}

      {/* Last price marker line */}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={lastY}
        y2={lastY}
        stroke={lastBullish ? "#22c55e" : "#ef4444"}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.7"
      />

      {/* Last price tag */}
      <g transform={`translate(${width - padding.right + 4}, ${lastY - 10})`}>
        <rect
          x="0"
          y="0"
          width="64"
          height="20"
          rx="4"
          fill={lastBullish ? "#22c55e" : "#ef4444"}
        />
        <text
          x="32"
          y="14"
          fill="#ffffff"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="SF Mono, Menlo, monospace"
        >
          {Number(lastCandle.close).toFixed(decimals)}
        </text>
      </g>

      {/* Candles */}
      {candles.map((candle, i) => {
        const x =
          padding.left + i * stepX + stepX / 2;

        const bullish = candle.close >= candle.open;

        const wickTop = yFor(candle.high);
        const wickBottom = yFor(candle.low);

        const bodyTop = yFor(
          Math.max(candle.open, candle.close)
        );
        const bodyBottom = yFor(
          Math.min(candle.open, candle.close)
        );

        const bodyHeight = Math.max(
          1,
          bodyBottom - bodyTop
        );

        const color = bullish ? "#16a34a" : "#dc2626";

        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x}
              x2={x}
              y1={wickTop}
              y2={wickBottom}
              stroke={color}
              strokeWidth="1"
            />

            {/* Body */}
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyHeight}
              fill={color}
              stroke={color}
              strokeWidth="1"
              rx="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default CandleChart;