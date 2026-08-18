import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function PhotoCard({ photo, children }) {
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-surface">
      <img src={photo.photoUrl} alt="" className="w-full aspect-square object-cover" />
      <div className="p-3 flex flex-col gap-2">
        {(photo.name || photo.caption) && (
          <div className="text-xs text-neutral-500">
            {photo.name && <p className="text-neutral-300">{photo.name}</p>}
            {photo.caption && <p>{photo.caption}</p>}
          </div>
        )}
        <div className="flex gap-2">{children}</div>
      </div>
    </div>
  );
}

export default function CommunityPhotosEditor() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'communityPhotos'), orderBy('createdAt', 'desc')), (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const pending = photos.filter((p) => p.status === 'pending');
  const approved = photos.filter((p) => p.status === 'approved');

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
            {pending.map((photo) => (
              <PhotoCard key={photo.id} photo={photo}>
                <button
                  onClick={() => approve(photo.id)}
                  className="flex-1 bg-accent text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:brightness-110 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(photo.id)}
                  className="flex-1 border border-neutral-700 text-neutral-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:text-white hover:border-white transition"
                >
                  Reject
                </button>
              </PhotoCard>
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
            {approved.map((photo) => (
              <PhotoCard key={photo.id} photo={photo}>
                <button
                  onClick={() => reject(photo.id)}
                  className="flex-1 border border-red-900 text-red-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded hover:bg-red-950 transition"
                >
                  Remove
                </button>
              </PhotoCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
