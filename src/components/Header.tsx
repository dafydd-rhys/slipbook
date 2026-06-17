'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const CONTENT_WIDTH = 720;

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleAdminClick() {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin') === btoa('saucyslips')) {
      router.push('/admin');
      return;
    }
    setShowModal(true);
    setPassword('');
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === 'saucyslips') {
      sessionStorage.setItem('admin', btoa('saucyslips'));
      setShowModal(false);
      router.push('/admin');
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <>
      <header style={{ background: '#0d0d20', borderBottom: '1px solid #1a1a38' }} className="sticky top-0 z-50">
        <div
          style={{
            maxWidth: CONTENT_WIDTH,
            margin: '0 auto',
            padding: '0 20px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
                border: '1px solid #6d28d9',
                borderRadius: 8,
                padding: '7px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', lineHeight: 1 }}>
                strz
              </span>
              <span style={{ color: '#a78bfa', fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Slipz
              </span>
            </div>
          </Link>

          <button
            onClick={handleAdminClick}
            style={{
              background: 'transparent',
              border: '1px solid #1e1e3e',
              borderRadius: 7,
              color: '#475569',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '6px 13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6d28d9';
              e.currentTarget.style.color = '#a78bfa';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1e1e3e';
              e.currentTarget.style.color = '#475569';
            }}
          >
            ADMIN
          </button>
        </div>
      </header>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: '#16162e', border: '1px solid #2a2a52',
            borderRadius: 16, padding: '28px 24px',
            width: '100%', maxWidth: 320,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Admin Access</h2>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Enter password to continue</p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Password"
                autoFocus
                style={{
                  width: '100%', background: '#0a0a14',
                  border: `1px solid ${error ? '#ef4444' : '#2a2a52'}`,
                  borderRadius: 8, color: '#f1f5f9', fontSize: 14,
                  padding: '10px 12px', outline: 'none', marginBottom: 8,
                }}
              />
              {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{error}</p>}
              <button type="submit" style={{
                width: '100%', background: '#7c3aed', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 14, fontWeight: 700, padding: 10,
                cursor: 'pointer', marginTop: error ? 0 : 4,
              }}>
                Enter
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
