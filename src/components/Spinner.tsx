// Circular loading spinner used anywhere something's in flight (page loads,
// AI parsing, saving). Keeps animating under prefers-reduced-motion — see
// the `.spin` exemption in globals.css — since a frozen spinner reads as a
// hung page rather than a calmer one.
interface SpinnerProps {
  size?: number;
  color?: string;
  borderWidth?: number;
  style?: React.CSSProperties;
}

export default function Spinner({ size = 30, color = 'var(--accent)', borderWidth, style }: SpinnerProps) {
  const resolvedBorderWidth = borderWidth ?? (size <= 16 ? 2 : 3);

  return (
    <span
      aria-hidden
      className="spin"
      style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        border: `${resolvedBorderWidth}px solid var(--border)`, borderTopColor: color,
        ...style,
      }}
    />
  );
}
