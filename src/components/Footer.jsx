import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <SocialLinks />
        <p className="text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} Backfire Moto. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
