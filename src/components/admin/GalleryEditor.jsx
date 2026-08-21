import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';
import SortableGrid from './SortableGrid';

export default function GalleryEditor() {
  const [items, setItems] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'gallery'), orderBy('order')), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const type = file.type.startsWith('video') ? 'video' : 'photo';
    const uploadFile = type === 'photo' ? await compressImage(file) : file;
    const fileRef = ref(storage, `backfire/gallery/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, uploadFile);
    const url = await getDownloadURL(fileRef);
    const minOrder = items.length > 0 ? Math.min(...items.map((i) => i.order ?? 0)) : 0;
    await addDoc(collection(db, 'gallery'), {
      url,
      type,
      caption: caption.trim(),
      order: minOrder - 1,
      createdAt: serverTimestamp(),
    });
    setCaption('');
    setUploading(false);
    e.target.value = '';
  }

  async function handleDelete(item) {
    await deleteStorageFileByUrl(storage, item.url);
    await deleteDoc(doc(db, 'gallery', item.id));
  }

  async function handleReorder(reordered) {
    setItems(reordered);
    const batch = writeBatch(db);
    reordered.forEach((item, i) => batch.update(doc(db, 'gallery', item.id), { order: i }));
    await batch.commit();
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Caption (optional, applies to next upload)
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Upload photo or video
          <input type="file" accept="image/*,video/*" onChange={handleUpload} className="text-sm text-neutral-400" />
          {uploading && <span className="text-xs text-neutral-500">Uploading…</span>}
        </label>
      </div>

      {items.length > 0 && (
        <>
          <p className="text-xs text-neutral-500">Drag to reorder.</p>
          <SortableGrid
            items={items}
            keyExtractor={(item) => item.id}
            onReorder={handleReorder}
            className="grid grid-cols-3 gap-2"
            renderItem={(item) => (
              <div className="relative">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full aspect-square object-cover rounded border border-neutral-800" />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-square object-cover rounded border border-neutral-800"
                  />
                )}
                <button
                  onClick={() => handleDelete(item)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            )}
          />
        </>
      )}
    </div>
  );
}
