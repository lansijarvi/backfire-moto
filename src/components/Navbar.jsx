import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/gallery', label: 'Gallery' },
];

export default function Navbar() {
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
        </nav>
      </div>
    </header>
  );
}
