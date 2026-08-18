import { useEffect } from 'react';

export default function Lightbox({ media, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-accent"
      >
        &times;
      </button>
      {media.type === 'video' ? (
        <video
          src={media.url}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={media.url}
          alt=""
          className="max-w-full max-h-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
