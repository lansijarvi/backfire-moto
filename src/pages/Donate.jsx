import { useEffect, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import QRCode from 'qrcode';
import { functions } from '../firebase';

const PRESETS = [5, 10, 20, 50];

export default function Donate() {
  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const url = window.location.href.split('#')[0];
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 260,
        margin: 1,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      });
    }
  }, []);

  const selectedAmount = customAmount ? Number(customAmount) : amount;

  async function handleDonate() {
    if (!Number.isFinite(selectedAmount) || selectedAmount < 1) {
      setError('Enter an amount of at least $1.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const createDonationCheckoutSession = httpsCallable(functions, 'createDonationCheckoutSession');
      const result = await createDonationCheckoutSession({
        amount: selectedAmount,
        basePath: import.meta.env.BASE_URL,
      });
      window.location.href = result.data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 max-w-lg mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-8">
      <div>
        <h1 className="font-heading text-4xl text-white">Support Backfire Moto</h1>
        <p className="mt-2 text-neutral-400">
          Grabbing food tonight? Donations help keep the events, food, and community going.
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <div className="grid grid-cols-4 gap-2 w-full">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setAmount(p);
                setCustomAmount('');
              }}
              className={`py-3 rounded border text-sm font-semibold transition ${
                !customAmount && amount === p
                  ? 'bg-accent border-accent text-white'
                  : 'border-neutral-700 text-neutral-300 hover:border-white'
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full bg-surface border border-neutral-700 rounded px-4 py-3 text-center text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleDonate}
          disabled={loading}
          className="w-full bg-accent text-white font-semibold px-6 py-3 rounded uppercase tracking-wide text-sm hover:brightness-110 disabled:opacity-60 transition"
        >
          {loading ? 'Redirecting…' : `Donate $${selectedAmount || 0}`}
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-3 pt-8 border-t border-neutral-800">
        <p className="text-sm uppercase tracking-widest text-neutral-500">Or scan to donate from your phone</p>
        <canvas ref={canvasRef} className="rounded-lg border border-neutral-800" />
      </div>
    </div>
  );
}
