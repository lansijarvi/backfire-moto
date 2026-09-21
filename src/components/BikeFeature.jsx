import { useState } from 'react';
import Lightbox from './Lightbox';
import Reactions from './Reactions';

export default function BikeFeature({ title, subject, postId, media = [] }) {
  const [lightbox, setLightbox] = useState(null);

  return (
    <>
      {title && <h2 className="font-heading text-2xl sm:text-3xl text-accent break-words px-2">{title}</h2>}
      {subject && <p className="text-neutral-400 max-w-xl px-2">{subject}</p>}

      {postId && <Reactions targetId={postId} className="justify-center" />}

      {media.length > 0 && (
        <div className="columns-2 md:columns-3 gap-3 space-y-3 w-full mt-4">
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => setLightbox(item)}
              className="group block w-full break-inside-avoid rounded-lg overflow-hidden border border-neutral-800 bg-surface transition-colors duration-200 hover:border-neutral-600"
            >
              {item.type === 'video' ? (
                <video src={item.url} className="w-full transition-transform duration-300 group-hover:scale-105" muted />
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

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
