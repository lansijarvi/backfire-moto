import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import BikeFeature from '../components/BikeFeature';
import { monthLabel } from '../lib/monthLabel';

export default function PastBike() {
  const { postId } = useParams();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    getDoc(doc(db, 'pastBikesOfTheMonth', postId)).then((snap) => {
      setBike(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [postId]);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">
      <Link to="/bike-of-the-month" className="text-sm text-neutral-500 hover:text-white transition-colors">
        ← Back to Bike of the Month
      </Link>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !bike ? (
        <p className="text-neutral-400">We couldn't find that bike.</p>
      ) : (
        <>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Bike of the Month{monthLabel(bike.featuredAt || bike.archivedAt) && ` · ${monthLabel(bike.featuredAt || bike.archivedAt)}`}
          </p>
          <BikeFeature title={bike.title} subject={bike.subject} postId={bike.postId} media={bike.media} />
        </>
      )}
    </div>
  );
}
