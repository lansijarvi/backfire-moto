import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

const CHANNEL_LABELS = {
  Direct: 'Direct',
  'Organic Search': 'Google / Search',
  'Organic Social': 'Social (organic)',
  Referral: 'Referral',
  Email: 'Email',
  Paid_Search: 'Paid Search',
  Paid_Social: 'Paid Social',
  Unassigned: 'Unassigned',
};

function StatCard({ label, value }) {
  return (
    <div className="border border-neutral-800 rounded p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-3xl font-heading text-white mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AnalyticsSummary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAnalyticsSummary = httpsCallable(functions, 'getAnalyticsSummary');
    getAnalyticsSummary()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Loading traffic data…</p>;

  if (error) {
    return (
      <p className="text-sm text-red-400 max-w-xl">
        Couldn't load traffic data: {error}. If this is the first time, make sure the site's
        Cloud Functions service account has been added as a Viewer on the Google Analytics
        property.
      </p>
    );
  }

  const maxDayViews = Math.max(1, ...data.byDay.map((d) => d.pageViews));

  return (
    <div className="max-w-3xl flex flex-col gap-8">
      <div>
        <h3 className="text-white font-semibold mb-3">Last 7 Days</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Visitors" value={data.last7Days.activeUsers} />
          <StatCard label="Sessions" value={data.last7Days.sessions} />
          <StatCard label="Page Views" value={data.last7Days.pageViews} />
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Page Views, Last 14 Days</h3>
        <div className="flex items-end gap-1 h-32 border-b border-neutral-800">
          {data.byDay.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full bg-accent/70 hover:bg-accent transition-colors rounded-t-sm"
                style={{ height: `${(d.pageViews / maxDayViews) * 100}%`, minHeight: d.pageViews > 0 ? '2px' : 0 }}
              />
              <div className="absolute -top-6 hidden group-hover:block text-xs text-white bg-neutral-800 rounded px-1.5 py-0.5 whitespace-nowrap">
                {d.pageViews} views
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-600 mt-1">
          <span>{data.byDay[0]?.date}</span>
          <span>{data.byDay[data.byDay.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Top Pages</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {data.topPages.map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-4 text-neutral-300">
                <span className="truncate">{p.path}</span>
                <span className="text-neutral-500 shrink-0">{p.pageViews}</span>
              </li>
            ))}
            {data.topPages.length === 0 && <p className="text-neutral-500">No data yet.</p>}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Traffic Sources</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {data.sources.map((s) => (
              <li key={s.channel} className="flex items-center justify-between gap-4 text-neutral-300">
                <span className="truncate">{CHANNEL_LABELS[s.channel] || s.channel}</span>
                <span className="text-neutral-500 shrink-0">{s.sessions}</span>
              </li>
            ))}
            {data.sources.length === 0 && <p className="text-neutral-500">No data yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
