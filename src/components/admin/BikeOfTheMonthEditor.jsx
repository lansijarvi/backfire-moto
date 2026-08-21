import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';
import SortableGrid from './SortableGrid';

const EMPTY = { title: '', subject: '', media: [], postId: '' };

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

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setStatus('');
    try {
      const uploaded = [];
      for (const file of files) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const uploadFile = type === 'image' ? await compressImage(file) : file;
        const fileRef = ref(storage, `backfire/bike-of-the-month/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, uploadFile);
        const url = await getDownloadURL(fileRef);
        uploaded.push({ url, type });
      }
      setForm((f) => ({ ...f, media: [...f.media, ...uploaded] }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeMedia(index) {
    deleteStorageFileByUrl(storage, form.media[index]?.url);
    setForm((f) => ({ ...f, media: f.media.filter((_, i) => i !== index) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      // postId identifies "this bike feature" for reactions — keep the same one across
      // edits (adding photos, fixing a typo), only "Start New" below generates a fresh one.
      const toSave = form.postId ? form : { ...form, postId: crypto.randomUUID() };
      await setDoc(doc(db, 'settings', 'bikeOfTheMonth'), toSave);
      setForm(toSave);
      setStatus('Saved.');
    } catch {
      setStatus('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartNew() {
    if (!confirm('Start a new Bike of the Month? This clears the title, subject, and photos — reactions on the current one will no longer be reachable. This can\'t be undone.')) {
      return;
    }
    await Promise.all(form.media.map((m) => deleteStorageFileByUrl(storage, m.url)));
    const fresh = { ...EMPTY, postId: crypto.randomUUID() };
    setForm(fresh);
    await setDoc(doc(db, 'settings', 'bikeOfTheMonth'), fresh);
    setStatus('Started fresh — add a title, subject, and photos, then Save.');
  }

  const mediaWithKeys = form.media.map((m, i) => ({ ...m, _key: `${m.url}-${i}` }));

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
        <span className="text-sm text-neutral-400">
          Photos/videos ({form.media.length}) — you can add more anytime, even after this is
          already live. Drag to reorder.
        </span>
        {form.media.length > 0 && (
          <SortableGrid
            items={mediaWithKeys}
            keyExtractor={(item) => item._key}
            onReorder={(reordered) => update('media', reordered.map(({ _key, ...m }) => m))}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            renderItem={(item) => {
              const index = form.media.findIndex((m) => m.url === item.url);
              return (
                <div className="relative">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full aspect-square object-cover rounded border border-neutral-800" />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="w-full aspect-square object-cover rounded border border-neutral-800"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              );
            }}
          />
        )}
        <label className="bg-surface border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-400 text-center cursor-pointer hover:border-accent transition">
          {uploading ? 'Uploading…' : 'Add photo(s)/video(s)'}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white font-semibold px-5 py-2.5 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleStartNew}
          className="text-sm text-neutral-500 hover:text-red-400 transition"
        >
          Start a new Bike of the Month
        </button>
      </div>
      <p className="text-xs text-neutral-600 -mt-2">
        "Save" edits the current feature (reactions stay intact). "Start new" clears
        everything for a fresh bike next month and resets reactions.
      </p>
      {status && <p className="text-sm text-neutral-400">{status}</p>}
    </form>
  );
}
