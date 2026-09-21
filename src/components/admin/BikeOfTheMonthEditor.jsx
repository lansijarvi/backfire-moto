import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';
import SortableGrid from './SortableGrid';
import PastBikesList from './PastBikesList';

const EMPTY = { title: '', subject: '', media: [], postId: '', featuredAt: '' };

export default function BikeOfTheMonthEditor() {
  return (
    <div className="flex flex-col gap-10">
      <CurrentBikeForm />
      <PastBikesList />
    </div>
  );
}

function CurrentBikeForm() {
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
      const toSave = {
        ...form,
        postId: form.postId || crypto.randomUUID(),
        featuredAt: form.featuredAt || new Date().toISOString(),
      };
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
    const hasContent = form.title || form.subject || form.media.length > 0;
    const question = hasContent
      ? 'Start a new Bike of the Month? The current one moves to "Past Bikes of the Month" with its photos and reactions.'
      : 'Start a new Bike of the Month?';
    if (!confirm(question)) return;

    setStatus('');
    try {
      const now = new Date().toISOString();
      const fresh = { ...EMPTY, postId: crypto.randomUUID(), featuredAt: now };
      // One atomic write: archive the current bike and reset the live one together, so a
      // failure can never leave the old bike lost (or half-archived).
      const batch = writeBatch(db);
      if (hasContent) {
        const postId = form.postId || crypto.randomUUID();
        batch.set(doc(db, 'pastBikesOfTheMonth', postId), {
          title: form.title,
          subject: form.subject,
          media: form.media,
          postId,
          featuredAt: form.featuredAt || now,
          archivedAt: now,
        });
      }
      batch.set(doc(db, 'settings', 'bikeOfTheMonth'), fresh);
      await batch.commit();
      setForm(fresh);
      setStatus('Started fresh — the previous bike is saved under Past Bikes of the Month. Add a title, subject, and photos, then Save.');
    } catch {
      setStatus('Something went wrong — nothing was changed. Try again.');
    }
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
        "Save" edits the current feature (reactions stay intact). "Start new" moves this
        bike to Past Bikes of the Month and clears the form for the next one.
      </p>
      {status && <p className="text-sm text-neutral-400">{status}</p>}
    </form>
  );
}
