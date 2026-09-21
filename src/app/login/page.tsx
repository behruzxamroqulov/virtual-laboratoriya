'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kirishda xatolik yuz berdi.');
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError('Server bilan bog\'lanib bo\'lmadi. Internetni tekshiring.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 dark:from-surface-dark dark:via-surface-dark dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <FlaskConical size={28} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Virtual Lab</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Talabalar laboratoriya platformasiga xush kelibsiz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-8">
          <div>
            <label className="label">Login</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input pl-10"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="login"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Parol</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                className="input pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Kirish
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Hisobingiz yo'qmi? Ustozingiz bilan bog'laning.
        </p>
      </div>
    </div>
  );
}
