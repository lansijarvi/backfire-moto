import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className="text-accent font-medium">You're on the list. See you at the next event.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 min-w-0 bg-surface border border-neutral-700 rounded px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="shrink-0 bg-accent text-white font-semibold px-5 py-3 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
      >
        {status === 'loading' ? '...' : 'Sign Up'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-400 basis-full">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
