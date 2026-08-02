'use client';

// Dropdown of common market names that fills the adjacent free-text Market field.
import { SELECT } from '../adminPanelStyles';
import { COMMON_MARKETS } from '@/lib/betFormOptions';

export default function MarketQuickPick({ onPick }: { onPick: (value: string) => void }) {
  return (
    <select
      value=""
      onChange={(event) => {
        if (event.target.value) {
          onPick(event.target.value);
        }
      }}
      style={{ ...SELECT, marginBottom: 6 }}
    >
      <option value="">Quick pick…</option>
      {COMMON_MARKETS.map((market) => <option key={market} value={market}>{market}</option>)}
    </select>
  );
}
