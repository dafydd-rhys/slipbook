import Spinner from './Spinner';

interface ShareImageButtonProps {
  sharing: boolean;
  onShare: () => void;
  label?: string;
}

// Small circular button that triggers a "share as image" download — used
// wherever a card gets captured via shareElementAsPng (stats row, Insights).
export default function ShareImageButton({ sharing, onShare, label = 'Share as an image' }: ShareImageButtonProps) {
  return (
    <button
      onClick={onShare}
      disabled={sharing}
      aria-label={label}
      title={label}
      style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
        border: '1px solid var(--border)', background: 'transparent',
        color: 'var(--text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {sharing ? (
        <Spinner size={12} style={{ display: 'block' }} />
      ) : (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M8 10.5V2M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 9.5V12.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
