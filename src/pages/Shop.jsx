import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'products'), where('active', '==', true))).then((snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
      <h1 className="font-heading text-4xl text-white text-center mb-10">Shop</h1>

      {loading ? (
        <p className="text-center text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-center text-neutral-500">No merch up yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border border-neutral-800 rounded-lg overflow-hidden bg-surface flex flex-col">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover" />
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h2 className="text-white font-semibold">{p.name}</h2>
                {p.sizes && <p className="text-xs text-neutral-500">Sizes: {p.sizes}</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-accent font-semibold">${p.price}</span>
                  {p.stripeLink && (
                    <a
                      href={p.stripeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-accent text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded hover:brightness-110 transition"
                    >
                      Buy
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
