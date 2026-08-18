import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ADMIN_UID } from '../adminConfig';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/donate', label: 'Donate' },
];

export default function Navbar() {
  const { totalCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  return (
    <header className="border-b border-neutral-800 sticky top-0 bg-bg/90 backdrop-blur z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <NavLink to="/" className="font-heading text-2xl tracking-wider text-white">
          BACKFIRE MOTO
        </NavLink>
        <nav className="flex items-center gap-6 text-sm uppercase tracking-wide">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-white'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-white'}`
              }
            >
              Admin
            </NavLink>
          )}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open cart"
            className="relative text-neutral-400 hover:text-white transition-colors"
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
        </nav>
      </div>
    </header>
  );
}
