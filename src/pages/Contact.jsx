import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — real users never see/fill this
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (website) return; // honeypot tripped, silently drop
    setSending(true);
    setError('');
    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch {
      setError('Something went wrong sending that. Try again, or reach us on social.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 max-w-lg mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">
      <h1 className="font-heading text-4xl text-white">Contact Us</h1>
      <p className="text-neutral-400">
        Question, idea, or something we should know? Send us a note.
      </p>

      {sent ? (
        <p className="text-accent font-medium">Sent — thanks, we'll get back to you.</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 text-left">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={5}
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
          <div aria-hidden="true" className="absolute -left-[5000px]">
            <input
              type="text"
              tabIndex="-1"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="bg-accent text-white font-semibold px-5 py-3 rounded uppercase tracking-wide text-sm hover:brightness-110 disabled:opacity-60 transition"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
}
