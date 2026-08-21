import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Lightbox from '../components/Lightbox';
import Reactions from '../components/Reactions';

export default function BikeOfTheMonth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'bikeOfTheMonth')).then((snap) => {
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    });
  }, []);

  const media = data?.media || [];

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">
      <h1 className="font-heading text-3xl sm:text-4xl text-white">Bike of the Month</h1>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !data ? (
        <p className="text-neutral-400 max-w-md px-2">
          TBD at the next Backfire Motorcycle Night, Wednesday August 19th, 2026. Good luck!
        </p>
      ) : (
        <>
          {data.title && (
            <h2 className="font-heading text-2xl sm:text-3xl text-accent break-words px-2">{data.title}</h2>
          )}
          {data.subject && <p className="text-neutral-400 max-w-xl px-2">{data.subject}</p>}

          {data.postId && <Reactions targetId={data.postId} className="justify-center" />}

          {media.length > 0 && (
            <div className="columns-2 md:columns-3 gap-3 space-y-3 w-full mt-4">
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(item)}
                  className="group block w-full break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface transition-colors duration-200 hover:border-neutral-600"
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full transition-transform duration-300 group-hover:scale-105"
                      muted
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="w-full transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
