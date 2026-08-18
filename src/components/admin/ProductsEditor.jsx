import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { compressImage, deleteStorageFileByUrl } from '../../lib/imageUpload';

const EMPTY = { name: '', price: '', sizes: '', imageUrl: '', active: true };

export default function ProductsEditor() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ ...EMPTY, ...p });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const previousUrl = form.imageUrl;
    const compressed = await compressImage(file);
    const fileRef = ref(storage, `backfire/products/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, compressed);
    const url = await getDownloadURL(fileRef);
    update('imageUrl', url);
    setUploading(false);
    if (previousUrl) deleteStorageFileByUrl(storage, previousUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0 };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (product.imageUrl) await deleteStorageFileByUrl(storage, product.imageUrl);
    await deleteDoc(doc(db, 'products', product.id));
    if (editingId === product.id) resetForm();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
        <h3 className="text-white font-semibold">{editingId ? 'Edit product' : 'Add product'}</h3>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Price (USD)
          <input
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Sizes (comma-separated — shows as a picker in the shop; leave blank for stickers/pins)
          <input
            value={form.sizes}
            onChange={(e) => update('sizes', e.target.value)}
            placeholder="S, M, L, XL"
            className="bg-surface border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Image
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-neutral-400" />
          {uploading && <span className="text-xs text-neutral-500">Uploading…</span>}
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="mt-2 max-w-[140px] rounded border border-neutral-800" />
          )}
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-400">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => update('active', e.target.checked)}
          />
          Visible in shop
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-white font-semibold px-5 py-2.5 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add product'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="text-white font-semibold mb-3">Products ({products.length})</h3>
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border border-neutral-800 rounded px-3 py-2">
              {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" className="w-10 h-10 object-cover rounded" />}
              <div className="flex-1 text-sm">
                <p className="text-white">{p.name} {!p.active && <span className="text-neutral-600">(hidden)</span>}</p>
                <p className="text-neutral-500">${p.price}</p>
              </div>
              <button onClick={() => startEdit(p)} className="text-xs text-neutral-400 hover:text-white">Edit</button>
              <button onClick={() => handleDelete(p)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
