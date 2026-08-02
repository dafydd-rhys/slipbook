'use client';

import { useMemo, useRef, useState } from 'react';
import { BankrollPoint } from '@/lib/types';
import { formatUnits } from '@/lib/units';

interface Props {
  points: BankrollPoint[];
  height?: number;
}

const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export default function BankrollChart({ points, height = 220 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 640; // viewBox units — scales via CSS width:100%

  const { path, areaPath, xOf, yOf, gridLines, positive } = useMemo(() => {
    const values = points.map(p => p.balance);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values, 0.01); // avoid a zero-height range
    const innerW = width - PAD_X * 2;
    const innerH = height - PAD_TOP - PAD_BOTTOM;

    const xOf = (i: number) => PAD_X + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const yOf = (v: number) => PAD_TOP + innerH - ((v - min) / (max - min)) * innerH;

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(p.balance).toFixed(1)}`).join(' ');
    const zeroY = yOf(0).toFixed(1);
    const areaPath = points.length > 0
      ? `${path} L ${xOf(points.length - 1).toFixed(1)} ${zeroY} L ${xOf(0).toFixed(1)} ${zeroY} Z`
      : '';

    const gridSteps = 3;
    const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / gridSteps;
      return { y: yOf(v), value: v };
    });

    return { path, areaPath, xOf, yOf, gridLines, positive: points[points.length - 1]?.balance >= 0 };
  }, [points, height]);

  if (points.length < 2) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-faint)', fontSize: 13,
      }}>
        Add a deposit or settle a bet to start the chart.
      </div>
    );
  }

  const color = positive ? 'var(--won)' : 'var(--lost)';
  const hover = hoverIdx != null ? points[hoverIdx] : null;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0, nearestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xOf(i) - relX);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    });
    setHoverIdx(nearest);
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`Bankroll balance over time, currently ${formatUnits(points[points.length - 1].balance)}`}
      >
        <defs>
          <linearGradient id="bankroll-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_X} y1={g.y} x2={width - PAD_X} y2={g.y} stroke="var(--border-soft)" strokeWidth="1" />
            <text x={PAD_X} y={g.y - 4} fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-faint)">
              {formatUnits(g.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#bankroll-fill)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Emphasized endpoint */}
        <circle cx={xOf(points.length - 1)} cy={yOf(points[points.length - 1].balance)} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />

        {/* Hover crosshair */}
        {hover && hoverIdx != null && (
          <>
            <line x1={xOf(hoverIdx)} y1={PAD_TOP} x2={xOf(hoverIdx)} y2={height - PAD_BOTTOM} stroke="var(--text-faint)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={xOf(hoverIdx)} cy={yOf(hover.balance)} r="4.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>

      {hover && (
        <div style={{
          position: 'absolute', top: 4, left: 4, background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px', pointerEvents: 'none', fontSize: 11,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
            {formatUnits(hover.balance)}
          </div>
          <div style={{ color: 'var(--text-faint)', fontSize: 10, marginTop: 2 }}>
            {new Date(hover.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {hover.label && <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>{hover.label}</div>}
        </div>
      )}
    </div>
  );
}
