import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function mediaOf(post) {
  return post.media || (post.url ? [{ url: post.url, type: post.type }] : []);
}

function InfoBlock({ post }) {
  return (
    <>
      {post.name && <p className="text-neutral-300">{post.name}</p>}
      {post.email && <p className="text-neutral-500">{post.email}</p>}
      {post.story && <p className="text-neutral-400">{post.story}</p>}
      <p className={post.usageConsent ? 'text-neutral-600' : 'text-red-400'}>
        {post.usageConsent ? 'Usage rights granted' : 'No usage consent on file'}
      </p>
      <p className="text-neutral-600">{post.newsletterOptIn ? 'Opted into newsletter' : 'Not opted in'}</p>
    </>
  );
}

function MediaGrid({ media, selected, onToggle, onOpenMedia }) {
  return (
    <div className={`grid gap-0.5 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {media.map((m, i) => {
        const isSelected = selected?.has(i);
        return (
          <div key={i} className="relative">
            {m.type === 'video' ? (
              <video
                src={m.url}
                onClick={() => onOpenMedia(m)}
                className="w-full aspect-square object-cover cursor-pointer"
              />
            ) : (
              <img
                src={m.url}
                alt=""
                onClick={() => onOpenMedia(m)}
                className="w-full aspect-square object-cover cursor-pointer"
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(i);
              }}
              aria-label={isSelected ? 'Deselect' : 'Select'}
              className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                isSelected ? 'bg-accent border-accent text-white' : 'bg-black/60 border-white/70 text-transparent'
              }`}
            >
              ✓
            </button>
            {!isSelected && <div className="absolute inset-0 bg-black/60 pointer-events-none" />}
          </div>
        );
      })}
    </div>
  );
}

function PendingCard({ post, selected, onToggle, onOpenMedia, onApprove, onReject }) {
  const media = mediaOf(post);
  const selectedCount = selected?.size || 0;

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-surface">
      <MediaGrid media={media} selected={selected} onToggle={onToggle} onOpenMedia={onOpenMedia} />
      <div className="p-3 flex flex-col gap-2 text-xs">
        <InfoBlock post={post} />
        <p className="text-neutral-500">
          {selectedCount} of {media.length} selected for the public page
        </p>
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={selectedCount === 0}
            className="flex-1 bg-accent text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:brightness-110 disabled:opacity-40 transition"
          >
            Approve Selected
          </button>
          <button
            onClick={onReject}
            className="flex-1 border border-neutral-700 text-neutral-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:text-white hover:border-white transition"
          >
            Reject All
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovedCard({ post, selected, onToggle, onOpenMedia, onUpdate, onReject, dirty }) {
  const media = mediaOf(post);
  const selectedCount = selected?.size || 0;

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-surface">
      <MediaGrid media={media} selected={selected} onToggle={onToggle} onOpenMedia={onOpenMedia} />
      <div className="p-3 flex flex-col gap-2 text-xs">
        <InfoBlock post={post} />
        <p className="text-neutral-500">{selectedCount} of {media.length} showing publicly</p>
        <div className="flex gap-2">
          {dirty && (
            <button
              onClick={onUpdate}
              className="flex-1 bg-accent text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:brightness-110 transition"
            >
              Update
            </button>
          )}
          <button
            onClick={onReject}
            className="flex-1 border border-red-900 text-red-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:bg-red-950 transition"
          >
            Remove All
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPhotosEditor() {
  const [posts, setPosts] = useState([]);
  const [selections, setSelections] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'communityPhotos'), orderBy('createdAt', 'desc')), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(next);
      setSelections((prev) => {
        const updated = { ...prev };
        next.forEach((p) => {
          if (updated[p.id]) return;
          const media = mediaOf(p);
          if (p.status === 'approved' && p.includedMedia) {
            const set = new Set();
            media.forEach((m, i) => {
              if (p.includedMedia.includes(m.url)) set.add(i);
            });
            updated[p.id] = set;
          } else {
            updated[p.id] = new Set(media.map((_, i) => i));
          }
        });
        return updated;
      });
    });
  }, []);

  const pending = posts.filter((p) => p.status === 'pending');
  const approved = posts.filter((p) => p.status === 'approved');

  function toggleSelection(postId, index) {
    setSelections((prev) => {
      const set = new Set(prev[postId]);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      return { ...prev, [postId]: set };
    });
  }

  function includedUrlsFor(post) {
    const media = mediaOf(post);
    const selected = selections[post.id] || new Set(media.map((_, i) => i));
    return media.filter((_, i) => selected.has(i)).map((m) => m.url);
  }

  function isDirty(post) {
    const current = includedUrlsFor(post);
    const saved = post.includedMedia || mediaOf(post).map((m) => m.url);
    return current.length !== saved.length || current.some((u) => !saved.includes(u));
  }

  async function approve(post) {
    const includedMedia = includedUrlsFor(post);
    if (includedMedia.length === 0) return;
    await updateDoc(doc(db, 'communityPhotos', post.id), { status: 'approved', includedMedia });
  }

  async function updateIncluded(post) {
    await updateDoc(doc(db, 'communityPhotos', post.id), { includedMedia: includedUrlsFor(post) });
  }

  async function reject(id) {
    await deleteDoc(doc(db, 'communityPhotos', id));
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="text-xs text-neutral-500 -mt-2">
        Click any photo/video to view it full-size (right-click to copy). Tap the checkmark to
        include/exclude it from the public page.
      </p>

      <div>
        <h3 className="text-white font-semibold mb-3">Pending review ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing waiting.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {pending.map((post) => (
              <PendingCard
                key={post.id}
                post={post}
                selected={selections[post.id]}
                onToggle={(i) => toggleSelection(post.id, i)}
                onOpenMedia={setLightbox}
                onApprove={() => approve(post)}
                onReject={() => reject(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Approved ({approved.length})</h3>
        {approved.length === 0 ? (
          <p className="text-sm text-neutral-500">None yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {approved.map((post) => (
              <ApprovedCard
                key={post.id}
                post={post}
                selected={selections[post.id]}
                onToggle={(i) => toggleSelection(post.id, i)}
                onOpenMedia={setLightbox}
                onUpdate={() => updateIncluded(post)}
                onReject={() => reject(post.id)}
                dirty={isDirty(post)}
              />
            ))}
          </div>
        )}
      </div>

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
