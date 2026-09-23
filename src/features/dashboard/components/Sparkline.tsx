import { Box } from "@mui/material";

interface SparklineProps {
  data: readonly number[];
  color: string;
  height?: number;
}

/** Tiny trend line for stat cards — draws itself in on mount, last point pulses. */
export function Sparkline({ data, color, height = 30 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = 3 + (i * 94) / (data.length - 1);
    const y = 25 - ((v - min) / range) * 19; // keep 3..25 vertical padding in a 0-30 box
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });
  const pts = points.map(([x, y]) => `${x},${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <Box
      component="svg"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      sx={{
        width: "100%",
        height,
        display: "block",
        overflow: "visible",
        "@keyframes sparkDraw": { from: { strokeDashoffset: 100 }, to: { strokeDashoffset: 0 } },
        "& .spark-line": {
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: "sparkDraw 1.3s .25s cubic-bezier(.4,0,.2,1) forwards",
        },
      }}
    >
      <polygon points={`${points[0][0]},28 ${pts} ${lastX},28`} fill={color} opacity={0.12} />
      <polyline
        className="spark-line"
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.4} fill={color}>
        <animate attributeName="opacity" values="1;.35;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </Box>
  );
}
