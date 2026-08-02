'use client';

// Shared SVG line/area chart with a gradient fill and pointer-driven hover
// tooltip — used by both BankrollChart and PnlChart, which differ only in
// their data source and value formatting.
import { useMemo, useRef, useState } from 'react';

export interface LineChartPoint {
  date: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  points: LineChartPoint[];
  height?: number;
  gradientId: string;
  emptyMessage: string;
  ariaLabel: (lastValue: number) => string;
  formatValue: (value: number) => string;
  formatGridValue?: (value: number) => string;
}

const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const WIDTH = 640; // viewBox units — scales via CSS width:100%

// Computes the SVG path/area/gridlines for a set of points at a given chart height.
function buildGeometry(points: LineChartPoint[], height: number) {
  const values = points.map((point) => point.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values, 0.01); // avoid a zero-height range
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = height - PAD_TOP - PAD_BOTTOM;

  const xOf = (index: number) => PAD_X + (points.length <= 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const yOf = (value: number) => PAD_TOP + innerHeight - ((value - min) / (max - min)) * innerHeight;

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xOf(index).toFixed(1)} ${yOf(point.value).toFixed(1)}`).join(' ');
  const zeroY = yOf(0).toFixed(1);
  const areaPath = points.length > 0
    ? `${path} L ${xOf(points.length - 1).toFixed(1)} ${zeroY} L ${xOf(0).toFixed(1)} ${zeroY} Z`
    : '';

  const gridSteps = 3;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, step) => {
    const value = min + ((max - min) * step) / gridSteps;

    return { y: yOf(value), value };
  });

  return { path, areaPath, xOf, yOf, gridLines, positive: points[points.length - 1]?.value >= 0 };
}

function HoverTooltip({ hover, formatValue }: { hover: LineChartPoint; formatValue: (value: number) => string }) {
  return (
    <div style={{
      position: 'absolute', top: 4, left: 4, background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '6px 10px', pointerEvents: 'none', fontSize: 11, maxWidth: 220,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>{formatValue(hover.value)}</div>
      <div style={{ color: 'var(--text-faint)', fontSize: 10, marginTop: 2 }}>
        {new Date(hover.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      {hover.label && (
        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hover.label}
        </div>
      )}
    </div>
  );
}

export default function LineChart({ points, height = 200, gradientId, emptyMessage, ariaLabel, formatValue, formatGridValue = formatValue }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { path, areaPath, xOf, yOf, gridLines, positive } = useMemo(() => buildGeometry(points, height), [points, height]);

  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
        {emptyMessage}
      </div>
    );
  }

  const color = positive ? 'var(--won)' : 'var(--lost)';
  const hover = hoverIndex != null ? points[hoverIndex] : null;
  const last = points[points.length - 1];

  // Finds the point nearest the pointer's x position and hovers it.
  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    points.forEach((_, index) => {
      const distance = Math.abs(xOf(index) - relativeX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setHoverIndex(nearestIndex);
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={ariaLabel(last.value)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((gridLine, index) => (
          <g key={index}>
            <line x1={PAD_X} y1={gridLine.y} x2={WIDTH - PAD_X} y2={gridLine.y} stroke="var(--border-soft)" strokeWidth="1" />
            <text x={PAD_X} y={gridLine.y - 4} fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-faint)">
              {formatGridValue(gridLine.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={xOf(points.length - 1)} cy={yOf(last.value)} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />

        {hover && hoverIndex != null && (
          <>
            <line x1={xOf(hoverIndex)} y1={PAD_TOP} x2={xOf(hoverIndex)} y2={height - PAD_BOTTOM} stroke="var(--text-faint)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={xOf(hoverIndex)} cy={yOf(hover.value)} r="4.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>

      {hover && <HoverTooltip hover={hover} formatValue={formatValue} />}
    </div>
  );
}
