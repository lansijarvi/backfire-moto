import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function SubmissionCard({ post, children }) {
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-surface">
      <div className={(post.media?.length || 0) > 1 ? 'grid grid-cols-2 gap-0.5' : ''}>
        {(post.media || []).map((m, i) =>
          m.type === 'video' ? (
            <video key={i} src={m.url} className="w-full aspect-square object-cover" />
          ) : (
            <img key={i} src={m.url} alt="" className="w-full aspect-square object-cover" />
          )
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 text-xs">
        {post.name && <p className="text-neutral-300">{post.name}</p>}
        {post.email && <p className="text-neutral-500">{post.email}</p>}
        {post.story && <p className="text-neutral-400">{post.story}</p>}
        <p className="text-neutral-600">{post.newsletterOptIn ? 'Opted into newsletter' : 'Not opted in'}</p>
        <div className="flex gap-2 mt-1">{children}</div>
      </div>
    </div>
  );
}

export default function CommunityPhotosEditor() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'communityPhotos'), orderBy('createdAt', 'desc')), (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const pending = posts.filter((p) => p.status === 'pending');
  const approved = posts.filter((p) => p.status === 'approved');

  async function approve(id) {
    await updateDoc(doc(db, 'communityPhotos', id), { status: 'approved' });
  }

  async function reject(id) {
    await deleteDoc(doc(db, 'communityPhotos', id));
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h3 className="text-white font-semibold mb-3">Pending review ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing waiting.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pending.map((post) => (
              <SubmissionCard key={post.id} post={post}>
                <button
                  onClick={() => approve(post.id)}
                  className="flex-1 bg-accent text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:brightness-110 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(post.id)}
                  className="flex-1 border border-neutral-700 text-neutral-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:text-white hover:border-white transition"
                >
                  Reject
                </button>
              </SubmissionCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Approved ({approved.length})</h3>
        {approved.length === 0 ? (
          <p className="text-sm text-neutral-500">None yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {approved.map((post) => (
              <SubmissionCard key={post.id} post={post}>
                <button
                  onClick={() => reject(post.id)}
                  className="flex-1 border border-red-900 text-red-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:bg-red-950 transition"
                >
                  Remove
                </button>
              </SubmissionCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
