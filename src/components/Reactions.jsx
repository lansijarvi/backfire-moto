import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getDeviceId } from '../lib/deviceId';

const EMOJIS = [
  { key: 'like', glyph: '👍', label: 'Like' },
  { key: 'love', glyph: '❤️', label: 'Love' },
  { key: 'haha', glyph: '😂', label: 'Haha' },
  { key: 'wow', glyph: '😮', label: 'Wow' },
  { key: 'sad', glyph: '😢', label: 'Sad' },
  { key: 'angry', glyph: '😡', label: 'Angry' },
];

// Facebook-style reactions, no login required — just a per-browser anonymous ID.
// Collapsed by default (shows your pick + total count); hover on desktop or tap on
// mobile reveals the full picker. Expands inline rather than floating, since the
// cards this sits in use overflow-hidden to clip image corners.
export default function Reactions({ targetId, className = '' }) {
  const [reactions, setReactions] = useState([]);
  const [myReactionId, setMyReactionId] = useState(null);
  const [open, setOpen] = useState(false);
  const deviceId = getDeviceId();
  const pendingRef = useRef(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!targetId) return;
    return onSnapshot(query(collection(db, 'reactions'), where('targetId', '==', targetId)), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReactions(docs);
      setMyReactionId((prev) => {
        // Trust our own optimistic ID if the listener just hasn't caught up yet;
        // only follow the server when it actually disagrees.
        if (prev && docs.some((r) => r.id === prev)) return prev;
        return docs.find((r) => r.deviceId === deviceId)?.id || null;
      });
    });
  }, [targetId, deviceId]);

  const counts = {};
  for (const r of reactions) counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  const myEmoji = reactions.find((r) => r.id === myReactionId)?.emoji;
  const totalCount = reactions.length;

  async function react(emoji) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      if (myReactionId && myEmoji === emoji) {
        const idToDelete = myReactionId;
        setMyReactionId(null);
        await deleteDoc(doc(db, 'reactions', idToDelete));
      } else if (myReactionId) {
        await updateDoc(doc(db, 'reactions', myReactionId), { emoji });
      } else {
        const ref = await addDoc(collection(db, 'reactions'), { targetId, deviceId, emoji });
        setMyReactionId(ref.id);
      }
    } finally {
      pendingRef.current = false;
    }
    setOpen(false);
  }

  function openPicker() {
    clearTimeout(closeTimerRef.current);
    setOpen(true);
  }

  function closePickerSoon() {
    closeTimerRef.current = setTimeout(() => setOpen(false), 250);
  }

  const mine = EMOJIS.find((e) => e.key === myEmoji);

  return (
    <div
      className={`inline-block ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={openPicker}
      onMouseLeave={closePickerSoon}
    >
      {open ? (
        <div className="flex items-center gap-0.5">
          {EMOJIS.map(({ key, glyph }) => {
            const count = counts[key] || 0;
            const isMine = myEmoji === key;
            return (
              <button
                key={key}
                onClick={() => react(key)}
                aria-label={key}
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-base transition-transform hover:scale-110 ${
                  isMine ? 'bg-accent/20 ring-1 ring-accent' : 'hover:bg-white/10'
                }`}
              >
                <span>{glyph}</span>
                {count > 0 && <span className="text-[10px] text-neutral-400">{count}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors ${
            mine ? 'text-accent' : 'text-neutral-500 hover:text-white'
          }`}
        >
          <span className="text-sm">{mine?.glyph || '👍'}</span>
          <span>{mine?.label || 'Like'}</span>
          {totalCount > 0 && <span className="text-neutral-600">· {totalCount}</span>}
        </button>
      )}
    </div>
  );
}
