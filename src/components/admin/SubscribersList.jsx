import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SubscribersList() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'newsletter'), orderBy('createdAt', 'desc')), (snap) => {
      setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  function copyAll() {
    navigator.clipboard.writeText(subs.map((s) => s.email).join(', '));
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Subscribers ({subs.length})</h3>
        {subs.length > 0 && (
          <button onClick={copyAll} className="text-xs text-neutral-400 hover:text-white">
            Copy all emails
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
        {subs.map((s) => (
          <div key={s.id} className="text-sm text-neutral-300 border-b border-neutral-800 py-1.5">
            {s.email}
          </div>
        ))}
        {subs.length === 0 && <p className="text-sm text-neutral-500">No signups yet.</p>}
      </div>
    </div>
  );
}
