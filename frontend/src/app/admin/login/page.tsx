'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiErrorMessage, authApi } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.adminLogin(email.trim(), password);
      router.push('/admin');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f9fc', color: '#111827', padding: 16 }}>
      <section style={{ width: '100%', maxWidth: 440, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <p style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', color: '#15b8a6' }}>Acatalog Admin</p>
        <h1 style={{ margin: '8px 0 20px 0', fontSize: 28, lineHeight: 1.1 }}>Login administrativo</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            name="email"
            type="text"
            placeholder="E-mail ou usuario administrativo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{ minHeight: 44, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 12px' }}
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ minHeight: 44, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 12px' }}
          />
          {error ? (
            <p style={{ margin: 0, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', padding: 12, fontWeight: 600 }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            style={{ minHeight: 44, border: 0, borderRadius: 8, background: '#111827', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Entrando...' : 'Entrar no dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}
