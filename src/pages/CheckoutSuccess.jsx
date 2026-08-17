import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccess() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
      <h1 className="font-heading text-4xl text-white">Order Placed</h1>
      <p className="text-neutral-400 max-w-sm">
        Thanks for the support — you'll get a receipt by email. If you picked event pickup,
        we'll have it ready next time we see you.
      </p>
      <Link to="/shop" className="text-accent hover:underline text-sm">
        Back to Shop
      </Link>
    </div>
  );
}
