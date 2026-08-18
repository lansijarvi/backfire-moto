import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

  const images = data?.images || [];

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">
      <h1 className="font-heading text-4xl text-white">Bike of the Month</h1>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !data ? (
        <p className="text-neutral-400 max-w-md">
          TBD at the next Backfire Motorcycle Night, Wednesday August 19th, 2026. Good luck!
        </p>
      ) : (
        <>
          {data.title && <h2 className="font-heading text-3xl text-accent">{data.title}</h2>}
          {data.subject && <p className="text-neutral-400 max-w-xl">{data.subject}</p>}

          {images.length > 0 && (
            <div className="columns-2 md:columns-3 gap-3 space-y-3 w-full mt-4">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(url)}
                  className="block w-full break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface"
                >
                  <img src={url} alt="" className="w-full" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-accent"
          >
            &times;
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
