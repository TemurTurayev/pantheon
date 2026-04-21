interface Props {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

// Tiny inline sparkline — no axes, no grid. Pure shape.
export function Sparkline({ values, color, width = 180, height = 40 }: Props) {
  if (values.length < 2) {
    return <div style={{ width, height }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastY = height - ((values[values.length - 1] - min) / span) * (height - 4) - 2;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - 1} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
