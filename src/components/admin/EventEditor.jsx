import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

const EMPTY = { title: '', dateText: '', description: '', flyerImageUrl: '', ctaText: '', ctaUrl: '' };

export default function EventEditor() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'event')).then((snap) => {
      if (snap.exists()) setForm({ ...EMPTY, ...snap.data() });
    });
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFlyerUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileRef = ref(storage, `event/flyer-${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    update('flyerImageUrl', url);
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await setDoc(doc(db, 'settings', 'event'), form);
      setStatus('Saved.');
    } catch {
      setStatus('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-lg">
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Event title
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Date / time text
        <input
          value={form.dateText}
          onChange={(e) => update('dateText', e.target.value)}
          placeholder="Sat, Sept 20 · 12PM"
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Description
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Flyer image
        <input type="file" accept="image/*" onChange={handleFlyerUpload} className="text-sm text-neutral-400" />
        {uploading && <span className="text-xs text-neutral-500">Uploading…</span>}
        {form.flyerImageUrl && (
          <img src={form.flyerImageUrl} alt="Flyer preview" className="mt-2 max-w-[200px] rounded border border-neutral-800" />
        )}
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Button text (optional)
        <input
          value={form.ctaText}
          onChange={(e) => update('ctaText', e.target.value)}
          placeholder="Get Tickets"
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Button link (optional)
        <input
          value={form.ctaUrl}
          onChange={(e) => update('ctaUrl', e.target.value)}
          placeholder="https://..."
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
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
