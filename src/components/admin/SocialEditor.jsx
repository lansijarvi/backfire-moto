import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const FIELDS = ['instagram', 'youtube', 'facebook', 'x', 'tiktok', 'email'];
const EMPTY = Object.fromEntries(FIELDS.map((f) => [f, '']));

function placeholderFor(field) {
  return field === 'email' ? 'backfiremoto@gmail.com' : `https://${field}.com/backfiremoto`;
}

export default function SocialEditor() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'social')).then((snap) => {
      if (snap.exists()) setForm({ ...EMPTY, ...snap.data() });
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await setDoc(doc(db, 'settings', 'social'), form);
      setStatus('Saved.');
    } catch {
      setStatus('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-lg">
      {FIELDS.map((field) => (
        <label key={field} className="flex flex-col gap-1 text-sm text-neutral-400 capitalize">
          {field}
          <input
            value={form[field]}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            placeholder={placeholderFor(field)}
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="self-start bg-accent text-white font-semibold px-5 py-2.5 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {status && <p className="text-sm text-neutral-400">{status}</p>}
    </form>
  );
}
