'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const router = useRouter();
  const [prakriti_id, setPrakritiId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prakriti_id, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('prakriti_id', data.prakriti_id);
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex w-full items-stretch dina-background">
      <div className=" w-1/2 flex items-center justify-center bg-[#6a9974] rounded-r-xl z-1 relative">
        <div className="flex flex-col items-center justify-center text-center gap-4 w-3/4 bg-white p-8 rounded-xl shadow-md">
          <p className="dina-heading text-lg font-bold">Login</p>

          <input
            type="text"
            placeholder="Prakriti ID"
            value={prakriti_id}
            onChange={e => setPrakritiId(e.target.value)}
            className="dina-input" // use your existing input styles
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="dina-input"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="dina-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
      <div className="bg-green-400 w-1/2"></div>
    </main>
  );
}