'use client';

// Full-screen PIN pad gating /admin. Ticket-stub dots fill in as digits are
// entered; a shake-red state on wrong PIN is driven by `pinError` from the parent.
export const MAX_PIN_LEN = 12;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

interface PinLoginProps {
  pin: string;
  pinError: boolean;
  pinSubmitting: boolean;
  onDigit: (digit: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

// One key on the PIN pad — a digit, the backspace key, or the submit checkmark.
function PinKey({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const isBack = label === '⌫';
  const isSubmit = label === '✓';

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={{
        background: (isBack || isSubmit) ? 'transparent' : 'var(--surface)',
        border: `1px solid ${(isBack || isSubmit) ? 'transparent' : 'var(--border)'}`,
        borderRadius: 11,
        color: isSubmit ? 'var(--accent)' : isBack ? 'var(--text-faint)' : 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: (isBack || isSubmit) ? 20 : 18,
        fontWeight: 600,
        height: 58,
        cursor: 'pointer',
        transition: 'all 0.12s',
        opacity: disabled ? 0.3 : 1,
      }}
      onMouseEnter={(event) => {
        if (!isBack && !isSubmit) {
          event.currentTarget.style.borderColor = 'var(--accent)';
          event.currentTarget.style.color = 'var(--accent)';
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = (isBack || isSubmit) ? 'transparent' : 'var(--border)';
        event.currentTarget.style.color = isSubmit ? 'var(--accent)' : isBack ? 'var(--text-faint)' : 'var(--text)';
      }}
    >
      {label}
    </button>
  );
}

export default function PinLogin({ pin, pinError, pinSubmitting, onDigit, onBack, onSubmit }: PinLoginProps) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 280, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.14em', marginBottom: 28 }}>
          ENTER PIN
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, minHeight: 20, marginBottom: 36 }}>
          {pin.length === 0 && (
            <div style={{ width: 13, height: 18, borderRadius: 3, border: '1.5px solid var(--border)' }} />
          )}
          {Array.from({ length: pin.length }).map((_, index) => (
            <div key={index} style={{
              width: 13, height: 18, borderRadius: 3, position: 'relative', overflow: 'hidden',
              border: `1.5px solid ${pinError ? 'var(--lost)' : 'var(--accent)'}`,
              background: pinError ? 'var(--lost-soft)' : 'var(--accent-soft)',
              transition: 'all 0.15s',
            }}>
              <span style={{ position: 'absolute', inset: 3, borderRadius: 1, background: pinError ? 'var(--lost)' : 'var(--accent)' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {KEYPAD.map((key) => {
            const isBack = key === '⌫';
            const isSubmit = key === '✓';
            const disabled = isSubmit ? (!pin || pinSubmitting) : (!isBack && pin.length >= MAX_PIN_LEN);

            return (
              <PinKey
                key={key}
                label={key}
                disabled={disabled}
                onPress={() => {
                  if (isBack) {
                    onBack();
                  } else if (isSubmit) {
                    onSubmit();
                  } else {
                    onDigit(key);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
