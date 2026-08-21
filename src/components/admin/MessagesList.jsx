import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MessagesList() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')), (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  function markRead(id) {
    updateDoc(doc(db, 'contactMessages', id), { read: true });
  }

  function remove(id) {
    deleteDoc(doc(db, 'contactMessages', id));
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-white font-semibold mb-3">Messages ({messages.length})</h3>
      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            onClick={() => !m.read && markRead(m.id)}
            className={`border rounded p-4 text-sm cursor-pointer ${
              m.read ? 'border-neutral-800' : 'border-accent bg-accent/5'
            }`}
          >
            <div className="flex items-center justify-between text-white">
              <span className="font-medium">{m.subject || '(no subject)'}</span>
              {!m.read && <span className="text-[10px] uppercase tracking-wide text-accent">New</span>}
            </div>
            <p className="text-neutral-500 mt-1">
              {m.name} — <a href={`mailto:${m.email}`} className="hover:text-white" onClick={(e) => e.stopPropagation()}>{m.email}</a>
            </p>
            <p className="text-neutral-400 mt-2 whitespace-pre-wrap">{m.message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(m.id);
              }}
              className="text-xs text-red-400 hover:text-red-300 mt-3"
            >
              Delete
            </button>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-neutral-500">No messages yet.</p>}
      </div>
    </div>
  );
}
