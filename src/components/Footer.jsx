import { Link } from 'react-router-dom';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <SocialLinks />
        <Link
          to="/contact"
          className="flex items-center gap-2 border border-neutral-700 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-300 hover:text-white hover:border-white transition-colors"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 15 22l-4-9-9-4 20-7z" />
          </svg>
          Send Us a Note
        </Link>
        <p className="text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} Backfire Moto. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
