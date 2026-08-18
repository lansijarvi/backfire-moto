import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function Community() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(
      query(collection(db, 'communityPhotos'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'))
    ).then((snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fileRef = ref(storage, `backfire/community/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await addDoc(collection(db, 'communityPhotos'), {
        photoUrl: url,
        name: name.trim(),
        caption: caption.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
      <h1 className="font-heading text-4xl text-white text-center mb-4">Community Photos</h1>
      <p className="text-neutral-400 text-center max-w-lg mx-auto mb-10">
        Your bike, your rig at the event, rocking a Backfire shirt — share it here. We check
        every photo before it goes public.
      </p>

      <div className="max-w-sm mx-auto flex flex-col gap-3 mb-16 border border-neutral-800 rounded-lg p-6 bg-surface">
        {submitted ? (
          <p className="text-accent text-center font-medium">
            Thanks! Your photo is in for review — we'll add it soon.
          </p>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or @handle (optional)"
              className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
            />
            <label className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-4 py-3 rounded text-center cursor-pointer hover:brightness-110 transition">
              {uploading ? 'Uploading…' : 'Choose Photo & Submit'}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </>
        )}
      </div>

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-neutral-500">No community photos yet — be the first!</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {photos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface">
              <img src={photo.photoUrl} alt={photo.caption || ''} className="w-full" />
              {(photo.caption || photo.name) && (
                <div className="px-3 py-2 text-xs text-neutral-500">
                  {photo.caption && <p>{photo.caption}</p>}
                  {photo.name && <p className="text-neutral-600">— {photo.name}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
