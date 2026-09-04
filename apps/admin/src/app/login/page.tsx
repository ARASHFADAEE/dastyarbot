'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, getToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace('/');
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      router.replace('/');
    } catch {
      setError('ورود ناموفق بود. ایمیل یا رمز را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(700px 360px at 80% 0%, rgba(13, 148, 136, 0.16), transparent 55%), radial-gradient(600px 320px at 10% 100%, rgba(3, 105, 161, 0.1), transparent 50%), #0b1220',
      }}
    >
      <form
        onSubmit={onSubmit}
        className="surface"
        style={{
          width: 'min(420px, 100%)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(145deg, #14b8a6, #0f766e)',
            color: '#fff',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          F
        </div>
        <div style={{ color: 'var(--brand)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
          Fadaee Desk
        </div>
        <h1 style={{ margin: 0, fontSize: 26 }}>ورود به پنل</h1>
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          مدیریت مکالمات، لیدها و تماس‌های مشتریان
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          ایمیل
          <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          رمز عبور
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <div className="toast toast-err">{error}</div> : null}
        <button className="btn" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
          {loading ? '...' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
