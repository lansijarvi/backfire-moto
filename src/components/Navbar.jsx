import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ADMIN_UID } from '../adminConfig';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/bike-of-the-month', label: 'Bike of the Month' },
  { to: '/community', label: 'Community' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/shop', label: 'Shop' },
  { to: '/donate', label: 'Donate' },
];

function CartButton({ totalCount, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open cart"
      className={`relative text-neutral-400 hover:text-white transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {totalCount}
        </span>
      )}
    </button>
  );
}

function AdminLink({ pendingCount, onNavigate, className = '' }) {
  return (
    <NavLink
      to="/admin"
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-white'} ${className}`
      }
    >
      Admin
      {pendingCount > 0 && (
        <span className="absolute -top-2 -right-3 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {pendingCount}
        </span>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { totalCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(query(collection(db, 'communityPhotos'), where('status', '==', 'pending')), (snap) => {
      setPendingCount(snap.size);
    });
  }, [isAdmin]);

  const linkClass = ({ isActive }) =>
    `transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-white'}`;

  return (
    <header className="border-b border-neutral-800 sticky top-0 bg-bg/90 backdrop-blur z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <NavLink
          to="/"
          onClick={() => setMenuOpen(false)}
          className="font-heading text-xl sm:text-2xl tracking-wider text-white shrink-0"
        >
          BACKFIRE MOTO
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wide">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAdmin && <AdminLink pendingCount={pendingCount} />}
          <CartButton totalCount={totalCount} onClick={() => setIsOpen(true)} />
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-4">
          <CartButton totalCount={totalCount} onClick={() => setIsOpen(true)} />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="text-neutral-300 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav className="md:hidden border-t border-neutral-800 px-4 py-4 flex flex-col gap-4 text-sm uppercase tracking-wide bg-bg">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAdmin && <AdminLink pendingCount={pendingCount} onNavigate={() => setMenuOpen(false)} />}
        </nav>
      )}
    </header>
  );
}
