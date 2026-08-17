import { Link } from 'react-router-dom';

export default function CheckoutCancel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
      <h1 className="font-heading text-4xl text-white">Checkout Cancelled</h1>
      <p className="text-neutral-400 max-w-sm">No charge was made. Your cart is still saved if you want to try again.</p>
      <Link to="/shop" className="text-accent hover:underline text-sm">
        Back to Shop
      </Link>
    </div>
  );
}
