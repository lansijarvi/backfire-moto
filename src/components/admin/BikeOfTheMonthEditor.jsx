import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';

const MAX_IMAGES = 5;
const EMPTY = { title: '', subject: '', images: [] };

export default function BikeOfTheMonthEditor() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'bikeOfTheMonth')).then((snap) => {
      if (snap.exists()) setForm({ ...EMPTY, ...snap.data() });
    });
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) {
      setStatus(`Max ${MAX_IMAGES} images — remove one first.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    setStatus('');
    try {
      const toUpload = files.slice(0, room);
      const urls = [];
      for (const file of toUpload) {
        const compressed = await compressImage(file);
        const fileRef = ref(storage, `backfire/bike-of-the-month/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, compressed);
        urls.push(await getDownloadURL(fileRef));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(index) {
    deleteStorageFileByUrl(storage, form.images[index]);
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await setDoc(doc(db, 'settings', 'bikeOfTheMonth'), form);
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
        Title
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="1975 Honda CB750"
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Subject
        <input
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          placeholder="Owned by Mike Torres"
          className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutral-400">Photos ({form.images.length}/{MAX_IMAGES})</span>
        {form.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-full aspect-square object-cover rounded border border-neutral-800" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs px-2 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {form.images.length < MAX_IMAGES && (
          <label className="bg-surface border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-400 text-center cursor-pointer hover:border-accent transition">
            {uploading ? 'Uploading…' : 'Add photo(s)'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

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
