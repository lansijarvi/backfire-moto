import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import Lightbox from '../components/Lightbox';
import Reactions from '../components/Reactions';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    getDocs(query(collection(db, 'gallery'), orderBy('order'))).then((snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
      <h1 className="font-heading text-4xl text-white text-center mb-10">Photos &amp; Videos</h1>

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-neutral-500">Nothing posted yet — check back soon.</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface transition-colors duration-200 hover:border-neutral-600"
            >
              {item.type === 'video' ? (
                <video src={item.url} controls className="w-full" />
              ) : (
                <button
                  onClick={() => setLightbox({ url: item.url, type: 'image' })}
                  className="block w-full overflow-hidden"
                >
                  <img
                    src={item.url}
                    alt={item.caption || ''}
                    loading="lazy"
                    className="w-full transition-transform duration-300 hover:scale-105"
                  />
                </button>
              )}
              {item.caption && (
                <p className="text-xs text-neutral-500 px-3 pt-2">{item.caption}</p>
              )}
              <Reactions targetId={item.id} className="px-3 py-2" />
            </div>
          ))}
        </div>
      )}

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
