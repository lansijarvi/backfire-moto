import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { MAILCHIMP_ACTION, MAILCHIMP_HONEYPOT_NAME } from '../mailchimpConfig';
import { compressImage } from '../lib/imageUpload';
import Lightbox from '../components/Lightbox';
import Reactions from '../components/Reactions';

const MAX_FILES = 5;

export default function Community() {
  const [tiles, setTiles] = useState([]); // flattened { url, type } across all approved submissions
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [story, setStory] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [usageConsent, setUsageConsent] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const formSectionRef = useRef(null);
  const mailchimpFormRef = useRef(null);
  const mailchimpEmailRef = useRef(null);

  useEffect(() => {
    getDocs(query(collection(db, 'communityPhotos'), where('status', '==', 'approved'))).then((snap) => {
      const flat = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((data) => {
          const allMedia = data.media || (data.url ? [{ url: data.url, type: data.type }] : []);
          const media = data.includedMedia
            ? allMedia.filter((m) => data.includedMedia.includes(m.url))
            : allMedia;
          return media.map((m) => ({ ...m, id: data.id }));
        });
      setTiles(flat);
      setLoading(false);
    });
  }, []);

  function openForm() {
    setFormOpen(true);
    requestAnimationFrame(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function handleFileChange(e) {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length > MAX_FILES) {
      setError(`Choose up to ${MAX_FILES} photos/videos.`);
      setFiles(chosen.slice(0, MAX_FILES));
    } else {
      setError('');
      setFiles(chosen);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) {
      setError('Add at least one photo or video.');
      return;
    }
    if (!usageConsent) {
      setError('Please confirm you have the right to share this.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const media = [];
      for (const file of files) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const uploadFile = type === 'image' ? await compressImage(file) : file;
        const fileRef = ref(storage, `backfire/community/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, uploadFile);
        const url = await getDownloadURL(fileRef);
        media.push({ url, type });
      }

      await addDoc(collection(db, 'communityPhotos'), {
        name: name.trim(),
        email: email.trim(),
        story: story.trim(),
        newsletterOptIn,
        usageConsent,
        media,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      if (newsletterOptIn && email.trim()) {
        mailchimpEmailRef.current.value = email.trim();
        mailchimpFormRef.current.submit();
      }

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
      <p className="text-neutral-400 text-center max-w-lg mx-auto mb-2">
        Your bike, your rig at the event, rocking a Backfire shirt — share it here. We check
        every submission before it goes public.
      </p>
      <p className="text-accent text-center max-w-lg mx-auto mb-5 text-sm">
        We might feature your bike (and your story) in the newsletter!
      </p>
      <div className="text-center mb-10">
        <button
          onClick={openForm}
          className="border border-accent text-accent hover:bg-accent hover:text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded transition-colors"
        >
          Share yours ↓
        </button>
      </div>

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : tiles.length === 0 ? (
        <p className="text-center text-neutral-500">No community photos yet — be the first!</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {tiles.map((tile, i) => (
            <div
              key={`${tile.id}-${i}`}
              className="group w-full break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface transition-colors duration-200 hover:border-neutral-600"
            >
              <button onClick={() => setLightbox(tile)} className="block w-full overflow-hidden">
                {tile.type === 'video' ? (
                  <video src={tile.url} className="w-full transition-transform duration-300 group-hover:scale-105" muted />
                ) : (
                  <img
                    src={tile.url}
                    alt=""
                    loading="lazy"
                    className="w-full transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </button>
              <Reactions targetId={tile.url} className="px-2 py-1.5" />
            </div>
          ))}
        </div>
      )}

      <section ref={formSectionRef} className="mt-16 pt-10 border-t border-neutral-800 scroll-mt-24 text-center">
        <h2 className="font-heading text-2xl text-white">Share your bike</h2>

        {submitted ? (
          <p className="text-accent font-medium mt-3">
            Thanks! Your submission is in for review — we'll add it soon.
          </p>
        ) : !formOpen ? (
          <>
            <p className="text-sm text-neutral-500 mt-1 mb-4">Photos or short videos, reviewed before they go public.</p>
            <button
              onClick={openForm}
              className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-5 py-2.5 rounded hover:brightness-110 transition"
            >
              Submit a photo
            </button>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="relative max-w-lg mx-auto flex flex-col gap-3 mt-4 border border-neutral-800 rounded-lg p-4 bg-surface text-left"
          >
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="absolute top-2 right-3 text-neutral-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name or @handle (optional)"
                className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
              />
            </div>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell us the story behind it (optional)"
              rows={2}
              className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
            />
            <label className="flex items-start gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="mt-0.5"
              />
              Sign me up for the Backfire Moto newsletter
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
            <div className="flex items-center gap-3">
              <label className="flex-1 border border-dashed border-neutral-600 hover:border-accent text-neutral-300 text-sm px-3 py-2.5 rounded text-center cursor-pointer transition-colors">
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? 's' : ''} chosen`
                  : `Add photos/videos (up to ${MAX_FILES})`}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                type="submit"
                disabled={uploading}
                className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-5 py-2.5 rounded hover:brightness-110 disabled:opacity-60 transition"
              >
                {uploading ? 'Uploading…' : 'Submit'}
              </button>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </form>
        )}
      </section>

      {/* Hidden Mailchimp opt-in form, submitted programmatically when checked above */}
      <form ref={mailchimpFormRef} action={MAILCHIMP_ACTION} method="post" target="mc-community-iframe" className="hidden">
        <input ref={mailchimpEmailRef} type="email" name="EMAIL" />
        <input type="text" name={MAILCHIMP_HONEYPOT_NAME} defaultValue="" />
      </form>
      <iframe name="mc-community-iframe" title="mailchimp" className="hidden" />

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
