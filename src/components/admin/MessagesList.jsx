import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';

function ReplyThread({ message }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const sendMessageReply = httpsCallable(functions, 'sendMessageReply');
      await sendMessageReply({ messageId: message.id, replyText: text.trim() });
      setText('');
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3" onClick={(e) => e.stopPropagation()}>
      {message.replies?.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {message.replies.map((r, i) => (
            <div key={i} className="bg-bg border border-neutral-800 rounded p-3 text-sm">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                You replied {r.sentAt ? new Date(r.sentAt).toLocaleString() : ''}
              </p>
              <p className="text-neutral-300 whitespace-pre-wrap">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <form onSubmit={send} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder={`Reply to ${message.name || message.email}...`}
            className="bg-bg border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-accent text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded hover:brightness-110 disabled:opacity-60 transition"
            >
              {sending ? 'Sending…' : 'Send Reply'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-500 hover:text-white px-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-accent hover:brightness-110 font-semibold uppercase tracking-wide"
        >
          Reply
        </button>
      )}
    </div>
  );
}

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
            <ReplyThread message={m} />
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-neutral-500">No messages yet.</p>}
      </div>
    </div>
  );
}
