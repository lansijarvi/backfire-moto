import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import EventEditor from '../components/admin/EventEditor';
import ProductsEditor from '../components/admin/ProductsEditor';
import GalleryEditor from '../components/admin/GalleryEditor';
import SocialEditor from '../components/admin/SocialEditor';
import OrdersList from '../components/admin/OrdersList';
import CommunityPhotosEditor from '../components/admin/CommunityPhotosEditor';
import BikeOfTheMonthEditor from '../components/admin/BikeOfTheMonthEditor';
import MessagesList from '../components/admin/MessagesList';
import AnalyticsSummary from '../components/admin/AnalyticsSummary';

const TABS = [
  { id: 'event', label: 'Event', Component: EventEditor },
  { id: 'bike', label: 'Bike of the Month', Component: BikeOfTheMonthEditor },
  { id: 'products', label: 'Shop', Component: ProductsEditor },
  { id: 'orders', label: 'Orders', Component: OrdersList },
  { id: 'gallery', label: 'Gallery', Component: GalleryEditor },
  { id: 'community', label: 'Community Photos', Component: CommunityPhotosEditor },
  { id: 'messages', label: 'Messages', Component: MessagesList },
  { id: 'analytics', label: 'Traffic', Component: AnalyticsSummary },
  { id: 'social', label: 'Social Links', Component: SocialEditor },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('event');
  const { user } = useAuth();
  const Active = TABS.find((t) => t.id === activeTab).Component;

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-white">Admin</h1>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-neutral-400 hover:text-white border border-neutral-700 rounded px-4 py-2"
        >
          Sign out
        </button>
      </div>

      <div className="flex gap-2 border-b border-neutral-800 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-white'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
