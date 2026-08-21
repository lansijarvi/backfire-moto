import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getDeviceId } from '../lib/deviceId';

const EMOJIS = [
  { key: 'like', glyph: '👍' },
  { key: 'love', glyph: '❤️' },
  { key: 'haha', glyph: '😂' },
  { key: 'wow', glyph: '😮' },
  { key: 'sad', glyph: '😢' },
  { key: 'angry', glyph: '😡' },
];

// Facebook-style reactions, no login required — just a per-browser anonymous ID.
// One reaction per device per targetId; clicking your current pick removes it.
export default function Reactions({ targetId, className = '' }) {
  const [reactions, setReactions] = useState([]);
  const deviceId = getDeviceId();

  useEffect(() => {
    if (!targetId) return;
    return onSnapshot(query(collection(db, 'reactions'), where('targetId', '==', targetId)), (snap) => {
      setReactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [targetId]);

  const counts = {};
  for (const r of reactions) counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  const mine = reactions.find((r) => r.deviceId === deviceId);

  async function handleClick(emoji) {
    if (mine && mine.emoji === emoji) {
      await deleteDoc(doc(db, 'reactions', mine.id));
    } else if (mine) {
      await updateDoc(doc(db, 'reactions', mine.id), { emoji });
    } else {
      await addDoc(collection(db, 'reactions'), { targetId, deviceId, emoji });
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      {EMOJIS.map(({ key, glyph }) => {
        const count = counts[key] || 0;
        const isMine = mine?.emoji === key;
        return (
          <button
            key={key}
            onClick={() => handleClick(key)}
            aria-label={key}
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-sm transition-colors ${
              isMine ? 'bg-accent/20 ring-1 ring-accent' : 'hover:bg-white/10'
            }`}
          >
            <span>{glyph}</span>
            {count > 0 && <span className="text-[10px] text-neutral-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
