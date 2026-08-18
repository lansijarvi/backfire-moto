import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { MAILCHIMP_ACTION, MAILCHIMP_HONEYPOT_NAME } from '../mailchimpConfig';

const MAX_FILES = 5;

export default function Community() {
  const [photos, setPhotos] = useState([]);
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

  const mailchimpFormRef = useRef(null);
  const mailchimpEmailRef = useRef(null);

  useEffect(() => {
    getDocs(
      query(collection(db, 'communityPhotos'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'))
    ).then((snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

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
    setUploading(true);
    setError('');
    try {
      const media = [];
      for (const file of files) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const fileRef = ref(storage, `backfire/community/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
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
      <p className="text-accent text-center max-w-lg mx-auto mb-10 text-sm">
        We might feature your bike (and your story) in the newsletter!
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
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or @handle (optional)"
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
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell us the story behind it (optional)"
              rows={3}
              className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
            />
            <label className="flex items-start gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                required
                checked={usageConsent}
                onChange={(e) => setUsageConsent(e.target.checked)}
                className="mt-0.5"
              />
              I have the right to share this and give Backfire Moto permission to use it on
              our website, social media, newsletter, and event promotions.
            </label>
            <label className="flex items-start gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="mt-0.5"
              />
              Sign me up for the Backfire Moto newsletter
            </label>
            <label className="bg-accent text-white text-sm font-semibold uppercase tracking-wide px-4 py-3 rounded text-center cursor-pointer hover:brightness-110 transition">
              {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} chosen` : 'Choose Photos/Videos'}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-neutral-500 text-center">Up to {MAX_FILES} photos or short videos</p>
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

      {/* Hidden Mailchimp opt-in form, submitted programmatically when checked above */}
      <form ref={mailchimpFormRef} action={MAILCHIMP_ACTION} method="post" target="mc-community-iframe" className="hidden">
        <input ref={mailchimpEmailRef} type="email" name="EMAIL" />
        <input type="text" name={MAILCHIMP_HONEYPOT_NAME} defaultValue="" />
      </form>
      <iframe name="mc-community-iframe" title="mailchimp" className="hidden" />

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-neutral-500">No community photos yet — be the first!</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {photos.map((post) => (
            <div key={post.id} className="break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface">
              <div className={post.media?.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}>
                {(post.media || []).map((m, i) =>
                  m.type === 'video' ? (
                    <video key={i} src={m.url} controls className="w-full" />
                  ) : (
                    <img key={i} src={m.url} alt="" className="w-full" />
                  )
                )}
              </div>
              {(post.story || post.name) && (
                <div className="px-3 py-2 text-xs text-neutral-500">
                  {post.story && <p className="text-neutral-300">{post.story}</p>}
                  {post.name && <p className="text-neutral-600 mt-1">— {post.name}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
