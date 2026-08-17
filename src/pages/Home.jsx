import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NewsletterSignup from '../components/NewsletterSignup';

export default function Home() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'event')).then((snap) => {
      if (snap.exists()) setEvent(snap.data());
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-8">
        {loading ? null : event?.flyerImageUrl ? (
          <img
            src={event.flyerImageUrl}
            alt={event.title || 'Event flyer'}
            className="w-full max-w-md rounded-lg border border-neutral-800 shadow-2xl"
          />
        ) : (
          <div className="w-full max-w-md aspect-[3/4] rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-600 text-sm px-6">
            Event flyer goes here — upload one from the admin page.
          </div>
        )}

        <div>
          <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-white">
            {event?.title || 'Next Event Coming Soon'}
          </h1>
          {event?.dateText && (
            <p className="mt-2 text-accent uppercase tracking-widest text-sm">{event.dateText}</p>
          )}
          {event?.description && (
            <p className="mt-4 max-w-xl text-neutral-400">{event.description}</p>
          )}
          {event?.ctaText && event?.ctaUrl && (
            <a
              href={event.ctaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-6 bg-accent text-white font-semibold px-6 py-3 rounded uppercase tracking-wide text-sm hover:brightness-110 transition"
            >
              {event.ctaText}
            </a>
          )}
        </div>

        <div className="w-full flex flex-col items-center gap-3 pt-8 border-t border-neutral-800">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500">
            Stay in the loop for all things Backfire Moto
          </h2>
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
