import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

function mediaOf(post) {
  return { url: post.url || post.media?.[0]?.url, type: post.type || post.media?.[0]?.type };
}

export default function Community() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usageConsent, setUsageConsent] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    getDocs(
      query(collection(db, 'communityPhotos'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'))
    ).then((snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a photo or video.');
      return;
    }
    if (!usageConsent) {
      setError('Please confirm you have the right to share this.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const fileRef = ref(storage, `backfire/community/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, 'communityPhotos'), {
        url,
        type,
        usageConsent,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
      <h1 className="font-heading text-4xl text-white text-center mb-4">Community Photos</h1>
      <p className="text-neutral-400 text-center max-w-lg mx-auto mb-10">
        Your bike, your rig at the event, rocking a Backfire shirt — share it here. We check
        every submission before it goes public.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto flex flex-col gap-3 mb-16 border border-neutral-800 rounded-lg p-6 bg-surface"
      >
        {submitted ? (
          <p className="text-accent text-center font-medium">
            Thanks! Your submission is in for review — we'll add it soon.
          </p>
        ) : (
          <>
            <label className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-4 py-3 rounded text-center cursor-pointer hover:brightness-110 transition">
              {file ? file.name : 'Choose Photo or Video'}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <label className="flex items-start gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={usageConsent}
                onChange={(e) => setUsageConsent(e.target.checked)}
                className="mt-0.5"
              />
              I have the right to share this and give Backfire Moto permission to use it on
              our website, social media, newsletter, and event promotions.
            </label>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-4 py-3 rounded hover:brightness-110 disabled:opacity-60 transition"
            >
              {uploading ? 'Uploading…' : 'Submit'}
            </button>
          </>
        )}
      </form>

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-neutral-500">No community photos yet — be the first!</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {photos.map((post) => {
            const { url, type } = mediaOf(post);
            if (!url) return null;
            return (
              <button
                key={post.id}
                onClick={() => setLightbox({ url, type })}
                className="block w-full break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface"
              >
                {type === 'video' ? (
                  <video src={url} className="w-full" muted />
                ) : (
                  <img src={url} alt="" className="w-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-accent"
          >
            &times;
          </button>
          {lightbox.type === 'video' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.url}
              alt=""
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
