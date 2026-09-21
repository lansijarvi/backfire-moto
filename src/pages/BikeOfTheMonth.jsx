import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import BikeFeature from '../components/BikeFeature';
import { monthLabel } from '../lib/monthLabel';

export default function BikeOfTheMonth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [past, setPast] = useState([]);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'bikeOfTheMonth')).then((snap) => {
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    });
    getDocs(collection(db, 'pastBikesOfTheMonth')).then((snap) => {
      const when = (b) => b.featuredAt || b.archivedAt || '';
      setPast(snap.docs.map((d) => d.data()).sort((a, b) => when(b).localeCompare(when(a))));
    });
  }, []);

  const media = data?.media || [];
  const hasCurrent = data && (data.title || data.subject || media.length > 0);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">
      <h1 className="font-heading text-3xl sm:text-4xl text-white">Bike of the Month</h1>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !hasCurrent ? (
        <p className="text-neutral-400 max-w-md px-2">
          TBD at the next Backfire Motorcycle Night, Wednesday August 19th, 2026. Good luck!
        </p>
      ) : (
        <BikeFeature title={data.title} subject={data.subject} postId={data.postId} media={media} />
      )}

      {past.length > 0 && (
        <section className="w-full pt-10 mt-4 border-t border-neutral-800">
          <h2 className="font-heading text-2xl text-white mb-6">Past Bikes of the Month</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {past.map((bike) => {
              const cover = bike.media?.find((m) => m.type !== 'video');
              const label = monthLabel(bike.featuredAt || bike.archivedAt);
              return (
                <Link
                  key={bike.postId}
                  to={`/bike-of-the-month/past/${bike.postId}`}
                  className="group block rounded-lg overflow-hidden border border-neutral-800 bg-surface transition-colors duration-200 hover:border-neutral-600"
                >
                  {cover ? (
                    <img
                      src={cover.url}
                      alt=""
                      loading="lazy"
                      className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-neutral-900" />
                  )}
                  <div className="p-3">
                    {label && <p className="text-[11px] uppercase tracking-widest text-neutral-500">{label}</p>}
                    <p className="text-sm text-white mt-0.5 break-words">{bike.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-sm text-neutral-500 pt-4 border-t border-neutral-800 w-full max-w-md">
        Have a Bike of the Month idea?{' '}
        <Link to="/community" className="text-accent hover:underline">
          Submit it here
        </Link>
        .
      </p>
    </div>
  );
}
