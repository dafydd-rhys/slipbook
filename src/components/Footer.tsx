export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1a1a38', marginTop: 'auto' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: '-0.01em', color: '#2a2a52' }}>
          strz<span style={{ color: '#3b0764' }}>Slipz</span>
        </span>
        <span style={{ fontSize: 11, color: '#1e1e3e' }}>
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
