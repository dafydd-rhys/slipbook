'use client';

// Tab bar switching between the admin panel's Add/Manage/Bankroll/Reports/Data/Trash sections.
export type AdminTab = 'add' | 'manage' | 'bankroll' | 'reports' | 'data' | 'trash';

const TAB_ORDER: AdminTab[] = ['add', 'manage', 'bankroll', 'reports', 'data', 'trash'];

// Display label for one tab, e.g. "Manage (12)" or "Edit Bet" while editing.
function tabLabel(tab: AdminTab, editingId: string | null, betCount: number): string {
  switch (tab) {
    case 'add': return editingId ? 'Edit Bet' : '+ Add Bet';
    case 'manage': return `Manage (${betCount})`;
    case 'bankroll': return 'Bankroll';
    case 'reports': return 'Reports';
    case 'data': return 'Data';
    case 'trash': return 'Trash';
  }
}

interface AdminTabsProps {
  tab: AdminTab;
  editingId: string | null;
  betCount: number;
  onChange: (tab: AdminTab) => void;
}

export default function AdminTabs({ tab, editingId, betCount, onChange }: AdminTabsProps) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
      {TAB_ORDER.map((tabOption) => (
        <button key={tabOption} onClick={() => onChange(tabOption)} style={{
          flexShrink: 0,
          background: tab === tabOption ? 'var(--accent)' : 'transparent',
          border: `1px solid ${tab === tabOption ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 20, color: tab === tabOption ? 'var(--accent-contrast)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: tab === tabOption ? 700 : 600, letterSpacing: '0.03em',
          padding: '6px 16px', cursor: 'pointer',
        }}>
          {tabLabel(tabOption, editingId, betCount)}
        </button>
      ))}
    </div>
  );
}
