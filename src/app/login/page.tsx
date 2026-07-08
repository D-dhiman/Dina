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
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/loginBg.png')",
        backgroundPosition: 'center',
        backgroundSize: 'fit',
      }}
    >
      <div className="absolute inset-0 bg-black/20 " aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mx-3/4 bg-white/2 backdrop-blur-lg border border-white/5 rounded-2xl p-12 shadow-2xl">
          <h1 className="text-center text-4xl pb-4 font-merriweather font-weight-800 text-white tracking-wider mb-6">LOGIN</h1>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleLogin();
            }}
            className="flex flex-col gap-4"
            aria-labelledby="login-heading"
          >
            <label htmlFor="prakriti_id" className="sr-only">
              Prakriti ID
            </label>
            <input
              id="prakriti_id"
              name="prakriti_id"
              type="text"
              placeholder="Prakriti ID"
              value={prakriti_id}
              onChange={e => setPrakritiId(e.target.value)}
              className="w-full px-2 py-3 rounded-lg bg-white border border-green-800 text-gray-800 text-sm placeholder-gray-500 focus:outline-none"
              required
              aria-required="true"
            />

            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-2 py-3 rounded-lg bg-white mb-3 text-gray-800 text-sm placeholder-gray-500 focus:outline-none"
              required
              aria-required="true"
            />

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-800 text-white font-semibold shadow-md disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-white/80 underline">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}