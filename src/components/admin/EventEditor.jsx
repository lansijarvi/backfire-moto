import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';

const EMPTY = {
  title: '',
  dateText: '',
  description: '',
  flyerImageUrl: '',
  ctaText: '',
  ctaUrl: '',
  eventStart: '',
  eventEnd: '',
  venueName: '',
  venueAddress: '',
};

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
    const previousUrl = form.flyerImageUrl;
    const compressed = await compressImage(file, 2000);
    const fileRef = ref(storage, `backfire/hero/flyer-${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, compressed);
    const url = await getDownloadURL(fileRef);
    update('flyerImageUrl', url);
    setUploading(false);
    if (previousUrl) deleteStorageFileByUrl(storage, previousUrl);
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

      <div className="border-t border-neutral-800 pt-4 mt-1">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
          For Google search (not shown on the page) — fill these in so the event can show up
          with its date/location directly in search results.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 text-sm text-neutral-400 flex-1">
              Start date &amp; time
              <input
                type="datetime-local"
                value={form.eventStart}
                onChange={(e) => update('eventStart', e.target.value)}
                className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-400 flex-1">
              End date &amp; time (optional)
              <input
                type="datetime-local"
                value={form.eventEnd}
                onChange={(e) => update('eventEnd', e.target.value)}
                className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Venue name
            <input
              value={form.venueName}
              onChange={(e) => update('venueName', e.target.value)}
              placeholder="Two-Kick Coffee"
              className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Venue address
            <input
              value={form.venueAddress}
              onChange={(e) => update('venueAddress', e.target.value)}
              placeholder="3208 Queen Anne Ave N, Seattle, WA 98109"
              className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>

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
