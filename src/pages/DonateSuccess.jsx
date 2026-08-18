import { Link } from 'react-router-dom';

export default function DonateSuccess() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
      <h1 className="font-heading text-4xl text-white">Thank You!</h1>
      <p className="text-neutral-400 max-w-sm">
        Your donation means a lot — it goes straight back into the events, food, and community.
      </p>
      <Link to="/" className="text-accent hover:underline text-sm">
        Back to Backfire Moto
      </Link>
    </div>
  );
}
