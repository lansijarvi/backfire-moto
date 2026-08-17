import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-heading text-3xl text-white text-center mb-2">Admin Login</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-surface border border-neutral-700 rounded px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="bg-surface border border-neutral-700 rounded px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-white font-semibold px-5 py-3 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
