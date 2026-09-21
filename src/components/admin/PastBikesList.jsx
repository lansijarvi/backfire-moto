import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { deleteStorageFileByUrl } from '../../lib/imageUpload';
import { monthLabel } from '../../lib/monthLabel';

export default function PastBikesList() {
  const [bikes, setBikes] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'pastBikesOfTheMonth'), (snap) => {
      const when = (b) => b.featuredAt || b.archivedAt || '';
      setBikes(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => when(b).localeCompare(when(a))));
    });
  }, []);

  async function remove(bike) {
    if (!confirm(`Permanently delete "${bike.title || 'this bike'}" from Past Bikes of the Month, including its photos? This can't be undone.`)) {
      return;
    }
    await Promise.all((bike.media || []).map((m) => deleteStorageFileByUrl(storage, m.url)));
    await deleteDoc(doc(db, 'pastBikesOfTheMonth', bike.id));
  }

  return (
    <div className="max-w-lg border-t border-neutral-800 pt-8">
      <h3 className="text-white font-semibold mb-1">Past Bikes of the Month ({bikes.length})</h3>
      <p className="text-xs text-neutral-600 mb-4">
        Bikes move here automatically when you start a new one. They show on the public page.
      </p>
      <div className="flex flex-col gap-2">
        {bikes.map((bike) => {
          const cover = bike.media?.find((m) => m.type !== 'video');
          return (
            <div key={bike.id} className="flex items-center gap-3 border border-neutral-800 rounded p-2">
              {cover ? (
                <img src={cover.url} alt="" className="w-12 h-12 object-cover rounded shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-neutral-900 rounded shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{bike.title || '(untitled)'}</p>
                <p className="text-xs text-neutral-500">
                  {monthLabel(bike.featuredAt || bike.archivedAt)} · {bike.media?.length || 0} photos
                </p>
              </div>
              <Link to={`/bike-of-the-month/past/${bike.id}`} className="text-xs text-neutral-400 hover:text-white">
                View
              </Link>
              <button onClick={() => remove(bike)} className="text-xs text-red-400 hover:text-red-300">
                Delete
              </button>
            </div>
          );
        })}
        {bikes.length === 0 && <p className="text-sm text-neutral-500">No past bikes yet.</p>}
      </div>
    </div>
  );
}
