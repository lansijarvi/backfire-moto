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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';

export default function GalleryEditor() {
  const [items, setItems] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (snap) => {
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
    await addDoc(collection(db, 'gallery'), {
      url,
      type,
      caption: caption.trim(),
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

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.id} className="relative group">
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
              className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
